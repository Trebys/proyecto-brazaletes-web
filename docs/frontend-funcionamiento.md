# Frontend: funcionamiento del codigo

## Objetivo de este documento

Este archivo explica como funciona el frontend actual del proyecto desde el codigo real. La idea es que sirva para:

- entender el flujo general sin tener que abrir todos los archivos;
- ubicar rapido donde vive cada responsabilidad;
- poder trabajar solo el frontend sin mezclar demasiado contexto del backend;
- dejar claro el estado actual, incluyendo partes incompletas o con deuda tecnica.

## Stack actual

- React 18
- Vite
- React Router DOM
- Axios
- Tailwind CSS con clases utilitarias personalizadas
- Integracion de PayPal con `@paypal/react-paypal-js`

Archivo clave de dependencias: `frontend/frontend_react/package.json`

## Estructura principal

```text
frontend/frontend_react/
  src/
    api/
      api.js
    components/
      AutoLogout.jsx
      LoginForm.jsx
      MasterPageCliente.jsx
      MyBracelets.jsx
      PayPalButton.jsx
      PrivateRoutes.jsx
      ProfileDataForm.jsx
      RegistroForm.jsx
    pages/
      InicioPage.jsx
      ComprarBrazaletesPage.jsx
      PerfilClientePage.jsx
      ReciboCompraPage.jsx
      LoginPage.jsx
      AdministradorPage.jsx
      AtraccionesComidasPage.jsx
      ContactoPage.jsx
    App.jsx
    main.jsx
```

## Punto de entrada

### `src/main.jsx`

Es el arranque de la aplicacion. Renderiza `App` dentro de `React.StrictMode` y envuelve toda la app con `AutoLogout`.

Eso significa que la logica de expiracion por inactividad queda activa para toda la aplicacion desde el inicio.

### `src/App.jsx`

Define el enrutamiento principal.

- `/login` muestra `LoginPage`
- `/registro` muestra `RegistroForm`
- `/administrador` se renderiza fuera del layout del cliente y queda protegido con `PrivateRoutes requireAdmin`
- el resto de rutas se renderiza dentro de `MasterPageCliente`
- `PrivateRoutes` protege `/mi-perfil/*`

Observacion importante: dentro de la ruta principal se anidan otros `Routes` directamente dentro del `element`. Funciona, pero no es la forma mas limpia ni la mas escalable en React Router v6. A futuro conviene migrarlo a rutas anidadas declarativas con `Outlet`.

## Capa de API

### `src/api/api.js`

Este archivo concentra casi toda la comunicacion con el backend.

Responsabilidades:

- crea una instancia de Axios cuya `baseURL` sale de `VITE_API_BASE_URL`
- adjunta automaticamente el token desde `localStorage`
- sincroniza `user_data` en `localStorage` cuando el perfil cambia o se consulta de nuevo
- expone helpers para limpiar sesion y detectar si el usuario actual es admin
- expone funciones para login, registro, perfil, compra interna y compra por PayPal
- expone tambien helpers para construir URLs de media y consumir atracciones/comidas
- expone helpers administrativos para consultar y gestionar clientes, tipos de brazalete, brazaletes, recibos, comidas y atracciones

Funciones principales:

- `loginUser(identifier, password)`
- `registerClient(clientData)`
- `getClientData()`
- `submitClientData(userData)`
- `deleteClientAccount()`
- `Logout()`
- `getTiposBrazaletes()`
- `createPurchaseReceipt(braceletTypeId)`
- `createPayPalOrder(amount, currency, description)`
- `capturePayPalOrder(orderID, braceletTypeId)`
- `getPurchaseReceiptById(receiptId)`
- `getUserPurchaseReceipts()`
- `getAttractions()`
- `getFoods()`
- `consumeAttraction(attractionId, braceletId)`
- `purchaseFood(foodId, braceletId, paymentSource)`
- `getBraceletTransactions()`
- `buildMediaUrl(path)`
- helpers administrativos: `getAdminClients`, `updateAdminClient`, `deleteAdminClient`, `getAdminBraceletTypes`, `createAdminBraceletType`, `updateAdminBraceletType`, `deleteAdminBraceletType`, `getAdminBracelets`, `updateAdminBracelet`, `deleteAdminBracelet`, `getAdminReceipts`, `updateAdminReceipt`, `deleteAdminReceipt`, `createAdminFood`, `updateAdminFood`, `deleteAdminFood`, `createAdminAttraction`, `updateAdminAttraction`, `deleteAdminAttraction`

Decisiones actuales a tener presentes:

- el token se guarda en `localStorage` como `access_token`;
- parte del estado del usuario tambien se guarda en `localStorage` como `user_data`;
- `user_data` incluye informacion de privilegios como `is_admin`, `is_staff` e `is_superuser`;
- para la UI, la bandera canonica es `is_admin`, que el backend deriva desde `is_staff`;
- el `baseURL` ya no esta fijo en codigo; se toma de `VITE_API_BASE_URL`;
- el frontend falla temprano si faltan variables de entorno obligatorias, lo que evita builds con configuracion incompleta;
- la redireccion global por error `401` esta comentada para evitar saltos de pagina automaticos.

Regla administrativa vigente en frontend:

- la UI toma `is_admin` como fuente de verdad para distinguir cliente y administrador;
- `is_admin` llega desde backend ya resuelto a partir de la regla operativa basada en `is_staff`;
- `is_superuser` no define comportamiento de interfaz por si solo.

## Flujo de autenticacion

### Login

Archivo principal: `src/components/LoginForm.jsx`

Flujo:

1. el usuario escribe `identifier` y `password`;
2. `handleLogin` llama `loginUser`;
3. si el backend responde bien, se guardan `Token` y `User` en `localStorage`;
4. se redirige al usuario a la ruta previa;
5. si el usuario es administrador e inicio sesion sin una ruta previa especifica, se redirige a `/administrador`.

### Registro

Archivo principal: `src/components/RegistroForm.jsx`

Flujo:

1. se arma un objeto `clientData`;
2. se llama `registerClient`;
3. si el backend responde `201`, se limpia el formulario.

Observacion: el frontend no inicia sesion automaticamente despues del registro, aunque el backend si devuelve token.

Estado vigente para este flujo:

- el frontend sigue mostrando el flujo de login y registro como hasta ahora;
- el backend ya tiene cobertura automatica sobre login, registro, permisos basicos y proteccion del saldo del perfil;
- esto reduce el riesgo de regresiones invisibles en los flujos que alimentan las pantallas de acceso y perfil.

### Rutas privadas

Archivo principal: `src/components/PrivateRoutes.jsx`

La proteccion ya no depende solo de que exista `access_token` en `localStorage`.

Funcionamiento actual:

- si no hay token, redirige a `/login`;
- si la ruta requiere admin, revisa `user_data` y su bandera `is_admin`;
- si falta informacion local o puede estar desactualizada, consulta `user-profile` al backend para revalidar;
- si el usuario no tiene privilegios, bloquea `/administrador` y lo redirige a `/inicio`.

Regla operativa en frontend:

- cliente: `is_admin = false`;
- administrador operativo: `is_admin = true`;
- la UI no infiere administracion desde `is_superuser`; esa bandera se muestra solo como contexto.

### Auto logout por inactividad

Archivo principal: `src/components/AutoLogout.jsx`

Funcionamiento actual:

- escucha eventos de usuario: `mousemove`, `keydown`, `click`, `scroll`;
- reinicia un temporizador cada vez que detecta actividad;
- si expira el tiempo, llama al endpoint `refresh-token/`;
- si ese endpoint falla, hace logout y limpia `localStorage`.

Observacion importante:

- el comentario dice que el tiempo es de prueba;
- el temporizador del frontend esta en 5 minutos;
- el backend valida expiracion con 1 minuto.

Esa diferencia puede provocar comportamientos confusos durante pruebas.

## Layout general

### `src/components/MasterPageCliente.jsx`

Este componente funciona como layout publico para la mayor parte del sitio.

Incluye:

- navbar superior;
- enlaces a inicio, compra, atracciones/comidas y contacto;
- boton de perfil o de login segun exista `user_data`;
- boton de cerrar sesion;
- footer con branding y redes.
- usa el color `fondoLogin` (`#00565F`) para mantener consistencia con los mockups.

Detalles practicos:

- usa `navigate`, pero tambien renderiza enlaces con `href`; eso puede producir recargas completas si el navegador prioriza el comportamiento nativo del enlace;
- el estado del usuario se lee una sola vez desde `localStorage`, asi que no existe un contexto global de autenticacion.

## Paginas y flujos principales

### `src/pages/InicioPage.jsx`

Es la landing principal del cliente.

Responsabilidades:

- mostrar introduccion del parque;
- renderizar `Carrusel`;
- cargar tipos de brazaletes desde el backend;
- mostrar tarjetas por tipo;
- navegar a compra enviando `tipoId` por `location.state`.

### `src/pages/ComprarBrazaletesPage.jsx`

Es el centro del flujo de compra.

Responsabilidades:

- cargar tipos de brazaletes;
- seleccionar un tipo por defecto;
- permitir compra con saldo interno;
- permitir compra con PayPal;
- bloquear compra si el usuario no ha iniciado sesion.

Detalle practico: la pagina consume el catalogo publico de tipos activos. Si un administrador desactiva un tipo, deja de aparecer en inicio y compra, y el backend tambien rechaza intentos de compra con ese ID.

Flujo con saldo interno:

1. valida que exista token;
2. llama `createPurchaseReceipt(selectedTipo.id)`;
3. el backend devuelve un recibo ya pagado con `status = CAPTURED`;
4. guarda `receiptId` en `localStorage`;
5. navega a `/recibo-compra`.

Flujo con PayPal:

1. renderiza `PayPalButton`;
2. `PayPalButton` crea la orden en backend;
3. al aprobar el pago, captura la orden;
4. el backend devuelve un recibo con estado consistente con el pago, normalmente `CAPTURED`;
5. guarda `receiptId` en `localStorage`;
6. navega a `/recibo-compra`.

Nota de alcance vigente:

- el frontend actual solo cubre la compra inicial del brazalete y la consulta del recibo;
- la logica nueva del proyecto ya definio que los futuros consumos de comida y atracciones no se modelaran como nuevas ventas de brazalete;
- cuando esa parte se implemente, la interfaz probablemente necesitara vistas de historial de movimientos o consumos del brazalete, ademas del recibo de compra.

Estado vigente para este flujo:

- el backend ya tiene cobertura automatica para compra interna con saldo, captura PayPal y contratos clave del webhook;
- eso protege el flujo que consume `ComprarBrazaletesPage`, `PayPalButton` y `ReciboCompraPage`;
- los escenarios de rechazo mas sensibles, como saldo insuficiente, firma invalida o errores de verificacion con PayPal, ya no dependen solo de prueba manual.

### `src/components/PayPalButton.jsx`

Encapsula la integracion con PayPal.

Responsabilidades:

- inicializar `PayPalScriptProvider`;
- crear la orden en backend;
- capturar la orden aprobada;
- redirigir al recibo luego del pago.

Observacion importante: el `client-id` de PayPal ya no esta hardcodeado. Ahora se toma de `VITE_PAYPAL_CLIENT_ID`, lo que permite separar credenciales por entorno y mantener el repo sin configuracion sensible embebida.

### `src/pages/ReciboCompraPage.jsx`

Muestra el detalle de la ultima compra.

Flujo:

1. lee `receiptId` desde `localStorage`;
2. consulta el endpoint del recibo;
3. renderiza datos del usuario, brazalete, monto, metodo de pago y estado de la compra.

Detalle practico del estado actual:

- si el brazalete ya tuvo consumos, la pagina ya muestra `current_balance` y `attraction_uses_remaining` reales del brazalete;
- si todavia no hubo consumos, sigue mostrando el estado inicial esperado.

### `src/pages/PerfilClientePage.jsx`

Es una pagina contenedora con rutas internas:

- `info` -> `ProfileDataForm`
- `mis-brazaletes` -> `MyBracelets`

### `src/components/ProfileDataForm.jsx`

Responsabilidades:

- cargar perfil del usuario autenticado;
- permitir editar datos;
- permitir eliminar la cuenta.

Detalle importante: el campo `password` se rellena con `******` como valor visual. El backend evita cambiarla si llega exactamente ese valor.

### `src/components/MyBracelets.jsx`

Responsabilidades:

- listar recibos del usuario actual;
- mostrar datos resumidos del brazalete comprado;
- guardar `receiptId` en `localStorage` cuando el usuario pulsa "Ver Recibo";
- redirigir a `ReciboCompraPage`.

Detalle practico del estado actual:

- la tarjeta ya no muestra solo los valores iniciales del tipo de brazalete;
- ahora refleja el saldo y los usos restantes reales del brazalete.

### `src/pages/AtraccionesComidasPage.jsx`

Esta pagina dejo de ser placeholder y ahora resuelve el catalogo operativo de atracciones y comidas.

Responsabilidades:

- cargar el catalogo publico de atracciones y comidas;
- si el usuario tiene sesion, cargar tambien sus recibos y perfil para obtener brazaletes y saldo de cuenta;
- permitir seleccionar un brazalete activo;
- consumir atracciones descontando usos del brazalete;
- comprar comidas descontando saldo del brazalete;
- reflejar en pantalla el nuevo estado del brazalete sin recargar toda la aplicacion.
- mostrar feedback de exito con el identificador del movimiento auditado.

Decision vigente del flujo minimo:

- las atracciones solo consumen usos del brazalete;
- las comidas solo pueden cobrarse con saldo del brazalete;
- si no hay saldo suficiente, la interfaz bloquea la accion y el backend tambien rechaza la operacion;
- PayPal no se reutiliza todavia para comidas, porque el flujo actual de PayPal sigue acoplado a la compra inicial del brazalete.

### `src/pages/AdministradorPage.jsx`

Es el panel operativo del sistema para administradores. Ya no es un placeholder y esta separado visualmente del flujo del cliente.

Responsabilidades:

- cargar en paralelo clientes, brazaletes, recibos, tipos de brazalete, comidas y atracciones;
- mostrar un resumen operativo con totales de clientes, brazaletes, ventas e ingresos registrados;
- ofrecer accesos directos a clientes, brazaletes, ventas, comidas y atracciones;
- consultar clientes y gestionar alta, edicion de datos basicos, saldo y eliminacion de clientes no administradores;
- consultar y gestionar tipos de brazalete dentro de la seccion Brazaletes, incluyendo precio, saldo de comida, usos de atraccion, descripcion, imagen, activacion/desactivacion y eliminacion cuando no tienen historial asociado;
- consultar y gestionar brazaletes emitidos dentro de la misma seccion, incluyendo tipo, saldo y usos restantes;
- consultar ventas/recibos y editar su estado operativo;
- consultar y gestionar comidas y atracciones, incluyendo imagenes;
- mantener botones de perfil y cierre de sesion consistentes con el layout principal;
- mostrar footer con anio actual calculado automaticamente.

Detalle practico:

- la ruta `/administrador` esta protegida por `PrivateRoutes requireAdmin`;
- la interfaz usa `is_admin` desde `user_data` y revalidacion con `user-profile` si hace falta;
- el panel reutiliza los endpoints administrativos existentes del backend;
- los tipos desactivados se mantienen visibles para el administrador, pero desaparecen del flujo publico de compra;
- la seccion `Brazaletes` agrupa dos bloques separados: catalogo de tipos de brazalete y brazaletes emitidos;
- la tabla administrativa incluye busqueda local, ordenamiento ascendente/descendente por columna con indicadores visuales, paginacion local y selector de filas por pagina;
- las secciones con muchas columnas, como clientes y ventas, priorizan el ancho de la tabla y mueven el formulario debajo hasta pantallas mas amplias para mejorar lectura;
- las acciones de eliminacion piden confirmacion antes de llamar al backend;
- los roles administrativos no se editan desde este panel por seguridad; `is_staff` e `is_superuser` siguen siendo de solo lectura desde la API publica del backoffice.

### Requerimiento completado: gestion administrativa de tipos de brazalete

El requerimiento "Implementar gestion administrativa de tipos de brazalete" quedo cerrado desde frontend.

Criterios resueltos:

- el administrador gestiona tipos de brazalete desde la pagina `/administrador`;
- la gestion vive dentro de la seccion `Brazaletes`, separada visualmente de los brazaletes emitidos;
- el formulario permite crear y editar nombre, precio, saldo de comida, usos de atraccion, descripcion, imagen y disponibilidad para compra;
- la tabla permite consultar tipos activos e inactivos, editarlos, activarlos/desactivarlos y solicitar eliminacion;
- los tipos desactivados dejan de mostrarse en `InicioPage` y `ComprarBrazaletesPage`;
- `ComprarBrazaletesPage` evita operar sin un tipo disponible y usa URLs de media construidas desde la configuracion de API;
- el acceso sigue restringido por `PrivateRoutes requireAdmin`, por lo que clientes no pueden abrir el panel administrativo.

### Requerimiento completado: modulo de atracciones y comidas

El requerimiento "Completar modulo de atracciones y comidas desde backend hasta frontend" quedo cerrado como MVP funcional desde la perspectiva del frontend.

Criterios resueltos:

- `AtraccionesComidasPage.jsx` dejo de ser placeholder;
- la pagina consume datos reales de `/api/atracciones-comidas/attractions/` y `/api/atracciones-comidas/foods/`;
- la interfaz muestra imagen, nombre, descripcion, usos requeridos y precio segun corresponda;
- el diseno vuelve a respetar la estructura del mockup original: secciones simples de atracciones y comidas con tarjetas centradas;
- al iniciar sesion, el usuario puede seleccionar un brazalete y ver sus usos/saldo actuales;
- usar una atraccion actualiza los usos restantes;
- comprar comida actualiza el saldo del brazalete;
- `MyBracelets` y `ReciboCompraPage` muestran el estado actual del brazalete, no solo los valores iniciales del tipo.

Comentario de continuidad:

- esta version queda lista para pruebas funcionales del MVP;
- mas adelante conviene agregar historial de consumos, una vista para movimientos del brazalete y mejoras de administracion visual del catalogo.

### Requerimiento completado: pruebas backend para autenticacion, compra interna y pagos

Aunque la implementacion de pruebas vive en backend, este requerimiento ya impacta directamente la estabilidad de los flujos principales consumidos por frontend.

Criterios resueltos desde la perspectiva del frontend:

- login, registro y permisos basicos ya cuentan con cobertura automatica en backend;
- la compra con saldo interno ya tiene pruebas utiles sobre exito y rechazos de negocio;
- la captura de PayPal y el webhook ya tienen pruebas sobre contratos clave y errores controlados;
- los flujos visibles para el usuario en login, compra y recibo quedan mejor protegidos frente a regresiones.

## Componentes secundarios

### `src/components/Carrusel.jsx`

Carrusel manual de imagenes locales para la home.

### `src/components/ModalMessage.jsx`

Modal simple usado para avisar que el usuario debe iniciar sesion antes de comprar.

## Matriz de acceso en frontend

Esta matriz resume que deberia pasar en la interfaz segun el tipo de usuario.

| Ruta o accion | Sin sesion | Cliente autenticado | Administrador |
| --- | --- | --- | --- |
| `/inicio` | permitido | permitido | permitido |
| `/comprar-brazaletes` | permitido | permitido | permitido |
| intento de compra interna | bloqueado por falta de sesion | permitido | permitido |
| inicio de flujo PayPal | bloqueado por falta de sesion | permitido | permitido |
| `/mi-perfil/*` | redirige a `/login` | permitido | permitido |
| `/administrador` | redirige a `/login` | redirige a `/inicio` | permitido |
| gestion en `/administrador` | no disponible | no disponible | permitido |

Notas practicas:

- el frontend usa `user_data` para detectar privilegios, pero puede revalidar con `user-profile` si falta informacion o puede estar desactualizada.
- aunque el frontend bloquee una ruta, la validacion definitiva sigue estando en el backend.

## Estado actual del frontend

### Partes funcionales

- login basico
- registro basico
- proteccion de rutas por autenticacion y una regla administrativa ya unificada
- consulta de tipos de brazalete
- compra con saldo interno
- compra con PayPal
- visualizacion de estados consistentes de recibo para compras internas y PayPal
- respaldo automatizado en backend para los flujos criticos de login, compra interna y pagos
- visualizacion de recibo
- visualizacion y edicion basica del perfil
- bloqueo del panel administrativo para usuarios sin privilegios administrativos
- panel operativo administrativo para clientes, brazaletes, tipos de brazalete, ventas, comidas y atracciones
- tablas administrativas con busqueda, ordenamiento visual, paginacion y mejor distribucion de espacio en secciones densas
- listado de compras del usuario
- catalogo funcional de atracciones y comidas
- consumo minimo de atracciones y comidas sobre el estado real del brazalete
- feedback de consumos con numero de movimiento auditado

### Siguiente mejora definida

El proyecto ya dejo definido el modelo de dominio para la siguiente etapa:

- `PurchaseReceipt` seguira representando el pago de la compra inicial;
- la venta de brazaletes se separara conceptualmente del historial operativo del brazalete;
- los consumos de comida y atracciones ya aparecen como movimientos del brazalete, no como nuevas compras del mismo.

La interfaz ya consume el estado actual del brazalete para atracciones y comidas y muestra el numero de transaccion devuelto por el backend. Lo que queda para una mejora posterior es exponer una vista de historial transaccional completa.

### Partes incompletas o minimas

- varias paginas vacias en `src/pages/`
- `MasterPageAdmin.jsx`
- `FormularioCompra.jsx`

### Deuda tecnica visible

- uso intensivo de `localStorage` como fuente de verdad;
- ausencia de contexto global para autenticacion;
- parte del estado del usuario sigue viviendo duplicado entre backend, memoria y `localStorage`;
- mezcla de `href` y `navigate`;
- varios textos del codigo muestran problemas de codificacion de caracteres;
- el modulo de atracciones y comidas esta completo como MVP, pero aun no expone una vista dedicada de historial transaccional del brazalete.

## Como seguir documentando bien este frontend

Si vas a mantener este documento, la forma mas util es documentar por capas, no por archivo suelto.

Orden recomendado:

1. punto de entrada;
2. rutas;
3. capa de API;
4. flujos de negocio;
5. estado actual y deuda tecnica.

Buenas practicas:

- describe primero la responsabilidad del modulo y luego sus detalles;
- separa "como funciona hoy" de "como deberia funcionar";
- documenta flujos completos, no solo componentes aislados;
- si una parte esta incompleta, dejalo escrito en vez de asumir que existe;
- cuando cambie un endpoint o una ruta, actualiza este archivo en la misma tarea.

Plantilla mental util para documentar cada modulo:

- que resuelve;
- de que depende;
- que expone;
- que flujo dispara;
- que limitaciones tiene hoy.
