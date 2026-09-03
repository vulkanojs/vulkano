# Frontend

Frontend conventions for the Vulkano Framework (`frontend/`, Vue 3 + Vite). See [ARCHITECTURE.md](ARCHITECTURE.md) for the project structure overview and [AGENTS.md](../AGENTS.md) for workflow/safety rules.

**Component/view layout, routing, forms, analytics, and accessibility are now covered by Claude Code skills** — invoke them for detailed conventions and worked code instead of relying on this file alone:

- `.claude/skills/vulkano-frontend-component/SKILL.md` — `.vue`/`.js`/`.scss` file splitting, `views/` vs `components/` placement, route↔view naming, Pinia store per concern, BEM styling, CSS Grid layout
- `.claude/skills/vulkano-frontend-router/SKILL.md` — adding routes, resource+action file naming (`Form.vue` for create+edit), the SPA catch-all(s), auth guard/current-user fetching
- `.claude/skills/vulkano-frontend-form/SKILL.md` — required-field asterisks, JS-only validation, `fieldErrors` pattern
- `.claude/skills/vulkano-frontend-analytics/SKILL.md` — tracking wiring ([ANALYTICS.md](ANALYTICS.md))
- `.claude/skills/vulkano-frontend-a11y/SKILL.md` — accessibility minimums ([ACCESSIBILITY.md](ACCESSIBILITY.md))

This file keeps only what those skills don't cover: the entry point, `$api` usage, state (Pinia), and Vite config.

The `frontend/` folder is a standard Vue 3 SPA wired to the Express backend via `Api.js`. Paths below are written as `frontend/<entrypoint>?/...` — with 1 entrypoint `frontend/` stays flat (`frontend/app.js`, `frontend/Api.js`, ...); once a project has 2+ (like this template's default `website` + `cms`), each app gets its own subfolder (`frontend/website/app.js`, `frontend/cms/app.js`, ...) — see `.claude/skills/vulkano-frontend-entrypoint/SKILL.md` for the migration trigger. Concrete examples below use `website` since that's this template's current default.

Prefer the **Composition API** (`setup()`, `ref`/`reactive`, composables) over the Options API for new and edited components — do not add new `data()`/`methods`/`created()`-style options blocks.

## Entry point — `frontend/<entrypoint>?/app.js`

```js
import { createApp } from 'vue';
import { createWebHistory } from 'vue-router';

import '@website/style.scss';

import createRouter from '@website/routes';
import App from '@website/App.vue';
import Api from '@website/Api';

const router = createRouter(createWebHistory());

const app = createApp(App);
app.config.globalProperties.$api = Api;

app.use(router).mount('#app');
```

## Routing — adding routes, view naming, SPA catch-all

Covered by `.claude/skills/vulkano-frontend-router/SKILL.md`: `frontend/<entrypoint>?/routes.js` wiring, route↔view naming (`Index.vue` for plain/nested routes, `Form.vue` for resource create+edit), and the `app/config/routes.js` catch-all(s) (including multi-entry-point `/admin*` setups). Example kept below for the catch-all's HTML5-history rationale:

Vue Router uses HTML5 history mode, so every client-side route (`/login`, `/forbidden`, etc.) needs the server to return the same `index.html` on a hard refresh or direct URL hit — otherwise Express 404s before Vue Router ever runs. `app/config/routes.js` must keep a catch-all as its **last** entry:

```js
module.exports = {
  '/': 'HomeController.get',
  '/*': 'HomeController.get' // must stay last — see note below
};
```

Safe because `@vulkano/core` registers convention routes (`app/controllers/api/*` → `/api/*`) before `config/routes.js` entries (`bootstrap/server.js`), so `/*` never shadows an API route. If this catch-all goes missing again, every non-`/` client route will 404 on refresh while still working via in-app `<router-link>`/`router.push` navigation — that split symptom is the tell.

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

`frontend/<entrypoint>?/Api.js` is a thin `fetch` wrapper (no axios): it prefixes requests with `/api`, serializes/parses JSON, unwraps the `data` field from the `res.vsr` envelope, and rejects with the raw `Response` on non-2xx status.

## Component/view file layout, CSS Grid, BEM

Covered by `.claude/skills/vulkano-frontend-component/SKILL.md`: `.vue`/`.js`/`.scss` pairing, `frontend/<entrypoint>?/components/` vs `frontend/<entrypoint>?/views/` aggregator convention, CSS Grid layout (no Flexbox), BEM naming.

## State — `frontend/<entrypoint>?/store/`

Split state into one [Pinia](https://pinia.vuejs.org/) store per concern — not one global store. If a payload carries data for multiple entities (e.g. an event, its attendee, and a campaign), split it into independent stores rather than one combined store:

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

**Testing** — each store gets its own test file (e.g. `test/store/useEventStore.test.js`), independent of other stores' tests. Because stores are split by concern, tests can exercise one store's actions/getters in isolation, with `createPinia()` + `setActivePinia()` in `beforeEach`, without needing to set up unrelated entity state. Mock `$api` calls at the store boundary rather than hitting the real API.

## Responsive grid system — `frontend/<entrypoint>?/scss/_grid.scss`

Extends the CSS Grid rule in `.claude/skills/vulkano-frontend-component/SKILL.md` with the project's Foundation-style column system:

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

## Component library — not installed, note for future

**Not currently a dependency of this project.** If a future need calls for pre-built accessible components (dialogs, dropdowns, etc.), pick one of these two, don't mix both in the same project:

### Option A — Tailwind + shadcn-vue

- Install Tailwind (`tailwindcss` + `@tailwindcss/vite`) and shadcn-vue's CLI dependencies (`reka-ui`, `class-variance-authority`, `clsx`, `tailwind-merge`) only when actually needed.
- Use the shadcn-vue CLI to pull in components one at a time, as needed — don't bulk-install the whole library.
- Tailwind utility classes stay scoped to the new shadcn components only. The rest of the project keeps using the existing SCSS/BEM/CSS Grid convention above — no migration, no mixing utility classes into existing `_index.scss`-based components.
- This lets Tailwind + shadcn-vue coexist with the current styling system rather than replacing it.
- Prefer this option when the design needs low-level, unstyled primitives to restyle from scratch to match a custom design system.

### Option B — Element Plus

- Install `element-plus` only when actually needed; register components on-demand via its own auto-import plugin (`unplugin-vue-components` + `unplugin-auto-import`) rather than importing the whole library globally.
- Element Plus ships its own themed CSS (SCSS variables for overriding) — scope any override to the components actually in use, same isolation principle as shadcn: don't let its classes leak into or get mixed with the project's BEM components.
- Prefer this option when the app needs a large ready-made admin/CMS component set (tables, forms, date pickers, tree views) fast, and a fully custom look matters less than shadcn's blank-slate approach would give.

## Vite (`vite.config.mjs`)

- **Entry points**: `rollupOptions.input` maps one key per entrypoint — this template ships 2 by default (`{ app: 'frontend/website/app.js', cms: 'frontend/cms/app.js' }`). With only 1 entrypoint, `frontend/` stays flat (no subfolder) and `input` holds a single key. Adding a 2nd entrypoint is the trigger to restructure `frontend/` into a container: the existing app moves to `frontend/website/`, each new one gets its own `frontend/<name>/` (e.g. `frontend/cms/`), and `rollupOptions.input` gains one key per app — see docs/ARCHITECTURE.md § Multiple entry points and `.claude/skills/vulkano-frontend-entrypoint/SKILL.md`. The Nunjucks `vite()` helper takes an `entry` param (`vite({ entry: 'app', type: 'script' })`), so wiring a new bundle into a template only needs the matching `entry:` value — no other config changes.
- **Output**: assets land in `public/js/`, `public/css/`, `public/img/` — served directly by Express (`outDir: public/`, `emptyOutDir: false` so backend-served files aren't wiped)
- **Dev server**: runs alongside Express (`vp dev` + `nodemon`, via `concurrently`) with HMR (Hot Module Replacement) — edited modules are swapped in the running app over the existing socket connection, so a full page reload isn't needed; CORS is open (`origin: '*'`) so the two servers talk freely; `host: process.env.VITE_HOST || true` binds all interfaces by default so it prints a LAN URL too (`Network: http://<your-ip>:5173/`) — useful for testing from a phone on the same network. Set `VITE_HOST` in `.env` only if you need to force a specific host (e.g. a fixed IP/hostname); leave it unset for the auto-detected default
- **Alias**: one per entrypoint, named after it — `@website` → `frontend/website/`, `@cms` → `frontend/cms/`. A new entrypoint adds its own alias entry alongside its `rollupOptions.input` key; never reach across entrypoints through another one's alias (`@website` from inside `frontend/cms/`) — see `.claude/skills/vulkano-frontend-entrypoint/SKILL.md`.
- **Manifest**: `vite-plugin-dev-manifest` writes `public/.vite/manifest.<NODE_ENV>.json`, which the Nunjucks templates read to inject the correct `<script>`/`<link>` tags in dev and production
- **Cache hashing**: controlled by `VITE_CHUNK_NAMES` — `true` adds `-[hash]` to output filenames, `false` (default) keeps plain names for simpler debugging

For complex apps, keep state in [Pinia](https://pinia.vuejs.org/) (see [State — `frontend/<entrypoint>?/store/`](#state--frontendentrypointstore)) rather than local component `ref`/`reactive`. Component-local state resets whenever HMR can't hot-swap a module in place and falls back to a full reload; state that lives in a store is less likely to be lost across that reload.
