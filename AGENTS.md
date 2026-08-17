# Default communication

- Use Caveman mode (if the skill is available): use the fewest tokens possible.
- No explanations unless explicitly asked for.
- Zero pleasantries, greetings, sign-offs, or filler.
- Ultra-short, direct sentences.

---

## What this project is

This is the **Vulkano Framework** — the full-stack app template built on top of `@vulkano/core`. It combines an Express MVC backend with a Vue 3 frontend, bundled by Vite. It is the starting point for new Vulkano-based applications.

- **Backend**: `@vulkano/core` (Express, Mongoose, Socket.io, JWT, i18n)
- **Frontend**: Vue 3 + Vue Router, bundled by Vite Plus
- **Package manager**: `pnpm`
- **Node**: `>=22`

See [ARCHITECTURE.md](ARCHITECTURE.md) for the project structure, routing conventions, and controller/model/response conventions.

**Read every `.md` file referenced from this one** (`ARCHITECTURE.md`, `README.md`, and any other linked doc) before starting work — don't rely on filenames or prior memory of their contents, conventions in them change. This includes [`@vulkano/core`'s own README](node_modules/@vulkano/core/README.md) — it's the source of truth for routing, controllers, models, and JWT auth (see [ARCHITECTURE.md § Backend conventions](ARCHITECTURE.md#backend-conventions--owned-by-vulkanocore)), not optional background reading.

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
VITE_CHUNK_NAMES=false
# VITE_HOST=192.168.x.x   # optional — forces a specific dev-server host; unset uses auto LAN detection
```

## Code principles — DRY, KISS, divide and conquer

- **DRY**: don't repeat code blocks — extract reusable functions/components instead of copy-pasting.
- **KISS**: write simple code a human understands fast. Avoid clever tricks and long functions. Use clear names for variables and functions.
- **Divide and conquer**: keep components small, each doing one task. Split large components into smaller pieces rather than growing one file.
- **Separate logic from view**: within a component/view, split `.vue` (template), `.js` (logic), and `.scss` (styles) as their own files — see [ARCHITECTURE.md](ARCHITECTURE.md#component-convention--vue--js-pairing).

## Security considerations

- Never commit credentials, API keys, tokens, private keys, or production configuration values. Treat untracked local configuration as sensitive unless a tracked authority explicitly says otherwise.
- Treat request data as untrusted. Validate the expected type, range, and business rules at the boundary; filtering alone is not authorization or a substitute for context-appropriate output escaping.
- Enforce authentication and authorization for every protected action or resource. Do not rely on routes, navigation, or client-side controls as the access boundary; verify the relevant source and tests when changing it.
- Escape dynamic view output for its rendered context, and avoid exposing sensitive values in responses, exceptions, fixtures, or logs like passwords and API keys, etc.
- Treat changes to `package.json` and `pnpm-lock.yaml` as security sensitive. Keep versions compatible with the tracked Node requirement (`>=22`), review the dependency's purpose and maintenance status, and do not prescribe vulnerability-scanning commands without tracked support.
- When implementing authentication: use a dedicated `Auth`/`User` model — don't bolt login logic onto an unrelated model. Route login/logout/session-check through their own controller (e.g. `AuthController`, following the core's `login`/`logout`/`me` action convention — see [ARCHITECTURE.md](ARCHITECTURE.md#authentication)). On successful login, set the session token as an `httpOnly` cookie, not `localStorage`/`sessionStorage` or a plain response body field — client-readable storage is exposed to XSS.
- Never store user data (profile, role, etc.) in `localStorage`/`sessionStorage` either — same XSS exposure as the token. After login, fetch the current user via `GET /api/auth/me` (or `/api/auth/current`), and re-fetch it on every route change (router guard) instead of caching it client-side.

## Visual verification (frontend)

For `client/` changes, don't just read the diff — look at it running. If the `chrome-devtools` MCP is available, use it: check first whether the port (`8000`/`$PORT`) is already in use — if it's this project already running (the user may have started it themselves), navigate straight to it, don't restart it, and ask the user first if you're unsure whether it's safe to touch. If it's a different, unrelated project holding that port, don't kill it — start this one with `PORT=<alt> pnpm run dev` for the check instead. Navigate, take a screenshot, and check the console/network tab for new errors. Stop only the dev server you started yourself once you're done — never a server you didn't start. This is how you catch layout, styling, and runtime issues that a type-check or `vp check` can't — treat it as part of verifying the change, not an optional extra.

## Safety boundaries

- CSS units: use `rem`, `px`, `dvh`, `vw`, or `%` only — no `ch`, `em`, `vh` (use `dvh`), or other units. `ch` in particular renders inconsistently across the font stacks a host page might cascade in.
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
- [ ] For `client/` changes, the frontend was checked visually in a browser (`chrome-devtools` MCP if available) — see [Visual verification](#visual-verification-frontend).
- [ ] Public behavior, routes, and compatibility risks are called out explicitly.
- [ ] The final diff contains no accidental whitespace or generated artifacts.
- [ ] No `require(...)` of a project model or service (`app/models/`, `app/services/`) — both are auto-loaded as globals; reference them by name directly (e.g. `User`, `Project`) instead.

## UI components — shadcn-vue

Tailwind + shadcn-vue live isolated in `client/components/ui/`, separate from the project's `.scss`/BEM convention (see [ARCHITECTURE.md](ARCHITECTURE.md)). Everything outside that folder stays plain `.scss` — do not introduce Tailwind utility classes elsewhere.

Setup, for reference:

- `components.json` (repo root) is the shadcn-vue CLI config — `aliases` point at `@client/components/ui`.
- `client/components/ui/tailwind.css` is the isolated Tailwind entry: `source(none)` + `@source './**/*.{vue,js}'` scopes scanning to that folder only, `prefix(tw)` namespaces every utility class (`tw-flex`, `tw-p-4`, ...) so nothing collides with existing BEM classes. It is imported once, directly in `client/app.js` — not chained through `client/style.scss`.
- `client/components/ui/lib/utils.js` exports `cn()` (clsx + tailwind-merge), the standard shadcn helper for merging class strings.

To add a component:

```
pnpm dlx shadcn-vue@latest add <component>
```

The CLI reads `components.json` and drops the component into `client/components/ui/<component>/`. After adding, import it with the `tw-` prefixed classes it ships with — don't strip the prefix. Run `vp build` once to confirm the new classes made it into the compiled CSS.

<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.

<!--VITE PLUS END-->
