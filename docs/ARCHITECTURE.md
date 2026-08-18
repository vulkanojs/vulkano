# Architecture

Project structure overview for the Vulkano Framework. See [docs/BACKEND.md](docs/BACKEND.md) for backend (`app/`) conventions and [docs/FRONTEND.md](docs/FRONTEND.md) for frontend (`client/`) conventions. See [AGENTS.md](AGENTS.md) for workflow, safety, and security rules. See [docs/ANALYTICS.md](docs/ANALYTICS.md) for the tracking convention and [docs/ACCESSIBILITY.md](docs/ACCESSIBILITY.md) for accessibility minimums — both apply to frontend work.

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
