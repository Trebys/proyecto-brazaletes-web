# Politica de sesion

## Decision vigente

El sistema usa una sola politica de expiracion por inactividad:

- duracion por defecto: 15 minutos;
- fuente de verdad: backend, mediante `SESSION_IDLE_TIMEOUT_MINUTES`;
- el frontend consume la duracion que devuelve el backend y usa `VITE_SESSION_IDLE_TIMEOUT_MINUTES=15` solo como respaldo local;
- solo existe una sesion activa por usuario;
- si el mismo usuario inicia sesion de nuevo en otro navegador, dispositivo o instancia independiente, el backend invalida el token anterior y deja vigente el ultimo inicio de sesion.

## Comportamiento esperado

### Sesion vigente

Mientras el usuario tenga actividad, el frontend llama de forma controlada a `/api/refresh-token/` para confirmar que la sesion sigue vigente y prolongar la ventana de inactividad en backend.

Los endpoints protegidos tambien validan la expiracion del token. Si el token sigue vigente, el backend actualiza su fecha de actividad.

### Inactividad

Si el usuario supera la ventana de inactividad, el frontend cierra la sesion y muestra el mensaje correspondiente. Si el siguiente request llega primero al backend con un token vencido, el backend elimina el token y responde `401` con el mismo criterio de expiracion.

Al cerrar sesion, el frontend limpia tambien datos temporales de compra asociados a la sesion, como el ultimo `receiptId` usado para mostrar recibos y claves temporales conocidas del flujo PayPal, incluyendo `__paypal_storage__`. Esto evita que una sesion posterior herede referencias o metadatos de compras de un usuario anterior en el mismo navegador.

### Segunda sesion

El sistema aplica la regla "ultimo inicio de sesion gana".

Cuando un usuario inicia sesion y ya habia una sesion activa:

1. el backend elimina el token anterior;
2. crea un token nuevo;
3. responde al nuevo login indicando que se cerro una sesion anterior;
4. cualquier instancia que conserve el token anterior recibira `401` en su siguiente validacion o request protegido.

Esta decision evita estados ambiguos y reduce el riesgo de sesiones paralelas con permisos o datos desactualizados.

## Configuracion

Backend:

```env
SESSION_IDLE_TIMEOUT_MINUTES=15
```

Frontend:

```env
VITE_SESSION_IDLE_TIMEOUT_MINUTES=15
```

La variable del frontend debe mantenerse igual al valor del backend, pero durante una sesion autenticada el frontend prioriza el valor recibido desde la API.

## Mensajes al usuario

Los mensajes de sesion deben ser coherentes:

- expiracion por inactividad: `Tu sesion expiro por inactividad. Inicia sesion nuevamente.`;
- token invalido o sesion reemplazada: `Tu sesion ya no esta activa. Inicia sesion nuevamente.`;
- nuevo inicio de sesion con sesion previa: `Inicio de sesion correcto. Se cerro una sesion anterior.`.
