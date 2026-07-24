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

### Backend routing: convention over configuration
`@vulkano/core` maps browser/API URLs to controllers automatically — no manual route wiring needed for the common cases. The URL segments map to `/:resource/:method?/:param?`, resolving to `<Resource>Controller.<method>(param)`:

```
GET /products/edit/1
     │        │    │
     │        │    └── param  → passed as the method argument
     │        └─────── method → ProductsController.edit
     └──────────────── resource ("products") → ProductsController
```

REST-style verbs (HTTP METHODS) follow the same resource → controller mapping:
- `GET /products` → `ProductsController.get`
- `GET /products/:id` → `ProductsController['get :id']`
- `POST /products` → `ProductsController.post`
- `PUT /products/:id` → `ProductsController['put :id']`
- `PATCH /products/:id` → `ProductsController['patch :id']`
- `DELETE /products/:id` → `ProductsController['delete :id']`

#### Method key convention: `'<verb>? <path tail>'`
A controller method key is `<path tail>` on its own, or `'<verb> <path tail>'` when the verb isn't GET. The auto-router only ever reassigns the HTTP method when the key has a space-separated verb prefix — otherwise it defaults to **GET**. So:
- `get(req, res)` / `'get :id'` — the plain REST verbs already covered above.
- A **custom action name with no verb prefix** (no space in the key) is still GET, e.g. `me(req, res)` on `AuthController` → `GET /api/auth/me`. Don't write `'get me'`; it's redundant.
- A **custom action that isn't GET** needs the verb spelled out, e.g. `'post login'` → `POST /api/auth/login`, `'post logout'` → `POST /api/auth/logout`.
- The path tail can carry arbitrary nested segments and multiple params — the auto-router just appends whatever follows the verb straight onto the URL:

```js
// domain.com/api/products/
// controllers/api/ProductsController.js
module.exports = {

  // GET domain.com/api/products/123/variants/988
  'get :id/variants/:variant': (req, res) => {
    // req.params → { id: '123', variant: '988' }
  }

};
```

```js
// domain.com/api/auth/
// controllers/api/AuthController.js
module.exports = {

  // GET /api/auth/me — no verb prefix needed, GET is the default
  me(req, res) { },

  // POST /api/auth/login
  'post login': (req, res) => { },

  // POST /api/auth/logout
  'post logout': (req, res) => { }

};
```

All of this is mapped automatically — no `routes.js` entry needed. The one hard rule: the resource segment in the URL is always the requesting controller's own filename (`ProductsController` → `products`).

#### When you actually need `app/config/routes.js`
`routes.js` exists for flexibility/customization, or as a fallback for whatever the convention can't resolve on its own:
- **You want a URL shape the convention can't produce at all**, e.g. an absolute path (`/`), or breaking the "resource segment = controller filename" rule entirely (a catch-all like `/*` for the frontend router).
- **For more routes as definition**:
  ```js

  // Most flexible
  '/test': (req, res) => {
    res.json({ message: 'Hello, world!' });
  }
  ```
- **For more complex and advanced routing as method**:
  ```js

  // More advanced — `app` is the global Vulkano object; the Express instance lives at `app.vulkano`
  custom() {

    app.vulkano.get('/test', (req, res) => {
      res.json({ hello: 'world' });
    });

    app.vulkano.get('/test2', (req, res) => {
      res.json({ hello: 'world2' });
    });

    app.vulkano.get('/test3', (req, res) => {
      res.json({ hello: 'world3' });
    });

  },
  ```

For everything else don't add entries to `routes.js`; a redundant explicit entry just gives the route two sources of truth that can drift apart.

### Controllers stay thin — business logic lives in the model
Controllers only orchestrate the HTTP request/response cycle: read params, call the model, send the response with `res.vsr(...)` for REST API or `res.render(...)` for server-side rendering. They must **not** contain business logic, validation rules, or data manipulation — that belongs on the model (as instance/static methods, hooks, or virtuals), so it stays reusable outside the HTTP layer (crontabs, sockets, other models, tests).

#### For REST API controllers, the convention is to have a single `get` method that returns JSON:
```js
module.exports = {

  // Example: GET /api/products?page=1 → controllers/api/ProductsController.get
  get(req, res) {

    // Status code: 200 (default)
    res.vsr(Product.getAll(req.query || {}));

  }

};
```

#### For Server Side Rendering (SSR) controllers, the convention is to have a single `get` method that renders the view:
```js
module.exports = {

  // Example: GET /home/ → controllers/HomeController.get
  get(req, res) {

    res.render('home/index.html');

  },

};
```

### Scaffold controllers
Point a controller at a model and get a full REST API for free — the simplest way to keep a controller free of logic when it's a plain CRUD resource:
```js
module.exports = {

  scaffold: 'Product', //ModelName

  allowedMethods: ['get', 'post', 'put', 'patch', 'delete']

};
```

A scaffold controller wires each allowed HTTP method to the matching standard CRUD method on the model (`getAll`, `get<ModelName>`, `create`, `update`, `delete` — see [Models](#models-business-logic-lives-here) below), so the model still needs those methods implemented or auto-generated.

NOTE: To find examples with the best practices, look in `@vulkano/core/examples/controllers` to find a well-structured controller for server side rendering, like `ExampleController.js`, REST API like `RestExampleController.js` and Scaffold REST API like `RestScaffoldController.js`.

### Models: business logic lives here
Files in `app/models/` are auto-loaded as globals. A file `Project.js` becomes `global.Project` (singular).
Every model gets `attributes` (Mongoose schema fields), plus `active`, `createdAt`, `updatedAt` automatically.

Models are where validation, data manipulation, and business rules belong — not just the raw Mongoose schema. Controllers should only ever call methods on the model; they shouldn't reach into `Model.find(...)` or manipulate documents directly.

#### Standard CRUD methods
Every model is expected to expose this same set of methods, so controllers can call them the same way regardless of the resource:

| Method | Purpose |
|---|---|
| `getAll(props)` | List/paginate records. `props` = `{ page, perPage, search, sort }` |
| `get<ModelName>(id)` | Get a single record by id (e.g. `getProject(id)`) |
| `create(data)` | Create a new record |
| `update(id, data)` | Update a record by id |
| `delete(id)` | Soft-delete a record (sets `active: false`) |

#### Hooks
Models can define `beforeSave(cb)` and `afterSave(data, cb)` for side effects tied to persistence (e.g. sending an email, syncing a related record). Keep these focused on cross-cutting effects, not core validation — validation belongs in `attributes`.

NOTE: To find examples with the best practices for available methods ahd hooks, look in `@vulkano/core/examples/models` and read the file `Example.js`, and Scaffold Model API `ExampleWithScaffold.js`.

### Services / libs
Files in `app/services/` are auto-loaded as globals. PascalCase filename = global name.
Framework globals available everywhere: `VSError`, `Jwt`, `Paginate`, `Merge`, `Encrypter`, `Filter`, `Crontab`, `ApiClient`, `i18n`, `mongoose`.

### Responses

#### REST API responses
All controller actions in the REST API use `res.vsr(promise, statusCode?)`:
```js
res.vsr(Promise.resolve({ data }));         // 200
res.vsr(Promise.resolve({ data }), 201);    // 201
res.vsr(VSError.notFound('Item'));           // 404
res.vsr(VSError.reject('Not allowed', 403)); // 403
```

Every `res.vsr` response is wrapped in the same envelope, regardless of success or failure:

```json
{ "success": true, "statusCode": 200, "data": { … } }
```

#### Server Side Rendering responses
All controller actions in the SSR use `res.render(template, data?)`:
```js
res.render('home/index.html', { title: 'Home' });
```

### Explicit routes (`app/config/routes.js`)
```js
module.exports = {
  '/': 'HomeController.get',
  // '/*': 'HomeController.get', // catch-all (uncomment if using frontend routing)
  '/admin*': 'HomeController.cms',
};
```

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
