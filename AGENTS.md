# AGENTS.md

@PROJECT.md

Vulkano Framework project — full-stack app on `@vulkano/core`: Express MVC backend + Vue 3 / vanilla JS frontend, bundled by Vite. Project name, purpose and decisions live only in [PROJECT.md](PROJECT.md) (never touched by a template update) — never in this file.

## Communication

- No explanations unless asked. No pleasantries or filler. Short, direct sentences.
- User-facing text (including `AskUserQuestion` options) only in Spanish or English.
- Use the `caveman` skill if available. Plan multi-step work with `superpowers` (brainstorming, writing-plans). If either is missing, tell the user and recommend installing it.

## Where to look

Skills under `.claude/skills/vulkano-skills/` hold the worked code and load automatically when the task matches — invoke the matching one. `references/AGENTS/` holds the rules; read the doc for the area you touch:

- Git action, or planning/executing a plan — `references/AGENTS/WORKFLOW.md`.
- Unsure where something lives, or creating a file/folder — `references/AGENTS/ARCHITECTURE.md`.
- Touching `app/` (controllers, scaffold, models, auth, views, autoload/libraries, config, cron, routes, SEO wiring) — `references/AGENTS/BACKEND.md`.
- Touching `frontend/` (components, UI library, store, forms, routes, CSS, microinteractions, assets, analytics wiring) — `references/AGENTS/FRONTEND.md`.
- New page a browser opens directly (landing, "about", blog post, product) — BACKEND.md § Views + skill `vulkano-backend-views` **first**: `res.render`, not a Vue SPA route (the SPA isn't crawlable). Then BACKEND.md § SEO wiring.
- Creating/renaming/removing a frontend entrypoint, or editing `vite.config.ts`, `vite.entries.mjs`, or a `vite()` call — `references/AGENTS/BUILD.md`.
- Adds/changes a controller, model, service, middleware, or a `frontend/<entrypoint>/store/`, `composables/`, `utils/` file — it needs a test: skill `vulkano-testing`.
- Verifying UI in a browser — `references/AGENTS/DEVTOOLS.md`.
- New or changed `.env` variable — `.env.example` first (every variable documented there).
- Deploying — `PROJECT.md` § Deployment; going public flips `SEO_NOINDEX` + `robots.txt` together (BACKEND.md § SEO wiring).

Skills submodule missing → the references are enough; tell the user to run `git submodule update --init`.

## Workflow

1. Inspect the affected files and nearby code; note existing worktree changes (`git status`) and leave them untouched.
2. Make the smallest change that satisfies the task, following the area's conventions. Do only what was asked — if the user will build a piece, note its contract in the handoff instead.
3. Run `vp check` and `vp test` before considering it done.
4. Hand off: changed paths match the scope, no stray whitespace or generated files, and public behavior/routes/API or compatibility changes called out explicitly.

## Code principles

DRY, KISS, small single-purpose units. Intentionally unused variables get a `_` prefix (`catch (_err)`), front and back.

## Security

- Never commit credentials, API keys, tokens, private keys or production config. Treat untracked local config as sensitive.
- Request data is untrusted: validate type, range and business rules at the boundary. Filtering is not authorization.
- Enforce authentication and authorization on every protected action server-side — routes, navigation and client controls are not the boundary.
- `package.json` / `pnpm-lock.yaml` changes are security-sensitive: keep Node `>=24` compatibility, check the dependency's purpose and maintenance.

## Safety

- Never claim a tool, script or command is supported because it's conventional — require evidence in `package.json`, `vite.config.ts` or another tracked config.
- No source-mutating formatters beyond what `vp check` runs, unless the task requires it.
- Local search (`find`, `grep`, `rg`): relative paths (`find ./`), never `find /`.
