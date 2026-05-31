# Sprint de hosteo y portafolio

## Objetivo

Cerrar la etapa de desarrollo dejando una version publicada por internet, funcional para demostracion y lista para enlazarse desde el portafolio.

## Alcance recomendado

Este sprint se puede trabajar como un bloque corto y muy enfocado.

Duracion sugerida:

- `1 a 2 semanas` si ya casi todo el desarrollo esta estable
- `2 semanas` si todavia faltan ajustes de produccion, medios o QA de despliegue

## Requerimientos sugeridos

1. Preparar configuracion de produccion y estrategia de despliegue
2. Desplegar el frontend publico en un hosting accesible por internet
3. Desplegar backend, base de datos y almacenamiento multimedia para entorno publico
4. Publicar la aplicacion en el portafolio con enlace real y validacion final

## Orden recomendado

1. Configuracion de produccion
2. Base de datos y almacenamiento de medios
3. Backend publico
4. Frontend publico
5. Smoke tests end-to-end
6. README y portafolio con URL real

## Estrategia de hosting recomendada

### Opcion gratis primero

- Frontend: `Vercel Hobby`
- Backend: `Render Free Web Service`
- Base de datos: `Neon Free`
- Archivos e imagenes: `Cloudinary Free`

Esta opcion sirve bien para portafolio y demo, pero tiene limitaciones operativas.

Limitaciones importantes:

- `Render Free` no se recomienda para produccion, hace spin down tras 15 minutos sin trafico, puede tardar hasta un minuto en volver a responder y no soporta persistent disk en free.
- `Neon Free` es util para demos y proyectos pequenos, con 100 CU-horas al mes por proyecto, 0.5 GB de storage por proyecto y scale-to-zero.
- `Cloudinary Free` se puede usar sin tarjeta y soporta uso real mientras no excedas sus cuotas.

### Opcion barata y mas seria

- Frontend: `Cloudflare Pages Free` o `Vercel Hobby`
- Backend: `Railway Free` para experimentar o `Railway Hobby` si quieres una opcion mas estable
- Base de datos: `Neon Free`
- Archivos e imagenes: `Cloudinary Free`

Esta opcion suele dar una experiencia mas consistente que depender de un backend gratuito que se duerme.

## Recomendacion practica

Para este proyecto se elige salir primero con:

- `Vercel Hobby + Render Free + Neon Free + Cloudinary Free`

Si Render Free no convence por cold starts, latencia o limites, la alternativa prevista es migrar solo el backend a:

- `Railway Hobby + Neon Free + Cloudinary Free`, manteniendo el frontend en Vercel.

## Coste esperado

Escenario totalmente gratis:

- frontend: `0 USD`
- backend: `0 USD`
- base de datos: `0 USD`
- media: `0 USD`

Costo total estimado: `0 USD/mes`

Escenario barato y mas estable:

- frontend: `0 USD`
- backend: `5 USD/mes` aprox con `Railway Hobby`
- base de datos: `0 USD` con `Neon Free`
- media: `0 USD` con `Cloudinary Free`

Costo total estimado: `5 USD/mes` aprox

## Riesgos de despliegue que no conviene ignorar

- el backend usa imagenes y archivos, asi que no conviene depender de filesystem efimero para media persistente;
- PayPal real exige credenciales del entorno correcto y validacion final en URL publica;
- correo real para recuperacion de contrasena puede requerir SMTP externo;
- CORS, CSRF, dominios y URLs publicas deben revisarse como parte del hardening final.

## Salida esperada del sprint

El sprint se considera bien cerrado cuando:

- existe una URL publica funcional del frontend;
- existe una URL publica funcional del backend;
- login, registro, compra, recibos, perfil, testimonios y administracion funcionan en el entorno desplegado;
- el proyecto aparece en el portafolio con enlace vivo y descripcion clara;
- el README explica como esta hosteado y que limitaciones tiene el entorno elegido.

## Avance validado al 2026-05-31

Completado:

- configuracion de produccion y estrategia de despliegue;
- backend publico en Render Free con health check;
- base de datos persistente en Neon Free;
- media persistente en Cloudinary Free;
- frontend publico en Vercel Hobby con soporte para rutas SPA directas;
- registro, login, perfil, recuperacion de contrasena por Brevo SMTP, panel
  administrativo, compra interna y PayPal Sandbox;
- comprobacion local de idempotencia de `seed_atracciones_comidas`, incluyendo
  atracciones, comidas y tipos base `Estándar`, `Especial` y `Premium`.

Pendiente para cerrar la validacion de la demo:

- actualizar el portafolio y publicar el enlace vivo.

Decision operativa: el cold start de Render Free fue probado manualmente y es
tolerable para la demo de portafolio. Se mantiene Render Free. Railway Hobby
queda como alternativa futura para migrar solo el backend si la experiencia
deja de ser suficiente.

Nota SMTP: Render Free bloquea conexiones salientes por `25`, `465` y `587`.
Con Brevo se usa `smtp-relay.brevo.com`, puerto `2525`, TLS activo y timeout
configurable.
