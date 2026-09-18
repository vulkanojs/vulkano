# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@PROJECT.md

## What this framework is

Vulkano Framework project — full-stack app built on `@vulkano/core`: Express MVC backend + Vue 3 / vanilla JS frontend, bundled by Vite.

See [PROJECT.md](PROJECT.md) for this project's name/purpose and its per-area SEO/Analytics/Accessibility settings — the only file a template update never touches, and the only place project-specific facts belong. Never write project name, purpose, or per-area decisions into this file — put them in PROJECT.md instead, so pulling a newer AGENTS.md from the template stays a clean overwrite.

# Default communication

- No explanations unless explicitly asked for.
- Zero pleasantries, greetings, sign-offs, or filler.
- Ultra-short, direct sentences.
- All user-facing text — including `AskUserQuestion` questions, option labels, and descriptions — must be in Spanish or English only, never another language.
- Use Caveman mode (if the skill is available): use the fewest tokens possible.
- Use the `superpowers` skill (brainstorming, writing-plans) for planning and specs before multi-step work — read `references/AGENTS/PLANS.md` first (output paths under `.superpowers/`, one task at a time, framework skills inside a plan).
- If `caveman` or `superpowers` skills aren't installed/available, tell the user and recommend installing them.

---

## Git

Before any `git` action (commit, push, branch, reset, etc.) — read `references/AGENTS/GIT.md` first.

---

## Area conventions

- Touching `app/` (backend) — read `references/AGENTS/ARCHITECTURE.md`, `references/AGENTS/BACKEND.md`, and [`@vulkano/core`'s own README](node_modules/@vulkano/core/README.md) first (project structure, code principles, security, handoff checklist — core README is the source of truth for routing/controllers/models/JWT auth, not optional background reading).
- Touching `frontend/` — read `references/AGENTS/ARCHITECTURE.md` and `references/AGENTS/FRONTEND.md` first (project structure, code principles, security, UI components, forms, microinteractions, safety boundaries, handoff checklist).
- Adds/changes a controller, model, service, or middleware — also read `references/AGENTS/TESTING.md`.
- Adds/changes a `frontend/<entrypoint>/store/`, `composables/`, or `utils/` file — also read `references/AGENTS/TESTING.md`.
- Adds/edits a Pinia store (`frontend/<entrypoint>/store/`) — also read `references/AGENTS/STORE.md`.
- Adds/edits a route (`frontend/<entrypoint>/routes.js` or `app/config/routes.js`) — also read `references/AGENTS/ROUTING.md`.
- Creates/renames/removes a frontend entrypoint, or wires its Vite entry, backend layout, or catch-all — also read `references/AGENTS/ENTRYPOINTS.md`.

## Assets

Adding/editing an image, font, or downloadable file (lives in `public/`, referenced from `app/views/` or `frontend/`) — read `references/AGENTS/ASSETS.md` first. Applies to both `app/` and `frontend/` work.

## Environment variables

Adding/reading a new `.env` variable, or setting up a project's `.env` for the first time — read `.env.example` first (every variable is documented there; `.env` is a copy of it).

## Vite / build

Editing `vite.config.mjs`, `vite.entries.mjs`, or a backend template's `vite()` injection call — read `references/AGENTS/VITE.md` first. Applies to both `app/` and `frontend/` work.

## Per-area requirements (SEO / Analytics / Accessibility)

Touching a new entry point/area with no row yet in `PROJECT.md`'s table — read `references/AGENTS/AREAS.md` first.

## Launch

Deploying/launching a project to production — read `references/AGENTS/LAUNCH.md` first.

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
- Do not silently change public APIs, controller/model contracts, or compatibility requirements — call these out explicitly.
- Never claim a tool, script, or command is supported merely because it's conventional; require evidence in `package.json`, `vite.config.mjs`, or another tracked config file.
- Avoid source-mutating formatters or normalizers beyond what `vp check` already runs, unless the task requires it.
- Local search commands (`find`, `grep`, `rg`, `ag`): scope to relative/project paths (`find ./ ...`), never absolute root (`find / ...`).

## Before handoff checklist

- The changed paths match the requested scope.
- Existing unrelated changes in the worktree remain untouched.
- Public behavior, routes, and compatibility risks are called out explicitly.
- The final diff contains no accidental whitespace or generated artifacts.
