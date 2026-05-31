# Despliegue de produccion

## Objetivo

Este documento deja preparada la estrategia de despliegue para publicar Fantasy Land sin depender de valores locales ni de filesystem efimero.

La preparacion inicial ya fue aplicada y validada sobre servicios publicos. El
documento conserva los pasos para repetir el despliegue y registra los ajustes
descubiertos durante los smoke tests.

## Estrategia elegida

| Capa | Servicio elegido | Plan inicial | Motivo |
| --- | --- | --- | --- |
| Frontend | Vercel | Hobby | Build simple de Vite desde el monorepo y URL publica rapida para portafolio |
| Backend | Render | Free | Permite publicar Django con `gunicorn` y conectar variables externas |
| Base de datos | Neon | Free | PostgreSQL administrado compatible con `DATABASE_URL` |
| Media | Cloudinary | Free | Evita perder imagenes cuando Render Free reinicia o usa filesystem efimero |

Alternativa prevista: si Render Free produce cold starts, latencia o limites incomodos para una demo, migrar solo el backend a Railway Hobby. El monorepo se conserva.

## Que puede hacer la IA y que queda manual

La IA puede preparar en el repositorio:

- settings de Django para `DEBUG=False`, hosts, CORS, CSRF, static files, media persistente y base de datos por URL;
- endpoint de health check;
- dependencias de despliegue;
- comandos de build y start;
- ejemplos de variables de entorno;
- documentacion de pasos y limitaciones.

El propietario debe hacer manualmente:

- crear el proyecto de Neon y copiar `DATABASE_URL`;
- crear el cloud de Cloudinary y copiar `CLOUDINARY_URL`;
- crear el servicio web en Render o conectar `render.yaml`;
- crear el proyecto de Vercel apuntando a `frontend/frontend_react`;
- configurar credenciales de PayPal del entorno correcto;
- configurar SMTP real para recuperacion de contrasena;
- copiar URLs publicas finales en las variables de cada servicio;
- ejecutar smoke tests sobre las URLs desplegadas.

## Backend en Render

El backend vive en `backend/`. El archivo `render.yaml` documenta la configuracion esperada para Render:

```bash
pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate
```

Comando de arranque:

```bash
gunicorn backend_django.wsgi:application
```

Health check:

```text
/health/
```

Render Free puede dormir el servicio tras inactividad. El primer request despues de dormir puede tardar. Esto es aceptable para portafolio, pero no ideal para produccion real.

## Frontend en Vercel

Configurar el proyecto de Vercel desde el monorepo:

- Root Directory: `frontend/frontend_react`
- Build Command: `npm run build`
- Output Directory: `dist`

Variable principal:

```env
VITE_API_BASE_URL=https://your-render-backend.onrender.com/api/
```

El sufijo `/api/` es importante porque los helpers de Axios construyen rutas relativas desde esa base.

El archivo `frontend/frontend_react/vercel.json` agrega un rewrite hacia
`/index.html`. Es necesario porque React Router resuelve las rutas de la SPA:
sin este fallback, abrir directamente `/inicio`, `/login` o
`/atracciones-comidas` devolvia `404: NOT_FOUND` desde Vercel aunque la
navegacion interna funcionara.

## Variables de entorno backend

Produccion en Render:

```env
DJANGO_SECRET_KEY=replace-with-render-secret
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=your-render-backend.onrender.com
DJANGO_CORS_ALLOWED_ORIGINS=https://your-vercel-frontend.vercel.app
DJANGO_CORS_ALLOW_CREDENTIALS=True
DJANGO_CSRF_TRUSTED_ORIGINS=https://your-vercel-frontend.vercel.app
DJANGO_SECURE_SSL_REDIRECT=True
DJANGO_SESSION_COOKIE_SECURE=True
DJANGO_CSRF_COOKIE_SECURE=True
DJANGO_SECURE_HSTS_SECONDS=31536000
DJANGO_SECURE_HSTS_INCLUDE_SUBDOMAINS=False
DJANGO_SECURE_HSTS_PRELOAD=False

DATABASE_URL=postgresql://...

DJANGO_USE_CLOUDINARY=True
CLOUDINARY_URL=cloudinary://...

SESSION_IDLE_TIMEOUT_MINUTES=15
PASSWORD_RESET_CODE_EXPIRATION_MINUTES=15
PASSWORD_RESET_MAX_ATTEMPTS=5

PAYPAL_CLIENT_ID=replace-with-paypal-client-id
PAYPAL_CLIENT_SECRET=replace-with-paypal-client-secret
PAYPAL_ENV=sandbox
PAYPAL_WEBHOOK_ID=replace-with-paypal-webhook-id

DJANGO_EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
DJANGO_DEFAULT_FROM_EMAIL=Fantasy Land <no-reply@your-domain.example>
DJANGO_EMAIL_HOST=smtp.example.com
DJANGO_EMAIL_PORT=587
DJANGO_EMAIL_HOST_USER=replace-with-email-user
DJANGO_EMAIL_HOST_PASSWORD=replace-with-email-password
DJANGO_EMAIL_USE_TLS=True
DJANGO_EMAIL_USE_SSL=False
DJANGO_EMAIL_TIMEOUT=10
```

Para entorno local se puede seguir usando `backend/.env` con `DB_*` y `DJANGO_DEBUG=True`.

En Render Free no se pueden abrir conexiones SMTP salientes por los puertos
`25`, `465` o `587`. Si el proveedor lo admite, usar un puerto alternativo como
`2525`. Por ejemplo, con Brevo:

```env
DJANGO_EMAIL_HOST=smtp-relay.brevo.com
DJANGO_EMAIL_PORT=2525
DJANGO_EMAIL_USE_TLS=True
DJANGO_EMAIL_USE_SSL=False
```

`DJANGO_DEFAULT_FROM_EMAIL` debe usar un remitente verificado por el proveedor
SMTP. En Brevo, `DJANGO_EMAIL_HOST_USER` corresponde al SMTP login y
`DJANGO_EMAIL_HOST_PASSWORD` a una SMTP key, no a una API key.

## Variables de entorno frontend

Produccion en Vercel:

```env
VITE_API_BASE_URL=https://your-render-backend.onrender.com/api/
VITE_PAYPAL_CLIENT_ID=replace-with-paypal-client-id
VITE_SESSION_IDLE_TIMEOUT_MINUTES=15
```

El `VITE_PAYPAL_CLIENT_ID` debe pertenecer al mismo ambiente que `PAYPAL_ENV` del backend.

## Media y archivos

En desarrollo, Django usa `backend/media/`.

En produccion, `DJANGO_USE_CLOUDINARY=True` activa Cloudinary como storage de archivos subidos. Esto cubre:

- imagen de perfil de usuarios;
- imagenes de tipos de brazalete;
- fotos de atracciones;
- fotos de comidas.

No se debe depender de `backend/media/` en Render Free porque el filesystem no es persistente.

## Catalogo base y datos demo

El comando local:

```cmd
cd backend
venv\Scripts\activate
python manage.py seed_atracciones_comidas
```

carga o actualiza tres atracciones y tres comidas. Usa `update_or_create`, por
lo que es idempotente y puede repetirse sin duplicar registros.

En produccion se debe tener presente que las rutas de imagen incluidas por el
seed apuntan al catalogo local de ejemplo. El comando no sube automaticamente
los archivos a Cloudinary. Para una demo publica se puede:

1. crear o actualizar los registros desde el panel administrativo;
2. subir cada imagen desde el formulario correspondiente;
3. confirmar que el archivo aparece en Cloudinary;
4. verificar que la imagen carga desde el frontend publico.

Este flujo ya fue validado con una atraccion creada desde el admin y almacenada
en Cloudinary.

## Validaciones antes de desplegar

Backend:

```cmd
cd backend
venv\Scripts\activate
python manage.py check
python manage.py test
```

Frontend:

```cmd
cd frontend\frontend_react
npm run build
```

Validacion productiva local aproximada:

```cmd
cd backend
venv\Scripts\activate
python manage.py check --deploy
```

`check --deploy` puede mostrar advertencias si se ejecuta con variables locales. Lo importante es corregir las que apliquen al entorno real antes de publicar.

## Costos y limites

Todo el stack elegido puede iniciar en planes gratuitos:

- Vercel Hobby: gratis para demo y portafolio;
- Render Free: gratis, pero con cold starts y limites de uso;
- Neon Free: gratis con cuotas de almacenamiento y computo;
- Cloudinary Free: gratis con cuotas de transformacion, almacenamiento y ancho de banda.

Partes que podrian requerir pago:

- backend si Render Free afecta la experiencia de demo: Railway Hobby o plan pago equivalente;
- base de datos si el proyecto supera las cuotas de Neon Free;
- media si se superan cuotas de Cloudinary;
- correo SMTP si el proveedor gratuito limita envio o reputacion.

## Smoke tests del despliegue real

Cuando existan URLs publicas:

1. abrir `https://your-render-backend.onrender.com/health/`;
2. abrir el frontend en Vercel;
3. registrar usuario;
4. iniciar sesion;
5. recuperar contrasena usando SMTP real;
6. consultar catalogos de brazaletes, atracciones y comidas;
7. subir una imagen de perfil y confirmar que la URL viene desde Cloudinary;
8. ejecutar compra interna;
9. probar PayPal con credenciales sandbox;
10. entrar al panel administrativo con un usuario `is_staff=True`.

## Estado validado del entorno publico

Servicios publicados:

- frontend: `https://proyecto-brazaletes-web.vercel.app`;
- backend: `https://fantasy-land-backend.onrender.com`;
- health check: `https://fantasy-land-backend.onrender.com/health/`.

Smoke tests completados:

- health check del backend;
- rutas directas y navegacion SPA en Vercel;
- registro, login, perfil y edicion de datos;
- recuperacion de contrasena con Brevo SMTP por puerto `2525`;
- alta administrativa de brazaletes, atracciones y comidas;
- carga persistente de imagenes hacia Cloudinary;
- compra con saldo interno;
- compra PayPal Sandbox;
- consulta de datos desde Neon.

Hallazgos corregidos durante la validacion:

- rewrite SPA de Vercel para rutas directas;
- bloqueo del formulario de perfil mientras carga o guarda;
- atributos `autocomplete` explicitos para evitar que el navegador inserte una
  contrasena guardada en formularios que no corresponden;
- propagacion de mensajes seguros del backend cuando PayPal falla;
- puerto SMTP alternativo `2525` y timeout configurable para Render Free.
