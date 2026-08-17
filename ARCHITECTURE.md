# Architecture

How to structure a Vulkano-based project at the API/backend level, and how the frontend attaches to it. See [AGENTS.md](AGENTS.md) for workflow, safety, and security rules.

## Project structure

```
framework/
├── app.js                  # Entry point — calls vulkano()
├── vite.config.js          # Vite config (entry points: client)
├── nodemon.json            # Nodemon watches app/ only (ignores public/, client/, cms/)
│
├── app/                    # Backend
│   ├── config/
│   │   ├── settings.js     # Port, DB URI, salt key
│   │   ├── routes.js       # Explicit route mappings (override convention)
│   │   ├── express/        # cookies, cors, csp, helmet, json, jwt, permissionPolicy, settings
│   │   └── locales/        # i18n files
│   ├── controllers/        # Convention-based request handlers
│   │   ├── sockets/        # Socket.io handlers
│   │   └── api/            # Scaffold or custom API controllers
│   ├── models/             # Mongoose models (auto-loaded as globals)
│   ├── services/           # Shared libs (auto-loaded as globals)
│   └── views/              # Nunjucks/Handlebars layouts
│
├── client/                 # Vue 3 main app
│   ├── app.js              # Vue entry — mounts App.vue, registers $api global
│   ├── App.vue
│   ├── routes.js           # Vue Router routes
│   ├── Api.js              # Native fetch wrapper (replaces axios)
│   ├── style.scss          # Single style entry point — chains components/views/layouts index
│   ├── components/
│   │   ├── _index.scss     # Aggregator — imports every component's own _index.scss
│   │   └── MyComponent/
│   │       ├── MyComponent.vue
│   │       ├── MyComponent.js
│   │       └── _index.scss
│   ├── layouts/
│   │   ├── _index.scss     # Aggregator — imports every layout's own _index.scss
│   │   └── Layout.vue / Layout.js
│   └── views/
│       ├── _index.scss     # Aggregator — imports every view's own _index.scss (or module's)
│       ├── MyView/          # /my-view → views/MyView/Index.*
│       │   ├── Index.vue
│       │   ├── Index.js
│       │   └── _index.scss
│       └── MyModule/        # /my-module/my-view → views/MyModule/MyView/Index.*
│           ├── _index.scss  # Aggregator — imports every child view's _index.scss
│           └── MyView/
│               ├── Index.vue
│               ├── Index.js
│               └── _index.scss
│
└── public/                 # Built assets (output of vite build)
    ├── js/
    ├── css/
    ├── img/
    └── files/              # Uploaded files
```

---

## Key conventions

### Naming: controllers in plural (recommended but not mandatory), models in singular

`@vulkano/core` pairs each model with a controller by name, so the naming convention is what makes the auto-routing work:

- **Model** → singular PascalCase (e.g., `Product.js` → `global.Product`)
- **Controller** → plural PascalCase + `Controller` suffix (e.g., `ProductsController.js`)
- **MongoDB collection naming:** a model only maps to a table/collection if it defines `attributes` (schema fields) — a model file with no `attributes` is just a plain global, not backed by a collection.

By convention, model files should be named in singular (e.g. `User.js`), and the collection binding is automatic and singular-lowercase: `User.js` → collection `user`, `Project.js` → collection `project` (never pluralized like `users`/`projects`). Any script or tool that talks to the database directly (seeds, migrations, ad-hoc queries) must target that singular lowercase collection name to match what the running app actually uses.

### Unused variables — prefix with `_`

When a function parameter or binding is intentionally unused (e.g. a `catch` block that doesn't need the error), prefix it with `_` so the linter's `no-unused-vars` rule doesn't flag it: `catch (_err) {`.

### Controllers — no top-level functions or variables (template-specific)

A controller file may only have, outside of `module.exports`, its `require`/import statements. No helper functions, no top-level `const`/`let` — only the exported object and its methods:

```js
// app/controllers/ProductsController.js
const exceljs = require('exceljs'); // ok: import
const VAR_NAME = 'value'; // no top-level constants or variables hardcoded (template-specific)

module.exports = {
  get(req, res) {
    // ok: this IS a controller method
    res.vsr(exceljs.download());
  }
};
```

If a method needs helper logic, extract it into `app/services/<Name>.js` (auto-loaded as a global by the core, like models — see `app/services/` in the tree above) and call the service from the controller. Business rules and reusable logic belong in the service (or the model), not the controller.

### Global constants hardcoded — `app/config/common.js` or `bootstrap.js`

Shared constants used across controllers/services/models go in `app/config/common.js`, exported like any other config file. The core exposes every `app/config/*.js` file as `app.config.<filename>` (see `app.config = allConfig` in `@vulkano/core/app.js`), so `app/config/common.js` becomes readable as `app.config.common`:

```js
// app/config/common.js
module.exports = {
  HOLDER_TYPES: ['user', 'company']
};

// usage anywhere: app.config.common.HOLDER_TYPES
```

For a constant that should behave as a true global (not nested under `config`), register it in `app/config/bootstrap.js` instead:

```js
// app/config/bootstrap.js
global.HOLDER_TYPES = ['user', 'company']; // usage anywhere: HOLDER_TYPES
module.exports = (start) => {
  start(() => {});
};
```

### Backend conventions — owned by `@vulkano/core`

Routing (convention over configuration, method key convention, `app/config/routes.js`), the thin-controller/business-logic-in-model split, scaffold controllers, the model CRUD interface and hooks, cron jobs (`Crontab.schedule(...)` registered in `app/config/bootstrap.js`), auto-loaded globals, and the `res.vsr`/`res.render` response conventions are all defined by the framework core, not by this template. Source of truth: [`@vulkano/core` README](node_modules/@vulkano/core/README.md) (also mirrored at https://github.com/vulkanojs/vulkano-core). For worked examples, see `@vulkano/core/examples/controllers` (`ExampleController.js`, `RestExampleController.js`, `RestScaffoldController.js`) and `@vulkano/core/examples/models` (`Example.js`, `ExampleWithScaffold.js`).

This template only adds what follows below: the controller/config conventions above, the frontend, the dependency list, and deployment.

### Authentication

The core wires JWT (`Jwt.encode`/`Jwt.decode`, `express-jwt` middleware — see [`@vulkano/core` README § JWT Authentication](node_modules/@vulkano/core/README.md)), but doesn't prescribe a model/controller shape. Recommended convention for this template:

- **Dedicated model** — `Auth`/`User` (whichever this app calls it), not login logic bolted onto an unrelated model.
- **Dedicated controller** — `app/controllers/api/AuthController.js`, following the core's method-key convention: `'post login'` (`POST /api/auth/login`), `'post logout'` (`POST /api/auth/logout`), `me` (`GET /api/auth/me` — no verb prefix needed, `GET` is the default; returns the current session's user or `401`).
- **`httpOnly` cookie, not `localStorage`** — on successful login, set the JWT as an `httpOnly` (and `secure` in production) cookie rather than returning it in the response body for client-side storage. `Jwt.getToken(req)` already reads from cookie, header, or query param, so this doesn't require custom token-extraction logic. `localStorage`/`sessionStorage` are readable by any script on the page — a stored token there is exposed to XSS.

## Frontend — Vue 3 + Vite

The `client/` folder is a standard Vue 3 SPA wired to the Express backend via `Api.js`.

Prefer the **Composition API** (`setup()`, `ref`/`reactive`, composables) over the Options API for new and edited components — do not add new `data()`/`methods`/`created()`-style options blocks.

### Entry point — `client/app.js`

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

### Adding a route — `client/routes.js`

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

### Route ↔ view naming convention

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

### SPA catch-all — `app/config/routes.js`

Vue Router uses HTML5 history mode, so every client-side route (`/login`, `/forbidden`, etc.) needs the server to return the same `index.html` on a hard refresh or direct URL hit — otherwise Express 404s before Vue Router ever runs. `app/config/routes.js` must keep a catch-all as its **last** entry:

```js
module.exports = {
  '/': 'HomeController.get',
  '/*': 'HomeController.get' // must stay last — see note below
};
```

Safe because `@vulkano/core` registers convention routes (`app/controllers/api/*` → `/api/*`) before `config/routes.js` entries (`bootstrap/server.js`), so `/*` never shadows an API route. If this catch-all goes missing again, every non-`/` client route will 404 on refresh while still working via in-app `<router-link>`/`router.push` navigation — that split symptom is the tell.

### Calling the API from a component

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

### Component convention — `.vue` / `.js` pairing

Each component splits its options/logic into a sibling `.js` file, imported by the `.vue` file via `<script src="./X.js">`; the `.vue` file carries the template and (optionally) scoped styles. Views and components additionally carry an `_index.scss` partial (e.g. `views/MyView/_index.scss`, `components/MyComponent/_index.scss`).

#### `client/components/` — shared/reusable components

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

#### `client/views/` — same aggregator convention

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

### State — `client/store/`

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

**Pinia is not yet a dependency of this project** — add it (`pnpm add pinia`) and register it in `client/app.js` (`app.use(createPinia())`) before creating the first store.

**Testing** — each store gets its own test file (e.g. `test/store/useEventStore.test.js`), independent of other stores' tests. Because stores are split by concern, tests can exercise one store's actions/getters in isolation, with `createPinia()` + `setActivePinia()` in `beforeEach`, without needing to set up unrelated entity state. Mock `$api` calls at the store boundary rather than hitting the real API.

### Layout — CSS Grid

All layout — components and views, any dimension, any nesting level — uses CSS Grid (`display: grid`) in the `_index.scss`. No Flexbox, anywhere.

### CSS naming — BEM

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

### Tailwind + shadcn-vue — not installed, note for future

**Not currently a dependency of this project.** If a future need calls for pre-built accessible components (dialogs, dropdowns, etc.), the recommendation is:

- Install Tailwind (`tailwindcss` + `@tailwindcss/vite`) and shadcn-vue's CLI dependencies (`reka-ui`, `class-variance-authority`, `clsx`, `tailwind-merge`) only when actually needed.
- Use the shadcn-vue CLI to pull in components one at a time, as needed — don't bulk-install the whole library.
- Tailwind utility classes stay scoped to the new shadcn components only. The rest of the project keeps using the existing SCSS/BEM/CSS Grid convention above — no migration, no mixing utility classes into existing `_index.scss`-based components.
- This lets Tailwind + shadcn-vue coexist with the current styling system rather than replacing it.

### Vite (`vite.config.mjs`)

- **Entry points**: `rollupOptions.input` (an object) currently maps a single key, `app: 'client/app.js'`. Vite supports multiple entries — each additional key builds its own bundle (e.g. a future CMS app in its own top-level folder, mirroring `client/`'s structure). The Nunjucks `vite()` helper already takes an `entry` param (`vite({ entry: 'app', type: 'script' })`), so wiring a new bundle into a template only needs the matching `entry:` value — no other config changes. Not in use yet — there's currently only one entry (`app`)
- **Output**: assets land in `public/js/`, `public/css/`, `public/img/` — served directly by Express (`outDir: public/`, `emptyOutDir: false` so backend-served files aren't wiped)
- **Dev server**: runs alongside Express (`vp dev` + `nodemon`, via `concurrently`) with HMR (Hot Module Replacement) — edited modules are swapped in the running app over the existing socket connection, so a full page reload isn't needed; CORS is open (`origin: '*'`) so the two servers talk freely; `host: process.env.VITE_HOST || true` binds all interfaces by default so it prints a LAN URL too (`Network: http://<your-ip>:5173/`) — useful for testing from a phone on the same network. Set `VITE_HOST` in `.env` only if you need to force a specific host (e.g. a fixed IP/hostname); leave it unset for the auto-detected default
- **Alias**: `@client` → `client/`
- **Manifest**: `vite-plugin-dev-manifest` writes `public/.vite/manifest.<NODE_ENV>.json`, which the Nunjucks templates read to inject the correct `<script>`/`<link>` tags in dev and production
- **Cache hashing**: controlled by `VITE_CHUNK_NAMES` — `true` adds `-[hash]` to output filenames, `false` (default) keeps plain names for simpler debugging

For complex apps, keep state in [Pinia](https://pinia.vuejs.org/) (see [State — `client/store/`](#state--clientstore)) rather than local component `ref`/`reactive`. Component-local state resets whenever HMR can't hot-swap a module in place and falls back to a full reload; state that lives in a store is less likely to be lost across that reload.

## Dependencies — what and why

| Package                            | Purpose                                                 |
| ---------------------------------- | ------------------------------------------------------- |
| `@vulkano/core`                    | The framework core (Express, Mongoose, Socket.io, etc.) |
| `vue` + `vue-router`               | Frontend SPA                                            |
| `vite-plus` + `@vitejs/plugin-vue` | Frontend bundler                                        |
| `concurrently`                     | Runs vp + nodemon together in `npm run dev`             |
| `vite-plugin-dev-manifest`         | Writes manifest.json for asset injection in dev mode    |
| `sass`                             | SCSS compilation                                        |
| `nodemon`                          | Auto-restarts Vulkano on file changes (dev only)        |

## Deployment

- `ecosystem.config.js` — PM2 config for VPS deployment (bare-metal/VPS, no container)
- `Dockerfile` — multi-stage build: `build` stage runs `pnpm install --frozen-lockfile` + `pnpm run build` (produces `public/`), `runtime` stage installs prod-only deps and copies `public/`, `app/`, `app.js`; exposes port `8000`, runs `node app.js`
- `docker-compose.yml` — `app` service builds from the `Dockerfile`, reads `.env` via `env_file`, maps `${PORT:-8000}`; optional `mongo` service under the `local-db` profile for local Mongo without a managed DB
- **Coolify**: default build pack is Nixpacks (auto-detects Node, runs `pnpm install` + start script), not the repo's `Dockerfile` — pick "Dockerfile" as the build pack in the Coolify app settings if you want it to build from `Dockerfile`/`docker-compose.yml` instead. No dedicated Coolify config file in the repo either way
