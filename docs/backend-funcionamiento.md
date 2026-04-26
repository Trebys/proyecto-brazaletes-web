# Backend: funcionamiento del codigo

## Objetivo de este documento

Este archivo resume como funciona el backend actual del proyecto a partir del codigo real. Sirve para trabajar esta capa de forma independiente y para entender:

- la arquitectura general de Django;
- las apps que existen;
- los modelos y endpoints principales;
- los flujos de autenticacion y compra;
- el estado actual del backend, incluyendo limites y riesgos visibles.

Regla de mantenimiento: cuando un cambio modifique modelos, endpoints, permisos, configuracion, pagos, sesion o reglas de negocio del backend, este documento debe actualizarse en la misma rama. La guia completa esta en [docs/gestion-documentacion.md](gestion-documentacion.md).

## Stack actual

- Django
- Django REST Framework
- autenticacion por token
- PostgreSQL
- integracion con PayPal SDK
- `corsheaders`

Archivos base:

- `backend/manage.py`
- `backend/backend_django/settings.py`
- `backend/backend_django/urls.py`

## Estructura principal

```text
backend/
  backend_django/
    settings.py
    urls.py
  login/
    models.py
    serializers.py
    views.py
    urls.py
  compra_brazaletes/
    apps.py
    models.py
    serializers.py
    signals.py
    paypal_client.py
    views.py
    urls.py
  atracciones_comidas/
    models.py
    serializers.py
    views.py
    urls.py
```

## Configuracion general

### `backend_django/settings.py`

Define la configuracion central del proyecto.

Puntos importantes:

- usa `login.User` como modelo de usuario personalizado;
- activa `rest_framework` y `rest_framework.authtoken`;
- carga desde variables de entorno la configuracion sensible y dependiente del entorno, incluyendo PayPal, `SECRET_KEY`, `DEBUG`, base de datos, `ALLOWED_HOSTS`, CORS y CSRF;
- define la expiracion de sesion con `SESSION_IDLE_TIMEOUT_MINUTES`, alineada con [docs/politica-sesion.md](politica-sesion.md);
- configura PostgreSQL como base de datos principal usando variables de entorno;
- habilita `ExpiringTokenAuthentication` y `SessionAuthentication`;
- permite CORS para los hosts configurados por entorno, manteniendo valores locales razonables para desarrollo.

Observaciones del estado actual:

- `DEBUG` ya no esta fijo en codigo; se controla con `DJANGO_DEBUG`;
- `SECRET_KEY` ya no esta hardcodeada en el repositorio; se lee desde `DJANGO_SECRET_KEY`;
- las credenciales de PostgreSQL ya no estan hardcodeadas; se leen desde variables `DB_*`;
- si no existe configuracion `DB_*` y `DEBUG=True`, el backend cae a SQLite local para evitar errores 500 durante desarrollo;
- `ALLOWED_HOSTS`, CORS y CSRF confiables tambien salen de variables de entorno;
- existe `backend/.env.example` como base para desarrollo local;
- `TIME_ZONE` esta en `UTC`.

Con esto, el backend ya quedo preparado para mantener una configuracion local simple sin acoplar secretos reales al codigo versionado. Si se quiere usar PostgreSQL local con datos reales, se debe crear `backend/.env` a partir de `backend/.env.example`.

### `backend_django/urls.py`

Centraliza las rutas:

- `/admin/`
- `/docs/`
- `/api/` -> app `login`
- `/api/compra_brazaletes/` -> app `compra_brazaletes`
- `/api/atracciones-comidas/` -> app `atracciones_comidas`

Observacion importante: el catalogo de atracciones y comidas ya quedo alineado con el mismo prefijo `/api/` del resto del backend.

## App `login`

Esta app concentra usuarios y autenticacion.

### Modelo

Archivo: `login/models.py`

#### `User`

Extiende `AbstractUser` y agrega:

- `account_balance`
- `is_admin_user` como propiedad derivada para centralizar la regla de acceso administrativo

Esto permite que el mismo usuario tenga saldo interno para comprar brazaletes sin usar PayPal.

Regla vigente para distinguir clientes y administradores:

- cliente: cualquier usuario autenticado con `is_staff = False`;
- administrador operativo: usuario activo con `is_staff = True`;
- superusuario: cuenta de bootstrap o soporte total; si `is_superuser = True`, el modelo fuerza tambien `is_staff = True`.

Esto elimina la ambiguedad de revisar unas veces `is_staff` y otras `is_superuser`. La aplicacion ya usa una sola semantica de dominio: el acceso administrativo operativo depende de `is_staff`, y `is_superuser` queda como elevacion total de Django.

#### `ExpiringToken`

Es un proxy de `Token` con logica para:

- revisar si el token expiro;
- refrescarlo creando uno nuevo.

La expiracion vigente ya no esta hardcodeada en el modelo. Usa la politica central documentada en [docs/politica-sesion.md](politica-sesion.md), con 15 minutos por defecto.

### Serializador

Archivo: `login/serializers.py`

`UserSerializer` ahora expone un conjunto controlado de campos del usuario.

Puntos importantes del estado actual:

- la password viaja como `write_only`;
- `is_staff` e `is_superuser` son solo lectura;
- el serializer expone `is_admin` como bandera util para el frontend, derivada de `is_admin_user`;
- ya no se publica el modelo completo del usuario con `fields = "__all__"`.

### Endpoints

Archivo: `login/views.py`

#### `login`

Recibe:

- `identifier`
- `password`

Flujo:

1. busca usuario por `username` o `email`;
2. valida password;
3. elimina tokens anteriores del usuario;
4. crea un token nuevo;
5. devuelve token, datos del usuario y la politica de sesion vigente.

Decision vigente: solo existe una sesion activa por usuario. Si ya habia una sesion activa, el nuevo login invalida la anterior y responde con `replaced_existing_session = true`.

#### `register_client`

Flujo:

1. valida el payload con `UserSerializer`;
2. crea un `User`;
3. cifra la password con `set_password`;
4. crea un `ExpiringToken`;
5. devuelve token y datos del usuario serializando la instancia real creada.

Detalle practico: la respuesta ya no usa `serializer.data` del serializer de entrada despues de crear el usuario. Esto evita que el campo derivado `is_admin` intente resolverse sobre un `dict` de `validated_data`, caso que podia provocar error 500 aunque el usuario hubiera quedado guardado.

#### `user_profile`

Devuelve la informacion del usuario autenticado.

Detalle practico: la respuesta incluye tambien banderas de privilegio como `is_staff`, `is_superuser` e `is_admin`, lo que permite que el frontend distinga entre cliente y administrador sin adivinarlo por otras senales.

#### `update_user_profile`

Permite actualizar:

- username
- first_name
- last_name
- email
- password

Detalle practico: si la password llega como `******`, no la cambia.

Observacion importante del estado actual:

- un cliente autenticado ya no puede alterarse su propio `account_balance` desde este endpoint;
- el saldo queda reservado para operaciones administrativas o flujos de negocio controlados por backend.

#### `delete_user`

Elimina al usuario autenticado.

#### `refresh_token`

No genera un token nuevo. Verifica si el token actual sigue dentro de la ventana de vigencia, renueva su marca de actividad mediante la autenticacion y devuelve la politica de sesion vigente. Si ya expiro, elimina el token y devuelve `401` con un mensaje de inactividad.

#### `logout`

Elimina el token actual del usuario autenticado.

### Cobertura automatica vigente en autenticacion

El backend ya cuenta con pruebas automaticas utiles sobre los flujos criticos de autenticacion y permisos basicos.

Cobertura actual:

- login con `username`;
- login con `email`;
- rechazo de credenciales incompletas;
- rechazo de password incorrecta;
- invalidacion del token anterior al iniciar una nueva sesion;
- expiracion por inactividad usando la politica central de 15 minutos;
- validacion de sesion vigente mediante `/api/refresh-token/`;
- cierre de sesion con eliminacion real del token;
- acceso administrativo protegido en `UserViewSet`;
- proteccion del saldo del usuario en `update_user_profile`, evitando que un cliente se altere su propio `account_balance`;
- permiso valido para que un administrador actualice su saldo cuando corresponde.

### Requerimiento completado: alineacion de expiracion de sesion

El requerimiento "Alinear expiracion de sesion entre frontend y backend" quedo resuelto desde backend.

Criterios resueltos:

- existe una politica unica documentada en [docs/politica-sesion.md](politica-sesion.md);
- el backend define la ventana de inactividad con `SESSION_IDLE_TIMEOUT_MINUTES`, con 15 minutos por defecto;
- `ExpiringTokenAuthentication` valida la expiracion en todos los endpoints protegidos por autenticacion de token;
- los tokens vigentes renuevan su marca de actividad cuando el usuario consume endpoints protegidos;
- los tokens vencidos se eliminan y devuelven `401` con un mensaje coherente para el frontend;
- el login mantiene la regla de una sola sesion activa por usuario, invalidando sesiones anteriores;
- la respuesta de login informa si se cerro una sesion previa mediante `replaced_existing_session`;
- existen pruebas para sesion vigente, expiracion por inactividad y token anterior invalidado por nuevo login.

### Rutas

Archivo: `login/urls.py`

Endpoints relevantes:

- `/api/login`
- `/api/register`
- `/api/user-profile`
- `/api/refresh-token`
- `/api/logout`
- `/api/edit-user`
- `/api/delete-user`

Tambien existe un `UserViewSet` registrado como router.

Observacion importante: ese `UserViewSet` ya no esta abierto. Ahora exige la misma regla administrativa centralizada que el resto del backoffice: `user.is_admin_user`.

Uso administrativo actual:

- permite al panel operativo listar usuarios;
- permite crear, editar y eliminar usuarios desde endpoints protegidos;
- mantiene `is_staff` e `is_superuser` como campos de solo lectura en el serializer;
- por seguridad, la promocion o degradacion de roles administrativos no se hace desde el formulario operativo del panel.

### Flujo administrativo definido

El flujo administrativo del proyecto ya quedo definido en codigo y documentacion.

1. un cliente se crea desde `POST /api/register` y siempre nace con `is_staff = False`;
2. un administrador no se crea desde el registro publico;
3. la promocion de cliente a administrador se hace desde Django Admin o por shell/comando administrativo, activando `is_staff = True`;
4. si la cuenta necesita control total de plataforma, se marca `is_superuser = True`; el modelo garantiza que eso tambien active `is_staff`;
5. los endpoints sensibles y el acceso a `/admin/` confian en esa misma base: `is_staff`.

Decisiones vigentes de permisos:

- `is_staff`: bandera canonica para entrar al backoffice y consumir endpoints administrativos;
- `is_superuser`: cuenta de maxima autoridad, reservada para mantenimiento y emergencias;
- grupos y permisos personalizados: no gobiernan el acceso base actual, pero quedan disponibles para segmentar futuros roles operativos sin romper la regla vigente.

Escalabilidad ya contemplada:

- hoy: `is_staff` separa clientes de operadores;
- futuro: grupos como `operaciones`, `finanzas` o `soporte` podran vivir encima de `is_staff`;
- cuando existan permisos mas finos, `is_staff` seguira siendo la puerta de entrada al backoffice y los grupos definiran que puede hacer cada rol dentro de ese backoffice.

## App `compra_brazaletes`

Es la app mas importante del negocio actual.

### Configuracion de la app

Archivo: `compra_brazaletes/apps.py`

En `ready()` importa `compra_brazaletes.signals`, lo que activa la asignacion automatica de codigos para brazaletes y compras.

### Modelos

Archivo: `compra_brazaletes/models.py`

#### `BraceletType`

Representa el catalogo de tipos de brazalete.

Campos importantes:

- `name`
- `price`
- `attraction_uses`
- `food_balance`
- `description`
- `image`
- `is_active`

Detalle practico: `is_active` permite retirar un tipo de brazalete de la experiencia de compra sin eliminar su historial operativo. Los tipos desactivados siguen disponibles para administradores cuando consultan el catalogo con fines de mantenimiento.

#### `Bracelet`

Representa una unidad concreta comprada.

Campos importantes:

- `bracelet_type`
- `bracelet_code`
- `current_balance`
- `attraction_uses_remaining`

#### `PurchaseReceipt`

Representa la compra hecha por un usuario.

Campos importantes:

- `user`
- `bracelet`
- `purchase_date`
- `purchase_code`
- `payment_method`
- `paypal_order_id`
- `amount_paid`
- `status`

El modelo soporta dos metodos de pago:

- `INTERNAL`
- `PAYPAL`

Y estos estados:

- `PENDING`
- `APPROVED`
- `CAPTURED`
- `REFUNDED`

#### `BraceletTransaction`

Representa el historial operativo auditable del brazalete para consumos posteriores a la venta.

Campos importantes:

- `bracelet`
- `owner`
- `performed_by`
- `attraction`
- `food`
- `transaction_type`
- `concept`
- `balance_delta`
- `uses_delta`
- `balance_before`
- `balance_after`
- `uses_before`
- `uses_after`
- `occurred_at`

Tipos vigentes:

- `ATTRACTION_CONSUMPTION`
- `FOOD_CONSUMPTION`

Detalle practico: los consumos de atracciones y comidas crean esta transaccion en la misma operacion atomica que actualiza el estado del brazalete.

### Decision de modelo transaccional ya definida

Ademas del estado actual del codigo, el proyecto ya dejo resuelta la logica de dominio para la siguiente etapa de consumo y auditoria.

Decision vigente:

- `PurchaseReceipt` se mantiene como comprobante de pago;
- la venta de brazaletes debe modelarse aparte como `Sale` y `SaleLine`;
- el historial operativo del brazalete debe vivir en una entidad tipo `BraceletTransaction`;
- el brazalete debe quedar relacionado de forma directa con el usuario, en lugar de depender solo del recibo para inferir propiedad.

Separacion de responsabilidades acordada:

- `PurchaseReceipt` responde como se pago;
- `Sale` y `SaleLine` responden que se vendio;
- `BraceletTransaction` responde que movimientos afectaron al brazalete.

Importante: la primera pieza real de esta logica ya quedo implementada mediante `BraceletTransaction` para consumos. `Sale`, `SaleLine` y la relacion directa `Bracelet -> User` siguen como evolucion futura documentada en [docs/modelo-transaccional-brazaletes.md](/C:/Users/3st3b/Dev/brazaletes_web_agentes_IA/proyecto-brazaletes-web/docs/modelo-transaccional-brazaletes.md).

### Signals

Archivo: `compra_brazaletes/signals.py`

Responsabilidades:

- asignar `bracelet_code = BR-{id}` cuando se crea un brazalete;
- asignar `purchase_code = ORDER-{id}` cuando se crea un recibo.

Esto evita que la capa de vistas tenga que construir esos codigos manualmente.

### Serializadores

Archivo: `compra_brazaletes/serializers.py`

Responsabilidades:

- exponer datos basicos del usuario en recibos;
- serializar tipos de brazalete;
- serializar brazaletes con `bracelet_type` anidado;
- serializar recibos con usuario y brazalete anidados.

Eso explica por que el frontend puede renderizar un recibo completo sin hacer varias consultas.

### Endpoints REST principales

Archivo: `compra_brazaletes/views.py`

#### `BraceletTypeViewSet`

CRUD de tipos de brazalete.

Permisos actuales:

- lectura publica para listar o consultar el catalogo;
- creacion, edicion y eliminacion solo para administradores.

Reglas vigentes:

- la lectura publica solo devuelve tipos activos;
- un administrador puede consultar activos e inactivos usando `include_inactive=1`;
- crear y modificar permite ajustar nombre, precio, saldo de comida, usos de atraccion, descripcion, imagen y estado activo;
- eliminar solo procede si el tipo no tiene brazaletes asociados; si ya hay historial, debe desactivarse para retirarlo de la compra.

#### `BraceletViewSet`

CRUD de brazaletes.

Permisos actuales:

- acceso restringido a administradores;
- ya no esta expuesto con `AllowAny`.

#### `PurchaseReceiptViewSet`

Gestiona recibos de compra y requiere autenticacion.

Comportamiento especial:

- si el usuario tiene privilegios administrativos, puede ver todos los recibos;
- si no, solo ve los suyos;
- `create()` fue sobreescrito para ejecutar la compra con saldo interno.

### Flujo de compra con saldo interno

Implementado en `PurchaseReceiptViewSet.create()`.

Flujo:

1. recibe `bracelet_type_id`;
2. busca el `BraceletType` activo;
3. valida el saldo del usuario;
4. descuenta el precio de `account_balance`;
5. crea un `Bracelet` con saldo de comida y usos iniciales;
6. crea un `PurchaseReceipt` con `status = CAPTURED`;
7. devuelve el recibo serializado.

Observacion: la compra con saldo interno queda en `status = CAPTURED`, porque el cobro se ejecuta en el mismo flujo.

Detalle practico: la compra solo acepta tipos de brazalete activos. Si un administrador desactiva un tipo, el catalogo publico deja de ofrecerlo y el backend tambien rechaza intentos de compra con ese `bracelet_type_id`.

Cobertura automatica vigente para compra interna:

- compra exitosa con saldo interno;
- descuento correcto del saldo del usuario;
- creacion consistente de `Bracelet` y `PurchaseReceipt`;
- asignacion automatica de `bracelet_code` y `purchase_code`;
- rechazo de compra si el tipo de brazalete esta inactivo;
- rechazo sin efectos laterales cuando el saldo del usuario no alcanza;
- aislamiento de recibos por usuario autenticado.

Nota de alcance vigente:

- hoy el backend implementa la venta inicial del brazalete y su recibo;
- el consumo posterior todavia no tiene modelo transaccional persistente en codigo;
- la logica aprobada es que la comida y las atracciones no generen una nueva venta del brazalete, sino movimientos operativos del brazalete.

### Requerimiento completado: gestion administrativa de tipos de brazalete

El requerimiento "Implementar gestion administrativa de tipos de brazalete" quedo cerrado desde backend.

Criterios resueltos:

- el modelo `BraceletType` soporta estado activo/inactivo mediante `is_active`;
- la API permite a administradores crear, editar, activar/desactivar y eliminar tipos de brazalete;
- la eliminacion fisica se bloquea cuando el tipo ya tiene brazaletes asociados, para no romper historial de compras o brazaletes emitidos;
- los administradores pueden consultar tipos activos e inactivos con `include_inactive=1`;
- clientes y usuarios anonimos solo ven tipos activos en el catalogo publico;
- compra interna y captura PayPal solo aceptan tipos activos;
- los campos administrables cubren precio, saldo de comida, usos de atraccion, descripcion e imagen;
- los permisos de escritura quedan restringidos a administradores usando la regla centralizada de backoffice.

## Integracion con PayPal

Archivos:

- `compra_brazaletes/paypal_client.py`
- `compra_brazaletes/views.py`

### `PayPalClient`

Construye el cliente usando:

- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_ENV`

Tambien expone `get_access_token()` para validar webhooks.

### `PayPalCreateOrderView`

Crea una orden de PayPal con:

- monto
- moneda
- descripcion

Devuelve el `id` de la orden y su estado.

Permiso actual: requiere autenticacion. Ya no acepta llamadas anonimas.

Comportamiento ante errores:

- si PayPal rechaza las credenciales configuradas, el backend devuelve `502` con un mensaje controlado para revisar `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET` y `PAYPAL_ENV`;
- si falta configuracion de PayPal, tambien devuelve `502` sin exponer secretos;
- ya no se deja subir este fallo esperado como `500` generico.

### `PayPalCaptureOrderView`

Flujo:

1. recibe `orderID` y `bracelet_type_id`;
2. verifica primero el estado de la orden;
3. intenta capturar la orden;
4. si el pago termina en `COMPLETED`, crea el brazalete;
5. crea el recibo con `payment_method = PAYPAL` y `status = CAPTURED`;
6. devuelve `receipt_id` para que el frontend consulte el recibo.

Permiso actual: requiere autenticacion. Esto evita capturas ligadas a usuarios anonimos.

### `paypal_webhook`

Responsabilidades:

- recibir eventos de PayPal;
- verificar firma del webhook;
- ubicar el `PurchaseReceipt` relacionado;
- actualizar el estado interno.

Eventos tratados:

- `CHECKOUT.ORDER.APPROVED`
- `PAYMENT.CAPTURE.COMPLETED`
- `CHECKOUT.ORDER.COMPLETED`

Observaciones importantes del estado actual:

- el webhook verifica firma antes de tocar recibos;
- `PAYPAL_WEBHOOK_ID` corresponde al identificador del webhook creado en el panel de PayPal Developer; sin este valor no se pueden verificar eventos reales del webhook;
- solo persiste estados definidos por el modelo: `APPROVED` o `CAPTURED`, segun el evento;
- evita degradar un recibo ya `CAPTURED` si llegan eventos fuera de orden;
- usa logging en lugar de `print()` para los mensajes operativos.

Impacto practico de no configurar `PAYPAL_WEBHOOK_ID`:

- el flujo normal de compra puede seguir funcionando si el frontend aprueba el pago y llama a `capture-order`;
- los eventos asincronos enviados directamente por PayPal no podran verificarse correctamente;
- el backend no podra usar el webhook como respaldo confiable para cambios de estado que ocurran fuera del flujo directo del navegador.

Cobertura automatica vigente para PayPal y webhook:

- creacion de orden exige autenticacion;
- creacion de orden devuelve error controlado si PayPal rechaza las credenciales configuradas;
- captura PayPal exitosa crea recibo y brazalete consistentes;
- la captura falla si falta `bracelet_type_id`;
- la captura falla si la orden todavia no esta en un estado capturable;
- la captura devuelve error controlado si falla la verificacion previa con PayPal;
- el webhook procesa `CHECKOUT.ORDER.APPROVED`, `CHECKOUT.ORDER.COMPLETED` y `PAYMENT.CAPTURE.COMPLETED`;
- el webhook no degrada un recibo ya `CAPTURED`;
- el webhook rechaza headers faltantes;
- el webhook rechaza payload JSON invalido;
- el webhook rechaza firmas invalidas;
- el webhook devuelve error controlado si no puede verificar la firma con PayPal.

### Requerimiento completado: pruebas backend para autenticacion, compra interna y pagos

El requerimiento "Agregar pruebas backend para autenticacion, compra interna y pagos" ya quedo cubierto desde backend.

Criterios resueltos:

- existen pruebas automaticas para login, registro y permisos basicos;
- existen pruebas para compra con saldo interno, incluyendo escenarios exitosos y rechazos de negocio;
- existen pruebas para contratos clave de PayPal y webhook en los puntos viables de aislamiento;
- los bugs y regresiones importantes de autenticacion, saldo, captura PayPal y webhook quedaron protegidos por pruebas;
- la cobertura agregada prioriza comportamiento critico y contratos de negocio, no cantidad artificial de casos.

## App `atracciones_comidas`

Esta app ya expone el catalogo publico de atracciones y comidas, ademas de un flujo minimo de consumo real sobre brazaletes existentes.

### Modelos

Archivo: `atracciones_comidas/models.py`

#### `Attractions`

- `name`
- `description`
- `photo`
- `usage_points`

#### `Food`

- `name`
- `description`
- `photo`
- `price`

### Datos base y carpeta `media`

El proyecto usa `backend/media/` como almacenamiento local de imagenes servidas por Django durante desarrollo.

Carpetas relevantes:

- `backend/media/attractions/` guarda imagenes de atracciones;
- `backend/media/foods/` guarda imagenes de comidas;
- `backend/media/bracelets/` guarda imagenes de tipos de brazalete.

Para cargar el catalogo base usado en el mockup, existe el comando:

```powershell
python manage.py seed_atracciones_comidas
```

Este comando es idempotente: crea o actualiza las 3 atracciones y 3 comidas base usando las imagenes existentes en `media`.

### Serializadores

Archivo: `atracciones_comidas/serializers.py`

Hay dos serializadores:

- `AttractionsSerializer`
- `FoodSerializer`

Detalle practico del estado actual:

- cada serializer expone su propio esquema correcto;
- `FoodSerializer` ya no reutiliza por error el serializer de atracciones;
- ambos exponen `photo_url` para que el frontend pueda consumir imagenes sin reconstruir manualmente rutas relativas.

### Vistas

Archivo: `atracciones_comidas/views.py`

La app ya usa `ModelViewSet` y permisos consistentes con el resto del backend.

Endpoints y acciones actuales:

- listar y consultar atracciones;
- crear, editar y eliminar atracciones;
- listar y consultar comidas;
- crear, editar y eliminar comidas;
- consumir una atraccion descontando usos del brazalete;
- comprar una comida usando saldo del brazalete;
- consultar transacciones auditadas del brazalete desde `/api/compra_brazaletes/transacciones/`.

Permisos actuales:

- lectura publica para catalogo;
- escritura del catalogo solo para administradores;
- acciones de consumo y compra solo para usuarios autenticados con un brazalete propio.

Reglas de negocio del flujo minimo actual:

- el consumo de atracciones exige `bracelet_id` y descuenta `usage_points` del brazalete;
- la compra de comida exige `bracelet_id`;
- si el pago usa `BRACELET_BALANCE`, se descuenta de `Bracelet.current_balance`;
- el consumo de comida ya no usa `ACCOUNT_BALANCE` como fallback, porque esta historia exige descontar saldo del brazalete;
- el backend valida que el brazalete pertenezca al usuario autenticado antes de permitir la operacion.
- cada consumo exitoso crea un `BraceletTransaction` con fecha, tipo, monto o usos descontados, estado anterior/posterior y referencia al brazalete.

Nota de dominio ya definida:

- el consumo actual descuenta saldo/usos del brazalete y registra movimientos auditables mediante `BraceletTransaction`;
- el estado actual del brazalete sigue funcionando como lectura rapida, mientras el historial queda persistido para trazabilidad.

### Rutas

Archivo: `atracciones_comidas/urls.py`

Endpoints:

- `GET /api/atracciones-comidas/attractions/`
- `POST /api/atracciones-comidas/attractions/`
- `GET /api/atracciones-comidas/attractions/{id}/`
- `POST /api/atracciones-comidas/attractions/{id}/consume/`
- `GET /api/atracciones-comidas/foods/`
- `POST /api/atracciones-comidas/foods/`
- `GET /api/atracciones-comidas/foods/{id}/`
- `POST /api/atracciones-comidas/foods/{id}/purchase/`

### Requerimiento completado: modulo de atracciones y comidas

El requerimiento "Completar modulo de atracciones y comidas desde backend hasta frontend" quedo cerrado como MVP funcional.

Criterios resueltos:

- el backend lista, crea y serializa correctamente atracciones y comidas;
- `FoodSerializer` corrige el bug donde comidas se serializaban con `AttractionsSerializer`;
- las rutas del modulo usan el prefijo consistente `/api/atracciones-comidas/`;
- el catalogo base puede cargarse con `seed_atracciones_comidas`;
- el frontend consume el catalogo real y muestra informacion util de atracciones y comidas;
- la pagina dejo de estar en estado placeholder;
- las atracciones descuentan usos del brazalete;
- las comidas descuentan saldo del brazalete.
- cada consumo queda auditado como `BraceletTransaction`.

Comentario de continuidad:

- esta version se considera completa para pruebas funcionales del MVP;
- mas adelante se recomienda sumar vistas especificas de historial de consumos y reglas mas avanzadas de pagos o recargas.

## Flujo de datos entre backend y frontend

### Autenticacion

1. frontend hace `POST /api/login`
2. backend devuelve token y usuario
3. frontend guarda token en `localStorage`
4. siguientes requests viajan con `Authorization: Token ...`

### Compra interna

1. frontend hace `POST /api/compra_brazaletes/recibos/`
2. backend valida saldo
3. backend crea brazalete
4. backend crea recibo
5. frontend consulta luego `/api/compra_brazaletes/recibos/{id}/`

### Compra PayPal

1. frontend pide crear orden
2. backend crea la orden en PayPal
3. frontend aprueba el pago
4. backend captura la orden
5. backend crea brazalete y recibo con `status = CAPTURED`
6. si PayPal envia eventos intermedios o finales, el webhook solo actualiza el recibo con estados validos y sin degradar estados ya consolidados

### Modelo logico acordado para la siguiente etapa

Aunque el codigo actual todavia no lo materializa, el proyecto ya definio esta evolucion del flujo:

1. una compra de brazalete seguira produciendo recibo y brazalete;
2. esa compra deberia quedar representada comercialmente por una `Sale` y su `SaleLine`;
3. la activacion inicial del saldo y de los usos del brazalete deberia registrarse como una transaccion operativa;
4. los consumos de comida y atracciones deberian registrarse como movimientos del brazalete, no como nuevas ventas de brazalete;
5. el saldo actual del brazalete seguira sirviendo como estado rapido, mientras que el historial detallado quedara en el ledger transaccional.

## Matriz de permisos

Esta matriz resume el comportamiento actual esperado para los endpoints sensibles.

### Usuarios y autenticacion

| Endpoint | Sin autenticacion | Cliente autenticado | Administrador |
| --- | --- | --- | --- |
| `POST /api/login` | permitido | permitido | permitido |
| `POST /api/register` | permitido, devuelve token y usuario creado | permitido, devuelve token y usuario creado | permitido, devuelve token y usuario creado |
| `POST /api/user-profile` | `401` | permitido | permitido |
| `PATCH /api/edit-user` | `401` | permitido para sus datos basicos, sin cambiar saldo | permitido |
| `DELETE /api/delete-user` | `401` | permitido sobre su propia cuenta | permitido sobre su propia cuenta |
| `GET /api/Users/` | `401` | `403` | permitido |
| `POST/PATCH/DELETE /api/Users/` | `401` | `403` | permitido |

### Catalogo y brazaletes

| Endpoint | Sin autenticacion | Cliente autenticado | Administrador |
| --- | --- | --- | --- |
| `GET /api/compra_brazaletes/tipos/` | permitido, solo activos | permitido, solo activos | permitido, activos o inactivos con `include_inactive=1` |
| `POST /api/compra_brazaletes/tipos/` | `401` | `403` | permitido |
| `PUT/PATCH/DELETE /api/compra_brazaletes/tipos/{id}/` | `401` | `403` | permitido; `DELETE` se bloquea si el tipo ya tiene brazaletes asociados |
| `GET /api/compra_brazaletes/brazaletes/` | `401` | `403` | permitido |
| `GET /api/compra_brazaletes/brazaletes/{id}/` | `401` | `403` | permitido |
| `POST /api/compra_brazaletes/brazaletes/` | `401` | `403` | permitido |

### Compras y recibos

| Endpoint | Sin autenticacion | Cliente autenticado | Administrador |
| --- | --- | --- | --- |
| `GET /api/compra_brazaletes/recibos/` | `401` | permitido, solo ve los suyos | permitido, ve todos |
| `GET /api/compra_brazaletes/recibos/{id}/` | `401` | permitido si el recibo es suyo | permitido |
| `POST /api/compra_brazaletes/recibos/` | `401` | permitido | permitido |
| `GET /api/compra_brazaletes/transacciones/` | `401` | permitido, solo ve las suyas | permitido, ve todas |
| `POST /api/compra_brazaletes/paypal/create-order/` | `401` | permitido | permitido |
| `POST /api/compra_brazaletes/paypal/capture-order/` | `401` | permitido | permitido |

### Atracciones y comidas

| Endpoint | Sin autenticacion | Cliente autenticado | Administrador |
| --- | --- | --- | --- |
| `GET /api/atracciones-comidas/attractions/` | permitido | permitido | permitido |
| `POST /api/atracciones-comidas/attractions/` | `401` | `403` | permitido |
| `PUT/PATCH/DELETE /api/atracciones-comidas/attractions/{id}/` | `401` | `403` | permitido |
| `POST /api/atracciones-comidas/attractions/{id}/consume/` | `401` | permitido si el brazalete es suyo y tiene usos | permitido si el brazalete es suyo y tiene usos |
| `GET /api/atracciones-comidas/foods/` | permitido | permitido | permitido |
| `POST /api/atracciones-comidas/foods/` | `401` | `403` | permitido |
| `PUT/PATCH/DELETE /api/atracciones-comidas/foods/{id}/` | `401` | `403` | permitido |
| `POST /api/atracciones-comidas/foods/{id}/purchase/` | `401` | permitido si el brazalete es suyo y tiene saldo | permitido si el brazalete es suyo y tiene saldo |

Notas practicas:

- `401` significa que falta autenticacion o el token no fue aceptado.
- `403` significa que el usuario si esta autenticado, pero no tiene privilegios suficientes.
- la distincion de administrador se basa en una sola regla de dominio: `is_staff`, expuesta como `is_admin_user` e `is_admin`.

## Estado actual del backend

### Lo que ya esta bien encaminado

- separacion por apps;
- modelo de usuario propio;
- distincion clara entre cliente y administrador usando una sola regla de dominio;
- `UserViewSet` protegido con la misma regla administrativa centralizada;
- registro de clientes devuelve correctamente token y usuario serializado, incluyendo `is_admin`, sin exponer password;
- `BraceletTypeViewSet` con lectura publica y escritura administrativa consistente;
- tipos de brazalete con estado activo/inactivo para retirar catalogo de compra sin perder historial;
- `BraceletViewSet` restringido a administradores con la misma convencion;
- endpoints de PayPal alineados con autenticacion obligatoria;
- flujo funcional de compra interna;
- flujo funcional de compra por PayPal;
- pruebas automaticas sobre autenticacion, compra interna y contratos defensivos de PayPal/webhook;
- catalogo funcional de atracciones y comidas bajo rutas consistentes;
- consumo minimo de atracciones y comidas conectado al estado real del brazalete;
- consumos de atracciones y comidas auditados con `BraceletTransaction`;
- estados de `PurchaseReceipt` alineados con el flujo real de compra y captura;
- webhook de PayPal alineado con estados persistibles del modelo;
- serializacion anidada util para el frontend;
- uso de signals para codigos automaticos;
- logica objetivo del modelo transaccional ya definida y documentada para la siguiente etapa.

### Riesgos y deuda tecnica visible

- la seguridad final depende de que cada entorno productivo defina correctamente sus variables y no reutilice valores de desarrollo;
- aun depende de la semantica de eventos que entregue PayPal;
- el flujo de consumo actual ya persiste historial transaccional para atracciones y comidas;
- el modelo transaccional completo aun tiene pendiente `Sale`, `SaleLine` y relacion directa `Bracelet -> User`.

## Como seguir documentando bien este backend

La mejor forma de documentar un backend no es copiar todos los modelos y endpoints en bruto. Lo que mas ayuda es contar la historia del sistema.

Orden recomendado:

1. configuracion global;
2. apps y su responsabilidad;
3. modelos;
4. endpoints;
5. flujos de negocio;
6. riesgos actuales.

Buenas practicas:

- separa arquitectura de detalle operativo;
- explica primero por que existe una app y luego sus archivos;
- documenta los endpoints por flujo, no solo por lista;
- anota riesgos reales detectados en el codigo;
- evita describir como "terminado" algo que esta a medias.

Apoyos para mantenerlo sincronizado:

- criterios de aceptacion vigentes: [docs/backlog-criterios-aceptacion.md](backlog-criterios-aceptacion.md);
- decisiones y limitaciones: [docs/registro-decisiones-arquitectura.md](registro-decisiones-arquitectura.md);
- checklist de cierre documental: [docs/gestion-documentacion.md](gestion-documentacion.md).

Plantilla mental util para documentar cada app:

- que dominio resuelve;
- que modelos maneja;
- que endpoints expone;
- que reglas de negocio aplica;
- que dependencias externas toca;
- que limites o bugs visibles tiene hoy.
