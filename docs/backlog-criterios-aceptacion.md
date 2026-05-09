# Backlog y criterios de aceptacion

## Objetivo

Mantener una vista liviana de las historias clave del proyecto y sus criterios de aceptacion vigentes.

Este archivo no reemplaza Jira si se usa para planificar. Sirve como respaldo tecnico dentro del repositorio para que codigo, documentacion y alcance funcional no se separen.

## Como usar este documento

- Agregar aqui solo historias clave o decisiones funcionales que afecten el producto.
- Mantener los criterios en lenguaje verificable.
- Marcar una historia como `Pendiente`, `En progreso`, `Completada` o `Reabierta`.
- Al cerrar una historia, enlazar los documentos tecnicos actualizados.
- Si una historia cambia de alcance, ajustar criterios antes de implementar.

## Historias clave

### Alinear expiracion de sesion entre frontend y backend

Estado: Completada

Documentos relacionados:

- [backend-funcionamiento.md](backend-funcionamiento.md)
- [frontend-funcionamiento.md](frontend-funcionamiento.md)
- [politica-sesion.md](politica-sesion.md)

Criterios de aceptacion:

- Backend y frontend usan una politica unica de expiracion por inactividad.
- La duracion por defecto es 15 minutos.
- El backend es la fuente de verdad mediante `SESSION_IDLE_TIMEOUT_MINUTES`.
- El frontend usa la politica devuelta por la API y mantiene `VITE_SESSION_IDLE_TIMEOUT_MINUTES` como respaldo.
- La inactividad cierra sesion y redirige al login.
- Una nueva sesion invalida la sesion anterior del mismo usuario.
- Existen pruebas backend para sesion vigente, expiracion e invalidacion del token anterior.

### Implementar gestion administrativa de tipos de brazalete

Estado: Completada

Documentos relacionados:

- [backend-funcionamiento.md](backend-funcionamiento.md)
- [frontend-funcionamiento.md](frontend-funcionamiento.md)

Criterios de aceptacion:

- El administrador puede crear, editar, activar, desactivar y eliminar tipos de brazalete.
- Los tipos inactivos no aparecen en el catalogo publico ni pueden comprarse.
- El administrador puede consultar tipos activos e inactivos.
- La eliminacion fisica se bloquea si el tipo tiene brazaletes asociados.
- Clientes y usuarios anonimos solo acceden a lectura publica de tipos activos.
- La interfaz administrativa expone precio, saldo de comida, usos de atraccion, descripcion, imagen y disponibilidad.

### Completar modulo de atracciones y comidas desde backend hasta frontend

Estado: Completada como MVP funcional

Documentos relacionados:

- [backend-funcionamiento.md](backend-funcionamiento.md)
- [frontend-funcionamiento.md](frontend-funcionamiento.md)
- [modelo-transaccional-brazaletes.md](modelo-transaccional-brazaletes.md)

Criterios de aceptacion:

- Backend lista, crea, edita y elimina atracciones y comidas con permisos consistentes.
- La lectura del catalogo es publica y la escritura es administrativa.
- La pagina de atracciones y comidas consume datos reales del backend.
- Un usuario autenticado puede seleccionar un brazalete propio.
- Consumir una atraccion descuenta usos del brazalete.
- Comprar comida descuenta saldo del brazalete.
- Cada consumo exitoso crea una `BraceletTransaction` auditable.
- La UI refleja saldo y usos actualizados sin recargar toda la aplicacion.

### Agregar pruebas backend para autenticacion, compra interna y pagos

Estado: Completada

Documentos relacionados:

- [backend-funcionamiento.md](backend-funcionamiento.md)
- [frontend-funcionamiento.md](frontend-funcionamiento.md)

Criterios de aceptacion:

- Existen pruebas para login por usuario y email.
- Existen pruebas para rechazo de credenciales invalidas.
- Existen pruebas para permisos basicos de endpoints administrativos.
- Existen pruebas para compra interna exitosa y saldo insuficiente.
- Existen pruebas para creacion consistente de brazalete y recibo.
- Existen pruebas para captura PayPal exitosa y errores controlados.
- Existen pruebas para webhook con firma valida, firma invalida y payload invalido.

### Ampliar BraceletTransaction para activacion inicial, ajustes y reversos

Estado: Completada

Documentos relacionados:

- [backend-funcionamiento.md](backend-funcionamiento.md)
- [modelo-transaccional-brazaletes.md](modelo-transaccional-brazaletes.md)
- [registro-decisiones-arquitectura.md](registro-decisiones-arquitectura.md)

Criterios de aceptacion:

- `BraceletTransaction` incorpora tipos de movimiento para activacion inicial, consumos, ajustes administrativos y reversos.
- Cada compra exitosa registra un movimiento inicial `ACTIVATION` del brazalete.
- La edicion administrativa de saldo o usos de un brazalete registra un movimiento `ADMIN_ADJUSTMENT`.
- El modelo permite representar ajustes y reversos sin sobrecargar `PurchaseReceipt`.
- Los reversos pueden referenciar la transaccion corregida mediante `reverted_transaction`.
- Los movimientos pueden conservar contexto operativo acotado mediante `metadata`.
- Las pruebas cubren creacion y consulta de movimientos de activacion, ajuste administrativo y reverso.
- La documentacion backend y del modelo transaccional queda actualizada.

### Mantener documentacion tecnica y criterios de aceptacion sincronizados

Estado: Completada

Documentos relacionados:

- [gestion-documentacion.md](gestion-documentacion.md)
- [backlog-criterios-aceptacion.md](backlog-criterios-aceptacion.md)
- [registro-decisiones-arquitectura.md](registro-decisiones-arquitectura.md)
- [flujo-ramas-git.md](flujo-ramas-git.md)

Criterios de aceptacion:

- Cada cambio importante tiene una regla explicita para actualizar documentos tecnicos afectados.
- Las historias clave del backlog quedan registradas con criterios claros y verificables.
- Las decisiones de arquitectura y limitaciones relevantes tienen un registro dedicado.
- El flujo de ramas recuerda validar documentacion antes de cerrar una tarea.
- El README enlaza los documentos principales para facilitar su uso cotidiano.

### Refactorizar frontend de autenticacion y rutas para mejorar mantenibilidad

Estado: Completada

Documentos relacionados:

- [frontend-funcionamiento.md](frontend-funcionamiento.md)
- [politica-sesion.md](politica-sesion.md)
- [registro-decisiones-arquitectura.md](registro-decisiones-arquitectura.md)

Criterios de aceptacion:

- La estructura de rutas principales queda declarada en `App.jsx` con rutas anidadas y `Outlet`.
- La autenticacion tiene una fuente de estado controlada mediante `AuthContext`.
- `localStorage` queda como persistencia, no como fuente principal de verdad para la UI.
- La navegacion interna usa `Link` o `navigate` para evitar recargas completas.
- El cierre de sesion limpia token, usuario, politica de sesion y datos temporales de compra/PayPal.
- El comportamiento de login, rutas protegidas, compra y consulta de recibo se mantiene.

## Historias recientes y pendientes

### Completar navegacion publica informativa

Estado: Completada

Documentos relacionados:

- [frontend-funcionamiento.md](frontend-funcionamiento.md)

Criterios de aceptacion:

- Existe una pagina publica de Sobre nosotros accesible desde la navegacion y el footer.
- La pagina explica la propuesta del parque, su concepto, experiencia y valor para el visitante.
- El contenido mantiene la idea general del parque y se alinea con el estilo visual existente.
- La pagina evita lenguaje de proyecto, portafolio o demostracion para sentirse como un sitio real.
- La pagina tiene una estructura visual profesional con hero, bloques de contenido, beneficios y llamadas a otras secciones publicas.
- Existe una pagina publica de Contactenos con formulario tipico, informacion de atencion y redes ficticias.
- Las redes ficticias del contacto y el footer muestran un aviso y no redirigen fuera del sitio.
- Existe una pagina publica de terminos y condiciones para el parque.
- El flujo queda documentado en frontend al agregar las rutas `/sobre-nosotros`, `/contacto`, `/terminos-condiciones` y los enlaces principales.

### Pulir el diseno visual global respetando la base de los mockups de Figma

Estado: Completada

Documentos relacionados:

- [frontend-funcionamiento.md](frontend-funcionamiento.md)
- [registro-decisiones-arquitectura.md](registro-decisiones-arquitectura.md)

Criterios de aceptacion:

- El diseno general mantiene la direccion visual base del proyecto y conserva el verde `#398269` como fondo principal.
- Se mejoran jerarquia tipografica, espaciados, contraste, consistencia de componentes y estados visuales.
- Inicio, navegacion, footer, paneles, tarjetas, tablas y formularios muestran una apariencia mas pulida y coherente entre si.
- La pagina de inicio se revisa especialmente para que hero, catalogo y testimonios se sientan mas profesionales y se perciban como secciones independientes al navegar.
- El resultado funciona correctamente en desktop y mobile mediante estructura responsive y validacion de build.
- La documentacion frontend describe la capa visual global y el nuevo estado de las pantallas principales.

### Exponer historial transaccional completo del brazalete en frontend

Estado: Completada

Documentos relacionados:

- [frontend-funcionamiento.md](frontend-funcionamiento.md)
- [backend-funcionamiento.md](backend-funcionamiento.md)
- [modelo-transaccional-brazaletes.md](modelo-transaccional-brazaletes.md)

Criterios de aceptacion:

- El cliente puede consultar movimientos de sus propios brazaletes.
- El administrador puede consultar movimientos de cualquier brazalete.
- Cada movimiento muestra fecha, tipo, concepto, saldo/usos antes y despues y variacion aplicada.
- La vista muestra el brazalete, cliente y usuario que ejecuto el movimiento cuando existen.
- La vista consume `BraceletTransaction` desde la API existente.
- La navegacion permite llegar a esta vista desde perfil de cliente y desde el backoffice.
- La documentacion frontend y backend se actualiza con el flujo final.

### Completar modelo comercial `Sale` y `SaleLine`

Estado: Completada

Documentos relacionados:

- [modelo-transaccional-brazaletes.md](modelo-transaccional-brazaletes.md)
- [backend-funcionamiento.md](backend-funcionamiento.md)
- [registro-decisiones-arquitectura.md](registro-decisiones-arquitectura.md)

Criterios de aceptacion:

- `PurchaseReceipt` conserva responsabilidad de comprobante de pago.
- `Sale` representa el hecho comercial de venta.
- `SaleLine` representa el detalle de brazalete vendido.
- La compra interna crea recibo, venta, linea, brazalete y movimiento inicial de activacion de forma consistente.
- La captura PayPal crea recibo, venta, linea, brazalete y movimiento inicial de activacion de forma consistente.
- Las migraciones y pruebas cubren el flujo principal y los rechazos de negocio.
- Los documentos tecnicos explican el nuevo modelo vigente.

### Como cliente quiero dejar testimonios visibles en la pagina de inicio

Estado: Completada

Documentos relacionados:

- [backend-funcionamiento.md](backend-funcionamiento.md)
- [frontend-funcionamiento.md](frontend-funcionamiento.md)
- [registro-decisiones-arquitectura.md](registro-decisiones-arquitectura.md)

Criterios de aceptacion:

- Existe un flujo para registrar testimonios de clientes autenticados.
- La pagina de inicio muestra testimonios reales obtenidos desde el backend.
- Los testimonios muestran nombre visible, comentario, fecha y valoracion simple.
- El cliente no digita su nombre en el testimonio; se toma de su perfil.
- La valoracion se selecciona con estrellas clicables, no con combobox.
- La imagen de perfil se puede subir desde el apartado de perfil del usuario.
- Si el usuario no tiene imagen, la home muestra un avatar generico.
- Los testimonios nuevos nacen pendientes y solo los publicados aparecen en la home.
- La moderacion se puede hacer desde Django Admin, API administrativa o panel administrativo.
- El diseno conserva la idea general del mockup con mejor pulido visual.
- La documentacion tecnica describe el modelo, endpoints y regla de publicacion.

### Fortalecer acceso publico con registro estable y recuperacion de contrasena

Estado: Completada

Documentos relacionados:

- [frontend-funcionamiento.md](frontend-funcionamiento.md)
- [backend-funcionamiento.md](backend-funcionamiento.md)
- [registro-decisiones-arquitectura.md](registro-decisiones-arquitectura.md)

Criterios de aceptacion:

- La ruta publica `/registro` vuelve a permitir crear cuentas end-to-end desde la interfaz sin quedar en un estado inconsistente.
- El incidente actual del flujo de registro queda reproducido, corregido y documentado con causa raiz o comportamiento final esperado.
- El frontend muestra errores de validacion o de servidor de forma clara cuando el registro falla.
- La pantalla de login expone una accion funcional de "Olvide mi contrasena".
- El usuario puede iniciar un flujo de recuperacion usando su correo registrado.
- El backend genera y valida un mecanismo seguro de recuperacion con expiracion adecuada.
- El codigo de recuperacion se envia por correo, se almacena hasheado y tiene limite de intentos.
- El usuario puede definir una nueva contrasena y luego iniciar sesion con ella.
- Los intentos con codigo invalido, vencido o reutilizado se rechazan con mensajes coherentes.
- La contrasena nueva se valida con parametros minimos de seguridad en backend.
- Existen pruebas razonables para registro y recuperacion de contrasena.
- La documentacion tecnica de frontend y backend describe el flujo final.

### Ejecutar revision integral y QA final antes de hosteo

Estado: Pendiente

Documentos relacionados:

- [frontend-funcionamiento.md](frontend-funcionamiento.md)
- [backend-funcionamiento.md](backend-funcionamiento.md)
- [gestion-documentacion.md](gestion-documentacion.md)

Criterios de aceptacion:

- Existe una lista de chequeo funcional que cubre navegacion publica, autenticacion, registro, recuperacion de contrasena, compra interna, PayPal, recibos, perfil, testimonios, backoffice, movimientos y consumos.
- Se ejecuta una revision manual extensa del flujo principal en desktop y mobile.
- Se registran defectos encontrados, severidad, resultado y estado de correccion o decision.
- Se revalidan los flujos corregidos despues de aplicar fixes.
- Se deja una conclusion clara de salida tipo go/no-go para despliegue y portafolio.
- La documentacion final refleja el estado real de la aplicacion despues del QA.
