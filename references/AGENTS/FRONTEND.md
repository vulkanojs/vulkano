# Frontend (`frontend/`)

See [ARCHITECTURE.md](ARCHITECTURE.md) for the project structure overview and [AGENTS.md](../../AGENTS.md) for workflow/safety rules.

**Component/view layout, routing, forms, analytics, and accessibility are covered by Claude Code skills** — invoke them for detailed conventions and worked code instead of relying on this file alone:

- `.claude/skills/vulkano-skills/vulkano-frontend-component/SKILL.md` — `.vue`/`.js`/`.scss` file splitting, `views/` vs `components/` placement, route↔view naming, installed UI kit
- `.claude/skills/vulkano-skills/vulkano-frontend-router/SKILL.md` — adding routes, resource+action file naming (`Form.vue` for create+edit), the SPA catch-all(s), auth guard/current-user fetching
- `.claude/skills/vulkano-skills/vulkano-frontend-form/SKILL.md` — required-field asterisks, JS-only validation, `fieldErrors` pattern
- `.claude/skills/vulkano-skills/vulkano-frontend-store/SKILL.md` — Pinia store-per-concern, `useAppStore` exception ([STORE.md](STORE.md))
- `.claude/skills/vulkano-skills/vulkano-frontend-css/SKILL.md` — CSS Grid layout, responsive grid system, BEM naming
- `.claude/skills/vulkano-skills/vulkano-frontend-analytics/SKILL.md` — tracking wiring ([ANALYTICS.md](ANALYTICS.md))
- `.claude/skills/vulkano-skills/vulkano-frontend-a11y/SKILL.md` — accessibility minimums ([ACCESSIBILITY.md](ACCESSIBILITY.md))

This file keeps only what those skills don't cover: `$api` usage and the conventions below. Entry point scaffold is in `vulkano-frontend-entrypoint`, Vite config is in [VITE.md](VITE.md).

The `frontend/` folder is a standard Vue 3 SPA wired to the Express backend via `Api.js`. Paths below are written as `frontend/<entrypoint>/...` — `frontend/` is always a container, one subfolder per entrypoint, even with only 1 (`frontend/website/app.js`, `frontend/website/Api.js`, ...); this template ships 2 by default (`website` + `admin`, each with its own subfolder) — see `.claude/skills/vulkano-skills/vulkano-frontend-entrypoint/SKILL.md` for adding a new one. Concrete examples below use `website` since that's this template's current default.

Prefer the **Composition API** (`setup()`, `ref`/`reactive`, composables) over the Options API for new and edited components — do not add new `data()`/`methods`/`created()`-style options blocks.

## Code principles

- **Separate logic from view**: within a component/view, split `.vue` (template), `.js` (logic), and `.scss` (styles) as their own files — see `.claude/skills/vulkano-skills/vulkano-frontend-component/SKILL.md`.

## Entry point — `frontend/<entrypoint>/app.js`

Only touched when creating a new entrypoint or fixing its router base — covered by `.claude/skills/vulkano-skills/vulkano-frontend-entrypoint/SKILL.md` (scaffold, `createWebHistory(base)` requirement) and `.claude/skills/vulkano-skills/vulkano-frontend-router/SKILL.md` § Multiple entry points (why the base must match the backend catch-all's path prefix).

## Routing — adding routes, view naming, SPA catch-all

Adding/editing a route (either side) — see [ROUTING.md](ROUTING.md) first: frontend `routes.js` wiring pointer and the full backend catch-all rule (HTML5-history rationale, scoped multi-entry-point catch-alls). Route↔view naming detail: `.claude/skills/vulkano-skills/vulkano-frontend-router/SKILL.md`.

## Calling the API from a component

`$api` is registered as a global property (`app.config.globalProperties.$api`), not exported as a module — pull it off `getCurrentInstance().proxy` inside `setup()`, don't `import Api from './Api'` directly in components. Worked example: `.claude/skills/vulkano-skills/vulkano-frontend-component/SKILL.md`.

`frontend/<entrypoint>/Api.js` is a thin `fetch` wrapper (no axios): it prefixes requests with `/api`, serializes/parses JSON, unwraps the `data` field from the `res.vsr` envelope, and rejects with the raw `Response` on non-2xx status.

## Component/view file layout

Covered by `.claude/skills/vulkano-skills/vulkano-frontend-component/SKILL.md`: `.vue`/`.js`/`.scss` pairing, `frontend/<entrypoint>/components/` vs `frontend/<entrypoint>/views/` aggregator convention.

## State — `frontend/<entrypoint>/store/`

Adding/editing a Pinia store — see `.claude/skills/vulkano-skills/vulkano-frontend-store/SKILL.md` first ([STORE.md](STORE.md) for the same detail without the submodule): store-per-concern splitting, setup-style `defineStore`, the `useAppStore` app-shell exception, and store testing.

## CSS — layout, units, grid system

Writing/editing `.scss` or page layout — read [CSS.md](CSS.md) first: CSS units and `rem` rules, `display: grid` (not flex) layout, and the Foundation-style responsive grid. Skill: `.claude/skills/vulkano-skills/vulkano-frontend-css/SKILL.md` (CSS Grid layout, BEM naming).

## Vite build/dev config and backend injection

Covered by [VITE.md](VITE.md): `vite.config.mjs` build/dev-server mechanics (output, HMR, manifest, cache hashing) and how a backend template injects a bundle via the `vite()` helper. One alias detail worth repeating here since it's a frontend-authoring mistake, not a config one: never reach across entrypoints through another one's `@<dir>` alias (`@website` from inside `frontend/admin/`).

## Security

- Never store user data (profile, role, etc.) in `localStorage`/`sessionStorage` — client-readable storage is exposed to XSS. After login, fetch the current user via `GET /api/auth/current`, and re-fetch it on every route change (router guard) instead of caching it client-side.

## UI components

Task needs a pre-built UI component (dialog, dropdown, etc.) — see [references/AGENTS/UI.md](UI.md) first: `components/ui/` isolation, component-splitting convention, `views/ui/` styleguide. Library choice lives in `PROJECT.md`, not here.

## Forms

Any `<form>` add/edit — always load the `vulkano-frontend-form` skill first (`.claude/skills/vulkano-skills/vulkano-frontend-form/SKILL.md`): required-field asterisks, JS-only validation via `useFormValidator`, `fieldErrors` pattern, input types, date-picker choice. Don't hand-roll form validation from memory of this note — the skill is the source of truth, load it every time, not just when it "seems needed".

## Microinteractions

Adding/editing a button or clickable element, an async action (fetch, submit, delete), or a transition/animation — read [MICROINTERACTIONS.md](MICROINTERACTIONS.md) first: loading states, hover, `cursor: pointer`, transition timing, GSAP/AOS policy.

## Before handoff checklist

- The frontend was checked visually in a browser (`chrome-devtools` MCP if available) — see [references/AGENTS/DEVTOOLS.md](DEVTOOLS.md).
- For changes involving user interaction (form, button, download, video, page), analytics tracking was added per [references/AGENTS/ANALYTICS.md](ANALYTICS.md), or the user explicitly confirmed tracking is not required for this task.
- For changes involving images, navigation, or forms, accessibility minimums per [references/AGENTS/ACCESSIBILITY.md](ACCESSIBILITY.md) were met, or the user explicitly confirmed accessibility is not required for this task.
- For new public/crawlable pages, SEO essentials per [references/AGENTS/SEO.md](SEO.md) (backend view, meta tags, sitemap entry) were met, or the user explicitly confirmed SEO is not required for this task.
