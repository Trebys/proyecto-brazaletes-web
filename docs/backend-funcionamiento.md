# Backend: funcionamiento del codigo

## Objetivo de este documento

Este archivo resume como funciona el backend actual del proyecto a partir del codigo real. Sirve para trabajar esta capa de forma independiente y para entender:

- la arquitectura general de Django;
- las apps que existen;
- los modelos y endpoints principales;
- los flujos de autenticacion y compra;
- el estado actual del backend, incluyendo limites y riesgos visibles.

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
- configura PostgreSQL como base de datos principal usando variables de entorno;
- habilita `TokenAuthentication` y `SessionAuthentication`;
- permite CORS para los hosts configurados por entorno, manteniendo valores locales razonables para desarrollo.

Observaciones del estado actual:

- `DEBUG` ya no esta fijo en codigo; se controla con `DJANGO_DEBUG`;
- `SECRET_KEY` ya no esta hardcodeada en el repositorio; se lee desde `DJANGO_SECRET_KEY`;
- las credenciales de PostgreSQL ya no estan hardcodeadas; se leen desde variables `DB_*`;
- `ALLOWED_HOSTS`, CORS y CSRF confiables tambien salen de variables de entorno;
- existe `backend/.env.example` como base para desarrollo local;
- `TIME_ZONE` esta en `UTC`.

Con esto, el backend ya quedo preparado para mantener una configuracion local simple sin acoplar secretos reales al codigo versionado.

### `backend_django/urls.py`

Centraliza las rutas:

- `/admin/`
- `/docs/`
- `/api/` -> app `login`
- `/api/compra_brazaletes/` -> app `compra_brazaletes`
- `/` -> app `atracciones_comidas`

Observacion importante: `atracciones_comidas` no esta bajo `/api/`, asi que la API no es totalmente consistente en su prefijo.

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

Observacion importante: el tiempo real de expiracion implementado en el codigo es de 1 minuto, aunque el comentario menciona 15 minutos.

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
5. devuelve token y datos del usuario.

#### `register_client`

Flujo:

1. valida el payload con `UserSerializer`;
2. crea un `User`;
3. cifra la password con `set_password`;
4. crea un `ExpiringToken`;
5. devuelve token y datos del usuario.

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

No genera un token nuevo. Solo verifica si el token actual sigue dentro de la ventana de vigencia. Si ya expiro, elimina el token y devuelve error.

#### `logout`

Elimina el token actual del usuario autenticado.

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

Importante: esta logica ya quedo definida como diseno del modelo, pero todavia no esta implementada en los modelos Django actuales. El detalle completo quedo documentado en [docs/modelo-transaccional-brazaletes.md](/C:/Users/3st3b/Dev/brazaletes_web_agentes_IA/proyecto-brazaletes-web/docs/modelo-transaccional-brazaletes.md).

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
2. busca el `BraceletType`;
3. valida el saldo del usuario;
4. descuenta el precio de `account_balance`;
5. crea un `Bracelet` con saldo de comida y usos iniciales;
6. crea un `PurchaseReceipt` con `status = CAPTURED`;
7. devuelve el recibo serializado.

Observacion: la compra con saldo interno queda en `status = CAPTURED`, porque el cobro se ejecuta en el mismo flujo.

Nota de alcance vigente:

- hoy el backend implementa la venta inicial del brazalete y su recibo;
- el consumo posterior todavia no tiene modelo transaccional persistente en codigo;
- la logica aprobada es que la comida y las atracciones no generen una nueva venta del brazalete, sino movimientos operativos del brazalete.

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
- solo persiste estados definidos por el modelo: `APPROVED` o `CAPTURED`, segun el evento;
- evita degradar un recibo ya `CAPTURED` si llegan eventos fuera de orden;
- usa logging en lugar de `print()` para los mensajes operativos.

## App `atracciones_comidas`

Esta app existe, pero todavia se ve mas temprana que `compra_brazaletes`.

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

### Serializadores

Archivo: `atracciones_comidas/serializers.py`

Hay dos serializadores:

- `AttractionsSerializer`
- `FoodSerializer`

### Vistas

Archivo: `atracciones_comidas/views.py`

Endpoints actuales:

- listar atracciones
- crear atracciones
- listar comidas
- crear comidas

Observacion importante: `getFoods()` usa `AttractionsSerializer` en lugar de `FoodSerializer`. Eso es un error funcional que conviene corregir cuando trabajemos esta app.

Nota de dominio ya definida:

- cuando se implemente el consumo de servicios, `Food` y `Attractions` no deberian reutilizar `PurchaseReceipt` como historial;
- esos consumos deberian registrarse como movimientos del brazalete, por ejemplo mediante `BraceletTransaction`;
- eso permitira auditar saldo, usos restantes, operador y motivo del cambio sin solapar la logica de compra inicial.

### Rutas

Archivo: `atracciones_comidas/urls.py`

Endpoints:

- `/attractions/`
- `/attractions/add/`
- `/foods/`
- `/foods/add/`

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
| `POST /api/register` | permitido | permitido | permitido |
| `POST /api/user-profile` | `401` | permitido | permitido |
| `PATCH /api/edit-user` | `401` | permitido para sus datos basicos, sin cambiar saldo | permitido |
| `DELETE /api/delete-user` | `401` | permitido sobre su propia cuenta | permitido sobre su propia cuenta |
| `GET /api/Users/` | `401` | `403` | permitido |

### Catalogo y brazaletes

| Endpoint | Sin autenticacion | Cliente autenticado | Administrador |
| --- | --- | --- | --- |
| `GET /api/compra_brazaletes/tipos/` | permitido | permitido | permitido |
| `POST /api/compra_brazaletes/tipos/` | `401` | `403` | permitido |
| `PUT/PATCH/DELETE /api/compra_brazaletes/tipos/{id}/` | `401` | `403` | permitido |
| `GET /api/compra_brazaletes/brazaletes/` | `401` | `403` | permitido |
| `GET /api/compra_brazaletes/brazaletes/{id}/` | `401` | `403` | permitido |
| `POST /api/compra_brazaletes/brazaletes/` | `401` | `403` | permitido |

### Compras y recibos

| Endpoint | Sin autenticacion | Cliente autenticado | Administrador |
| --- | --- | --- | --- |
| `GET /api/compra_brazaletes/recibos/` | `401` | permitido, solo ve los suyos | permitido, ve todos |
| `GET /api/compra_brazaletes/recibos/{id}/` | `401` | permitido si el recibo es suyo | permitido |
| `POST /api/compra_brazaletes/recibos/` | `401` | permitido | permitido |
| `POST /api/compra_brazaletes/paypal/create-order/` | `401` | permitido | permitido |
| `POST /api/compra_brazaletes/paypal/capture-order/` | `401` | permitido | permitido |

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
- `BraceletTypeViewSet` con lectura publica y escritura administrativa consistente;
- `BraceletViewSet` restringido a administradores con la misma convencion;
- endpoints de PayPal alineados con autenticacion obligatoria;
- flujo funcional de compra interna;
- flujo funcional de compra por PayPal;
- estados de `PurchaseReceipt` alineados con el flujo real de compra y captura;
- webhook de PayPal alineado con estados persistibles del modelo;
- serializacion anidada util para el frontend;
- uso de signals para codigos automaticos;
- logica objetivo del modelo transaccional ya definida y documentada para la siguiente etapa.

### Riesgos y deuda tecnica visible

- la seguridad final depende de que cada entorno productivo defina correctamente sus variables y no reutilice valores de desarrollo;
- expiracion de token con comentarios y tiempos inconsistentes;
- prefijos de rutas inconsistentes;
- aun depende de la semantica de eventos que entregue PayPal;
- `getFoods()` serializa con el serializer equivocado;
- el modelo transaccional de consumos y auditoria ya esta definido, pero todavia no fue implementado en entidades y endpoints reales.

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

Plantilla mental util para documentar cada app:

- que dominio resuelve;
- que modelos maneja;
- que endpoints expone;
- que reglas de negocio aplica;
- que dependencias externas toca;
- que limites o bugs visibles tiene hoy.
