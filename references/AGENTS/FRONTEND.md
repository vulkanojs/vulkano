# Frontend (`frontend/`)

See [ARCHITECTURE.md](ARCHITECTURE.md) for the project structure overview and [AGENTS.md](../../AGENTS.md) for workflow/safety rules.

**Component/view layout, routing, forms, analytics, and accessibility are covered by Claude Code skills** — invoke them for detailed conventions and worked code instead of relying on this file alone:

- `.claude/skills/vulkano-skills/vulkano-frontend-component/SKILL.md` — `.vue`/`.js`/`.scss` file splitting, `views/` vs `components/` placement, route↔view naming, Pinia store per concern, BEM styling, CSS Grid layout
- `.claude/skills/vulkano-skills/vulkano-frontend-router/SKILL.md` — adding routes, resource+action file naming (`Form.vue` for create+edit), the SPA catch-all(s), auth guard/current-user fetching
- `.claude/skills/vulkano-skills/vulkano-frontend-form/SKILL.md` — required-field asterisks, JS-only validation, `fieldErrors` pattern
- `.claude/skills/vulkano-skills/vulkano-frontend-analytics/SKILL.md` — tracking wiring ([ANALYTICS.md](ANALYTICS.md))
- `.claude/skills/vulkano-skills/vulkano-frontend-a11y/SKILL.md` — accessibility minimums ([ACCESSIBILITY.md](ACCESSIBILITY.md))

This file keeps only what those skills don't cover: the entry point, `$api` usage, state (Pinia), Vite config, and the conventions below.

The `frontend/` folder is a standard Vue 3 SPA wired to the Express backend via `Api.js`. Paths below are written as `frontend/<entrypoint>/...` — `frontend/` is always a container, one subfolder per entrypoint, even with only 1 (`frontend/website/app.js`, `frontend/website/Api.js`, ...); this template ships 2 by default (`website` + `admin`, each with its own subfolder) — see `.claude/skills/vulkano-skills/vulkano-frontend-entrypoint/SKILL.md` for adding a new one. Concrete examples below use `website` since that's this template's current default.

Prefer the **Composition API** (`setup()`, `ref`/`reactive`, composables) over the Options API for new and edited components — do not add new `data()`/`methods`/`created()`-style options blocks.

## Code principles

- **Separate logic from view**: within a component/view, split `.vue` (template), `.js` (logic), and `.scss` (styles) as their own files — see `.claude/skills/vulkano-skills/vulkano-frontend-component/SKILL.md`.

## Entry point — `frontend/<entrypoint>/app.js`

```js
import { createApp } from 'vue';
import { createWebHistory } from 'vue-router';

import '@website/style.scss';

import createRouter from '@website/routes';
import App from '@website/App.vue';
import Api from '@website/Api';

const router = createRouter(createWebHistory('/')); // scoped to this entrypoint's path prefix — '/admin' for frontend/admin/, etc.

const app = createApp(App);
app.config.globalProperties.$api = Api;

app.use(router).mount('#app');
```

`createWebHistory()`'s base must match the backend catch-all's path prefix for this entrypoint (`/` for the public front, `/admin` for `frontend/admin/`, ...) — see `.claude/skills/vulkano-skills/vulkano-frontend-router/SKILL.md` § Multiple entry points. Mismatch is a common miss: the backend route serves the app fine, but every client-side route inside it fails to match because the router still expects `/`.

## Routing — adding routes, view naming, SPA catch-all

Covered by `.claude/skills/vulkano-skills/vulkano-frontend-router/SKILL.md`: `frontend/<entrypoint>/routes.js` wiring, route↔view naming (`Index.vue` for plain/nested routes, `Form.vue` for resource create+edit), and the `app/config/routes.js` catch-all(s) (including multi-entry-point `/admin*` setups). Example kept below for the catch-all's HTML5-history rationale:

Vue Router uses HTML5 history mode, so every client-side route inside a mounted SPA needs the server to return the same shell on a hard refresh or direct URL hit — otherwise Express 404s before Vue Router ever runs. A catch-all only makes sense for an area whose backend template actually mounts a Vue app (`id="app"` + `vite({ entry: '<name>' })`) — see `.claude/skills/vulkano-skills/vulkano-frontend-router/SKILL.md` § Backend catch-all for the full backend+frontend pairing rule:

```js
module.exports = {
  '/': 'HomeController.get',
  '/admin': 'AdminController.get',

  // Scoped catch-all for the admin entry only — it mounts a Vue app
  // (app/views/_shared/templates/admin.html). No public '/*': the
  // public front is fully server-rendered Nunjucks (static.html, no
  // Vue mount point), so an invalid public URL should fall through to
  // @vulkano/core's built-in 404 handler instead of soft-200ing into
  // the homepage.
  '/admin/*': 'AdminController.get'
};
```

Safe to keep scoped catch-alls anywhere in the map: `@vulkano/core` registers convention routes (`app/controllers/api/*` → `/api/*`) before `config/routes.js` entries (`bootstrap/server.js`), so `/admin/*` never shadows an API route. If a scoped catch-all goes missing once a mounted-SPA area's routes grow past one, every non-root client route in that area 404s on refresh while still working via in-app `<router-link>`/`router.push` navigation — that split symptom is the tell. Each such entrypoint's `routes.js` should also have its own Vue Router catch-all (`{ path: '/:pathMatch(.*)*', component: NotFound }`) so an invalid path renders an actual 404 view instead of falling through to the home route.

## Calling the API from a component

`$api` is registered as a global property (`app.config.globalProperties.$api`), not exported as a module — pull it off `getCurrentInstance().proxy` inside `setup()`, don't `import Api from './Api'` directly in components:

```js
// MyComponent.js
import { ref, onMounted, getCurrentInstance, toRef } from 'vue';

export default {
  setup(props) {
    /**
     * INSTANCE (for $api variable)
     */
    const { $api } = getCurrentInstance().proxy || {};

    /**
     * REACTIVE FIELDS
     */
    const sku = toRef(props, 'sku');
    const products = ref([]);

    onMounted(async () => {
      products.value = await $api.get('/product');
    });

    return { products, sku };
  }
};
```

`frontend/<entrypoint>/Api.js` is a thin `fetch` wrapper (no axios): it prefixes requests with `/api`, serializes/parses JSON, unwraps the `data` field from the `res.vsr` envelope, and rejects with the raw `Response` on non-2xx status.

## Component/view file layout, CSS Grid, BEM

Covered by `.claude/skills/vulkano-skills/vulkano-frontend-component/SKILL.md`: `.vue`/`.js`/`.scss` pairing, `frontend/<entrypoint>/components/` vs `frontend/<entrypoint>/views/` aggregator convention, CSS Grid layout (no Flexbox), BEM naming.

## State — `frontend/<entrypoint>/store/`

Keep state in [Pinia](https://pinia.vuejs.org/) rather than local component `ref`/`reactive`, especially for anything worth surviving a re-render: component-local state resets whenever HMR can't hot-swap a module in place and falls back to a full reload, while state in a store is less likely to be lost across that reload.

Split state into one Pinia store per concern — not one global store. If a payload carries data for multiple entities (e.g. an event, its attendee, and a campaign), split it into independent stores rather than one combined store:

```
store/
  useEventStore.js
  useAttendeeStore.js
  useCampaignStore.js
```

Each store owns only its own entity's state, getters, and actions — a component importing `useAttendeeStore` should never need to reach into event or campaign state. This keeps each store small, its logic easy to follow, and its mutations traceable to one concern instead of a shared blob every component can write to.

```js
// store/useEventStore.js
import { ref, getCurrentInstance } from 'vue';
import { defineStore } from 'pinia';

export const useEventStore = defineStore('event', () => {
  const { $api } = getCurrentInstance().proxy || {};
  const current = ref(null);

  async function fetch(id) {
    current.value = await $api.get(`/event/${id}`);
  }

  return { current, fetch };
});
```

(setup-style store, in line with the Composition API preference above — not the options-style `defineStore('event', { state, actions })`.)

Naming: `use<Entity>Store` (singular, matching the model naming convention), file per store, no aggregator/barrel file — import each store directly where it's used.

Pinia is installed by default (`app.use(createPinia())` already registered in each entrypoint's `app.js`, e.g. `frontend/website/app.js`) — just create the store file.

### Global app-shell state — `useAppStore`

App-shell-level state — things there's only ever one of, shared across the whole app regardless of route — lives in a single `useAppStore`, not split per concern like entity stores: a global loading spinner, Socket.io connection status (`connected`/`reconnecting`/`disconnected`), a sidebar-open flag, a theme toggle. This is the one deliberate exception to "one store per concern": these are all facets of the same app shell, read/written from unrelated places (a router guard, the socket client, any component), so bundling them in one store avoids a proliferation of near-empty singleton stores. Entity data (`useEventStore`, etc.) still stays split — this exception is for app-shell/UI state only. Applies to any area of the app (public site, CMS/admin, widget) that needs this kind of shared state:

```js
// store/useAppStore.js
import { ref } from 'vue';
import { defineStore } from 'pinia';

export const useAppStore = defineStore('app', () => {
  const isLoading = ref(false);
  const socketStatus = ref('disconnected'); // 'connected' | 'reconnecting' | 'disconnected'

  function setLoadingStatus(status) {
    isLoading.value = status;
  }

  function setSocketStatus(status) {
    socketStatus.value = status;
  }

  return { isLoading, socketStatus, setLoadingStatus, setSocketStatus };
});
```

**Testing** — each store gets its own test file (e.g. `test/frontend/<entrypoint>/store/useEventStore.test.js`), independent of other stores' tests. Because stores are split by concern, tests can exercise one store's actions/getters in isolation, with `createPinia()` + `setActivePinia()` in `beforeEach`, without needing to set up unrelated entity state. Mock `$api` calls at the store boundary rather than hitting the real API. Full pattern table (store, composable, util): `.claude/skills/vulkano-skills/vulkano-testing/SKILL.md`, [TESTING.md](TESTING.md).

## Responsive grid system — `frontend/<entrypoint>/scss/_grid.scss`

Extends the CSS Grid rule in `.claude/skills/vulkano-skills/vulkano-frontend-component/SKILL.md` with the project's Foundation-style column system:

Foundation-style responsive grid, built on CSS Grid, imported once per entrypoint's `style.scss` (e.g. `frontend/website/style.scss`):

```html
<div class="row">
  <div class="column small-12 medium-6 large-4">...</div>
</div>
```

- `.row`: `display: grid; grid-template-columns: repeat(12, 1fr);` — 12-column grid.
- `.column`: `grid-column: span 12` default (mobile-first, full row).
- Size classes `.small-N` / `.medium-N` / `.large-N` / `.xlarge-N` (1-12), each `grid-column: span N` — `small` unscoped (base), `medium`/`large`/`xlarge` wrapped in `min-width` media queries (`$breakpoints` map: medium 40rem/640px, large 64rem/1024px, xlarge 75rem/1200px).
- Gutter: `0.875rem` (small), `0.9375rem` from `medium` up. `.row--collapsed` removes it (`gap: 0`).
- Nesting: any `.column` can also carry `.row` to nest a grid inside it — no special helper needed.
- No offset/push-pull classes (not needed yet — add only when a task requires them).

## Vite build/dev config and backend injection

Covered by [VITE.md](VITE.md): `vite.config.mjs` build/dev-server mechanics (output, HMR, manifest, cache hashing) and how a backend template injects a bundle via the `vite()` helper. One alias detail worth repeating here since it's a frontend-authoring mistake, not a config one: never reach across entrypoints through another one's `@<dir>` alias (`@website` from inside `frontend/admin/`).

## Security

- Never store user data (profile, role, etc.) in `localStorage`/`sessionStorage` — client-readable storage is exposed to XSS. After login, fetch the current user via `GET /api/auth/current`, and re-fetch it on every route change (router guard) instead of caching it client-side.

## UI components

Task needs a pre-built UI component (dialog, dropdown, etc.) — see [references/AGENTS/UI.md](UI.md) first: `components/ui/` isolation, component-splitting convention, `views/ui/` styleguide. Library choice lives in `PROJECT.md`, not here.

## Forms

Any `<form>` add/edit — always load the `vulkano-frontend-form` skill first (`.claude/skills/vulkano-skills/vulkano-frontend-form/SKILL.md`): required-field asterisks, JS-only validation via `useFormValidator`, `fieldErrors` pattern, input types, date-picker choice. Don't hand-roll form validation from memory of this note — the skill is the source of truth, load it every time, not just when it "seems needed".

## Microinteractions

- Every async action (fetch, submit, delete) needs a `loading` state: spinner/skeleton, disabled or `--loading` button state, visual feedback while waiting for the response.
- Interactive elements (buttons, table rows, cards, links) need hover/rollover: subtle color/shadow/scale transition, never an abrupt change.
- Every `<button>` (and any clickable non-native element, e.g. a `div`/`span` acting as one) gets `cursor: pointer`, disabled state excepted (`cursor: not-allowed` or default). Reuse a shared base button style/mixin instead of setting it per view.
- State transitions (modal/toast/dropdown/error appearing or disappearing) use a short `transition`/`animation` (~150-250ms), no instant jump.
- Reuse shared utilities (`.is-loading`, transition mixins in `_index.scss` or design tokens) instead of repeating the animation per view — see [AGENTS.md § Code principles](../../AGENTS.md#code-principles--dry-kiss-divide-and-conquer).
- For polished/complex animations (staggered lists, timeline sequences, scroll-triggered effects) CSS transitions can't cleanly express, GSAP is allowed — not yet a dependency, install with `pnpm add gsap` before first use and call this out explicitly in the diff.
- For scroll-reveal effects (fade/slide-in as elements enter viewport), AOS is allowed — not yet a dependency, install with `pnpm add aos` before first use and call this out explicitly in the diff.

## Safety boundaries

- CSS units: use `rem`, `px`, `dvh`, `vw`, or `%` only — no `ch`, `em`, `vh` (use `dvh`), or other units. `ch` in particular renders inconsistently across the font stacks a host page might cascade in.
- CSS `rem` values (`frontend/**/*.scss`): only use a `rem` value whose px equivalent (at the 16px root) is a whole number — never a decimal px. E.g. use `0.75rem` (12px) not `0.7rem` (11.2px); use `0.375rem` (6px) not `0.3rem` (4.8px); `1px` is `0.0625rem`.
- Frontend layout (`frontend/**/*.scss`): use `display: grid` for layout, not `display: flex` — keep the layout system consistent across the front. Only reach for flex when a component genuinely needs flex-only behavior grid can't express.

## Before handoff checklist

- The frontend was checked visually in a browser (`chrome-devtools` MCP if available) — see [references/AGENTS/DEVTOOLS.md](DEVTOOLS.md).
- For changes involving user interaction (form, button, download, video, page), analytics tracking was added per [references/AGENTS/ANALYTICS.md](ANALYTICS.md), or the user explicitly confirmed tracking is not required for this task.
- For changes involving images, navigation, or forms, accessibility minimums per [references/AGENTS/ACCESSIBILITY.md](ACCESSIBILITY.md) were met, or the user explicitly confirmed accessibility is not required for this task.
- For new public/crawlable pages, SEO essentials per [references/AGENTS/SEO.md](SEO.md) (backend view, meta tags, sitemap entry) were met, or the user explicitly confirmed SEO is not required for this task.
