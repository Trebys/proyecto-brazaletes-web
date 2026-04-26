# Registro de decisiones de arquitectura

## Objetivo

Registrar decisiones tecnicas, limitaciones aceptadas y acuerdos de dominio que pueden afectar tareas futuras.

Este archivo funciona como una version liviana de ADR. No busca documentar todo, solo aquello que seria costoso redescubrir despues.

## Estados

- `vigente`: decision activa.
- `propuesta`: decision recomendada, todavia no implementada completa.
- `reemplazada`: decision historica que ya no gobierna el sistema.

## Decisiones vigentes

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

Estado: propuesta

Contexto:

- `PurchaseReceipt` ya representa el comprobante de pago.
- El proyecto necesita distinguir venta, detalle vendido y movimientos posteriores del brazalete.

Decision:

- Mantener `PurchaseReceipt` como comprobante de pago.
- Modelar la venta con `Sale`.
- Modelar el detalle con `SaleLine`.
- Modelar movimientos del brazalete con `BraceletTransaction`.
- Hacer explicita la relacion directa `Bracelet -> User` en una etapa futura.

Impacto:

- El flujo actual puede seguir funcionando mientras se implementa por fases.
- Las futuras consultas comerciales y operativas tendran fronteras mas claras.
- La documentacion de referencia es [modelo-transaccional-brazaletes.md](modelo-transaccional-brazaletes.md).

Seguimiento:

- Implementar `Sale`, `SaleLine`, relacion directa de propietario y transaccion inicial de activacion.

## Limitaciones vigentes

### Historial de movimientos visible para usuarios

Estado: vigente

Limitacion:

- El backend ya registra `BraceletTransaction` para consumos, pero el frontend todavia no tiene una vista dedicada de historial completo.

Impacto:

- El usuario ve estado actualizado del brazalete y feedback del movimiento, pero no una linea de tiempo completa.
- El administrador tampoco cuenta aun con una vista especializada de auditoria de movimientos.

Seguimiento:

- La historia propuesta esta en [backlog-criterios-aceptacion.md](backlog-criterios-aceptacion.md).

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
