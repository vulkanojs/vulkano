## What this project is

This is the **Vulkano Framework** — the full-stack app template built on top of `@vulkano/core`. It combines an Express MVC backend with a Vue 3 frontend, bundled by Vite. It is the starting point for new Vulkano-based applications.

- **Backend**: `@vulkano/core` (Express, Mongoose, Socket.io, JWT, i18n)
- **Frontend**: Vue 3 + Vue Router, bundled by Vite Plus
- **Package manager**: `pnpm`
- **Node**: `>=22`

See [ARCHITECTURE.md](ARCHITECTURE.md) for the project structure, routing conventions, and controller/model/response conventions.

---

## Quick workflow

1. Inspect the affected files and nearby code before editing — check whether the change touches `app/` (backend), `client/` (frontend), or both.
2. Record existing worktree changes (`git status`) and leave unrelated files untouched.
3. Make the smallest change that satisfies the task while following the conventions in [ARCHITECTURE.md](ARCHITECTURE.md) (thin controllers, business logic in models, convention-based routing).
4. Run `vp check` and `vp test` for the affected boundary before considering the task done.
5. Review changed paths and diff quality before handing off the work.

---

## Environment variables

```
PORT=8000
HOST=localhost
MONGO_URI=mongodb://localhost:27017/myapp
SALT_KEY=random-string
JWT_SECRET=supersecret
VITE_HOST=localhost
VITE_CHUNK_NAMES=false
```

## Security considerations

- Never commit credentials, API keys, tokens, private keys, or production configuration values. Treat untracked local  configuration as sensitive unless   a tracked authority explicitly says otherwise.
- Treat request data as untrusted. Validate the expected type, range, and business rules at the boundary; filtering alone is not authorization or a substitute for context-appropriate output escaping.
- Enforce authentication and authorization for every protected action or resource. Do not rely on routes, navigation, or client-side controls as the access boundary; verify the relevant source and tests when changing it.
- Escape dynamic view output for its rendered context, and avoid exposing sensitive values in responses, exceptions, fixtures, or logs like passwords and API keys, etc.
- Treat changes to `package.json` and `pnpm-lock.yaml` as security sensitive. Keep versions compatible with the tracked Node requirement (`>=22`), review the dependency's purpose and maintenance status, and do not prescribe vulnerability-scanning commands without tracked support.

## Safety boundaries

- Keep the edit set targeted; do not overwrite, clean up, or reformat unrelated worktree changes.
- Do not silently change public APIs, controller/model contracts, or compatibility requirements — call these out explicitly.
- Never claim a tool, script, or command is supported merely because it's conventional; require evidence in `package.json`, `vite.config.js`, or another tracked config file.
- Avoid source-mutating formatters or normalizers beyond what `vp check` already runs, unless the task requires it.
- Do not duplicate large manuals here — link to [ARCHITECTURE.md](ARCHITECTURE.md) or `@vulkano/core/examples/` for reference implementations instead of copying them wholesale.

## Before handoff checklist

- [ ] The changed paths match the requested scope.
- [ ] Existing unrelated changes in the worktree remain untouched.
- [ ] Every documented command or convention claim has a tracked authority (`package.json`, `vite.config.js`, this file, `ARCHITECTURE.md`).
- [ ] For backend (`app/`) changes with no automated test coverage, the server was started (`pnpm dev` / `pnpm start`) and the affected endpoints/controllers were verified manually.
- [ ] Public behavior, routes, and compatibility risks are called out explicitly.
- [ ] The final diff contains no accidental whitespace or generated artifacts.

<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.

<!--VITE PLUS END-->
