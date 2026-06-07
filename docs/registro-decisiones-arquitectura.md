# Registro de decisiones de arquitectura

## Objetivo

Registrar decisiones tecnicas, limitaciones aceptadas y acuerdos de dominio que pueden afectar tareas futuras.

Este archivo funciona como una version liviana de ADR. No busca documentar todo, solo aquello que seria costoso redescubrir despues.

## Estados

- `vigente`: decision activa.
- `propuesta`: decision recomendada, todavia no implementada completa.
- `reemplazada`: decision historica que ya no gobierna el sistema.

## Decisiones vigentes

### 2026-05-12 - Diagramas de arquitectura versionados en Mermaid

Estado: vigente

Contexto:

- El proyecto necesita presentarse rapido como portafolio desde el repositorio.
- Los diagramas en imagen o documentos binarios son mas dificiles de revisar en Git y suelen quedar desactualizados.
- El sistema ya tiene documentacion viva para backend, frontend, modelo transaccional y criterios de aceptacion.

Decision:

- Mantener los diagramas clave en [diagramas-sistema.md](diagramas-sistema.md) usando Mermaid.
- Enlazar los diagramas desde el README como entrada principal de portafolio.
- Tratar los diagramas como documentacion viva cuando cambien relaciones principales, flujo de compra/consumo, navegacion o capas del sistema.

Impacto:

- Los diagramas pueden revisarse en pull requests junto con el resto del codigo y documentacion.
- No se depende de una herramienta externa para entender ER, secuencia de compra o navegacion principal.
- El README queda como mapa de lectura, no como duplicado exhaustivo de todos los documentos tecnicos.

Seguimiento:

- Si se agrega una herramienta formal de modelado, conservar una fuente versionable o exportable a Markdown para evitar divergencia.

### 2026-04-25 - Documentacion sincronizada con cambios importantes

Estado: vigente

Contexto:

- El proyecto cambia rapido.
- Ya existen documentos utiles de backend y frontend.
- Sin una regla explicita, la documentacion puede quedar desfasada aunque el codigo avance.

Decision:

- Todo cambio importante debe actualizar los documentos tecnicos afectados en la misma rama.
- Las historias clave y sus criterios de aceptacion se registran en [backlog-criterios-aceptacion.md](backlog-criterios-aceptacion.md).
- Las decisiones o limitaciones relevantes se registran en este archivo.
- La guia operativa vive en [gestion-documentacion.md](gestion-documentacion.md).

Impacto:

- Las tareas futuras deben revisar documentacion como parte del cierre.
- La documentacion deja de ser un paso separado y se vuelve parte del cambio tecnico.
- Las decisiones importantes quedan trazables sin depender solo de memoria o conversacion.

Seguimiento:

- Revisar este archivo cuando una tarea cambie arquitectura, permisos, seguridad, modelo de datos, sesion, pagos o flujos principales.

### 2026-04-25 - Backend como fuente de verdad para la politica de sesion

Estado: vigente

Contexto:

- La expiracion de sesion afecta backend, frontend y experiencia de usuario.
- Mantener tiempos duplicados sin una fuente de verdad puede generar cierres inesperados o sesiones mas largas de lo esperado.

Decision:

- El backend define la politica vigente con `SESSION_IDLE_TIMEOUT_MINUTES`.
- El frontend consume la politica devuelta por la API.
- `VITE_SESSION_IDLE_TIMEOUT_MINUTES` existe solo como respaldo local.
- Solo existe una sesion activa por usuario.

Impacto:

- Cambios de expiracion deben tocar [politica-sesion.md](politica-sesion.md), backend y frontend si aplica.
- Las pruebas deben cubrir expiracion, refresh y reemplazo de sesion.

Seguimiento:

- Si en el futuro se aceptan sesiones multiples por usuario, esta decision debe reemplazarse formalmente.

### 2026-04-25 - `is_staff` como regla canonica de administracion operativa

Estado: vigente

Contexto:

- El sistema necesita distinguir clientes de administradores.
- Usar `is_superuser` para todo mezclaria soporte total de Django con operacion diaria.

Decision:

- `is_staff` define acceso administrativo operativo.
- `is_superuser` queda reservado para autoridad total y mantenimiento.
- El backend expone `is_admin` derivado de la regla operativa.
- El frontend usa `is_admin` como bandera de interfaz.

Impacto:

- Los endpoints administrativos deben confiar en `user.is_admin_user`.
- La UI administrativa debe bloquear clientes aunque tengan token valido.
- La promocion de administradores no se hace desde el registro publico.

Seguimiento:

- Si aparecen roles finos, deben vivir sobre `is_staff` mediante grupos o permisos adicionales.

### 2026-04-25 - `AuthContext` como fuente de estado de sesion en frontend

Estado: vigente

Contexto:

- El frontend usaba `localStorage` como fuente principal de verdad para token, usuario y privilegios.
- Las rutas protegidas, el layout y varios flujos consultaban almacenamiento persistente directamente.
- El crecimiento del backoffice exige que sesion, roles y rutas protegidas sean mas faciles de extender.

Decision:

- Mantener `localStorage` solo como persistencia entre recargas y sincronizacion entre pestanas.
- Usar `AuthContext` como fuente de estado para la UI de autenticacion.
- Declarar las rutas principales con `Outlet` y rutas anidadas de React Router.
- Limpiar datos temporales de compra y PayPal al cerrar sesion.

Impacto:

- Los componentes deben preferir `useAuth` antes que leer `user_data` o token directamente.
- Las futuras rutas protegidas pueden reutilizar `PrivateRoutes` y el estado del contexto.
- El flujo de logout reduce exposicion de datos temporales de compras previas en navegadores compartidos.

Seguimiento:

- Si se agregan nuevos datos temporales ligados a compra o checkout, deben registrarse en la limpieza centralizada de sesion.

### 2026-04-25 - `PurchaseReceipt` no debe cargar todo el dominio de ventas y consumos

Estado: vigente

Contexto:

- `PurchaseReceipt` ya representa el comprobante de pago.
- El proyecto necesita distinguir venta, detalle vendido y movimientos posteriores del brazalete.
- La compra inicial ya crea brazalete, recibo, venta comercial, detalle y transaccion de activacion.

Decision:

- Mantener `PurchaseReceipt` como comprobante de pago.
- Modelar la venta con `Sale`.
- Modelar el detalle con `SaleLine`.
- Modelar movimientos del brazalete con `BraceletTransaction`.
- Hacer explicita la relacion directa `Bracelet -> User` mediante `Bracelet.owner`.
- Crear recibo, venta, linea, brazalete y transaccion de activacion dentro de una transaccion atomica en los flujos internos del backend.

Impacto:

- Las futuras consultas comerciales y operativas tendran fronteras mas claras.
- El recibo sigue siendo la fuente del pago, pero la venta ya no desaparece dentro del recibo.
- Los consumos posteriores siguen modelados como movimientos operativos, no como nuevas ventas del brazalete.
- La documentacion de referencia es [modelo-transaccional-brazaletes.md](modelo-transaccional-brazaletes.md).

Seguimiento:

- Exponer reportes o vistas de ventas si el panel administrativo necesita consultar `Sale` y `SaleLine` directamente.

### 2026-04-29 - Ajustes y reversos como movimientos append-only del brazalete

Estado: vigente

Contexto:

- El ledger del brazalete ya registra activacion inicial y consumos.
- El proyecto necesita representar correcciones administrativas y reversos sin convertir `PurchaseReceipt` en historial operativo.
- Editar o borrar movimientos antiguos debilitaria la trazabilidad del saldo y los usos.

Decision:

- Los ajustes administrativos se registran como `BraceletTransaction` de tipo `ADMIN_ADJUSTMENT`.
- La edicion administrativa de saldo o usos desde `BraceletViewSet` crea automaticamente ese movimiento de ajuste.
- Los reversos se registran como `BraceletTransaction` de tipo `REVERSAL`.
- Un reverso puede apuntar a la transaccion corregida mediante `reverted_transaction`.
- El contexto operativo variable se guarda en `metadata`, manteniendo el esquema principal estable.

Impacto:

- `PurchaseReceipt` sigue limitado a comprobante de pago.
- El historial operativo del brazalete conserva una semantica append-only.
- Las consultas pueden auditar quien hizo el ajuste, que cambio produjo y que movimiento se corrigio.
- El formulario administrativo existente de brazaletes ya no cambia saldo o usos sin dejar auditoria.

Seguimiento:

- Si se crean endpoints administrativos para ejecutar ajustes o reversos, deben actualizar el estado materializado de `Bracelet` y crear la transaccion en una misma operacion atomica.

### 2026-04-29 - Testimonios con publicacion moderada

Estado: vigente

Contexto:

- La home tenia testimonios estaticos y el proyecto necesita prueba social real.
- Permitir publicacion inmediata desde clientes autenticados puede exponer contenido inconsistente o no deseado.
- El alcance actual pide una moderacion minima, no un panel editorial completo.

Decision:

- Crear el modelo `Testimonial` como recurso propio del backend.
- Todo testimonio creado por cliente autenticado nace en `PENDING`.
- La API publica de la home solo devuelve testimonios `PUBLISHED`.
- La moderacion inicial se resuelve desde Django Admin, API administrativa o panel administrativo.
- La imagen de perfil pertenece al usuario, no al testimonio.
- El formulario publico de testimonio solo solicita comentario y valoracion.

Impacto:

- La home puede mostrar testimonios reales sin exponer contenido pendiente.
- Un cambio de imagen en el perfil del usuario se refleja en sus testimonios.
- El testimonio queda como contenido de opinion, no como duplicado de datos personales.
- Si mas adelante se necesita gestion editorial completa, puede agregarse al panel administrativo usando el mismo modelo.

Seguimiento:

- Evaluar una vista administrativa dedicada si el volumen de testimonios crece o si se requieren filtros, aprobacion masiva o motivos de rechazo visibles para clientes.

### 2026-05-05 - Capa visual global sobre Tailwind

Estado: vigente

Contexto:

- El frontend ya tenia mockups y una identidad verde/teal reconocible.
- Las pantallas crecieron de forma funcional, pero con diferencias de jerarquia, contraste, espaciado, formularios, tablas y estados visuales.
- El requerimiento pide mejorar el acabado para portafolio sin romper la direccion visual existente.

Decision:

- Mantener React y Tailwind como base, sin introducir una libreria nueva de componentes.
- Crear clases reutilizables en `src/index.css` para superficies, secciones, botones, formularios y tablas.
- Ajustar tokens de color existentes en `tailwind.config.js` en lugar de reemplazar la identidad visual del proyecto, conservando `#398269` como fondo principal.
- Aplicar el pulido a inicio, navegacion, footer, compra, perfil, recibo, catalogo de atracciones/comidas y panel administrativo.
- Separar las secciones principales de la home mediante alto de viewport y `scroll-snap` en modo `proximity`, para mejorar la lectura de hero, catalogo y testimonios sin forzar un salto brusco al desplazarse.

Impacto:

- Las futuras pantallas deben preferir las clases globales existentes antes de duplicar estilos por pagina.
- El proyecto conserva su identidad original, pero con una base mas consistente para desktop y mobile.
- Los cambios visuales no alteran contratos de API, modelos, permisos ni reglas de negocio.

Seguimiento:

- Si se reciben capturas o un enlace especifico de Figma, comparar contra esta capa visual y ajustar tokens o composicion sin romper los componentes reutilizables.

### 2026-05-06 - Recuperacion de contrasena por codigo de correo

Estado: vigente

Contexto:

- El flujo publico de autenticacion necesitaba una recuperacion de contrasena funcional.
- El requerimiento pidio usar un codigo enviado por correo con vencimiento, no un enlace magico.
- El sistema usa autenticacion por token y guarda sesiones activas en `rest_framework.authtoken`.

Decision:

- Implementar recuperacion en dos endpoints: solicitud de codigo y confirmacion de codigo con nueva contrasena.
- Exigir `username` y `email` en la solicitud y confirmacion para verificar que ambos correspondan a la misma cuenta activa.
- Guardar los codigos en `PasswordResetCode` como hash, nunca en texto plano.
- Incluir expiracion, limite de intentos y marca de uso para evitar reutilizacion.
- Responder la solicitud de recuperacion con mensaje generico aunque el usuario, el correo o la combinacion no existan.
- Validar la nueva contrasena con los validadores de Django mas una regla local de fortaleza.
- Invalidar tokens existentes del usuario despues de cambiar la contrasena.

Impacto:

- Se agrega una migracion de base de datos para `login.PasswordResetCode`.
- Los entornos deben configurar `DJANGO_EMAIL_*` si necesitan envio real por SMTP; desarrollo puede usar backend de consola.
- El frontend usa `/recuperar-contrasena` como pantalla dedicada y mantiene el login como entrada principal.
- El flujo reduce solicitudes accidentales o maliciosas sobre correos conocidos porque no genera codigo si el correo no pertenece al usuario indicado.

Seguimiento:

- Si se requiere auditoria de seguridad mas avanzada, agregar rate limiting por IP/correo y monitoreo de intentos.

### 2026-05-09 - Mensajes bloqueantes centralizados en modal reutilizable

Estado: vigente

Contexto:

- Durante el QA final se detecto uso mezclado de `alert()`, `window.confirm()`, `toast` y un modal visual anterior.
- Esto generaba una experiencia inconsistente y hacia mas dificil revisar mensajes, confirmaciones destructivas y estados de error.

Decision:

- Usar `ModalMessage` para avisos bloqueantes y confirmaciones que requieren decision del usuario.
- Usar `react-hot-toast` para feedback no bloqueante de exito o error.
- Evitar `alert()` y `window.confirm()` en componentes React.

Impacto:

- Login, compra, PayPal, perfil y panel administrativo usan una experiencia de mensajes mas uniforme.
- Las futuras acciones destructivas deben usar el modal reutilizable o una extension del mismo patron.
- Los cierres por expiracion de sesion se muestran como modal persistente en login hasta que el usuario pulse `Ok`.

Seguimiento:

- Si se agregan mas flujos con confirmaciones, reutilizar `ModalMessage` antes de crear modales aislados.

### 2026-05-10 - Baja logica de cuentas con historial

Estado: vigente

Contexto:

- El cliente puede tener recibos, ventas, brazaletes, movimientos y testimonios asociados.
- El modelo comercial protege parte de ese historial para conservar trazabilidad.
- Borrar fisicamente un usuario con ventas puede fallar por relaciones `PROTECT` o debilitar auditoria.

Decision:

- La accion `DELETE /api/delete-user/` representa baja de cuenta, no borrado fisico del historial.
- El backend invalida tokens, marca codigos pendientes como usados, borra referencia de imagen, anonimiza datos personales basicos y deja `is_active = False`.
- Las ventas, recibos, brazaletes y movimientos se conservan para auditoria.

Impacto:

- El usuario ya no puede iniciar sesion despues de eliminar su cuenta.
- El historial operativo y comercial permanece consistente.
- La UI puede tratar la respuesta como eliminacion exitosa desde la perspectiva del cliente.

Seguimiento:

- Si se requiere cumplimiento de privacidad mas estricto, revisar politicas de retencion y anonimizar otros campos derivados que se agreguen en el futuro.

### 2026-05-23 - Estrategia inicial de despliegue

Estado: vigente

Contexto:

- El proyecto entra a etapa de hosteo y portafolio sin separar el monorepo.
- El backend maneja imagenes y archivos, por lo que Render Free no puede ser la fuente persistente de media.
- Se prioriza una demo publica de bajo costo antes de contratar infraestructura mas estable.

Decision:

- Frontend en `Vercel Hobby`.
- Backend en `Render Free`.
- Base de datos PostgreSQL en `Neon Free`.
- Media persistente en `Cloudinary Free`.
- Mantener `Railway Hobby` como alternativa para migrar solo el backend si Render Free no convence.

Impacto:

- La configuracion productiva depende de variables de entorno y no de valores locales hardcodeados.
- El backend usa `DATABASE_URL` para Neon y `DJANGO_USE_CLOUDINARY=True` con `CLOUDINARY_URL` para media en produccion.
- Render Free puede tener cold starts; esto se acepta para portafolio, no como decision de produccion comercial.

Seguimiento:

- Validar URLs publicas, PayPal, SMTP y carga de media cuando se ejecuten las historias de despliegue real.

### 2026-06-07 - Resumen administrativo compacto en mobile

Estado: vigente

Contexto:

- En mobile, el panel administrativo mostraba las metricas operativas completas antes de cualquier seccion.
- Al cambiar de `Resumen` a secciones como `Comidas`, `Movimientos` o `Atracciones`, el usuario podia sentir que la pantalla no habia cambiado porque el contenido nuevo quedaba debajo del resumen.
- El requerimiento pide mejorar claridad y reducir scroll sin rehacer el panel administrativo completo.

Decision:

- Mantener el resumen completo de metricas como contenido principal de la seccion `Resumen`.
- Ocultar el resumen completo en mobile cuando el administrador entra a secciones internas.
- Mostrar una cabecera compacta con titulo y descripcion de la seccion activa antes de la tabla o formulario.
- Hacer scroll automatico al inicio del contenido activo solo en mobile al cambiar de seccion interna.
- Conservar en desktop el resumen de metricas visible antes del contenido para no alterar la lectura operativa existente.

Impacto:

- El cambio de seccion es mas evidente en pantallas pequenas.
- El administrador ve antes el contenido accionable de cada seccion.
- No se modifican endpoints, permisos, modelos ni contratos de datos.

Seguimiento:

- Si se implementa un menu hamburguesa administrativo, reutilizar esta separacion entre navegacion, resumen y contenido activo.

### 2026-06-07 - Navegacion colapsable en mobile

Estado: vigente

Contexto:

- La navegacion publica y administrativa de Fantasy Land crecio con varias rutas, secciones y acciones de sesion.
- En pantallas pequenas, mostrar todas las opciones visibles consumia demasiado alto de pantalla y empujaba el contenido principal.
- El requerimiento pide reducir el espacio ocupado por el navbar sin rehacer la navegacion desktop.

Decision:

- Usar una barra compacta en mobile con logo, nombre del sitio y boton hamburguesa.
- Mover rutas principales, secciones administrativas y acciones de sesion a un menu desplegable en mobile.
- Cerrar el menu al seleccionar una ruta, seccion o accion de sesion.
- Mantener la navegacion visible en desktop para conservar velocidad operativa.
- Usar el mismo lenguaje visual de estado activo: fondo blanco y texto `fondoLogin`.

Impacto:

- La vista mobile deja mas espacio disponible para el contenido.
- La navegacion publica, cliente autenticado y administrativa comparten un patron responsive reconocible.
- No se modifican rutas, permisos, endpoints ni contratos de API.

Seguimiento:

- Si se extrae un componente de navegacion reutilizable, conservar soporte para enlaces de React Router y botones internos de seccion administrativa.

## Limitaciones y seguimiento

### Historial de movimientos visible para usuarios

Estado: reemplazada

Limitacion:

- El backend ya registraba `BraceletTransaction` para consumos, pero el frontend no tenia una vista dedicada de historial completo.

Impacto:

- Esta limitacion quedo resuelta al exponer el historial en `/mi-perfil/historial-movimientos` para clientes y en la seccion `Movimientos` del backoffice para administradores.

Seguimiento:

- Mantener el contrato de permisos del endpoint de transacciones: cliente solo ve movimientos propios; administrador ve cualquier brazalete.

### Configuracion productiva depende del entorno

Estado: vigente

Limitacion:

- La seguridad final depende de variables de entorno correctas para secretos, base de datos, hosts, CORS, CSRF y PayPal.
- Las credenciales PayPal deben pertenecer al mismo entorno configurado en `PAYPAL_ENV`; credenciales live con `sandbox`, o sandbox con `live`, provocan rechazo `invalid_client` por parte de PayPal.

Impacto:

- Un despliegue con valores de desarrollo o variables incompletas puede fallar o quedar inseguro.
- En desarrollo, una configuracion PayPal invalida impide crear ordenes, pero el backend debe responder con error controlado y sin filtrar secretos.

Seguimiento:

- Mantener `backend/.env.example`, `frontend/frontend_react/.env.example` y la documentacion de configuracion actualizadas cuando cambien variables.

### QA visual automatizado pendiente

Estado: vigente

Limitacion:

- El QA final pudo validar arranque, build, pruebas backend y flujos criticos por API.
- No existe todavia una suite E2E automatizada ni Playwright/Cypress instalado para repetir navegador limpio, screenshots y responsive visual de forma reproducible.

Impacto:

- La salida local queda apta para portafolio con cautelas menores, pero un despliegue publico deberia sumar una pasada visual real en navegador y, preferiblemente, pruebas E2E basicas.

Seguimiento:

- Agregar una suite E2E minima para login, registro, compra interna, perfil, consumos y panel admin.
