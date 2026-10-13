# Frontend (`frontend/`)

Rules only. Worked code lives in the skills named per section — they load automatically when the task matches. Paths are `frontend/<entrypoint>/…` (`website`, `admin`, …).

## Code organization — skill `vulkano-frontend-component`

- Composition API only (`setup()`, `ref`/`reactive`, composables) — never `data()`/`methods`/`created()`.
- `views/` = one folder per route (`/users` → `views/Users/Index.*`, `/system/users` → `views/System/Users/Index.*`). `components/` = reusable pieces.
- Every component/view is split in 3 files: `<Name>.vue` (template), `<Name>.js` (logic), `_index.scss` (styles), and its `_index.scss` is imported by the parent aggregator.
- Business logic goes in a store or a composable (`composables/useX.js`), not the component. Pure helpers → `utils/`.
- Never import across entrypoints (`@website` from inside `frontend/admin/`).
- API calls: `$api` from `getCurrentInstance().proxy` — never `import Api` in a component. `Api.js` prefixes `/api`, unwraps `data` from the `res.vsr` envelope, rejects on non-2xx.

## UI library and reuse

- The library (shadcn-vue, Element Plus, …) is a project choice: `PROJECT.md` § Frontend conventions, else check `package.json`.
- Installed → every input, button, dialog, confirm and toast goes through it. Vendored code lives in `components/ui/`, split like any component, never edited for one screen (compose or extend it).
- `views/UI/Index.vue` (route `/ui`, dev/admin only) = live catalog of every reusable component — check it before building a new one; add each new reusable component to it.
- Never `window.confirm`/`alert`/`prompt` — use the library's confirm/message components, or one shared custom modal if none is installed.

## Store — skill `vulkano-frontend-store`

- Pinia, setup-style, one store per concern: `store/use<Entity>Store.js`, no barrel file.
- Single exception: `useAppStore` for app-shell state (global loading, socket status, sidebar, theme).
- Never store the user or the token in `localStorage`/`sessionStorage`.

## Forms — skill `vulkano-frontend-form` (load before any `<form>`)

- JS-only validation via the shared `useFormValidation` composable + `utils/validators.js` (`V.required`, …) → `fieldErrors`. `novalidate`; never native validation UI.
- Required labels get an asterisk (shared class + danger color token). Inline error under the input.
- Correct input `type` always. Submit shows a loading state; failure always shows a message.

## Routes — skill `vulkano-frontend-router`

- `frontend/<entrypoint>/routes.js`, hand-written, HTML5 history (`createWebHistory('/<base>')` for non-root entrypoints).
- Route path mirrors view folder (kebab-case URL → PascalCase folder). Resource routes: `Product/List.vue` + one `Product/Form.vue` for create and edit.
- Every Vue entrypoint has a `NotFound` route (`/:pathMatch(.*)*`) paired with its backend catch-all (see BACKEND.md § Routes).
- Auth guard re-fetches `GET /api/auth/current` on every route change — never cache the user.

## CSS and layout — skill `vulkano-frontend-css`

- BEM; block name = component folder in kebab-case.
- Layout with CSS Grid, no Flexbox (unless `PROJECT.md` overrides). Grid system: `.row` / `.column small-N medium-N large-N` from `scss/_grid.scss`.
- Units: `rem`, `px`, `dvh`, `vw`, `%`. Never `em`, `vh`, `ch`. A `rem` must equal whole pixels (`value × 16`).

## Design patterns — microinteractions

- Every async action (fetch, submit, delete) has a loading state (disabled/`--loading` button, spinner or skeleton).
- Hover on interactive elements; `cursor: pointer` on every clickable (`not-allowed` when disabled) — via a shared base style.
- State changes (modal, toast, dropdown, error) animate ~150-250ms, never jump.
- Reuse shared utilities/mixins (`.is-loading`, transitions) — no per-view copies.
- Complex sequences → GSAP; scroll reveal → AOS. Neither installed: `pnpm add`, and call out the new dependency.

## Assets

- Images, fonts, downloads live in `public/img|fonts|files/`, referenced by absolute path (`/img/x.webp`) — never imported through Vite or `@<entrypoint>`.
- Namespace per feature (`public/img/<section>/…`). Photos → `.webp` via `pnpm run webp`. Below-the-fold images get `loading="lazy"`.

## Analytics wiring (public areas only)

How to track well = any analytics skill. Where Vulkano wires it: Vue pages → `vue-gtag` (not installed, `pnpm add vue-gtag`); server-rendered pages → `gtag.js` snippet in the layout `<head>`. Provider ID from an env var (e.g. `VITE_GA_ID`, add it to `.env.example`) or hardcoded, as the user prefers. While `SEO_NOINDEX=true` (private mode) tracking still fires — warn the user.

## Before handoff

- New/changed store, composable or util has a test (skill `vulkano-testing`).
- Checked visually in a browser — [DEVTOOLS.md](DEVTOOLS.md).
