# Revision integral y QA final

## Objetivo

Registrar la revision final extensa de la aplicacion antes de dejarla lista para entrega, hosteo o portafolio.

Fecha de ejecucion: 2026-05-09.

Rama de trabajo: `chore/qa-final-app`.

## Alcance revisado

- Arranque local de backend y frontend siguiendo [arranque-servidores.md](arranque-servidores.md).
- Flujos publicos: inicio, navegacion base, catalogo, registro, login y recuperacion de contrasena.
- Flujos autenticados de cliente: compra de brazalete, perfil, recibos, historial y consumos.
- Flujos administrativos: acceso admin, clientes, tipos de brazalete, brazaletes, ventas, testimonios, atracciones, comidas y movimientos.
- Estados de carga, mensajes de error, estados vacios, redirecciones y manejo de sesion.
- Responsive basico por revision de estructuras y clases responsive en pantallas principales.

## Datos locales usados para QA

Se prepararon datos idempotentes en la base local para poder probar roles y flujos sin depender de datos manuales previos:

- cliente: `qa_cliente`
- administrador operativo: `qa_admin`
- contrasena local de QA: `QaPass123!`
- tipo de brazalete activo: `QA Pass`
- catalogo base de atracciones y comidas cargado con `python manage.py seed_atracciones_comidas`

Estos datos son locales de desarrollo y no forman parte de una migracion.

## Validaciones ejecutadas

| Validacion | Resultado |
| --- | --- |
| `python manage.py check` | OK |
| `python manage.py showmigrations` | OK, migraciones aplicadas en la base local |
| `python manage.py test` | OK, 71 pruebas ejecutadas |
| `npm run build` | OK |
| Arranque backend `127.0.0.1:8000` | OK, API publica responde 200 |
| Arranque frontend `127.0.0.1:5173` | OK, ruta `/inicio` responde 200 |
| Login cliente por API | OK |
| Perfil cliente por API | OK |
| Catalogo publico de tipos, atracciones y comidas por API | OK |
| Compra interna de brazalete por API | OK |
| Recibos del cliente por API | OK |
| Consumo de atraccion con brazalete por API | OK |
| Compra de comida con saldo de brazalete por API | OK |
| Historial de movimientos filtrado por brazalete | OK, incluye `ACTIVATION`, `ATTRACTION_CONSUMPTION` y `FOOD_CONSUMPTION` |
| Login administrador por API | OK |
| Endpoints administrativos de usuarios, brazaletes y movimientos | OK |

Nota: el primer intento de `npm run build` fallo dentro del sandbox por `EPERM` al resolver rutas de Node en `C:\Users\3st3b`. Al reejecutarlo fuera del sandbox, el build paso correctamente. Queda una advertencia no bloqueante de Browserslist/caniuse-lite desactualizado.

## Revision manual guiada

El entorno de Codex no tenia navegador ni Playwright instalado para ejecutar una sesion visual real con perfil limpio. Se hizo una revision guiada equivalente por arranque local, rutas HTTP y flujos de API con usuarios de cliente y administrador.

Checklist recomendado para repetir en navegador limpio:

1. Abrir `http://127.0.0.1:5173/inicio` en una ventana sin sesion previa.
2. Recorrer navbar: inicio, compra, atracciones/comidas, sobre nosotros, contacto y terminos.
3. Crear una cuenta desde `/registro` y verificar redireccion a `/inicio`.
4. Cerrar sesion e iniciar sesion desde `/login`.
5. Probar `/recuperar-contrasena` usando un correo local y revisar el codigo en consola/correo configurado.
   - Verificar que usuario y correo sean obligatorios.
   - Verificar que un correo valido con usuario incorrecto no genere codigo.
6. Comprar un `QA Pass` con saldo interno y abrir el recibo.
7. Entrar a `/mi-perfil/info`, editar datos basicos y verificar el modal de eliminacion sin confirmar.
8. Abrir `/mi-perfil/mis-brazaletes` y luego el historial filtrado.
9. Ir a `/atracciones-comidas`, seleccionar brazalete, consumir una atraccion y comprar una comida.
10. Iniciar sesion como `qa_admin`, abrir `/administrador` y revisar resumen, tablas, estados vacios, busqueda, paginacion y modales de eliminacion.
11. Repetir los puntos principales en ancho mobile usando DevTools.

## Hallazgos corregidos

### QA-001 - Modales y avisos inconsistentes

Se detecto uso mezclado de `alert()`, `window.confirm()`, `toast` y un modal visual antiguo.

Estado: corregido.

Cambios:

- `ModalMessage` ahora soporta avisos y confirmaciones con el mismo estilo visual.
- Login, compra interna, PayPal, perfil y panel administrativo dejaron de usar `alert()` y `window.confirm()`.
- Los mensajes de exito/error no bloqueantes usan `react-hot-toast`.
- Las confirmaciones destructivas usan `ModalMessage`.

### QA-002 - Header administrativo desalineado con header de cliente

Se detecto que el logo del panel administrativo no usaba el mismo tratamiento visual que el header del cliente y que la seccion activa se resaltaba con amarillo, rompiendo la consistencia del sistema.

Estado: corregido.

Cambios:

- El logo del panel administrativo usa el mismo contenedor blanco del header cliente.
- La marca queda estandarizada como `Fantasy Land` en ambos headers.
- Las opciones activas del header cliente y del panel administrativo usan fondo blanco y texto `fondoLogin`, evitando el resaltado amarillo.

### QA-003 - Mensaje de sesion expirada poco visible

Se detecto que el mensaje de sesion expirada quedaba como error de formulario en login y podia pasar desapercibido.

Estado: corregido.

Cambios:

- El mensaje de sesion cerrada o expirada se muestra como modal persistente al llegar a login.
- El modal no se cierra al hacer clic fuera; el usuario debe pulsar `Ok`.

## Hallazgos menores fuera de alcance

- No existe suite E2E automatizada con Playwright/Cypress para cubrir navegador real, responsive visual y sesion limpia.
- La advertencia de Browserslist indica que `caniuse-lite` esta desactualizado; no bloquea build ni ejecucion.
- La validacion real de PayPal depende de credenciales y entorno externo; se cubre con pruebas automatizadas/mocks y con error controlado, no con pago real.
- El envio real de correos de recuperacion depende de `DJANGO_EMAIL_*`; en desarrollo puede usarse backend de consola.

## Conclusion de salida

Estado: go para entrega local/portafolio con cautelas menores.

La aplicacion arranca, compila, pasa pruebas backend, permite recorrer los flujos criticos por API con usuarios de distintos roles y deja corregido el hallazgo visual principal de modales inconsistentes. Antes de un hosteo publico conviene agregar una suite E2E minima y hacer una pasada visual real en navegador con DevTools mobile.

## Validacion posterior al despliegue publico

Fecha de ejecucion: 2026-05-31.

Entorno validado:

- frontend: `https://proyecto-brazaletes-web.vercel.app`;
- backend: `https://fantasy-land-backend.onrender.com`;
- base de datos: Neon Free;
- media: Cloudinary Free;
- correo transaccional: Brevo SMTP;
- pagos externos: PayPal Sandbox.

Smoke tests manuales completados:

| Validacion | Resultado |
| --- | --- |
| `GET /health/` en Render | OK |
| Abrir y recargar rutas SPA directas en Vercel | OK despues de agregar rewrite hacia `/index.html` |
| Registro, login y edicion de perfil | OK |
| Recuperacion de contrasena por correo real | OK con Brevo SMTP por puerto `2525` |
| Alta administrativa de brazaletes, atracciones y comidas | OK |
| Subida de imagen desde admin hacia Cloudinary | OK |
| Compra con saldo interno | OK |
| Compra PayPal Sandbox | OK |
| Persistencia de datos desde Neon | OK |

Validacion local complementaria:

```powershell
python manage.py seed_atracciones_comidas
python manage.py seed_atracciones_comidas
python manage.py check
```

Resultado: el seed actualizo las tres atracciones y tres comidas en ambas
ejecuciones sin duplicados. `python manage.py check` termino sin issues.

Hallazgos corregidos durante el despliegue:

- faltaba fallback SPA de Vercel para rutas abiertas directamente;
- el perfil permitia guardar antes de terminar su carga inicial;
- el gestor de contrasenas del navegador podia completar campos fuera del
  login por falta de atributos `autocomplete`;
- los errores PayPal del backend quedaban ocultos por mensajes genericos del
  frontend;
- Render Free bloquea SMTP saliente por `587`; Brevo quedo configurado por
  `2525`;
- se agrego `DJANGO_EMAIL_TIMEOUT` para evitar que una falla SMTP congele el
  worker hasta alcanzar el timeout de Gunicorn.

Nota sobre datos demo: `seed_atracciones_comidas` carga referencias a imagenes
locales y no transfiere archivos hacia Cloudinary. Para produccion, las imagenes
de catalogo deben subirse desde admin o mediante una migracion explicita de
media.

Estado: go para continuar con preparacion y publicacion en portafolio. Queda
pendiente medir el cold start percibido de Render Free y registrar si se acepta
para la demo o si se planifica una migracion futura del backend a Railway Hobby.
