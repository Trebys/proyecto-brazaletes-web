# Gestion de documentacion tecnica

## Objetivo

Mantener la documentacion del proyecto como herramienta de trabajo diaria, no como entregable separado del codigo.

Este documento define que se actualiza, cuando se actualiza y como se verifica antes de cerrar una tarea.

## Documentos vivos del proyecto

| Documento | Uso principal | Cuando actualizarlo |
| --- | --- | --- |
| [backend-funcionamiento.md](backend-funcionamiento.md) | Arquitectura, modelos, endpoints, permisos, flujos y riesgos del backend | Cambios en Django, API, permisos, modelos, variables de entorno, pagos o reglas de negocio |
| [frontend-funcionamiento.md](frontend-funcionamiento.md) | Rutas, componentes, capa de API, flujos de usuario, estado y deuda del frontend | Cambios en React, rutas, pantallas, llamadas a API, sesion, permisos o UX principal |
| [politica-sesion.md](politica-sesion.md) | Decision vigente sobre expiracion, refresh y concurrencia de sesiones | Cambios en timeout, tokens, logout, mensajes de sesion o regla de sesion unica |
| [modelo-transaccional-brazaletes.md](modelo-transaccional-brazaletes.md) | Modelo objetivo para ventas, brazaletes y consumos | Cambios de dominio sobre venta, recibo, ledger, consumo, auditoria o relacion usuario-brazalete |
| [backlog-criterios-aceptacion.md](backlog-criterios-aceptacion.md) | Historias clave y criterios de aceptacion vigentes | Al crear, cerrar o redefinir historias importantes del backlog |
| [registro-decisiones-arquitectura.md](registro-decisiones-arquitectura.md) | Decisiones, limitaciones y motivos tecnicos relevantes | Cuando aparezca una decision de arquitectura, una restriccion o una deuda deliberada |
| [flujo-ramas-git.md](flujo-ramas-git.md) | Trabajo con ramas, commits, merges y regla documental | Cambios en convenciones de git, ramas, commits, PR o validacion documental |
| [arranque-servidores.md](arranque-servidores.md) | Arranque local del proyecto | Cambios en comandos de ejecucion, puertos, entornos o scripts de arranque |

## Regla practica

Si una tarea cambia comportamiento real del sistema, debe dejar actualizada la documentacion afectada en la misma rama.

Esto incluye:

- endpoints, rutas o payloads;
- permisos o roles;
- modelos, migraciones o relaciones importantes;
- variables de entorno y configuracion operativa;
- flujos de compra, sesion, administracion o consumo;
- decisiones de dominio o arquitectura;
- limitaciones aceptadas temporalmente;
- historias del backlog que cambian de alcance o quedan cerradas.

Si una tarea no cambia comportamiento funcional ni decisiones documentadas, puede cerrarse sin tocar `docs/`.

## Checklist para cerrar una tarea

Antes de considerar una rama lista:

1. Revisar si el cambio toca backend, frontend, configuracion, dominio o flujo operativo.
2. Actualizar el documento tecnico afectado.
3. Si la tarea cierra o redefine una historia clave, actualizar [backlog-criterios-aceptacion.md](backlog-criterios-aceptacion.md).
4. Si se tomo una decision relevante o se acepto una limitacion, registrarla en [registro-decisiones-arquitectura.md](registro-decisiones-arquitectura.md).
5. Verificar que la documentacion describa el estado vigente, no una intencion futura.
6. Ejecutar las pruebas o validaciones razonables para la tarea.
7. Hacer commit con codigo y documentacion relacionados en la misma unidad de trabajo.

## Criterios de calidad documental

Una actualizacion documental es util cuando:

- explica el estado real del sistema;
- separa lo completado de lo pendiente;
- documenta reglas de negocio antes que detalles accidentales;
- menciona riesgos o deuda tecnica sin esconderlos;
- evita duplicar codigo completo;
- permite a otra persona continuar la tarea sin leer todo el repositorio.

## Como registrar una decision

Usar [registro-decisiones-arquitectura.md](registro-decisiones-arquitectura.md) cuando una decision cumpla al menos una condicion:

- afecta mas de una capa del sistema;
- condiciona futuras tareas;
- cambia un contrato de API o datos;
- acepta una limitacion temporal;
- resuelve una ambiguedad de dominio;
- define una regla de seguridad, sesion, pago o permisos.

Formato recomendado:

```text
## YYYY-MM-DD - Titulo breve

Estado: vigente | reemplazada | propuesta

Contexto:
- ...

Decision:
- ...

Impacto:
- ...

Seguimiento:
- ...
```

## Criterios de aceptacion de este requerimiento

Este requerimiento queda cubierto cuando:

- existe una regla clara para actualizar documentacion tecnica junto con cambios importantes;
- las historias clave tienen criterios de aceptacion visibles y mantenibles;
- existe un registro para decisiones de arquitectura y limitaciones relevantes;
- los documentos principales enlazan este flujo para que pueda usarse en tareas futuras.
