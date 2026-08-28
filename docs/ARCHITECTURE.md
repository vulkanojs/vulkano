# Architecture

Project structure overview for the Vulkano Framework. See [BACKEND.md](BACKEND.md) for backend (`app/`) conventions, [FRONTEND.md](FRONTEND.md) for frontend (`client/`) conventions, and [SEO.md](SEO.md) for the SEO convention referenced in [Multiple entry points](#multiple-entry-points--front--cms-or-any-other-split-app) below. See [../AGENTS.md](../AGENTS.md) for workflow, safety, and security rules. See [ANALYTICS.md](ANALYTICS.md) for the tracking convention and [ACCESSIBILITY.md](ACCESSIBILITY.md) for accessibility minimums — both apply to frontend work.

## Project structure

```
framework/
├── app.js                  # Entry point — calls vulkano()
├── vite.config.mjs         # Vite config (entry points: client/ — add more per § Multiple entry points below)
├── nodemon.json            # Nodemon watches app/ only (ignores public/, client/, docs/, test, scripts, inbox)
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

## Multiple entry points — front + CMS (or any other split app)

A project isn't limited to one Vue app. When it has genuinely separate areas — e.g. a public front (landing + form) and a CMS/admin panel — each area gets **its own Vue app, its own Vite build entry, and its own backend layout**, not one shared entry with route-based conditionals. This is what makes [AGENTS.md § Project requirements](../AGENTS.md#project-requirements--seo--analytics--accessibility) work per area: SEO/Analytics/Accessibility toggle per entry point, not per whole project.

```
client/                   # Front — public, SEO area
├── app.js
├── App.vue
├── routes.js
└── ...

cms/                       # CMS — internal, logged-in area
├── app.js
├── App.vue
├── routes.js
└── ...
```

Wire the second entry:

- **`vite.config.mjs`** — add a second key to `build.rollupOptions.input` (e.g. `{ app: 'client/app.js', cms: 'cms/app.js' }`). Each key becomes a separate bundle, addressable from a template by that name.
- **`nodemon.json`** — add the new client folder to `ignore` alongside `client/`, same reason: it's frontend source, not backend, and doesn't need an app restart on change.
- **Backend layout** — each entry needs its own base template under `app/views/_shared/templates/` (e.g. `default.html` for front, `cms.html` for CMS), each calling `vite({ entry: '<name>', type: '...' })` with its own entry name. Don't reuse one layout for both — the CMS layout has no SEO meta block (see [docs/SEO.md](SEO.md)), the front layout does.
- **Routing** — each area keeps its own SPA catch-all in `app/config/routes.js` per `.claude/skills/vulkano-frontend-router/SKILL.md` § Multiple entry points, scoped to that area's path prefix (e.g. `/cms/*` → `CmsController.get`, rendering the CMS layout) instead of one global `/*` for everything.

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

**CI/CD pipeline: TBD.** No automated pipeline (GitHub Actions or otherwise) exists yet — deploys today are manual, via one of PM2/Docker/Coolify below.

- `ecosystem.config.js` — PM2 config for VPS deployment (bare-metal/VPS, no container)
- `Dockerfile` — multi-stage build: `build` stage runs `pnpm install --frozen-lockfile` + `pnpm run build` (produces `public/`), `runtime` stage installs prod-only deps and copies `public/`, `app/`, `app.js`; exposes port `8000`, runs `node app.js`
- `docker-compose.yml` — `app` service builds from the `Dockerfile`, reads `.env` via `env_file`, maps `${PORT:-8000}`; optional `mongo` service under the `local-db` profile for local Mongo without a managed DB
- **Coolify**: default build pack is Nixpacks (auto-detects Node, runs `pnpm install` + start script), not the repo's `Dockerfile` — pick "Dockerfile" as the build pack in the Coolify app settings if you want it to build from `Dockerfile`/`docker-compose.yml` instead. No dedicated Coolify config file in the repo either way
