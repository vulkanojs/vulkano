# Frontend

Frontend conventions for the Vulkano Framework (`client/`, Vue 3 + Vite). See [ARCHITECTURE.md](ARCHITECTURE.md) for the project structure overview and [AGENTS.md](../AGENTS.md) for workflow/safety rules. See also [ANALYTICS.md](ANALYTICS.md) and [ACCESSIBILITY.md](ACCESSIBILITY.md) — both apply to the frontend work described below.

The `client/` folder is a standard Vue 3 SPA wired to the Express backend via `Api.js`.

Prefer the **Composition API** (`setup()`, `ref`/`reactive`, composables) over the Options API for new and edited components — do not add new `data()`/`methods`/`created()`-style options blocks.

## Entry point — `client/app.js`

```js
import { createApp } from 'vue';
import { createWebHistory } from 'vue-router';

import '@client/style.scss';

import createRouter from '@client/routes';
import App from '@client/App.vue';
import Api from '@client/Api';

const router = createRouter(createWebHistory());

const app = createApp(App);
app.config.globalProperties.$api = Api;

app.use(router).mount('#app');
```

## Adding a route — `client/routes.js`

```js
import { createRouter } from 'vue-router';

import Layout from '@client/layouts/Layout.vue';
import Homepage from '@client/views/Home/Index.vue';
import Users from '@client/views/System/Users/Index.vue';

const routes = [
  {
    path: '/',
    component: Layout,
    children: [
      { path: '', component: Homepage },
      { path: '/system/users', component: Users }
    ]
  }
];

export default (history) => createRouter({ history, routes });
```

## Route ↔ view naming convention

Route path and view folder mirror each other — no code generates this, it's a naming discipline
followed by hand when adding a route. The leaf view file is always `Index.vue` / `Index.js`
(never named after the view) — the folder name is what identifies the view:

- **Single segment**: `/users` → `views/Users/Index.vue` (+ `Index.js`, `_index.scss`). Folder
  name and route segment match, cased differently (kebab-case URL → PascalCase folder); the file
  itself is always `Index.*`.
- **Modular (nested) routes**: each path segment becomes a nested folder under `views/`, in
  PascalCase; the leaf folder still holds `Index.vue` / `Index.js`:
  - `/system/users` → `views/System/Users/Index.vue`
  - `/config/categories` → `views/Config/Categories/Index.vue`
- A module folder (`System/`, `Config/`) gets its own `_index.scss` aggregator that imports its
  child views' `_index.scss` files — same pattern `views/_index.scss` already uses for leaf
  views, one level deeper. `views/_index.scss` then imports the module's `_index.scss` instead of
  each leaf directly.

`routes.js` stays a hand-written array (no auto-discovery of `views/`) — this convention only
makes the import path predictable from the URL, so a route can be located without grepping.

## SPA catch-all — `app/config/routes.js`

Vue Router uses HTML5 history mode, so every client-side route (`/login`, `/forbidden`, etc.) needs the server to return the same `index.html` on a hard refresh or direct URL hit — otherwise Express 404s before Vue Router ever runs. `app/config/routes.js` must keep a catch-all as its **last** entry:

```js
module.exports = {
  '/': 'HomeController.get',
  '/*': 'HomeController.get' // must stay last — see note below
};
```

Safe because `@vulkano/core` registers convention routes (`app/controllers/api/*` → `/api/*`) before `config/routes.js` entries (`bootstrap/server.js`), so `/*` never shadows an API route. If this catch-all goes missing again, every non-`/` client route will 404 on refresh while still working via in-app `<router-link>`/`router.push` navigation — that split symptom is the tell.

## Calling the API from a component

`$api` is registered as a global property (`app.config.globalProperties.$api`), not exported as a module — pull it off `getCurrentInstance().proxy` inside `setup()`, don't `import Api from '@client/Api'` directly in components:

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

`client/Api.js` is a thin `fetch` wrapper (no axios): it prefixes requests with `/api`, serializes/parses JSON, unwraps the `data` field from the `res.vsr` envelope, and rejects with the raw `Response` on non-2xx status.

## Component convention — `.vue` / `.js` pairing

Each component splits its options/logic into a sibling `.js` file, imported by the `.vue` file via `<script src="./X.js">`; the `.vue` file carries the template and (optionally) scoped styles. Views and components additionally carry an `_index.scss` partial (e.g. `views/MyView/_index.scss`, `components/MyComponent/_index.scss`).

### `client/components/` — shared/reusable components

Reusable components (as opposed to `views/`, which are the top-level states the store's status drives) live under `client/components/`, one subfolder per component:

```
components/
  _index.scss           # imports every component's own _index.scss
  MyComponent/
    MyComponent.vue      # HTML
    MyComponent.js       # Logic
    _index.scss          # Styles
```

`components/_index.scss` is the aggregator — each new component adds its own `@import './MyComponent/_index.scss';` line there. Individual `.vue` files do NOT import their own `_index.scss` — all imports flow from `client/style.scss`, which imports `components/_index.scss` (and `views/_index.scss`, and `layouts/_index.scss` if that folder exists), so there is a single entry point for every style partial in the widget.

### `client/views/` — same aggregator convention

`views/` follows the identical pattern: `views/_index.scss` is the aggregator, each view adds its own `@import './MyView/_index.scss';`-style line there. Same rule as `components/` — the view's own `.vue` file doesn't import its own `_index.scss`; `client/style.scss` is the one place that chains `@client/components/index`, `@client/views/index`, and `@client/layouts/index` together.

Unlike `components/`, a view's `.vue`/`.js` files are always named `Index.vue` / `Index.js` — the folder name is what identifies the view (and, per the route convention above, mirrors the URL segment):

```
views/
  _index.scss           # imports every view's own _index.scss
  MyView/
    Index.vue           # HTML
    Index.js            # Logic
    _index.scss         # Styles
```

## State — `client/store/`

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

Pinia is installed by default (`app.use(createPinia())` already registered in `client/app.js`) — just create the store file.

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

## Layout — CSS Grid

All layout — components and views, any dimension, any nesting level — uses CSS Grid (`display: grid`) in the `_index.scss`. No Flexbox, anywhere.

### Responsive grid system — `client/scss/_grid.scss`

Foundation-style responsive grid, built on CSS Grid, imported once in `client/style.scss`:

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

## CSS naming — BEM

Every `_index.scss` follows BEM: block is the component/view's root section, elements are `__container`/`__content` (or another noun scoped to that block), state/variant modifiers use `--` (e.g. `--opened`):

```scss
// MyComponent/_index.scss
.my-component {
  display: grid;

  &__container {
    display: grid;
  }

  &__content {
    display: grid;
  }

  &--opened {
    // state override
  }
}
```

Block name matches the component/view folder (kebab-case). No nested selectors beyond block/element/modifier — don't reach into a child block's internals from a parent's stylesheet.

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

- **Entry points**: `rollupOptions.input` (an object) currently maps a single key, `app: 'client/app.js'`. Vite supports multiple entries — each additional key builds its own bundle (e.g. a future CMS app in its own top-level folder, mirroring `client/`'s structure). The Nunjucks `vite()` helper already takes an `entry` param (`vite({ entry: 'app', type: 'script' })`), so wiring a new bundle into a template only needs the matching `entry:` value — no other config changes. Not in use yet — there's currently only one entry (`app`)
- **Output**: assets land in `public/js/`, `public/css/`, `public/img/` — served directly by Express (`outDir: public/`, `emptyOutDir: false` so backend-served files aren't wiped)
- **Dev server**: runs alongside Express (`vp dev` + `nodemon`, via `concurrently`) with HMR (Hot Module Replacement) — edited modules are swapped in the running app over the existing socket connection, so a full page reload isn't needed; CORS is open (`origin: '*'`) so the two servers talk freely; `host: process.env.VITE_HOST || true` binds all interfaces by default so it prints a LAN URL too (`Network: http://<your-ip>:5173/`) — useful for testing from a phone on the same network. Set `VITE_HOST` in `.env` only if you need to force a specific host (e.g. a fixed IP/hostname); leave it unset for the auto-detected default
- **Alias**: `@client` → `client/`
- **Manifest**: `vite-plugin-dev-manifest` writes `public/.vite/manifest.<NODE_ENV>.json`, which the Nunjucks templates read to inject the correct `<script>`/`<link>` tags in dev and production
- **Cache hashing**: controlled by `VITE_CHUNK_NAMES` — `true` adds `-[hash]` to output filenames, `false` (default) keeps plain names for simpler debugging

For complex apps, keep state in [Pinia](https://pinia.vuejs.org/) (see [State — `client/store/`](#state--clientstore)) rather than local component `ref`/`reactive`. Component-local state resets whenever HMR can't hot-swap a module in place and falls back to a full reload; state that lives in a store is less likely to be lost across that reload.
