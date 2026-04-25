# Flujo de ramas Git para este proyecto

## Objetivo

Este documento define como trabajar las ramas, commits y merges del proyecto para mantener `main` estable y dejar un flujo claro tanto para desarrollo manual como para agentes de IA.

La idea principal es:

- `main` representa el estado mas estable del proyecto;
- cada cambio importante se trabaja en una rama corta y enfocada;
- cuando el cambio esta validado, se integra a `main`;
- los commits deben ser pequenos, claros y trazables a una tarea o issue de Jira.

## Regla principal

No trabajar directamente sobre `main`, salvo que el usuario lo pida de forma explicita para un cambio muy pequeno o urgente.

Flujo recomendado:

1. partir desde `main`;
2. crear una rama nueva para la tarea;
3. hacer cambios pequenos y coherentes;
4. probar y validar;
5. hacer commit con mensaje claro;
6. si aplica, subir la rama al remoto;
7. cuando el cambio este estable, integrarlo a `main`.

## Rama principal

### `main`

Usar `main` para:

- codigo estable;
- version lista para continuar trabajo;
- punto de partida de nuevas ramas;
- historial limpio y facil de entender.

No usar `main` para:

- experimentos largos;
- cambios mezclados de varias tareas;
- trabajo incompleto;
- refactors a medias.

## Tipos de ramas

Usar nombres cortos, descriptivos y, si existe, con referencia a Jira.

Convenciones recomendadas:

- `feature/SCRUM-13-consumo-brazalete`
- `fix/SCRUM-15-estados-paypal`
- `refactor/SCRUM-20-rutas-auth-frontend`
- `docs/SCRUM-21-documentacion-backend`
- `chore/SCRUM-11-config-entornos`
- `hotfix/SCRUM-99-error-critico`
- `spike/investigacion-roles-admin`

## Cuando crear una rama nueva

Crear una rama nueva cuando:

- vas a trabajar una issue de Jira;
- vas a tocar varias lineas o varios archivos relacionados;
- el cambio puede romper algo si queda a medias;
- quieres aislar una correccion o una funcionalidad;
- quieres probar una idea sin ensuciar `main`.

No hace falta crear una rama nueva solo si:

- el usuario pide explicitamente trabajar sobre `main`;
- el cambio es minimo, local y sin riesgo;
- no se va a conservar historial separado.

Aun asi, para este proyecto se recomienda casi siempre usar rama nueva.

## Alcance de una rama

Una rama debe cubrir una unidad de trabajo clara.

Regla recomendada:

- una issue importante = una rama;
- una correccion puntual = una rama;
- una funcionalidad grande = una rama, pero con varios commits pequenos.

Evitar:

- meter varias issues no relacionadas en la misma rama;
- mezclar bugfix, feature y refactor sin necesidad;
- dejar una rama viva durante demasiado tiempo si ya se puede integrar.

## Convencion de commits

Cada commit debe representar una idea clara.

Buenos mensajes:

- `SCRUM-10 restringe acceso a endpoints sensibles`
- `SCRUM-15 corrige estados validos de PurchaseReceipt`
- `SCRUM-22 documenta estrategia de roles administrativos`

Si no hay issue de Jira:

- `fix corrige serializacion de comidas`
- `docs agrega flujo de ramas git`
- `refactor simplifica validacion de login`

Reglas:

- usar verbo en presente;
- describir que cambia, no todo el contexto;
- referenciar Jira cuando exista;
- si existe issue o tarea identificada, preferir incluir su clave en rama y commit;
- evitar mensajes como `cambios`, `update`, `arreglos`, `cosas varias`.

## Regla de documentacion sincronizada

Si una tarea cambia comportamiento real del sistema, configuracion operativa, endpoints, permisos, variables de entorno o flujos importantes, la documentacion afectada debe actualizarse en la misma rama antes de subir o integrar el cambio.

Esto aplica especialmente a archivos como:

- `docs/backend-funcionamiento.md`
- `docs/frontend-funcionamiento.md`
- `docs/flujo-ramas-git.md`

Regla practica:

- no subir ni integrar una rama dejando documentacion conocida como desactualizada si esa documentacion forma parte del alcance real de la tarea;
- si un cambio corrige deuda tecnica o cierra un requerimiento documentado, el documento debe reflejar que ya quedo resuelto o describir el nuevo estado vigente;
- si la tarea no afecta documentacion funcional ni operativa, no hace falta forzar cambios en `docs/`.

Documentos de apoyo:

- [gestion-documentacion.md](gestion-documentacion.md) define el checklist de cierre documental;
- [backlog-criterios-aceptacion.md](backlog-criterios-aceptacion.md) mantiene historias clave y criterios de aceptacion;
- [registro-decisiones-arquitectura.md](registro-decisiones-arquitectura.md) guarda decisiones y limitaciones relevantes.

## Flujo recomendado de trabajo

### Caso normal: trabajar una issue

1. actualizar `main`;
2. crear rama nueva desde `main`;
3. implementar el cambio;
4. actualizar la documentacion relacionada si el cambio modifica comportamiento o configuracion documentada;
5. actualizar criterios de aceptacion o decisiones si el cambio los afecta;
6. probar;
7. hacer uno o varios commits pequenos;
8. subir la rama si el usuario lo pide o si hace falta respaldo remoto;
9. integrar a `main` cuando el cambio este estable.

Ejemplo:

```powershell
git switch main
git pull origin main
git switch -c fix/SCRUM-15-estados-paypal
```

Despues de los cambios:

```powershell
git add .
git commit -m "SCRUM-15 corrige estados validos de PurchaseReceipt"
```

Si hace falta subir la rama:

```powershell
git push -u origin fix/SCRUM-15-estados-paypal
```

Cuando el cambio ya esta validado:

```powershell
git switch main
git pull origin main
git merge --no-ff fix/SCRUM-15-estados-paypal
git push origin main
```

## Cuando subir al remoto

Subir la rama al remoto cuando:

- el usuario pida respaldo remoto;
- el usuario quiera abrir PR;
- el trabajo vaya a continuar despues;
- quieras evitar perder progreso local;
- otro agente o persona necesite revisar el cambio.

No es obligatorio subir la rama si:

- el usuario solo pidio cambios locales;
- el trabajo sigue en progreso y no se necesita remoto;
- el entorno no tiene remoto configurado.

## Cuando integrar a `main`

Integrar a `main` solo cuando:

- el cambio compila o ejecuta correctamente;
- las pruebas basicas pasaron o fueron verificadas;
- el cambio corresponde a una unidad cerrada;
- el codigo ya no esta a medias;
- el usuario quiere dejar estable ese avance.

No integrar a `main` cuando:

- falta validar el flujo principal;
- hay partes rotas conocidas;
- el cambio mezcla demasiadas cosas;
- solo se hizo una exploracion o prueba tecnica.

## Cuando usar tag

Los tags no reemplazan ramas. Sirven para marcar hitos.

Usarlos cuando:

- se cierra un sprint;
- se quiere marcar una version estable;
- se quiere congelar un punto importante del historial.

Ejemplos:

- `sprint-1-completo`
- `v0.1.0`
- `mvp-compra-brazaletes`

Ejemplo:

```powershell
git tag sprint-1-completo
git push origin sprint-1-completo
```

## Reglas para agentes de IA

Todo agente que trabaje en este proyecto debe seguir estas reglas:

1. No trabajar directamente en `main` salvo instruccion explicita del usuario.
2. Crear una rama nueva si el cambio pertenece a una issue o a una unidad funcional clara.
3. Nombrar la rama con tipo de trabajo y, si existe, clave Jira.
4. Hacer commits pequenos y coherentes.
5. No mezclar cambios no relacionados en el mismo commit.
6. No hacer merge a `main` sin que el cambio este estable.
7. No hacer `push` al remoto a menos que el usuario lo pida o la tarea requiera respaldo/publicacion.
8. Si hay cambios locales no relacionados, no sobrescribirlos ni revertirlos.
9. Si una rama ya no se necesita despues del merge, se puede eliminar.

## Protocolo operativo para agentes

### Si el usuario pide solo implementar cambios locales

El agente debe:

1. crear o usar una rama de trabajo;
2. implementar el cambio;
3. actualizar documentacion si el cambio la afecta;
4. actualizar criterios de aceptacion o decisiones si corresponde;
5. hacer commit local si el usuario lo solicito o si la tarea incluye dejar historial listo;
6. no hacer `push` automatico;
7. resumir que rama uso y que commit dejo.

### Si el usuario pide implementar y dejar listo para subir

El agente debe:

1. crear rama de trabajo;
2. implementar y validar;
3. actualizar documentacion si el cambio la afecta;
4. hacer commit;
5. subir la rama con `git push -u origin <rama>`;
6. informar el nombre de la rama y el commit.

### Si el usuario pide integrar a `main`

El agente debe:

1. confirmar que el cambio ya esta estable;
2. actualizar `main`;
3. verificar que la documentacion relevante tambien quedo al dia;
4. fusionar la rama;
5. resolver conflictos si aparecen;
6. hacer `push` de `main` solo si el usuario lo pidio o el flujo del proyecto lo requiere.

### Si el usuario pide cerrar una issue o dejar una entrega estable

El agente puede:

1. fusionar la rama a `main` si el cambio esta listo;
2. crear un tag si el usuario quiere marcar sprint o version;
3. documentar el resultado final.

## Comandos utiles

Ver ramas:

```powershell
git branch
```

Crear rama:

```powershell
git switch -c feature/SCRUM-13-consumo-brazalete
```

Ver estado:

```powershell
git status
```

Agregar cambios:

```powershell
git add .
```

Commit:

```powershell
git commit -m "SCRUM-13 implementa registro de consumo de brazalete"
```

Subir rama:

```powershell
git push -u origin feature/SCRUM-13-consumo-brazalete
```

Cambiar a `main`:

```powershell
git switch main
```

Fusionar rama:

```powershell
git merge --no-ff feature/SCRUM-13-consumo-brazalete
```

Eliminar rama local ya integrada:

```powershell
git branch -d feature/SCRUM-13-consumo-brazalete
```

## Flujo recomendado para este proyecto

Para este proyecto, la forma recomendada de trabajo es:

- planificacion por sprint en Jira;
- ejecucion tecnica por rama de issue;
- commits pequenos durante la implementacion;
- `main` como estado estable;
- tag opcional al cerrar sprint.

Resumen practico:

- Jira organiza el trabajo;
- Git organiza el codigo;
- el sprint no debe ser la unidad principal del historial;
- la issue o cambio funcional si debe ser la unidad principal del historial.
