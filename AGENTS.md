# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Default communication

- Use Caveman mode (if the skill is available): use the fewest tokens possible.
- No explanations unless explicitly asked for.
- Zero pleasantries, greetings, sign-offs, or filler.
- Ultra-short, direct sentences.
- Use the `superpowers` skill (brainstorming, writing-plans) for planning and specs before multi-step work — output goes under `.claude/superpowers/plans/` and `.claude/superpowers/specs/`.
- Implement plans one task at a time (`superpowers:executing-plans`): after each task, mark it done in the plan file and note which task is next, then clear the conversation or start a new session. On "continue"/"next task", read the plan file's status first to know exactly where to resume.
- If `caveman` or `superpowers` skills aren't installed/available, tell the user and recommend installing them.

---

## What this project is

This is the **Vulkano Framework** — the full-stack app template built on top of `@vulkano/core`. It combines an Express MVC backend with a Vue 3 frontend, bundled by Vite. It is the starting point for new Vulkano-based applications.

- **Backend**: `@vulkano/core` (Express, Mongoose, Socket.io, JWT, i18n)
- **Frontend**: Vue 3 + Vue Router, bundled by Vite Plus
- **Package manager**: `pnpm`
- **Node**: `>=22`

`docs/COVERAGE.md` is a structural, management-level snapshot of core-level capabilities/configuration — it is **not** part of the list below, don't read it for routine controller/model/view/component work. Update it only when a task adds/changes/removes something at the core level (new entry point, new `app/config/express/*.js`/`middlewares/*.js` file, new deployment mechanism, testing convention change, etc.) — see [COVERAGE.md](docs/COVERAGE.md#maintenance).

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the project structure, routing conventions, and controller/model/response conventions. See [docs/TESTING.md](docs/TESTING.md) for the test convention — every new/changed controller, model, service, or middleware gets a test, and `TEST_MONGO_URI` must be set before running `vp test` at all. See [docs/ANALYTICS.md](docs/ANALYTICS.md) for the tracking convention — every project tracks analytics unless the user explicitly opts out. See [docs/ACCESSIBILITY.md](docs/ACCESSIBILITY.md) for the accessibility minimums — every project meets them unless the user explicitly opts out. See [docs/SEO.md](docs/SEO.md) for the SEO convention — backend server-rendered views are the crawlable surface, the Vue SPA is not (no SSR/prerendering) — every project follows it unless the user explicitly opts out.

### Project requirements — SEO / Analytics / Accessibility

A single Vulkano project can have several entry points/areas at once (e.g. a public front — landing + form — plus a separate CMS/admin area, each its own Vue app/Vite entry/backend layout — see [docs/ARCHITECTURE.md § Multiple entry points](docs/ARCHITECTURE.md#multiple-entry-points--front--cms-or-any-other-split-app)) — decide **per area**, not once for the whole project. SEO in particular only ever applies to the public/crawlable area(s); a CMS/admin area is never a SEO target even when the front next to it has SEO on.

On the first task touching a new area (no row for it yet in the table below), ask the user what that area is — landing page, landing + form, multi-page website, blog, embeddable widget, or CMS/admin panel — then set that row from the mapping instead of asking about SEO/Analytics/Accessibility one by one:

- **Landing / landing + form / website / blog** (public, crawlable pages) → SEO on, Analytics on, Accessibility on.
- **Embeddable widget** (mounts inside someone else's page, no page of its own to index) → SEO off, Accessibility on; Analytics — ask the user whether they want usage tracking (clicks, conversions) on the widget itself, don't assume off.
- **CMS / admin panel** (internal, logged-in tool) → SEO off, Analytics off, Accessibility on.
- Anything that doesn't fit cleanly: ask directly which of the three apply.

Show the user the resulting row so they can correct it before proceeding. From then on, treat this table as the answer and don't ask again for that area:

| Area (path/entry point) | SEO | Analytics | Accessibility |
| ------------------------ | --- | --------- | -------------- |
| _(none recorded yet)_     |     |           |                |

A blank/missing area means: not decided yet, ask on first touch. Marking an area's column "off" means: skip that doc entirely (don't read it, don't apply its checklist) for work scoped to that area — [docs/SEO.md](docs/SEO.md), [docs/ANALYTICS.md](docs/ANALYTICS.md), [docs/ACCESSIBILITY.md](docs/ACCESSIBILITY.md).

**Read every `.md` file referenced from this one** (`docs/ARCHITECTURE.md`, `docs/TESTING.md`, `docs/ANALYTICS.md`, `docs/ACCESSIBILITY.md`, `docs/SEO.md`, `README.md`, and any other linked doc), except any unchecked above, before starting work — don't rely on filenames or prior memory of their contents, conventions in them change. This includes [`@vulkano/core`'s own README](node_modules/@vulkano/core/README.md) — it's the source of truth for routing, controllers, models, and JWT auth (see [docs/BACKEND.md § Backend conventions](docs/BACKEND.md#backend-conventions--owned-by-vulkanocore)), not optional background reading.

---

## Quick workflow

1. Inspect the affected files and nearby code before editing — check whether the change touches `app/` (backend), `client/` (frontend), or both.
2. Record existing worktree changes (`git status`) and leave unrelated files untouched.
3. Make the smallest change that satisfies the task while following the conventions in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) (thin controllers, business logic in models, convention-based routing).
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
- **Separate logic from view**: within a component/view, split `.vue` (template), `.js` (logic), and `.scss` (styles) as their own files — see [docs/FRONTEND.md](docs/FRONTEND.md#component-convention--vue--js-pairing).

## Security considerations

- Never commit credentials, API keys, tokens, private keys, or production configuration values. Treat untracked local configuration as sensitive unless a tracked authority explicitly says otherwise.
- Treat request data as untrusted. Validate the expected type, range, and business rules at the boundary; filtering alone is not authorization or a substitute for context-appropriate output escaping.
- Enforce authentication and authorization for every protected action or resource. Do not rely on routes, navigation, or client-side controls as the access boundary; verify the relevant source and tests when changing it.
- Escape dynamic view output for its rendered context, and avoid exposing sensitive values in responses, exceptions, fixtures, or logs like passwords and API keys, etc.
- Treat changes to `package.json` and `pnpm-lock.yaml` as security sensitive. Keep versions compatible with the tracked Node requirement (`>=22`), review the dependency's purpose and maintenance status, and do not prescribe vulnerability-scanning commands without tracked support.
- When implementing authentication: use a dedicated `Auth`/`User` model — don't bolt login logic onto an unrelated model. Route login/logout/session-check through their own controller (e.g. `AuthController`, following the core's `login`/`logout`/`me` action convention — see [docs/BACKEND.md § Authentication](docs/BACKEND.md#authentication)). On successful login, set the session token as an `httpOnly` cookie, not `localStorage`/`sessionStorage` or a plain response body field — client-readable storage is exposed to XSS.
- Never store user data (profile, role, etc.) in `localStorage`/`sessionStorage` either — same XSS exposure as the token. After login, fetch the current user via `GET /api/auth/me` (or `/api/auth/current`), and re-fetch it on every route change (router guard) instead of caching it client-side.

## Form fields (frontend)

- Every required field must show a red asterisk (`*`) next to its label — visual cue, not just native `required`. Reuse a shared `.field-required` (or equivalent BEM element) style with `color: var(--color-danger-500)` instead of hardcoding red per view.
- Never rely on native HTML5 form *validation UI* (`required`/`:invalid` browser styling, error bubbles) — it can't be styled consistently across browsers/OSes and breaks the design system. Always validate in JS instead: `novalidate` on the `<form>`, a per-field error string in component state, error message rendered inline below the field (see `client/views/Login/` for the reference pattern: `novalidate`, `fieldErrors` reactive object, `<span class="*__field-error">` under the input, `*__input--invalid` class for the red border).
- Still set the correct `type` on every `<input>` (`email`, `number`, `date`, `range`, `tel`, …) — this is about semantics/mobile keyboard/a11y, not the validation-UI point above, and stays required even though native validation bubbles are suppressed.
- `type="date"`'s native picker UI can't be restyled and varies across browsers/OSes — acceptable for low-stakes internal forms, but views already carrying the redesign should use a shadcn-vue date-picker (`pnpm dlx shadcn-vue add calendar` + `popover`, not yet installed in `client/components/ui/`) instead, for visual consistency with the rest of the design system.

## Frontend assets (images, fonts, files)

- Static frontend assets (images, fonts, downloadable files) live directly in `public/` (`public/img/`, `public/fonts/`, `public/files/`) — not under `client/`, and not pulled through the Vite bundler via `@client`/relative `import`/`src="@client/..."`.
- Reference them by absolute path from the app root: `/img/<name>.webp`, `/fonts/<name>.woff2`, `/files/<name>`. Same in CSS `url(...)`.
- Namespace per feature when a design drops multiple files at once (e.g. `public/img/<section>/background.webp`) to avoid collisions in the flat `public/img/` root.
- Optimize photographic images to `.webp` first via `scripts/inbox-webp.js` (drop source in `inbox/`, run the script, move the `.webp` output into `public/`).

## Microinteractions (frontend)

- Every async action (fetch, submit, delete) needs a `loading` state: spinner/skeleton, disabled or `--loading` button state, visual feedback while waiting for the response.
- Interactive elements (buttons, table rows, cards, links) need hover/rollover: subtle color/shadow/scale transition, never an abrupt change.
- State transitions (modal/toast/dropdown/error appearing or disappearing) use a short `transition`/`animation` (~150-250ms), no instant jump.
- Reuse shared utilities (`.is-loading`, transition mixins in `_index.scss` or design tokens) instead of repeating the animation per view — see [Code principles](#code-principles--dry-kiss-divide-and-conquer).
- For polished/complex animations (staggered lists, timeline sequences, scroll-triggered effects) CSS transitions can't cleanly express, GSAP is allowed — not yet a dependency, install with `pnpm add gsap` before first use and call this out explicitly in the diff.
- For scroll-reveal effects (fade/slide-in as elements enter viewport), AOS is allowed — not yet a dependency, install with `pnpm add aos` before first use and call this out explicitly in the diff.

## Visual verification (frontend)

For `client/` changes, don't just read the diff — look at it running. The `chrome-devtools` MCP is the recommended tool for this — prefer it over other browser MCPs (e.g. `claude-in-chrome`) when both are available: its screenshots and page snapshots surface in the conversation, so the user sees the actual work being verified, not just a text confirmation. If it's available, use it: check first whether the port (`8000`/`$PORT`) is already in use — if it's this project already running (the user may have started it themselves), navigate straight to it, don't restart it, and ask the user first if you're unsure whether it's safe to touch. If it's a different, unrelated project holding that port, don't kill it — start this one with `PORT=<alt> pnpm run dev` for the check instead. Navigate, take a screenshot, and check the console/network tab for new errors. Stop only the dev server you started yourself once you're done — never a server you didn't start. This is how you catch layout, styling, and runtime issues that a type-check or `vp check` can't — treat it as part of verifying the change, not an optional extra.

**Testing from a phone/other LAN device (`http://<VITE_HOST>:8000`)** — if the page loads but assets/HMR fail with connection errors pointing at `localhost` instead of the LAN IP: `@vulkano/core` reads the Vite dev manifest (`public/.vite/manifest.development.json`, written by `vite-plugin-dev-manifest`) into `app.vite` **once, at Express boot** (`Vite.init()`), then caches it in memory for the life of the process. If the backend started before `VITE_HOST` was set or before Vite wrote the manifest with the correct LAN URL, `app.vite.url` stays stale — and stays stale even after the manifest file on disk is fixed, since `nodemon.json` ignores `client/` and never restarts Express for it. Fix: `touch app.js` (or otherwise trigger nodemon) to force a backend restart and re-read the manifest — don't chase this as a frontend/network bug first.

**On WSL**: `VITE_HOST` must be the Windows host's LAN IP, not the WSL/Ubuntu internal IP (`ip addr show eth0` inside WSL gives an address only reachable from the Windows host itself, not from other LAN devices). Get the right one from Windows (`ipconfig`, the adapter actually on the LAN/Wi-Fi) — a phone or other device connecting to the WSL-internal IP will fail the same way regardless of the manifest/restart fix above.

## Safety boundaries

- CSS units: use `rem`, `px`, `dvh`, `vw`, or `%` only — no `ch`, `em`, `vh` (use `dvh`), or other units. `ch` in particular renders inconsistently across the font stacks a host page might cascade in.
- Keep the edit set targeted; do not overwrite, clean up, or reformat unrelated worktree changes.
- Do not silently change public APIs, controller/model contracts, or compatibility requirements — call these out explicitly.
- Never claim a tool, script, or command is supported merely because it's conventional; require evidence in `package.json`, `vite.config.js`, or another tracked config file.
- Avoid source-mutating formatters or normalizers beyond what `vp check` already runs, unless the task requires it.
- Do not duplicate large manuals here — link to [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) or `@vulkano/core/examples/` for reference implementations instead of copying them wholesale.

## Before handoff checklist

- [ ] The changed paths match the requested scope.
- [ ] Existing unrelated changes in the worktree remain untouched.
- [ ] Every documented command or convention claim has a tracked authority (`package.json`, `vite.config.js`, this file, `docs/ARCHITECTURE.md`).
- [ ] For backend (`app/`) changes with no automated test coverage, the server was started (`pnpm dev` / `pnpm start`) and the affected endpoints/controllers were verified manually.
- [ ] For `client/` changes, the frontend was checked visually in a browser (`chrome-devtools` MCP if available) — see [Visual verification](#visual-verification-frontend).
- [ ] Public behavior, routes, and compatibility risks are called out explicitly.
- [ ] The final diff contains no accidental whitespace or generated artifacts.
- [ ] No `require(...)` of a project model or service (`app/models/`, `app/services/`) — both are auto-loaded as globals; reference them by name directly (e.g. `User`, `Project`) instead.
- [ ] For frontend changes involving user interaction (form, button, download, video, page), analytics tracking was added per [docs/ANALYTICS.md](docs/ANALYTICS.md), or the user explicitly confirmed tracking is not required for this task.
- [ ] For frontend changes involving images, navigation, or forms, accessibility minimums per [docs/ACCESSIBILITY.md](docs/ACCESSIBILITY.md) were met, or the user explicitly confirmed accessibility is not required for this task.
- [ ] For new public/crawlable pages, SEO essentials per [docs/SEO.md](docs/SEO.md) (backend view, meta tags, sitemap entry) were met, or the user explicitly confirmed SEO is not required for this task.

## UI components — shadcn-vue (not installed yet)

**Not currently a dependency of this project** — see [docs/FRONTEND.md § Tailwind + shadcn-vue](docs/FRONTEND.md#tailwind--shadcn-vue--not-installed-note-for-future). Only bring it in when a task actually needs pre-built accessible components (dialogs, dropdowns, etc.). When that need comes up:

- Install Tailwind (`tailwindcss` + `@tailwindcss/vite`) and shadcn-vue's CLI dependencies (`reka-ui`, `class-variance-authority`, `clsx`, `tailwind-merge`) first, then run `pnpm dlx shadcn-vue@latest init` to scaffold `components.json` (repo root) and `client/components/ui/`.
- Keep Tailwind + shadcn-vue isolated in `client/components/ui/`, separate from the project's `.scss`/BEM convention (see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)). Everything outside that folder stays plain `.scss` — do not introduce Tailwind utility classes elsewhere.
- Scope the Tailwind entry to that folder only (`source(none)` + `@source './**/*.{vue,js}'`) and prefix every utility class (`prefix(tw)` → `tw-flex`, `tw-p-4`, ...) so nothing collides with existing BEM classes. Import it once, directly in `client/app.js` — not chained through `client/style.scss`.
- Add the shadcn `cn()` helper (clsx + tailwind-merge) under `client/components/ui/lib/utils.js`, the standard shadcn convention for merging class strings.

The isolation is about styling method only (Tailwind utilities vs. SCSS/BEM) — it does **not** exempt `ui/` from the project's logic/template/style separation ([docs/FRONTEND.md § Component convention](docs/FRONTEND.md#component-convention--vue--js-pairing)). This applies to any external component library vendored into the codebase, not just shadcn-vue — whatever CLI or copy-paste source generates it, split it before committing: `Component.vue` (template only) and `Component.js` (logic, imported via `<script src="./Component.js">`); styling stays inline as the library's own classes in the `.vue` file (no `_index.scss` needed where there's no BEM to aggregate). The shadcn-vue CLI in particular scaffolds a single `.vue` file with an inline `<script setup>` block — after running `pnpm dlx shadcn-vue add <component>`, manually extract that block into a sibling `Component.js` and point the `.vue` file at it before committing.

To add a component once shadcn-vue is set up:

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
