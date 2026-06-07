# Frontend: funcionamiento del codigo

## Objetivo de este documento

Este archivo explica como funciona el frontend actual del proyecto desde el codigo real. La idea es que sirva para:

- entender el flujo general sin tener que abrir todos los archivos;
- ubicar rapido donde vive cada responsabilidad;
- poder trabajar solo el frontend sin mezclar demasiado contexto del backend;
- dejar claro el estado actual, incluyendo partes incompletas o con deuda tecnica.

Regla de mantenimiento: cuando un cambio modifique rutas, pantallas, capa de API, sesion, permisos, variables de entorno o flujos principales del frontend, este documento debe actualizarse en la misma rama. La guia completa esta en [docs/gestion-documentacion.md](gestion-documentacion.md).

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
    auth/
      AuthContext.jsx
    components/
      AutoLogout.jsx
      BraceletMovementHistory.jsx
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
      SobreNosotrosPage.jsx
      ContactoPage.jsx
      TerminosCondicionesPage.jsx
    App.jsx
    main.jsx
```

## Punto de entrada

### `src/main.jsx`

Es el arranque de la aplicacion. Renderiza `App` dentro de `React.StrictMode`.

La logica global de autenticacion y expiracion se monta dentro de `App`, ya bajo el contexto de React Router, para poder navegar sin recargas completas.

### `src/App.jsx`

Define el enrutamiento principal.

- `/login` muestra `LoginPage`
- `/registro` muestra `RegistroForm`
- `/recuperar-contrasena` muestra `PasswordResetPage`
- `/administrador` se renderiza fuera del layout del cliente y queda protegido con `PrivateRoutes requireAdmin`
- `MasterPageCliente` funciona como layout con `Outlet` para las rutas publicas del cliente
- `/sobre-nosotros` muestra una pagina publica de contexto del parque y del concepto de la experiencia
- `/contacto` muestra un formulario publico de contacto con informacion de atencion y redes ficticias
- `/terminos-condiciones` muestra terminos publicos de uso, brazaletes, seguridad y pagos del parque
- `PrivateRoutes` protege `/mi-perfil`
- las rutas internas de perfil (`info` y `mis-brazaletes`) se declaran en la misma jerarquia de rutas de `App`
- el perfil tambien incluye `historial-movimientos` para consultar el ledger transaccional de brazaletes del cliente

Estado vigente: el enrutamiento principal usa rutas anidadas declarativas de React Router v6 con `Outlet`. Esto evita tener `Routes` embebidos dentro de `element` y deja una estructura mas clara para extender paneles, roles y secciones protegidas.

### `src/auth/AuthContext.jsx`

Centraliza el estado de autenticacion en memoria React.

Responsabilidades:

- inicializar token y usuario desde almacenamiento persistente;
- exponer `isAuthenticated`, `isAdmin`, `user` y acciones de sesion;
- guardar una sesion autenticada luego del login;
- actualizar datos de usuario despues de consultar o editar perfil;
- limpiar sesion y datos temporales de compra al cerrar sesion;
- escuchar cambios de almacenamiento entre pestanas para sincronizar estado.

Decision vigente:

- `localStorage` sigue existiendo como persistencia entre recargas;
- el estado que consume la UI vive en `AuthContext`;
- los componentes no deben leer `user_data` directamente desde `localStorage` cuando puedan usar `useAuth`.

## Capa de API

### `src/api/api.js`

Este archivo concentra casi toda la comunicacion con el backend.

Responsabilidades:

- crea una instancia de Axios cuya `baseURL` sale de `VITE_API_BASE_URL`
- adjunta automaticamente el token desde helpers centralizados de sesion
- sincroniza datos persistentes del usuario cuando el perfil cambia o se consulta de nuevo
- expone helpers para guardar/limpiar sesion y detectar si el usuario actual es admin
- expone helpers para guardar o limpiar el recibo temporal de compra
- expone funciones para login, registro, recuperacion de contrasena, perfil, compra interna y compra por PayPal
- expone tambien helpers para construir URLs de media y consumir atracciones/comidas
- expone helpers administrativos para consultar y gestionar clientes, tipos de brazalete, brazaletes, recibos, comidas y atracciones

Funciones principales:

- `loginUser(identifier, password)`
- `registerClient(clientData)`
- `requestPasswordReset({ username, email })`
- `confirmPasswordReset({ username, email, code, newPassword })`
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
- `getBraceletTransactions(params)`
- `getTestimonials()`
- `createTestimonial(testimonialData)`
- `getAdminTestimonials()`
- `updateAdminTestimonial(testimonialId, testimonialData)`
- `buildMediaUrl(path)`
- `getBraceletTypeImageUrl(braceletType)`
- helpers administrativos: `getAdminClients`, `updateAdminClient`, `deleteAdminClient`, `getAdminBraceletTypes`, `createAdminBraceletType`, `updateAdminBraceletType`, `deleteAdminBraceletType`, `getAdminBracelets`, `updateAdminBracelet`, `deleteAdminBracelet`, `getAdminReceipts`, `updateAdminReceipt`, `deleteAdminReceipt`, `createAdminFood`, `updateAdminFood`, `deleteAdminFood`, `createAdminAttraction`, `updateAdminAttraction`, `deleteAdminAttraction`

Detalle practico: `getBraceletTransactions` consume el mismo endpoint para cliente y administrador. Cuando recibe `bracelet_id`, lo envia como query param para filtrar el historial de un brazalete especifico.

Decisiones actuales a tener presentes:

- el token se guarda en `localStorage` como `access_token`;
- parte del estado del usuario tambien se guarda en `localStorage` como `user_data`;
- la UI ya no toma `localStorage` como fuente principal de verdad: consume `AuthContext`;
- la politica de sesion se guarda en `localStorage` como `session_policy`, tomando como fuente principal el valor que devuelve el backend;
- el ultimo recibo usado por el flujo de compra se guarda temporalmente como `receiptId`;
- al cerrar sesion se eliminan token, usuario, politica de sesion y datos temporales de compra para no dejar referencias de PayPal o recibos de una sesion anterior, incluyendo la clave `__paypal_storage__` creada por el SDK de PayPal;
- `user_data` incluye informacion de privilegios como `is_admin`, `is_staff` e `is_superuser`;
- para la UI, la bandera canonica es `is_admin`, que el backend deriva desde `is_staff`;
- el `baseURL` ya no esta fijo en codigo; se toma de `VITE_API_BASE_URL`;
- el frontend falla temprano si faltan variables de entorno obligatorias, lo que evita builds con configuracion incompleta;
- en produccion, `VITE_API_BASE_URL` debe apuntar al backend publico con sufijo `/api/`, por ejemplo `https://your-render-backend.onrender.com/api/`;
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
3. si el backend responde bien, `AuthContext` guarda token, usuario y politica de sesion;
4. se redirige al usuario a la ruta previa;
5. si el usuario es administrador e inicio sesion sin una ruta previa especifica, se redirige a `/administrador`.

Detalle visual: la pantalla de login usa una composicion de acceso con imagen lateral, marca, texto breve de contexto y formulario en panel oscuro. El enlace "Olvide mi contrasena" navega al flujo real de recuperacion.

### Registro

Archivo principal: `src/components/RegistroForm.jsx`

Flujo:

1. se arma un objeto `clientData`;
2. si el saldo esta vacio, `registerClient` lo omite para que el backend lo normalice a cero;
3. se llama `registerClient`;
4. si el backend responde `201`, `AuthContext` guarda token, usuario y politica de sesion;
5. se limpia el formulario y se redirige a `/inicio`.

Decision vigente: el registro exitoso deja la sesion iniciada, porque el backend ya devuelve token y usuario en la misma respuesta.

Detalle visual: el registro usa la misma familia visual que login, con imagen lateral, mensaje de alta de cuenta y formulario organizado para que se sienta como parte del sitio publico y no como una pantalla aislada.

Estado vigente para este flujo:

- el frontend sigue mostrando el flujo de login y registro como hasta ahora;
- el backend ya tiene cobertura automatica sobre login, registro, permisos basicos y proteccion del saldo del perfil;
- el registro muestra errores de validacion devueltos por backend, incluyendo correo duplicado, usuario duplicado, campos obligatorios y contrasena debil;
- el formulario de registro marca los campos requeridos con asterisco y muestra una nota breve que explica su significado;
- la recuperacion de contrasena ya existe como flujo funcional por codigo de correo;
- esto reduce el riesgo de regresiones invisibles en los flujos que alimentan las pantallas de acceso y perfil.

### Recuperacion de contrasena

Archivo principal: `src/pages/PasswordResetPage.jsx`

Flujo:

1. el usuario entra desde `/login` o directamente a `/recuperar-contrasena`;
2. escribe su usuario y correo registrado, y la UI llama `requestPasswordReset`;
3. el backend responde con un mensaje generico, exista o no la combinacion;
4. la pantalla pasa al formulario de confirmacion;
5. el usuario conserva usuario/correo, escribe codigo de 6 digitos, nueva contrasena y confirmacion;
6. `confirmPasswordReset` envia el payload al backend;
7. si el codigo es valido y la contrasena cumple reglas, el backend cambia la contrasena y la UI muestra confirmacion para volver al login.

Reglas visibles:

- el codigo se captura como 6 digitos;
- usuario y correo deben corresponder a la misma cuenta activa;
- la nueva contrasena exige minimo 8 caracteres desde HTML y el backend valida la regla completa;
- errores de codigo invalido, vencido o contrasena debil se muestran como mensajes claros.

### Rutas privadas

Archivo principal: `src/components/PrivateRoutes.jsx`

La proteccion ya no depende solo de que exista `access_token` en `localStorage`.

Funcionamiento actual:

- si no hay sesion en `AuthContext`, redirige a `/login`;
- si la ruta requiere admin, revisa la bandera `isAdmin` del contexto;
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
- usa la misma ventana de sesion que devuelve el backend, con respaldo local `VITE_SESSION_IDLE_TIMEOUT_MINUTES`;
- si hay actividad, llama de forma controlada a `refresh-token/` para mantener vigente la sesion;
- si expira el tiempo por inactividad, cierra sesion, limpia `localStorage`, redirige a `/login` y muestra un mensaje coherente;
- si el backend devuelve `401`, tambien limpia `localStorage`, redirige a `/login` y muestra el mensaje recibido o uno de sesion no activa;
- escucha cambios de `localStorage` para reflejar cierres o inicios de sesion entre pestanas del mismo navegador.
- al estar dentro de `BrowserRouter`, redirige con `navigate` en vez de `window.location.href`, evitando recargas completas.

Politica vigente:

- duracion por defecto: 15 minutos de inactividad;
- fuente de verdad: backend, configurado con `SESSION_IDLE_TIMEOUT_MINUTES`;
- regla de concurrencia: una sola sesion activa por usuario; el ultimo login invalida sesiones anteriores.

La decision completa esta documentada en [docs/politica-sesion.md](politica-sesion.md).

### Requerimiento completado: alineacion de expiracion de sesion

El requerimiento "Alinear expiracion de sesion entre frontend y backend" quedo resuelto desde frontend.

Criterios resueltos:

- el frontend usa la politica de sesion devuelta por el backend y mantiene `VITE_SESSION_IDLE_TIMEOUT_MINUTES` como respaldo local;
- la ventana por defecto quedo alineada a 15 minutos de inactividad;
- la actividad del usuario llama de forma controlada a `refresh-token/` para mantener la sesion vigente;
- la inactividad real ya no refresca el token al vencer el temporizador, sino que cierra sesion y redirige a `/login`;
- los errores `401` limpian la sesion local y muestran mensajes coherentes en la pantalla de login;
- las pestanas del mismo navegador comparten la sesion mediante `localStorage` y reaccionan a cambios de autenticacion;
- una segunda sesion en otro navegador o instancia invalida la sesion anterior, siguiendo la regla del backend.

## Layout general

### Sistema visual global

El frontend cuenta ahora con una capa visual reutilizable declarada en `src/index.css` sobre Tailwind.

Responsabilidades:

- definir una superficie base clara mediante `app-shell`;
- normalizar contenedores de seccion con `section-container`;
- centralizar jerarquia tipografica con `section-eyebrow`, `section-title` y `section-copy`;
- unificar tarjetas, formularios, botones y tablas con clases como `surface-card`, `glass-panel`, `btn-primary`, `btn-secondary`, `btn-dark`, `form-input`, `form-input-dark` y `table-shell`;
- mantener la identidad verde/teal del proyecto con `fondoPrincipal` (`#398269`) como fondo global y acentos ambar para llamadas de atencion.

Detalle practico: los tokens de Tailwind para `fondoLogin`, `fondoPrincipal`, `fondoInput` y colores de brazalete se ajustaron para conservar la direccion visual original, pero con mejor contraste, superficies mas limpias y estados visuales mas consistentes. `fondoPrincipal` vuelve a usar el verde base del proyecto para evitar que las pantallas publicas se sientan desconectadas de los mockups iniciales.

### `src/components/MasterPageCliente.jsx`

Este componente funciona como layout publico para la mayor parte del sitio.

Incluye:

- navbar superior;
- enlaces a inicio, compra, atracciones/comidas, sobre nosotros y contacto;
- boton de perfil o de login segun exista `user_data`;
- boton de cerrar sesion;
- footer con branding, enlace a sobre nosotros y redes.
- usa el color `fondoLogin` (`#004C55`) para mantener consistencia con los mockups y mejorar contraste.
- las redes sociales del footer son acciones ficticias: muestran un aviso en pantalla y no redirigen fuera del sitio.
- el navbar y footer incorporan mejor jerarquia, estados hover, sombras sutiles y controles con alto minimo estable para funcionar en desktop y mobile.
- el logo se muestra dentro de un contenedor blanco reutilizado como referencia visual tambien por el panel administrativo.
- los enlaces principales usan estado activo con fondo blanco y texto `fondoLogin`, evitando resaltados de color no alineados con la identidad visual.

Detalles practicos:

- usa `Link`, `NavLink`, `Outlet` y `navigate` de React Router para mantener navegacion SPA y marcar la ruta publica activa;
- toma el usuario desde `AuthContext`, por lo que responde a login, logout y cambios entre pestanas sin depender de una lectura inicial de `localStorage`.

## Paginas y flujos principales

### `src/pages/InicioPage.jsx`

Es la landing principal del cliente.

Responsabilidades:

- mostrar introduccion del parque;
- renderizar `Carrusel`;
- cargar tipos de brazaletes desde el backend;
- mostrar tarjetas por tipo;
- navegar a compra enviando `tipoId` por `location.state`.
- cargar testimonios publicados desde el backend;
- mostrar nombre visible, comentario, fecha, valoracion e imagen opcional;
- permitir a clientes autenticados enviar un testimonio nuevo desde la home escribiendo solo comentario y estrellas;
- informar que los testimonios enviados quedan pendientes de revision antes de publicarse.
- aplicar una home mas pulida con hero de dos columnas, carrusel visual, llamadas a compra/atracciones, tarjetas de brazalete consistentes y testimonios en una seccion de alto contraste.
- separar hero, catalogo y testimonios como secciones de viewport con `scroll-snap` suave en modo `proximity`, para que al bajar se perciba una seccion a la vez sin un salto brusco.

Regla vigente de testimonios:

- la seccion ya no usa datos estaticos;
- la lectura publica consume `GET /api/testimonios/?published_only=1` para ocultar pendientes y rechazados incluso si la sesion actual es administrativa;
- el formulario autenticado envia `POST /api/testimonios/`;
- si el usuario no tiene sesion, se muestra una llamada a iniciar sesion;
- el nombre visible se toma del usuario autenticado;
- la imagen de perfil se toma del perfil del usuario;
- si el usuario no tiene imagen, se muestra un avatar generico.

### `src/pages/SobreNosotrosPage.jsx`

Es una pagina publica de contexto para completar la navegacion principal.

Responsabilidades:

- explicar la propuesta de Fantasy Land como parque de atracciones digitalizado;
- describir el concepto del brazalete como centro de la experiencia del visitante;
- comunicar el valor para el visitante: compra, visita, consumo y atencion operativa;
- reutilizar imagenes locales del parque para mantener coherencia visual con la home;
- ofrecer accesos hacia compra de brazaletes, atracciones/comidas, contacto y terminos.

Detalle practico: la pagina no consume API. Es contenido estatico de producto, accesible desde `/sobre-nosotros`, el navbar publico y el footer.

### `src/pages/ContactoPage.jsx`

Es una pagina publica de contacto para visitantes.

Responsabilidades:

- mostrar un formulario tipico con nombre, correo, telefono opcional, fecha de visita, motivo, mensaje y consentimiento de contacto;
- usar validaciones HTML basicas para campos obligatorios, correo, longitud minima y aceptacion de contacto;
- simular el envio del formulario con un toast y limpiar los campos;
- mostrar informacion ficticia de horario, ubicacion, telefono y correo;
- mostrar redes sociales ficticias con nombre e identificador, sin navegar fuera del sitio.

Detalle practico: la pagina no consume API. El envio es local y sirve para completar la experiencia publica sin crear todavia un endpoint de mensajes.

### `src/pages/TerminosCondicionesPage.jsx`

Es una pagina publica con terminos y condiciones del parque.

Responsabilidades:

- documentar condiciones de acceso al parque;
- explicar reglas generales de uso de brazaletes, atracciones, saldo y alimentos;
- mencionar pagos, comprobantes, cambios, reembolsos, seguridad, conducta y datos personales;
- enlazarse desde el footer y desde la llamada informativa de `SobreNosotrosPage`.

Detalle practico: la pagina no consume API. Es contenido estatico legal-operativo para dar realismo al flujo publico.

### Requerimiento completado: navegacion publica informativa

El requerimiento "Disenar e implementar la pagina Sobre nosotros" quedo ampliado y cerrado desde frontend con contacto, redes ficticias y terminos.

Criterios resueltos:

- existe la ruta publica `/sobre-nosotros`;
- la pagina es accesible desde la navegacion superior y desde el footer;
- el contenido explica propuesta, concepto, experiencia y valor para el visitante;
- la estructura usa hero visual, bloques de beneficios, lista de valor y llamada a contacto en lugar de un bloque plano de texto;
- el contenido evita presentarse como proyecto de portafolio y mantiene tono de parque real;
- existe la ruta publica `/contacto` con formulario, informacion de atencion y redes ficticias;
- existe la ruta publica `/terminos-condiciones` con condiciones tipicas de un parque de atracciones;
- el diseno reutiliza colores, tipografias e imagenes del sitio para mantener alineacion visual.

### Requerimiento completado: testimonios visibles en la pagina de inicio

El requerimiento "Como cliente quiero dejar testimonios visibles en la pagina de inicio" quedo cerrado desde frontend.

Criterios resueltos:

- la home muestra testimonios reales obtenidos del backend;
- cada testimonio muestra nombre visible, comentario, fecha y valoracion;
- la interfaz conserva la idea del mockup con tarjetas blancas, imagen lateral y estrellas;
- un cliente autenticado puede enviar un comentario nuevo desde la pagina de inicio usando estrellas clicables;
- el flujo comunica que el contenido queda pendiente de moderacion;
- la capa de API incluye funciones dedicadas para listar y crear testimonios.

### `src/pages/ComprarBrazaletesPage.jsx`

Es el centro del flujo de compra.

Responsabilidades:

- cargar tipos de brazaletes;
- seleccionar un tipo por defecto;
- permitir compra con saldo interno;
- permitir compra con PayPal;
- bloquear compra si el usuario no ha iniciado sesion.
- mostrar una composicion de compra mas clara, separando explicacion del flujo, resumen del brazalete seleccionado y formulario de pago.

Detalle practico: la pagina consume el catalogo publico de tipos activos. Si un administrador desactiva un tipo, deja de aparecer en inicio y compra, y el backend tambien rechaza intentos de compra con ese ID.

Flujo con saldo interno:

1. valida que exista token;
2. llama `createPurchaseReceipt(selectedTipo.id)`;
3. el backend devuelve un recibo ya pagado con `status = CAPTURED`;
4. guarda el `receiptId` mediante el helper temporal de compra;
5. navega a `/recibo-compra`.

Si el backend rechaza la compra, por ejemplo por saldo insuficiente, la pagina muestra el mensaje de negocio devuelto por la API y mantiene al usuario en el formulario para que pueda revisar su saldo o elegir otro brazalete.

Flujo con PayPal:

1. renderiza `PayPalButton`;
2. `PayPalButton` crea la orden en backend;
3. al aprobar el pago, captura la orden;
4. el backend devuelve un recibo con estado consistente con el pago, normalmente `CAPTURED`;
5. guarda el `receiptId` mediante el helper temporal de compra;
6. navega a `/recibo-compra`.

Detalle de seguridad: el `receiptId` temporal se borra al cerrar sesion junto con claves temporales conocidas del flujo PayPal, incluyendo `__paypal_storage__`, para evitar que una sesion posterior vea referencias o metadatos de una compra anterior.

Nota de alcance vigente:

- el frontend actual cubre compra inicial, consulta de recibo e historial completo de movimientos del brazalete;
- los consumos de comida y atracciones no se modelan como nuevas ventas de brazalete;
- el panel administrativo y el perfil del cliente consumen el mismo ledger de `BraceletTransaction`.
- el formulario visual de compra usa un panel verde oscuro alineado al mockup original, con campos verdes, imagen del brazalete sin contenedor decorativo y boton de compra con el estilo primario global.
- las imagenes de tipos de brazalete se resuelven mediante `getBraceletTypeImageUrl`, que normaliza `image_url` o `image` antes de renderizar; si no hay imagen valida, la UI evita mostrar iconos rotos.

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

1. lee el recibo temporal con el helper de compra;
2. consulta el endpoint del recibo;
3. renderiza datos del usuario, brazalete, monto, metodo de pago y estado de la compra.

Detalle practico del estado actual:

- si el brazalete ya tuvo consumos, la pagina ya muestra `current_balance` y `attraction_uses_remaining` reales del brazalete;
- si todavia no hubo consumos, sigue mostrando el estado inicial esperado.
- el resumen visual de la compra usa un panel verde oscuro alineado al mockup, con imagen del brazalete, nombre destacado y filas separadas por lineas finas.

### `src/pages/PerfilClientePage.jsx`

Es una pagina contenedora con rutas internas:

- `info` -> `ProfileDataForm`
- `mis-brazaletes` -> `MyBracelets`
- `historial-movimientos` -> `BraceletMovementHistory`

### `src/components/ProfileDataForm.jsx`

Responsabilidades:

- cargar perfil del usuario autenticado;
- permitir editar datos;
- permitir subir una imagen de perfil desde un boton circular con icono de lapiz sobre el avatar, ocultando el input nativo de archivo;
- permitir solicitar la eliminacion de la cuenta mediante una baja logica en backend.

Detalle importante: el campo `password` se rellena con `******` como valor visual. El backend evita cambiarla si llega exactamente ese valor.

Detalle de imagen de perfil:

- si el usuario sube una imagen, el formulario envia `multipart/form-data`;
- la imagen se guarda en el perfil del usuario;
- los testimonios de la home reutilizan esa imagen;
- si no existe imagen, la UI usa el avatar generico `perfil.svg`.

Detalle de eliminacion de cuenta:

- la accion pide confirmacion con `ModalMessage`;
- al confirmar, el backend desactiva y anonimiza la cuenta en lugar de borrar fisicamente el historial asociado;
- la sesion local se limpia y el usuario vuelve al inicio.

### `src/components/MyBracelets.jsx`

Responsabilidades:

- listar recibos del usuario actual;
- mostrar datos resumidos del brazalete comprado;
- guardar `receiptId` mediante el helper temporal de compra cuando el usuario pulsa "Ver Recibo";
- redirigir a `ReciboCompraPage`.
- permitir abrir el historial filtrado del brazalete con "Ver movimientos".

Detalle practico del estado actual:

- la tarjeta ya no muestra solo los valores iniciales del tipo de brazalete;
- ahora refleja el saldo y los usos restantes reales del brazalete.

### `src/components/BraceletMovementHistory.jsx`

Responsabilidades:

- consultar `/api/compra_brazaletes/transacciones/` con la sesion activa;
- mostrar movimientos propios del cliente autenticado;
- aceptar el query param `bracelet` para abrir directamente el historial de un brazalete;
- mostrar fecha, brazalete, tipo, concepto, saldo antes/despues, usos antes/despues y variaciones aplicadas;
- permitir quitar el filtro para ver todos los movimientos propios.

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
- usar tarjetas visuales consistentes para atracciones y comidas, con imagen estable, jerarquia de nombre/precio/usos y botones con estados deshabilitados claros.

Decision vigente del flujo minimo:

- las atracciones solo consumen usos del brazalete;
- las comidas solo pueden cobrarse con saldo del brazalete;
- si no hay saldo suficiente, la interfaz bloquea la accion y el backend tambien rechaza la operacion;
- PayPal no se reutiliza todavia para comidas, porque el flujo actual de PayPal sigue acoplado a la compra inicial del brazalete.

### `src/pages/AdministradorPage.jsx`

Es el panel operativo del sistema para administradores. Ya no es un placeholder y esta separado visualmente del flujo del cliente.

Responsabilidades:

- cargar en paralelo clientes, brazaletes, recibos, tipos de brazalete, comidas y atracciones;
- cargar tambien movimientos auditados de brazaletes;
- mostrar un resumen operativo con totales de clientes, brazaletes, ventas, movimientos e ingresos registrados;
- ofrecer accesos directos a clientes, brazaletes, ventas, movimientos, comidas y atracciones;
- consultar clientes y gestionar alta, edicion de datos basicos, saldo y eliminacion logica de clientes no administradores;
- consultar y gestionar tipos de brazalete dentro de la seccion Brazaletes, incluyendo precio, saldo de comida, usos de atraccion, descripcion, imagen, activacion/desactivacion y eliminacion cuando no tienen historial asociado;
- consultar y gestionar brazaletes emitidos dentro de la misma seccion, incluyendo tipo, saldo y usos restantes;
- consultar ventas/recibos y editar su estado operativo;
- consultar el historial de movimientos del brazalete, incluyendo activaciones, consumos, ajustes administrativos y reversos;
- moderar testimonios de clientes aprobando o rechazando comentarios pendientes;
- consultar y gestionar comidas y atracciones, incluyendo imagenes;
- mantener botones de perfil y cierre de sesion consistentes con el layout principal;
- mostrar footer con anio actual calculado automaticamente.
- alinearse con la capa visual global para que paneles, tablas, formularios y navegacion administrativa tengan contraste y estados coherentes con el resto del sitio.

Detalle practico:

- la ruta `/administrador` esta protegida por `PrivateRoutes requireAdmin`;
- la interfaz usa `is_admin` desde `user_data` y revalidacion con `user-profile` si hace falta;
- el panel reutiliza los endpoints administrativos existentes del backend;
- los tipos desactivados se mantienen visibles para el administrador, pero desaparecen del flujo publico de compra;
- la seccion `Brazaletes` agrupa dos bloques separados: catalogo de tipos de brazalete y brazaletes emitidos;
- la seccion `Movimientos` muestra el ledger operativo de `BraceletTransaction` con fecha, brazalete, cliente, tipo, concepto, saldo/usos antes y despues, y usuario que ejecuto el movimiento;
- la tabla administrativa incluye busqueda local, ordenamiento ascendente/descendente por columna con indicadores visuales, paginacion local y selector de filas por pagina;
- las secciones con muchas columnas, como clientes y ventas, priorizan el ancho de la tabla y mueven el formulario debajo hasta pantallas mas amplias para mejorar lectura;
- las acciones de eliminacion piden confirmacion antes de llamar al backend;
- en Clientes, la tabla muestra el estado activo/eliminada y la eliminacion administrativa advierte que compras, brazaletes y movimientos se conservan como historial operativo;
- los formularios laterales de creacion/edicion del panel no se estiran al alto de la tabla para mantener una lectura mas compacta;
- los roles administrativos no se editan desde este panel por seguridad; `is_staff` e `is_superuser` siguen siendo de solo lectura desde la API publica del backoffice.
- el header administrativo usa el mismo tratamiento de logo y patron responsive del layout cliente, separando marca, secciones y acciones de usuario cuando el ancho no permite una sola fila.
- en mobile, el resumen completo de metricas se mantiene solo en la seccion `Resumen`; al entrar a secciones internas, la interfaz muestra una cabecera compacta con el titulo y descripcion de la seccion activa para que el cambio sea evidente sin obligar a scrollear por todas las metricas.
- al cambiar de seccion interna en mobile, la pagina desplaza el viewport hacia el inicio del contenido activo para reducir friccion y hacer visible rapidamente la tabla o formulario correspondiente.

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
- mas adelante conviene agregar mejoras de administracion visual del catalogo.

### Requerimiento completado: historial transaccional completo del brazalete

El requerimiento "Exponer historial transaccional completo del brazalete en frontend" quedo cerrado desde frontend.

Criterios resueltos:

- el cliente consulta movimientos de sus propios brazaletes desde `/mi-perfil/historial-movimientos`;
- `MyBracelets` permite abrir el historial filtrado de un brazalete especifico;
- el administrador consulta movimientos de cualquier brazalete desde la seccion `Movimientos` de `/administrador`;
- cada movimiento muestra fecha, tipo, concepto, saldo antes/despues, usos antes/despues y variacion aplicada;
- cliente y administrador consumen la API existente de `BraceletTransaction`.

### Requerimiento completado: pruebas backend para autenticacion, compra interna y pagos

Aunque la implementacion de pruebas vive en backend, este requerimiento ya impacta directamente la estabilidad de los flujos principales consumidos por frontend.

Criterios resueltos desde la perspectiva del frontend:

- login, registro y permisos basicos ya cuentan con cobertura automatica en backend;
- la compra con saldo interno ya tiene pruebas utiles sobre exito y rechazos de negocio;
- la captura de PayPal y el webhook ya tienen pruebas sobre contratos clave y errores controlados;
- los flujos visibles para el usuario en login, compra y recibo quedan mejor protegidos frente a regresiones.

### Requerimiento completado: pulido visual global

El requerimiento "Pulir el diseno visual global respetando la base de los mockups de Figma" quedo resuelto desde frontend.

Criterios resueltos:

- la identidad visual actual se conserva usando el verde `#398269` como fondo base, verde/teal para navegacion y acentos calidos para llamadas de atencion;
- existe una capa reutilizable de estilos para superficies, botones, formularios, tablas y contenedores;
- se mejoraron jerarquia tipografica, espaciados, contraste, sombras, radios y estados hover/focus/disabled;
- `InicioPage` se pulio especialmente con hero mas profesional, carrusel enmarcado, catalogo de brazaletes en tarjetas coherentes, testimonios con mejor contraste y secciones separadas por viewport;
- navegacion, footer, compra, perfil, recibo, atracciones/comidas y panel administrativo quedaron visualmente mas consistentes;
- el resultado se valido mediante build de produccion de Vite y usa clases responsivas para desktop y mobile.

## Componentes secundarios

### `src/components/Carrusel.jsx`

Carrusel manual de imagenes locales para la home.

### `src/components/ModalMessage.jsx`

Modal reutilizable para avisos y confirmaciones importantes.

Uso vigente:

- aviso de sesion requerida antes de comprar;
- confirmacion de eliminacion de cuenta desde perfil;
- confirmaciones destructivas del panel administrativo;
- mensaje persistente de sesion cerrada o expirada al volver a login.

Decision visual: los mensajes bloqueantes usan este componente para mantener un mismo diseno. Los mensajes de exito o error no bloqueantes usan `react-hot-toast`.

## Matriz de acceso en frontend

Esta matriz resume que deberia pasar en la interfaz segun el tipo de usuario.

| Ruta o accion | Sin sesion | Cliente autenticado | Administrador |
| --- | --- | --- | --- |
| `/inicio` | permitido | permitido | permitido |
| `/sobre-nosotros` | permitido | permitido | permitido |
| `/contacto` | permitido | permitido | permitido |
| `/terminos-condiciones` | permitido | permitido | permitido |
| `/registro` | permitido, crea cuenta e inicia sesion | permitido, crea otra cuenta e inicia sesion nueva | permitido, crea otra cuenta e inicia sesion nueva |
| `/recuperar-contrasena` | permitido | permitido | permitido |
| `/comprar-brazaletes` | permitido | permitido | permitido |
| intento de compra interna | bloqueado por falta de sesion | permitido | permitido |
| inicio de flujo PayPal | bloqueado por falta de sesion | permitido | permitido |
| `/mi-perfil/*` | redirige a `/login` | permitido | permitido |
| `/mi-perfil/historial-movimientos` | redirige a `/login` | permitido, solo movimientos propios | permitido |
| `/administrador` | redirige a `/login` | redirige a `/inicio` | permitido |
| gestion en `/administrador` | no disponible | no disponible | permitido |

Notas practicas:

- el frontend usa `user_data` para detectar privilegios, pero puede revalidar con `user-profile` si falta informacion o puede estar desactualizada.
- aunque el frontend bloquee una ruta, la validacion definitiva sigue estando en el backend.

## Estado actual del frontend

### Preparacion para despliegue

El frontend queda preparado para publicarse en Vercel desde el monorepo:

- Root Directory: `frontend/frontend_react`;
- Build Command: `npm run build`;
- Output Directory: `dist`;
- variables requeridas: `VITE_API_BASE_URL`, `VITE_PAYPAL_CLIENT_ID` y `VITE_SESSION_IDLE_TIMEOUT_MINUTES`.

La estrategia completa de despliegue esta documentada en [despliegue-produccion.md](despliegue-produccion.md).

### Partes funcionales

- login basico
- registro publico funcional con inicio de sesion automatico al crear cuenta
- recuperacion de contrasena por codigo de correo desde `/recuperar-contrasena`, validando usuario y correo asociados
- proteccion de rutas por autenticacion y una regla administrativa ya unificada
- pagina publica de sobre nosotros integrada a rutas, navbar y footer
- pagina publica de contacto con formulario local, informacion de atencion y redes ficticias
- pagina publica de terminos y condiciones
- consulta de tipos de brazalete
- compra con saldo interno
- compra con PayPal
- visualizacion de estados consistentes de recibo para compras internas y PayPal
- respaldo automatizado en backend para los flujos criticos de login, registro, recuperacion, compra interna y pagos
- visualizacion de recibo
- visualizacion y edicion basica del perfil
- vista de historial de movimientos para clientes dentro de `mi-perfil`
- bloqueo del panel administrativo para usuarios sin privilegios administrativos
- panel operativo administrativo para clientes, brazaletes, tipos de brazalete, ventas, comidas y atracciones
- vista administrativa de historial de movimientos de brazaletes
- vista administrativa para moderar testimonios
- tablas administrativas con busqueda, ordenamiento visual, paginacion y mejor distribucion de espacio en secciones densas
- listado de compras del usuario
- catalogo funcional de atracciones y comidas
- consumo minimo de atracciones y comidas sobre el estado real del brazalete
- feedback de consumos con numero de movimiento auditado
- testimonios reales en la home con formulario autenticado y moderacion previa
- imagen de perfil editable desde `/mi-perfil/info`

### Siguiente mejora definida

El proyecto ya dejo definido el modelo de dominio para futuras mejoras comerciales:

- `PurchaseReceipt` seguira representando el pago de la compra inicial;
- la venta de brazaletes se separa conceptualmente del historial operativo del brazalete;
- los consumos de comida y atracciones aparecen como movimientos del brazalete, no como nuevas compras del mismo.

La interfaz ya consume el estado actual del brazalete, muestra el numero de transaccion devuelto por el backend y permite consultar el historial transaccional completo.

### Partes incompletas o minimas

- varias paginas vacias en `src/pages/`
- `MasterPageAdmin.jsx`
- `FormularioCompra.jsx`
- no existe todavia una suite E2E automatizada para navegador real y responsive visual; el QA final quedo registrado en [revision-qa-final.md](revision-qa-final.md).

### Deuda tecnica visible

- `localStorage` sigue existiendo como persistencia, pero ya no es la fuente principal de verdad para la UI de autenticacion;
- parte del estado del usuario sigue viviendo duplicado entre backend, memoria y almacenamiento persistente, aunque ahora hay una frontera mas clara mediante `AuthContext`;
- varios textos del codigo muestran problemas de codificacion de caracteres;
- la entrega real de correos de recuperacion depende de configurar `DJANGO_EMAIL_*` por entorno; en desarrollo se usa backend de consola si no se configura SMTP;
- el modulo de atracciones y comidas esta completo como MVP y ya existen vistas de historial transaccional para cliente y administrador.

### Requerimiento completado: refactor frontend de autenticacion y rutas

El requerimiento "Refactorizar frontend de autenticacion y rutas para mejorar mantenibilidad" quedo resuelto desde frontend.

Criterios resueltos:

- las rutas principales usan una estructura declarativa con `Outlet`;
- `AuthContext` centraliza estado de sesion, usuario, permisos y acciones de login/logout;
- los componentes principales dejaron de leer `user_data` directamente desde `localStorage`;
- la navegacion interna usa `Link` o `navigate`, reduciendo recargas completas;
- el logout limpia datos de autenticacion, politica de sesion y datos temporales de compra/PayPal;
- el comportamiento visible de login, rutas protegidas, compra y recibo se mantiene.

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

Apoyos para mantenerlo sincronizado:

- criterios de aceptacion vigentes: [docs/backlog-criterios-aceptacion.md](backlog-criterios-aceptacion.md);
- decisiones y limitaciones: [docs/registro-decisiones-arquitectura.md](registro-decisiones-arquitectura.md);
- checklist de cierre documental: [docs/gestion-documentacion.md](gestion-documentacion.md).

Plantilla mental util para documentar cada modulo:

- que resuelve;
- de que depende;
- que expone;
- que flujo dispara;
- que limitaciones tiene hoy.
