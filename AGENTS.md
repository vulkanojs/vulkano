## What this project is

This is the **Vulkano Framework** — the full-stack app template built on top of `@vulkano/core`. It combines an Express MVC backend with a Vue 3 frontend, bundled by Vite. It is the starting point for new Vulkano-based applications.

- **Backend**: `@vulkano/core` (Express, Mongoose, Socket.io, JWT, i18n)
- **Frontend**: Vue 3 + Vue Router, bundled by Vite Plus
- **Package manager**: `pnpm`
- **Node**: `>=22`

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
│   └── views/              # Nunjucks/Handlebars templates
│
├── client/                 # Vue 3 main app
│   ├── app.js              # Vue entry — mounts App.vue, registers $api global
│   ├── App.vue
│   ├── routes.js           # Vue Router routes
│   ├── Api.js              # Native fetch wrapper (replaces axios)
│   ├── components/
│   ├── layouts/
│   └── views/
││
└── public/                 # Built assets (output of vite build)
    ├── js/
    ├── css/
    ├── img/
    └── files/              # Uploaded files
```

---

## Key conventions

### Naming: controllers in plural, models in singular
`@vulkano/core` pairs each model with a controller by name, so the naming convention is what makes the auto-routing work:
- **Model** → singular PascalCase (e.g., `Project.js` → `global.Project`)
- **Controller** → plural PascalCase + `Controller` suffix (e.g., `ProjectsController.js`)

### Backend routing: convention over configuration
`@vulkano/core` maps browser/API URLs to controllers automatically — no manual route wiring needed for the common cases. The URL segments map to `/:resource/:method?/:param?`, resolving to `<Resource>sController.<method>(param)`:

```
GET /projects/edit/1
     │        │    │
     │        │    └── param  → passed as the method argument
     │        └─────── method → ProjectsController.edit
     └──────────────── resource ("projects") → ProjectsController
```

REST-style verbs follow the same resource → controller mapping:
- `GET /product` → `ProductsController.get`
- `GET /product/:id` → `ProductsController['get :id']`
- `POST /product` → `ProductsController.post`
- `PUT /product/:id` → `ProductsController['put :id']`
- `PATCH /product/:id` → `ProductsController['patch :id']`
- `DELETE /product/:id` → `ProductsController['delete :id']`
- `POST /product/save` → `ProductsController['post save']`

`app/config/routes.js` is optional — use it to add explicit mappings when a URL doesn't fit the resource/method convention, without giving up the convention for the rest of the app.

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

---


## Environment variables

```
PORT=8000
HOST=localhost
MONGO_URI=mongodb://localhost:27017/myapp
SALT_KEY=random-string
JWT_SECRET=supersecret
VITE_HOST=localhost
VITE_CHUNK_NAMES=false
```

<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.

<!--VITE PLUS END-->

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
