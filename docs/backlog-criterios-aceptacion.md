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

## Pendientes relevantes

### Exponer historial transaccional completo del brazalete en frontend

Estado: Pendiente

Documentos relacionados:

- [frontend-funcionamiento.md](frontend-funcionamiento.md)
- [backend-funcionamiento.md](backend-funcionamiento.md)
- [modelo-transaccional-brazaletes.md](modelo-transaccional-brazaletes.md)

Criterios de aceptacion propuestos:

- El usuario puede consultar movimientos de sus brazaletes.
- El administrador puede consultar movimientos de cualquier brazalete.
- Cada movimiento muestra fecha, tipo, concepto, saldo/usos antes y despues.
- La vista consume `BraceletTransaction` desde la API existente o una evolucion documentada.
- La documentacion frontend y backend se actualiza con el flujo final.

### Completar modelo comercial `Sale` y `SaleLine`

Estado: Pendiente

Documentos relacionados:

- [modelo-transaccional-brazaletes.md](modelo-transaccional-brazaletes.md)
- [backend-funcionamiento.md](backend-funcionamiento.md)

Criterios de aceptacion propuestos:

- `PurchaseReceipt` conserva responsabilidad de comprobante de pago.
- `Sale` representa el hecho comercial de venta.
- `SaleLine` representa el detalle de brazalete vendido.
- La compra de brazalete crea recibo, venta, linea, brazalete y movimiento inicial de activacion de forma consistente.
- Las migraciones y pruebas cubren el flujo principal y los rechazos de negocio.
- Los documentos tecnicos explican el nuevo modelo vigente.
