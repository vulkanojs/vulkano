# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@PROJECT.md

## What this framework is

Vulkano Framework project — full-stack app built on `@vulkano/core`: Express MVC backend + Vue 3 / vanilla JS frontend, bundled by Vite.

See [PROJECT.md](PROJECT.md) for this project's name/purpose and project-level overrides — the only file a template update never touches, and the only place project-specific facts belong. Never write project name, purpose, or project decisions into this file — put them in PROJECT.md instead, so pulling a newer AGENTS.md from the template stays a clean overwrite.

# Default communication

- No explanations unless explicitly asked for.
- Zero pleasantries, greetings, sign-offs, or filler.
- Ultra-short, direct sentences.
- All user-facing text — including `AskUserQuestion` questions, option labels, and descriptions — must be in Spanish or English only, never another language.
- Use Caveman mode (if the skill is available): use the fewest tokens possible.
- Use the `superpowers` skill (brainstorming, writing-plans) for planning and specs before multi-step work — read `references/AGENTS/WORKFLOW.md` § Plans first (output paths under `.superpowers/`, one task at a time, framework skills inside a plan).
- If `caveman` or `superpowers` skills aren't installed/available, tell the user and recommend installing them.

---

## Git

Before any `git` action (commit, push, branch, reset, etc.) — read `references/AGENTS/WORKFLOW.md` § Git first.

---

## Area conventions

Skills under `.claude/skills/vulkano-skills/` hold the worked code and load automatically when the task matches — invoke the matching one. `references/AGENTS/` holds the rules; read the doc for the area you touch:

- Unsure where something lives, or creating a file/folder — `references/AGENTS/ARCHITECTURE.md`.
- Touching `app/` (controllers, scaffold, models, auth, views, autoload/libraries, config, routes, SEO wiring) — `references/AGENTS/BACKEND.md`. Core details it doesn't cover: [`@vulkano/core`'s README](node_modules/@vulkano/core/README.md) — search the section, don't read it whole.
- Touching `frontend/` (components, UI library, store, forms, routes, CSS, microinteractions, assets, analytics wiring) — `references/AGENTS/FRONTEND.md`.
- New page a browser opens directly (landing, "about", blog post, product) — BACKEND.md § Views + skill `vulkano-backend-views` **first**: `res.render`, not a Vue SPA route (the SPA isn't crawlable). Then BACKEND.md § SEO wiring.
- Creating/renaming/removing a frontend entrypoint, or editing `vite.config.mjs`, `vite.entries.mjs`, or a `vite()` call — `references/AGENTS/BUILD.md`.
- Adds/changes a controller, model, service, middleware, or a `frontend/<entrypoint>/store/`, `composables/`, `utils/` file — it needs a test: skill `vulkano-testing`.
- Verifying UI in a browser — `references/AGENTS/DEVTOOLS.md`.

## Environment variables

Adding/reading a new `.env` variable, or setting up a project's `.env` for the first time — read `.env.example` first (every variable is documented there; `.env` is a copy of it).

---

## Quick workflow

1. Inspect the affected files and nearby code before editing — check whether the change touches `app/` (backend), `frontend/` (frontend), or both.
2. Record existing worktree changes (`git status`) and leave unrelated files untouched.
3. Make the smallest change that satisfies the task following convention:
   - for `app/` (backend): thin controllers, business logic in models, convention-based routing.
   - for `frontend/`: component split (`.vue`/`.js`/`.scss`), business logic in composables/store, convention-based routing.
4. Run `vp check` and `vp test` for the affected boundary before considering the task done.
5. Review changed paths and diff quality before handing off the work.

---

## Code principles — DRY, KISS, divide and conquer

- **DRY**: don't repeat code blocks — extract reusable functions/components instead of copy-pasting.
- **KISS**: write simple code a human understands fast. Avoid clever tricks and long functions. Use clear names for variables and functions.
- **Divide and conquer**: keep components small, each doing one task. Split large components into smaller pieces rather than growing one file.
- **Unused variables — prefix with `_`** (front and back, any language): an intentionally unused parameter/binding gets a `_` prefix so `no-unused-vars` doesn't flag it, e.g. `catch (_err) {`.

## Security considerations

- Never commit credentials, API keys, tokens, private keys, or production configuration values. Treat untracked local configuration as sensitive unless a tracked authority explicitly says otherwise.
- Treat request data as untrusted. Validate the expected type, range, and business rules at the boundary; filtering alone is not authorization or a substitute for context-appropriate output escaping.
- Enforce authentication and authorization for every protected action or resource. Do not rely on routes, navigation, or client-side controls as the access boundary; verify the relevant source and tests when changing it.
- Treat changes to `package.json` and `pnpm-lock.yaml` as security sensitive. Keep versions compatible with the tracked Node requirement (`>=24`), review the dependency's purpose and maintenance status, and do not prescribe vulnerability-scanning commands without tracked support.

## Safety boundaries

- Keep the edit set targeted; do not overwrite, clean up, or reformat unrelated worktree changes.
- Do only what was asked. If the user says they will build a piece themselves (an endpoint, a migration, a page), do not build it — note the expected contract in the handoff instead.
- Do not silently change public APIs, controller/model contracts, or compatibility requirements — call these out explicitly.
- Never claim a tool, script, or command is supported merely because it's conventional; require evidence in `package.json`, `vite.config.mjs`, or another tracked config file.
- Avoid source-mutating formatters or normalizers beyond what `vp check` already runs, unless the task requires it.
- Local search commands (`find`, `grep`, `rg`, `ag`): scope to relative/project paths (`find ./ ...`), never absolute root (`find / ...`).

## Minimum rules (if `references/` or the skills are missing)

Only when `references/AGENTS/` and `.claude/skills/vulkano-skills/` don't exist — otherwise the docs and skills above win.

- Never `window.confirm`/`alert`/`prompt`: use the installed UI library's confirm/message components; none installed → one shared, reusable confirm component.
- Forms: JS-only validation through the shared `useFormValidation` composable (`fieldErrors`), never native browser validation; mark required fields with an asterisk.
- Controllers stay thin: nothing top-level besides `require`/import and the exported object — no consts or helper functions. Logic goes in the model or `app/services/`.
- New frontend entrypoint: scoped backend catch-all `'/<name>/*'` in `app/config/routes.js` before `'/*'`, a `NotFound` route in the frontend, and `createWebHistory('/<name>')`.
- Tests mirror the source path under `test/` (`test/app/controllers/<Name>.http.test.js`, `test/app/models/<Name>.test.js`).
- CSS: CSS Grid, no Flexbox; `rem` only where `value × 16` is a whole pixel (`0.25`, `0.375`, `0.5`, `0.625`, `0.75`, `0.875`, `1`, `1.125`, `1.25`…); never `em`, `vh`, `ch`.
- Adding auth: set a non-empty `JWT_SECRET_KEY` in `.env` (empty → login returns 500). Never print or commit it.
- Unused variables keep the `_` prefix (see Code principles).

## Before handoff checklist

- The changed paths match the requested scope.
- Existing unrelated changes in the worktree remain untouched.
- Public behavior, routes, and compatibility risks are called out explicitly.
- The final diff contains no accidental whitespace or generated artifacts.
