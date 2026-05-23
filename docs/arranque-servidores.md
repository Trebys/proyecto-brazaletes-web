# Arranque rapido del proyecto

## Opcion automatica

Desde la raiz del proyecto ejecuta:

```cmd
start-dev.cmd
```

Esto abre dos ventanas de `cmd`:

- Backend Django con el entorno virtual activado y `python manage.py runserver`
- Frontend Vite con `npm run dev`

## Opcion manual

Backend:

```cmd
cd /d c:\Users\3st3b\Dev\brazaletes_web_agentes_IA\proyecto-brazaletes-web\backend
venv\Scripts\activate
python manage.py runserver
```

Frontend:

```cmd
cd /d c:\Users\3st3b\Dev\brazaletes_web_agentes_IA\proyecto-brazaletes-web\frontend\frontend_react
npm run dev
```

## Comandos de build y despliegue

Backend desde `backend/`:

```cmd
venv\Scripts\activate
python manage.py check
python manage.py collectstatic --noinput
python manage.py migrate
gunicorn backend_django.wsgi:application
```

En Windows local, `gunicorn` no es el servidor recomendado para desarrollo. Ese comando esta pensado para Render/Linux. Para validar localmente sigue usando `python manage.py runserver`.

Frontend desde `frontend/frontend_react/`:

```cmd
npm install
npm run build
```

Para Vercel:

- Root Directory: `frontend/frontend_react`
- Build Command: `npm run build`
- Output Directory: `dist`

La guia completa de produccion esta en [despliegue-produccion.md](despliegue-produccion.md).

## Como pedirselo a Codex despues

Puedes pedirme cualquiera de estas frases:

- "Ejecuta `start-dev.cmd`"
- "Levanta el proyecto"
- "Abre backend y frontend"

El archivo que automatiza el proceso es [`start-dev.cmd`](C:/Users/3st3b/Dev/brazaletes_web_agentes_IA/proyecto-brazaletes-web/start-dev.cmd).
