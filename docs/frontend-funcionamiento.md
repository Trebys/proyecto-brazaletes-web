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
- el resto de rutas se renderiza dentro de `MasterPageCliente`
- `PrivateRoutes` protege `/mi-perfil/*`
- `PrivateRoutes` con validacion administrativa protege `/administrador`

Observacion importante: dentro de la ruta principal se anidan otros `Routes` directamente dentro del `element`. Funciona, pero no es la forma mas limpia ni la mas escalable en React Router v6. A futuro conviene migrarlo a rutas anidadas declarativas con `Outlet`.

## Capa de API

### `src/api/api.js`

Este archivo concentra casi toda la comunicacion con el backend.

Responsabilidades:

- crea una instancia de Axios con `baseURL = http://localhost:8000/api/`
- adjunta automaticamente el token desde `localStorage`
- sincroniza `user_data` en `localStorage` cuando el perfil cambia o se consulta de nuevo
- expone helpers para limpiar sesion y detectar si el usuario actual es admin
- expone funciones para login, registro, perfil, compra interna y compra por PayPal

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

Decisiones actuales a tener presentes:

- el token se guarda en `localStorage` como `access_token`;
- parte del estado del usuario tambien se guarda en `localStorage` como `user_data`;
- `user_data` incluye informacion de privilegios como `is_admin`, `is_staff` e `is_superuser`;
- para la UI, la bandera canonica es `is_admin`, que el backend deriva desde `is_staff`;
- el `baseURL` esta fijo a `localhost`, asi que no hay configuracion por entorno;
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
4. se redirige al usuario a la ruta previa o a `/inicio`.

### Registro

Archivo principal: `src/components/RegistroForm.jsx`

Flujo:

1. se arma un objeto `clientData`;
2. se llama `registerClient`;
3. si el backend responde `201`, se limpia el formulario.

Observacion: el frontend no inicia sesion automaticamente despues del registro, aunque el backend si devuelve token.

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

### `src/components/PayPalButton.jsx`

Encapsula la integracion con PayPal.

Responsabilidades:

- inicializar `PayPalScriptProvider`;
- crear la orden en backend;
- capturar la orden aprobada;
- redirigir al recibo luego del pago.

Observacion importante: el `client-id` de PayPal esta hardcodeado en el frontend. En un proyecto mas maduro conviene moverlo a variables de entorno del frontend.

### `src/pages/ReciboCompraPage.jsx`

Muestra el detalle de la ultima compra.

Flujo:

1. lee `receiptId` desde `localStorage`;
2. consulta el endpoint del recibo;
3. renderiza datos del usuario, brazalete, monto, metodo de pago y estado de la compra.

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
- visualizacion de recibo
- visualizacion y edicion basica del perfil
- bloqueo del panel administrativo para usuarios sin privilegios administrativos
- listado de compras del usuario

### Partes incompletas o minimas

- `AdministradorPage.jsx`
- `AtraccionesComidasPage.jsx`
- varias paginas vacias en `src/pages/`
- `MasterPageAdmin.jsx`
- `FormularioCompra.jsx`

### Deuda tecnica visible

- configuraciones sensibles fijas en codigo (`baseURL`, `PayPal client id`);
- uso intensivo de `localStorage` como fuente de verdad;
- ausencia de contexto global para autenticacion;
- helpers repetidos para construir URLs de imagen;
- mezcla de `href` y `navigate`;
- varios textos del codigo muestran problemas de codificacion de caracteres.

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
