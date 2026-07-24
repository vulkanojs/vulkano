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
│   │   └── api/            # Scaffold or custom API controllers
│   ├── models/             # Mongoose models (auto-loaded as globals)
│   ├── services/           # Shared libs (auto-loaded as globals)
│   ├── views/              # Nunjucks/Handlebars templates
│   └── tests/
│       ├── unit/           # Unit tests for models/services (Vitest, via `pnpm test:backend`)
│       └── integration/    # Integration tests for controllers/routes
│
├── client/                 # Vue 3 main app
│   ├── app.js              # Vue entry — mounts App.vue, registers $api global
│   ├── App.vue
│   ├── routes.js           # Vue Router routes
│   ├── Api.js              # Native fetch wrapper (replaces axios)
│   ├── components/
│   ├── layouts/
│   └── views/
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
    children: [
      { path: '', component: Homepage },
    ],
  }
];

export default (history) => createRouter({ history, routes });
```

### Calling the API from a component
`$api` is registered as a global property, so it's available in every component:
```vue
<script>
export default {
  async created() {
    this.products = await this.$api.get('/product');
  }
}
</script>
```

`client/Api.js` is a thin `fetch` wrapper (no axios): it prefixes requests with `/api`, serializes/parses JSON, unwraps the `data` field from the `res.vsr` envelope, and rejects with the raw `Response` on non-2xx status.

### Vite (`vite.config.mjs`)
- **Single entry point**: `client/app.js` — Rolldown builds one bundle, no separate admin/CMS bundle
- **Output**: assets land in `public/js/`, `public/css/`, `public/img/` — served directly by Express (`outDir: public/`, `emptyOutDir: false` so backend-served files aren't wiped)
- **Dev server**: runs alongside Express (`vp dev` + `nodemon`, via `concurrently`) with HMR; CORS is open (`origin: '*'`) so the two servers talk freely; host is `VITE_HOST` (defaults to `localhost`)
- **Alias**: `@client` → `client/`
- **Manifest**: `vite-plugin-dev-manifest` writes `public/.vite/manifest.<NODE_ENV>.json`, which the Nunjucks templates read to inject the correct `<script>`/`<link>` tags in dev and production
- **Cache hashing**: controlled by `VITE_CHUNK_NAMES` — `true` adds `-[hash]` to output filenames, `false` (default) keeps plain names for simpler debugging

## Dependencies — what and why

| Package | Purpose |
|---------|---------|
| `@vulkano/core` | The framework core (Express, Mongoose, Socket.io, etc.) |
| `vue` + `vue-router` | Frontend SPA |
| `vite-plus` + `@vitejs/plugin-vue` | Frontend bundler |
| `concurrently` | Runs vp + nodemon together in `npm run dev` |
| `vite-plugin-dev-manifest` | Writes manifest.json for asset injection in dev mode |
| `sass` | SCSS compilation |
| `nodemon` | Auto-restarts Vulkano on file changes (dev only) |

## Deployment

- `ecosystem.config.js` — PM2 config for VPS deployment
