# `vulkano update` — diseño

Fecha: 2026-10-13. Estado: aprobado en brainstorming, pendiente de plan.

## Objetivo

Poner al día los proyectos que ya corren con Vulkano con los archivos que el template controla, desde cualquier estado de partida, con un solo comando determinista. El comando `new <app>` (antes "create-vulkano") es un sub-proyecto aparte con su propia spec.

**Hecho cuando:** `npx @vulkano/cli update` en un proyecto de cualquiera de los 4 estados de partida deja `AGENTS.md`, `references/` y las skills iguales a `master` del template (salvo ediciones locales que el usuario decidió conservar), el core al día, `vp check` y `vp test` en verde, y un reporte de lo que cambió.

## Contexto y decisiones

- Paquete: `@vulkano/cli` **1.0.0**, reescrito desde cero en su repo actual `vulkanojs/vulkano-cli` (local `../cli`). La 0.1.8 (2023) nunca se usó: se puede romper, no se reutiliza código. Bin: `vulkano`.
- Fuente: siempre el último commit de `master` de `vulkanojs/vulkano` (el template no tiene tags). Escape: `--ref <sha|rama>`.
- Estados de partida que debe soportar (todos existen hoy):
  1. skills como submódulo git;
  2. skills copiadas como carpeta normal, o sin skills;
  3. `references/AGENTS/` viejo (p. ej. los 22 docs anteriores a la consolidación);
  4. sin `references/` ni `AGENTS.md`.
- Ediciones locales en archivos del template: se pregunta archivo por archivo.

## Alcance

| Archivo                                             | Acción                                                                    |
| --------------------------------------------------- | ------------------------------------------------------------------------- |
| `AGENTS.md`, `CLAUDE.md` (symlink), `references/**` | Sobrescribir desde el template; ediciones locales → preguntar             |
| `.claude/skills/vulkano-skills`                     | Submódulo fijado al sha que fija `master` del template                    |
| `PROJECT.md`                                        | Crear desde el template **solo si no existe**; nunca editar uno existente |
| `.env.example`                                      | Añadir claves que falten, con su comentario; nunca tocar `.env`           |
| `@vulkano/core`                                     | Subir a la última versión, pin exacto                                     |
| `.vulkano.json`                                     | Nuevo: estado de la sincronización                                        |
| `CHANGELOG.md` del proyecto                         | Añadir entrada de la sincronización                                       |

Fuera de alcance: `app/`, `frontend/`, `README.md`, `.env`, cualquier otra dependencia, aplicar migraciones de código, `git commit`.

## Flujo

1. **Pre-checks.** Es repo git, `git status` limpio y `@vulkano/core` está en `package.json`. Si alguno falla, para con el motivo. Crea la rama `chore/vulkano-update-<sha corto>`. Con `--dry-run` no crea rama ni escribe nada.
2. **Resolver versiones.**
   - Destino: sha de `master` (o `--ref`).
   - Base: `template.sha` de `.vulkano.json`. Si no existe, o el sha ya no está en `master` (force-push), es **primera sincronización**.
   - Si destino = base: imprime "docs ya al día" y salta al paso 7.
3. **Descargar.** Con giget, a un directorio temporal: `gh:vulkanojs/vulkano#<destino>` y, si hay base, `gh:vulkanojs/vulkano#<base>`.
4. **Docs** (`AGENTS.md`, `CLAUDE.md`, `references/**`). Se clasifica cada archivo:

   | Caso                                  | Acción                                                                                                      |
   | ------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
   | Proyecto = base                       | Sobrescribir sin preguntar                                                                                  |
   | Proyecto ≠ base (edición local)       | Mostrar diff y preguntar: sobrescribir / conservar / ver                                                    |
   | Nuevo en destino                      | Crear                                                                                                       |
   | Borrado en destino, proyecto = base   | Borrar                                                                                                      |
   | Borrado en destino, con edición local | Preguntar                                                                                                   |
   | Primera sincronización                | Listar archivos a sobrescribir y borrar (p. ej. docs viejos de `references/AGENTS/`); una sola confirmación |
   - `CLAUDE.md`: si el template lo trae como symlink a `AGENTS.md`, se crea igual. Si el proyecto tiene un `CLAUDE.md` real, se trata como edición local.
   - `--yes`: sobrescribe todo sin preguntar.

5. **Skills.**
   - El sha destino se lee con la API de GitHub, porque el tarball no trae el puntero del submódulo: `GET /repos/vulkanojs/vulkano/contents/.claude/skills/vulkano-skills?ref=<destino>` devuelve `type: submodule` y `sha`. Si hay `GITHUB_TOKEN`, se usa (sin token el límite es 60 req/h).
   - Si ya es submódulo: lo fija a ese sha.
   - Si es una carpeta copiada: muestra el diff contra `vulkano-skills@<sha>`, pregunta, la borra, añade el submódulo y lo fija al sha.
   - Si no hay skills: añade el submódulo y lo fija al sha.
   - Si `.gitmodules` tiene otra URL para esa ruta: pregunta antes de cambiarla.
6. **Archivos del proyecto.**
   - `PROJECT.md`: si no existe, se copia el del template; si existe, no se toca.
   - `.env.example`: por cada clave del template que el proyecto no tiene, se añade con su bloque de comentario. No cambia valores ni orden de lo existente.
7. **Core.**
   - Versión actual: `catalog['@vulkano/core']` de `pnpm-workspace.yaml`, o `dependencies` de `package.json` si no hay catálogo. Última versión: registro de npm.
   - Si hay una más nueva: muestra old → new y el changelog del core. Si es major, pide confirmación (también con `--yes`).
   - Fija la versión exacta y corre `pnpm install`. Si falla, revierte `package.json`, `pnpm-workspace.yaml` y `pnpm-lock.yaml`, y lo reporta.
8. **Estado.**
   - Escribe `.vulkano.json` (trackeado) con `{ "template": { "ref": "master", "sha": "<destino>" }, "skills": "<sha>", "syncedAt": "<ISO>" }`.
   - Añade al `CHANGELOG.md` del proyecto la entrada `## <fecha> — Vulkano template sync <sha corto>`, con los archivos añadidos, borrados y cambiados, las ediciones locales conservadas y el core old → new.
9. **Reporte.** Imprime:
   - el resumen anterior;
   - las entradas **Migration** de `references/CHANGELOG.md` con fecha posterior a la del commit base (las entradas del CHANGELOG van por fecha, no por sha; la fecha del commit se lee de la API de GitHub) que no dicen "None". En primera sincronización, solo las de los últimos 90 días, con la nota de que la skill revise el resto;
   - el mensaje de commit sugerido: `[chore] docs: sync with Vulkano template <sha corto>`.

   Nunca hace commit.

Flags: `--ref`, `--yes`, `--dry-run`.

## Errores

- Sin red, o GitHub/npm caído, o rate limit: para antes de escribir nada, con un mensaje claro.
- Falla a mitad de camino: todo está en la rama nueva. El CLI imprime cómo descartar: `git checkout -`, `git branch -D <rama>`.
- Falla `pnpm install`: se revierten los tres archivos de dependencias; los docs ya aplicados se quedan en la rama.

## Skill `vulkano-template-update` (en `vulkano-skills`)

Se reescribe delgada:

1. Correr `npx @vulkano/cli update` (sin `--yes`: las preguntas las responde el usuario).
2. Aplicar las migraciones que imprimió el CLI al código del proyecto. Cada una es condición + acción; se salta si la condición ya se cumple, y se pregunta ante cualquier duda.
3. Revisar las ediciones locales conservadas: si son hechos del proyecto, proponer moverlos a `PROJECT.md`.
4. Correr `vp check` y `vp test`, verificar que los enlaces relativos de `AGENTS.md`, `PROJECT.md` y `references/AGENTS/*.md` resuelven, y buscar en el proyecto referencias a archivos borrados.
5. Reportar y proponer el mensaje de commit. Nunca hacer commit.

Desaparece la sección "First run in an older project": el CLI no depende de que la skill exista.

## Cambios en el template (`vulkanojs/vulkano`)

- `CHANGELOG.md` (stub del proyecto): el encabezado explica que la base de la próxima sincronización está en `.vulkano.json`, no en el título de la entrada.
- `references/CHANGELOG.md`: entrada con **Migration**: "corre `npx @vulkano/cli update`".
- `.vulkano.json` no se incluye en el template: lo escriben `new` y `update`.

## Pruebas (repo `vulkano-cli`, Vitest)

- **Unitarias:**
  - clasificación de archivos (igual a base / edición local / nuevo / borrado / borrado con edición);
  - merge de `.env.example` (añade la clave con su comentario; respeta valores y orden existentes);
  - lectura y escritura de `.vulkano.json`;
  - filtro de entradas **Migration** posteriores a una fecha;
  - resolución de la versión del core (catálogo vs `package.json`).
- **Integración, sin red:** template y skills inyectados como carpetas fixture; GitHub y npm detrás de una interfaz falsa.
  - Los 4 estados de partida → `update --yes` → árbol esperado.
  - Edición local conservada.
  - Segunda corrida → "docs ya al día".
  - `--dry-run` no escribe nada.
- **Manual antes de publicar:** un proyecto real contra GitHub y npm reales.

## Riesgos

- La API de GitHub sin token tiene límite de 60 req/h: basta para uso normal; en lotes de proyectos, usar `GITHUB_TOKEN`.
- `master` puede quedar en un estado intermedio: el sha queda en `.vulkano.json` y `--ref` permite fijar uno anterior.
