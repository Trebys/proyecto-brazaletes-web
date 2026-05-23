# Fantasy Land - Sistema web de venta y gestion de brazaletes

Proyecto full stack para un parque de atracciones ficticio. El sistema permite registrar clientes, vender brazaletes digitales, controlar saldo y usos de atracciones, procesar pagos internos o PayPal, auditar consumos y operar un panel administrativo.

El objetivo de este repositorio es mostrar una aplicacion de portafolio evaluable rapidamente: contexto de negocio, arquitectura, flujos principales, arranque local, variables de entorno y documentacion tecnica viva quedan enlazados desde este README.

## Contexto de negocio

Fantasy Land usa brazaletes como pase operativo del visitante. Un cliente compra un tipo de brazalete, recibe saldo para comidas y usos para atracciones, y luego consume servicios dentro del parque. El sistema conserva el estado actual del brazalete y tambien un historial transaccional para auditoria.

Roles principales:

- Visitante anonimo: navega el sitio publico, consulta brazaletes, atracciones, comidas, contacto y terminos.
- Cliente autenticado: compra brazaletes, consulta recibos, edita perfil, consume atracciones/comidas y deja testimonios.
- Administrador operativo: gestiona clientes, tipos de brazalete, brazaletes emitidos, recibos, movimientos, atracciones, comidas y testimonios.

## Stack real

Backend:

- Python con Django 5.1
- Django REST Framework
- Token authentication con expiracion por inactividad
- PostgreSQL como base principal por variables `DB_*`
- SQLite como respaldo local solo cuando `DJANGO_DEBUG=True` y no hay configuracion `DB_*`
- PayPal Checkout Server SDK
- `django-cors-headers`
- `gunicorn` y `whitenoise` para despliegue WSGI y archivos estaticos
- Cloudinary opcional para media persistente en produccion

Frontend:

- React 18
- Vite
- React Router DOM
- Axios
- Tailwind CSS
- `@paypal/react-paypal-js`
- `react-hot-toast`

## Estructura del repositorio

```text
backend/
  backend_django/          Configuracion y rutas Django
  login/                   Usuarios, autenticacion, sesion y recuperacion
  compra_brazaletes/       Tipos, brazaletes, recibos, ventas y ledger
  atracciones_comidas/     Catalogo y consumos de atracciones/comidas
  testimonios/             Testimonios moderados de clientes
frontend/frontend_react/
  src/
    api/                   Cliente Axios y helpers de sesion/compra
    auth/                  AuthContext
    components/            Layouts, formularios y componentes reutilizables
    pages/                 Paginas publicas, cliente y administrador
docs/                      Documentacion tecnica viva
```

## Arranque local

Opcion rapida desde la raiz:

```cmd
start-dev.cmd
```

Ese script abre backend y frontend en ventanas separadas.

Opcion manual:

```cmd
cd /d c:\Users\3st3b\Dev\brazaletes_web_agentes_IA\proyecto-brazaletes-web\backend
venv\Scripts\activate
python manage.py migrate
python manage.py runserver
```

```cmd
cd /d c:\Users\3st3b\Dev\brazaletes_web_agentes_IA\proyecto-brazaletes-web\frontend\frontend_react
npm install
npm run dev
```

URLs locales habituales:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000/api/`
- Django Admin: `http://localhost:8000/admin/`
- Docs DRF: `http://localhost:8000/docs/`

Mas detalle: [docs/arranque-servidores.md](docs/arranque-servidores.md).

## Variables de entorno

Backend: crear `backend/.env` a partir de [backend/.env.example](backend/.env.example).

Variables principales:

```env
DJANGO_SECRET_KEY=replace-with-a-real-secret-key
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
DJANGO_CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
DJANGO_CSRF_TRUSTED_ORIGINS=http://localhost:5173,http://localhost:3000
SESSION_IDLE_TIMEOUT_MINUTES=15

DB_ENGINE=django.db.backends.postgresql
DB_NAME=bd_brazaletes_web
DB_USER=postgres
DB_PASSWORD=replace-with-your-local-db-password
DB_HOST=localhost
DB_PORT=5432

PAYPAL_CLIENT_ID=replace-with-your-paypal-client-id
PAYPAL_CLIENT_SECRET=replace-with-your-paypal-client-secret
PAYPAL_ENV=sandbox
PAYPAL_WEBHOOK_ID=replace-with-your-paypal-webhook-id
```

Para produccion tambien se usan variables como `DATABASE_URL`, `DJANGO_USE_CLOUDINARY`, `CLOUDINARY_URL`, `DJANGO_SECURE_*`, hosts publicos, origenes CORS/CSRF y SMTP real. La guia completa esta en [docs/despliegue-produccion.md](docs/despliegue-produccion.md).

Frontend: crear `frontend/frontend_react/.env` a partir de [frontend/frontend_react/.env.example](frontend/frontend_react/.env.example).

```env
VITE_API_BASE_URL=http://localhost:8000/api/
VITE_PAYPAL_CLIENT_ID=replace-with-your-paypal-client-id
VITE_SESSION_IDLE_TIMEOUT_MINUTES=15
```

Notas:

- No versionar secretos reales.
- Para usar PostgreSQL local, ejecutar migraciones antes de probar flujos.
- PayPal real depende de credenciales consistentes con `PAYPAL_ENV`.
- En desarrollo, el correo de recuperacion puede salir por consola si se usa `django.core.mail.backends.console.EmailBackend`.

## Estrategia de despliegue preparada

La estrategia elegida para el primer despliegue publico es:

- Frontend: `Vercel Hobby`
- Backend: `Render Free`
- Base de datos: `Neon Free`
- Media: `Cloudinary Free`

El monorepo se mantiene con `backend/` y `frontend/`. Si Render Free no convence por cold starts, latencia o limites, se deja abierta la migracion solo del backend a `Railway Hobby`.

Mas detalle: [docs/despliegue-produccion.md](docs/despliegue-produccion.md).

## Flujos principales

Autenticacion y sesion:

1. El usuario inicia sesion con usuario o correo.
2. El backend emite un token y devuelve la politica de sesion.
3. El frontend guarda token y usuario, pero la UI consume `AuthContext`.
4. La inactividad cierra sesion segun la politica del backend.
5. Un nuevo login invalida sesiones anteriores del mismo usuario.

Compra de brazalete:

1. El cliente elige un tipo de brazalete.
2. Puede pagar con saldo interno o PayPal.
3. El backend crea recibo, venta, linea de venta, brazalete y transaccion de activacion.
4. El frontend muestra el recibo y el brazalete queda disponible en el perfil.

Consumo en parque:

1. El cliente selecciona un brazalete activo.
2. Las atracciones descuentan usos del brazalete.
3. Las comidas descuentan saldo del brazalete.
4. Cada consumo crea una `BraceletTransaction` auditable.

Administracion:

1. Solo usuarios con `is_staff=True` acceden al backoffice.
2. El panel permite gestionar catalogos, clientes, recibos, brazaletes y movimientos.
3. Los ajustes administrativos de saldo/usos quedan registrados como movimientos.
4. Los testimonios de clientes se moderan antes de publicarse.

## Diagramas clave

Los diagramas viven en [docs/diagramas-sistema.md](docs/diagramas-sistema.md) y estan escritos en Mermaid para que puedan versionarse junto con el codigo.

Incluyen:

- Diagrama entidad-relacion del dominio principal.
- Secuencia de compra de brazalete.
- Flujo de navegacion principal.

## Diferencias entre la propuesta inicial y la implementacion actual

La propuesta inicial hablaba de un sistema de venta de tiquetes/brazaletes con administracion general. La implementacion actual aterrizo el dominio en un modelo mas auditable:

- El producto operativo central es el brazalete, no un tiquete aislado.
- `PurchaseReceipt` conserva solo la responsabilidad de comprobante de pago.
- `Sale` y `SaleLine` representan la venta comercial.
- `BraceletTransaction` registra activaciones, consumos, ajustes y reversos.
- La comida y las atracciones no se modelan como nuevas ventas de brazalete, sino como consumos contra el estado del brazalete.
- La administracion operativa se basa en `is_staff`; `is_superuser` queda reservado para soporte total de Django.
- La autenticacion usa tokens con expiracion por inactividad y una sola sesion activa por usuario.
- PayPal esta integrado como flujo de pago externo, con captura y webhook defensivo.
- El frontend evoluciono de pantallas base a una SPA con rutas publicas, perfil de cliente y panel administrativo.

## Documentacion principal

- [Arranque rapido](docs/arranque-servidores.md)
- [Diagramas clave del sistema](docs/diagramas-sistema.md)
- [Funcionamiento del backend](docs/backend-funcionamiento.md)
- [Funcionamiento del frontend](docs/frontend-funcionamiento.md)
- [Politica de sesion](docs/politica-sesion.md)
- [Modelo transaccional de brazaletes](docs/modelo-transaccional-brazaletes.md)
- [Gestion de documentacion tecnica](docs/gestion-documentacion.md)
- [Despliegue de produccion](docs/despliegue-produccion.md)
- [Backlog y criterios de aceptacion](docs/backlog-criterios-aceptacion.md)
- [Registro de decisiones de arquitectura](docs/registro-decisiones-arquitectura.md)
- [Flujo de ramas Git](docs/flujo-ramas-git.md)
- [Revision integral y QA final](docs/revision-qa-final.md)

## Validaciones utiles

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

## Estado de portafolio

El proyecto ya cubre un MVP funcional: sitio publico, registro, login, recuperacion de contrasena, compra interna, compra PayPal, recibos, perfil, consumo de atracciones/comidas, historial transaccional, testimonios moderados y backoffice operativo.

Limitaciones documentadas:

- Falta una suite E2E automatizada de navegador real.
- PayPal y correo real dependen de credenciales externas.
- La configuracion productiva depende de variables de entorno correctas.
- Render Free usa filesystem efimero; la media productiva queda preparada para Cloudinary.

## Regla de trabajo

Cada cambio importante debe dejar actualizados los documentos tecnicos afectados, los criterios de aceptacion o el registro de decisiones cuando corresponda. La guia esta en [docs/gestion-documentacion.md](docs/gestion-documentacion.md).
