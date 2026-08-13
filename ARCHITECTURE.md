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
│       ├── _index.scss     # Aggregator — imports every view's own _index.scss
│       └── MyView/
│           ├── MyView.vue
│           ├── MyView.js
│           └── _index.scss
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
-
- **MongoDB collection naming:** a model only maps to a table/collection if it defines `attributes` (schema fields) — a model file with no `attributes` is just a plain global, not backed by a collection.

By convention, model files should be named in singular (e.g. `User.js`), and the collection binding is automatic and singular-lowercase: `User.js` → collection `user`, `Project.js` → collection `project` (never pluralized like `users`/`projects`). Any script or tool that talks to the database directly (seeds, migrations, ad-hoc queries) must target that singular lowercase collection name to match what the running app actually uses.

### Backend conventions — owned by `@vulkano/core`

Routing (convention over configuration, method key convention, `app/config/routes.js`), the thin-controller/business-logic-in-model split, scaffold controllers, the model CRUD interface and hooks, auto-loaded globals, and the `res.vsr`/`res.render` response conventions are all defined by the framework core, not by this template. Source of truth: [`@vulkano/core` README](node_modules/@vulkano/core/README.md) (also mirrored at https://github.com/vulkanojs/vulkano-core). For worked examples, see `@vulkano/core/examples/controllers` (`ExampleController.js`, `RestExampleController.js`, `RestScaffoldController.js`) and `@vulkano/core/examples/models` (`Example.js`, `ExampleWithScaffold.js`).

This template only adds what follows below: the frontend, the dependency list, and deployment.

## Frontend — Vue 3 + Vite

The `client/` folder is a standard Vue 3 SPA wired to the Express backend via `Api.js`.

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

const routes = [
  {
    path: '/',
    component: Layout,
    children: [{ path: '', component: Homepage }]
  }
];

export default (history) => createRouter({ history, routes });
```

### Calling the API from a component

`$api` is registered as a global property, so it's available in every component:

```js
// MyComponent.js
export default {
  async created() {
    this.products = await this.$api.get('/product');
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

```
views/
  _index.scss           # imports every view's own _index.scss
  MyView/
    MyView.vue          # HTML
    MyView.js           # Logic
    _index.scss         # Styles
```

### Layout — CSS Grid

All layout — components and views, any dimension, any nesting level — uses CSS Grid (`display: grid`) in the `_index.scss`. No Flexbox, anywhere.

### Vite (`vite.config.mjs`)

- **Entry points**: `rollupOptions.input` (an object) currently maps a single key, `app: 'client/app.js'`. Vite supports multiple entries — each additional key builds its own bundle (e.g. a future CMS app in its own top-level folder, mirroring `client/`'s structure). The Nunjucks `vite()` helper already takes an `entry` param (`vite({ entry: 'app', type: 'script' })`), so wiring a new bundle into a template only needs the matching `entry:` value — no other config changes. Not in use yet — there's currently only one entry (`app`)
- **Output**: assets land in `public/js/`, `public/css/`, `public/img/` — served directly by Express (`outDir: public/`, `emptyOutDir: false` so backend-served files aren't wiped)
- **Dev server**: runs alongside Express (`vp dev` + `nodemon`, via `concurrently`) with HMR; CORS is open (`origin: '*'`) so the two servers talk freely; host is `VITE_HOST` (defaults to `localhost`)
- **Alias**: `@client` → `client/`
- **Manifest**: `vite-plugin-dev-manifest` writes `public/.vite/manifest.<NODE_ENV>.json`, which the Nunjucks templates read to inject the correct `<script>`/`<link>` tags in dev and production
- **Cache hashing**: controlled by `VITE_CHUNK_NAMES` — `true` adds `-[hash]` to output filenames, `false` (default) keeps plain names for simpler debugging

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
