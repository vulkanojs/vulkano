# Architecture

Project structure overview for the Vulkano Framework. See [BACKEND.md](BACKEND.md) for backend (`app/`) conventions, [FRONTEND.md](FRONTEND.md) for frontend (`frontend/`) conventions, and [SEO.md](SEO.md) for the SEO convention referenced in [Multiple entry points](#multiple-entry-points--front--cms-or-any-other-split-app) below. See [../AGENTS.md](../AGENTS.md) for workflow, safety, and security rules. See [ANALYTICS.md](ANALYTICS.md) for the tracking convention and [ACCESSIBILITY.md](ACCESSIBILITY.md) for accessibility minimums — both apply to frontend work.

## Project structure

```
framework/
├── app.js                  # Entry point — calls vulkano()
├── vite.config.mjs         # Vite config (2 entry points by default: frontend/website/, frontend/admin/ — see § Multiple entry points)
├── nodemon.json            # Nodemon watches app/ only (ignores public/, frontend/, reference/, test, scripts, inbox)
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
├── frontend/                # Vue 3 apps — ships with 2 entrypoints by default (below); collapse to 1
│   │                        # flat app with `pnpm run clean` if multi-entry isn't needed
│   ├── website/             # Public front — see § Multiple entry points
│   │   ├── app.js           # Vue entry — mounts App.vue, registers $api global
│   │   ├── App.vue
│   │   ├── routes.js        # Vue Router routes
│   │   ├── Api.js           # Native fetch wrapper (replaces axios)
│   │   ├── style.scss       # Single style entry point — chains components/views/layouts index
│   │   ├── components/
│   │   │   ├── _index.scss  # Aggregator — imports every component's own _index.scss
│   │   │   └── MyComponent/
│   │   │       ├── MyComponent.vue
│   │   │       ├── MyComponent.js
│   │   │       └── _index.scss
│   │   ├── layouts/
│   │   │   ├── _index.scss  # Aggregator — imports every layout's own _index.scss
│   │   │   └── Layout.vue / Layout.js
│   │   └── views/
│   │       ├── _index.scss  # Aggregator — imports every view's own _index.scss (or module's)
│   │       ├── MyView/       # /my-view → views/MyView/Index.*
│   │       │   ├── Index.vue
│   │       │   ├── Index.js
│   │       │   └── _index.scss
│   │       └── MyModule/     # /my-module/my-view → views/MyModule/MyView/Index.*
│   │           ├── _index.scss # Aggregator — imports every child view's _index.scss
│   │           └── MyView/
│   │               ├── Index.vue
│   │               ├── Index.js
│   │               └── _index.scss
│   │
│   └── admin/                # Admin panel — same shape as website/, minimal by default
│       └── ...
│
└── public/                 # Built assets (output of vite build)
    ├── js/
    ├── css/
    ├── img/
    └── files/              # Uploaded files
```

---

## Multiple entry points — front + CMS (or any other split app)

A project isn't limited to one Vue app. When it has genuinely separate areas — e.g. a public front (landing + form), a CMS/admin panel, a one-off landing — each area gets **its own Vue app, its own Vite build entry, and its own backend layout**, not one shared entry with route-based conditionals. This is what makes [AGENTS.md § Project requirements](../AGENTS.md#project-requirements--seo--analytics--accessibility) work per area: SEO/Analytics/Accessibility toggle per entry point, not per whole project. `.claude/skills/vulkano-frontend-entrypoint/SKILL.md` covers the full scaffold checklist for creating a new one — the summary below is the rationale/reference, that skill is the actionable one.

**This template ships with 2 entrypoints by default** (`frontend/website/` public front + `frontend/admin/` minimal admin panel) so both shapes are demonstrated out of the box. `frontend/admin/` only exists to demonstrate the 2-entrypoint shape — it carries no content worth keeping on its own. If a project only needs 1, run `pnpm run clean` and choose "1" — it removes `frontend/admin/`, its backend template/controller/route, and its row in the AGENTS.md table, then flattens `frontend/website/` back to a flat `frontend/`.

**Threshold rule — flat vs container:**

- **1 entrypoint** — `frontend/` stays flat, exactly like a single-app project: `frontend/app.js`, `frontend/App.vue`, `frontend/routes.js`, etc.
- **2+ entrypoints** — `frontend/` becomes a container, one subfolder per app. Adding the 2nd entry is what triggers the migration: the existing flat app moves to `frontend/website/` (the public front keeps this fixed name), the new one(s) get `frontend/<name>/` (e.g. `frontend/admin/`, `frontend/landingx/`).

```
frontend/
├── website/                 # Front — public, SEO area
│   ├── app.js
│   ├── App.vue
│   ├── routes.js
│   └── ...
│
├── admin/                    # Admin — internal, logged-in area
│   ├── app.js
│   ├── App.vue
│   ├── routes.js
│   └── ...
│
└── landingx/                # One-off landing — its own area
    ├── app.js
    ├── App.vue
    ├── routes.js
    └── ...
```

Wire a new entry:

- **`vite.config.mjs`** — add a key to `build.rollupOptions.input` (e.g. `{ app: 'frontend/website/app.js', admin: 'frontend/admin/app.js' }`), plus its own alias in `resolve.alias` (e.g. `@admin` → `frontend/admin/`). Each key becomes a separate bundle, addressable from a template by that name.
- **`nodemon.json`** — no per-app entry needed: `ignore` already covers the whole tree with `frontend/`, since every app lives under that one folder.
- **Backend layout** — each entry needs its own base template under `app/views/_shared/templates/` (e.g. `default.html` for front, `admin.html` for the admin area), each calling `vite({ entry: '<name>', type: '...' })` with its own entry name. Don't reuse one layout for both — the admin layout has no SEO meta block (see [reference/SEO.md](SEO.md)), the front layout does.
- **Routing** — each area keeps its own SPA catch-all in `app/config/routes.js` per `.claude/skills/vulkano-frontend-router/SKILL.md` § Multiple entry points, scoped to that area's path prefix (e.g. `/admin/*` → `AdminController.get`, rendering the admin layout) instead of one global `/*` for everything.

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
