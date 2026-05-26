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

### Backend routing (auto by convention)
`@vulkano/core` maps URLs to controllers automatically:
- `GET /product` → `ProductController.get`
- `GET /product/:id` → `ProductController['get :id']`
- `POST /product` → `ProductController.post`
- `PUT /product/:id` → `ProductController['put :id']`
- `PATCH /product/:id` → `ProductController['patch :id']`
- `DELETE /product/:id` → `ProductController['delete :id']`
- `POST /product/save` → `ProductController['post save']`

### Scaffold controllers
Point a controller at a model and get a full REST API for free:
```js
module.exports = {
  scaffold: 'ModelName',
  allowedMethods: ['get', 'post', 'put', 'patch', 'delete']
};
```

### Models
Files in `app/models/` are auto-loaded as globals. A file `Product.js` becomes `global.Product`.
Every model gets `active`, `createdAt`, `updatedAt` automatically.

### Services / libs
Files in `app/services/` are auto-loaded as globals. PascalCase filename = global name.
Framework globals available everywhere: `VSError`, `Jwt`, `Paginate`, `Merge`, `Encrypter`, `Filter`, `Crontab`, `ApiClient`, `i18n`, `mongoose`.

### Responses
All controller actions use `res.vsr(promise, statusCode?)`:
```js
res.vsr(Promise.resolve({ data }));         // 200
res.vsr(Promise.resolve({ data }), 201);    // 201
res.vsr(VSError.notFound('Item'));           // 404
res.vsr(VSError.reject('Not allowed', 403)); // 403
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
HOST=
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
