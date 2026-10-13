# Frontend (`frontend/`)

Rules only. Worked code lives in the skills named per section — they load automatically when the task matches. Paths are `frontend/<entrypoint>/…` (`website`, `admin`, …).

## Code organization — skill `vulkano-frontend-component`

- Composition API only (`setup()`, `ref`/`reactive`, composables) — never `data()`/`methods`/`created()`.
- `views/` = one folder per route (`/users` → `views/Users/Index.*`, `/system/users` → `views/System/Users/Index.*`). `components/` = reusable pieces.
- Every component/view is split in 3 files: `<Name>.vue` (template), `<Name>.js` (logic), `_index.scss` (styles), and its `_index.scss` is imported by the parent aggregator (`@import './Name/index';`). A long stylesheet splits into partials (`_list.scss`, `_form.scss`) imported by that `_index.scss`.
- Business logic goes in a store or a composable (`composables/useX.js`), not the component. Pure helpers → `utils/`.
- `layouts/` = the SPA's page template (the frontend's `_shared/templates/`): header/nav/footer around `<router-view />`, set as the parent `component` in `routes.js`. One per template variant; views fill the content.
- Composable = reusable component logic, e.g. form validation (`useFormValidation`, skill `vulkano-frontend-form`): `composables/use<Name>.js`, named export, called in `setup()`, returns refs + functions, own state per call. Shared state → store; no reactivity → `utils/`.
- Never import across entrypoints (`@website` from inside `frontend/admin/`).
- API calls: components use `$api` from `getCurrentInstance().proxy`; stores, composables and utils `import Api from '../Api'`, the guard in `routes.js` `from './Api'` (no component instance there — `getCurrentInstance()` is null). `Api.js` prefixes `/api`, unwraps `data` from the `res.vsr` envelope, and on failure rejects with an `Error`: `message` = the backend's `error.detail` (the text the controller/model threw), plus `status` (0 = network), `code`, `name`, `data`. Show `err.message`; branch on `err.status`. Each entrypoint keeps its own `Api.js` — never shared. Entrypoints never share code: no `frontend/shared/`, no import from another entrypoint.

## UI library and reuse

- The library (shadcn-vue, Element Plus, …) is a project choice: `PROJECT.md` § Frontend conventions, else check `package.json`.
- Installed → every input, button, dialog, confirm and toast goes through it. Vendored code lives in `components/ui/`, split like any component, never edited for one screen (compose or extend it).
- `views/DesignSystem/Index.vue` (route `/design-system`, dev only) = the entrypoint's design system page and component catalog — check it before building a new one; add each new reusable component to it.
- Never `window.confirm`/`alert`/`prompt` — use the library's confirm/message components, or one shared custom modal if none is installed.

## Store — skill `vulkano-frontend-store`

- Pinia, setup-style, one store per concern: `store/use<Entity>Store.js`, no barrel file.
- Single exception: `useAppStore` for app-shell state (global loading, socket status, sidebar, theme).
- Store vs `$api`: data read by one view only (a form submit, a detail nothing else reads) → `$api` in that view. Data read by 2+ components/views or kept across navigation (list + filters, cart) → a store, and components call its actions — never `$api` for that same data.
- Never store the user or the token in `localStorage`/`sessionStorage`.

## Forms — skill `vulkano-frontend-form` (load before any `<form>`)

- JS-only validation via the shared `useFormValidation` composable + `utils/validators.js` (`V.required`, …) → `fieldErrors`. `novalidate`; never native validation UI.
- Required labels get an asterisk (shared class + danger color token). Inline error under the input.
- Correct input `type` always. Submit shows a loading state; failure always shows a message.

## Routes — skill `vulkano-frontend-router`

- `frontend/<entrypoint>/routes.js`, hand-written, exports a factory that takes `history`; `app.js` creates it (`createWebHistory('/<base>')` for non-root entrypoints).
- Route path mirrors view folder (kebab-case URL → PascalCase folder). Resource routes: `Product/List.vue` + one `Product/Form.vue` for create and edit.
- Every Vue entrypoint has a `NotFound` route — `:pathMatch(.*)*`, last child of the `Layout` route — paired with its backend catch-all (see BACKEND.md § Routes).
- Auth guard inside the `routes.js` factory. Mixed public/private entrypoint → protected routes carry `meta: { auth: true }` (on the parent `Layout` for a section); entrypoint fully behind login (admin) → guard every route except `/login*`. The guard re-fetches `GET /api/auth/current` on each — never cache the user. The guard is UX; the API enforces auth.

## Design system

- Each entrypoint owns its tokens in `scss/_tokens.scss` (CSS custom properties: `--color-*`, `--font-size-*`, `--space-*`, `--radius-*`, light/dark) and base element styles in `scss/_base.scss` (links, buttons, inputs, `.field-required`). Stylesheets use `var(--token)`, never raw colors or sizes.
- New token → add it to `_tokens.scss` and to the lists in `views/DesignSystem/Index.js` so `/design-system` shows it.
- `/design-system` is registered only when `import.meta.env.DEV`; production builds drop it.

## CSS and layout — skill `vulkano-frontend-css`

- BEM; block name = component folder in kebab-case.
- Layout with CSS Grid, no Flexbox (unless `PROJECT.md` overrides). Grid system: `.row` / `.column small-N medium-N large-N` from `scss/_grid.scss`.
- Units: `rem`, `px`, `dvh`, `vw`, `%`. Never `em`, `vh`, `ch`. A `rem` must equal whole pixels (`value × 16`).

## Design patterns — microinteractions

- Every async action (fetch, submit, delete) has a loading state (disabled button + a loader, e.g. `.is-loading`, spinner or skeleton).
- Every list/fetched view renders 4 states: loading, error (`err.message` + retry), empty (a message, never a blank area), data. Read `data.items` + page metadata — a bare array only when the request sent `?page=all`. Code: skill `vulkano-frontend-component` § List view.
- Hover on interactive elements; `cursor: pointer` on every clickable (`not-allowed` when disabled) — via a shared base style.
- State changes (modal, toast, dropdown, error) animate ~150-250ms, never jump.
- Loaders and transitions are shared utilities: create once (e.g. `.is-loading`, a `flash` transition in `scss/_base.scss`) the first time one is needed, reuse after — no per-view copies.
- Complex sequences → GSAP; scroll reveal → AOS. Neither installed: `pnpm add`, and call out the new dependency.

## Assets

- Images, fonts, downloads live in `public/img|fonts|files/`, referenced by absolute path (`/img/x.webp`) — never imported through Vite or `@<entrypoint>`.
- Namespace per feature (`public/img/<section>/…`). Photos → `.webp` via `pnpm run webp`. Below-the-fold images get `loading="lazy"`.

## Analytics wiring

How to track well = any analytics skill. Where Vulkano wires it: Vue pages → `vue-gtag` (not installed, `pnpm add vue-gtag`); server-rendered pages → `gtag.js` snippet in the layout `<head>`. Provider ID from an env var (e.g. `VITE_GA_ID`, add it to `.env.example`) or hardcoded, as the user prefers. While `SEO_NOINDEX=true` (private mode) tracking still fires — warn the user.

## Before handoff

- New/changed store, composable or util has a test (skill `vulkano-testing`).
- Checked visually in a browser — [DEVTOOLS.md](DEVTOOLS.md).
