---
name: vulkano-frontend-entrypoint
description: Use when creating a brand-new Vue frontend entrypoint in this Vulkano framework project — a CMS/admin panel, a custom landing, or any additional app beyond the existing one — covering the flat-vs-container folder migration, Vite/nodemon wiring, the backend template/controller/catch-all, and the SEO/Analytics/Accessibility area decision.
---

# Frontend Entrypoint

## Overview

A Vulkano project can have more than one Vue app — public front, CMS/admin, a one-off landing. Each gets its own Vite build entry and its own backend template + controller + catch-all route. This skill is for creating a **new** entrypoint. Not for adding a route inside one that already exists (see vulkano-frontend-router). Not for a component/view's own internals (see vulkano-frontend-component).

## When to use

- Adding a CMS/admin app, a landing page built as its own app, or any second-or-later Vue app to the project
- Migrating a single-entrypoint project into its first multi-entrypoint layout

## Folder placement — threshold rule

- **1 entrypoint** — `frontend/` stays flat: `frontend/app.js`, `frontend/App.vue`, `frontend/routes.js`, etc. No subfolder.
- **2+ entrypoints** — `frontend/` becomes a container. Adding the 2nd entrypoint is what triggers the migration: the existing flat app moves to `frontend/website/` (fixed name for the public front), each new one gets its own `frontend/<name>/` (e.g. `frontend/admin/`).

```
frontend/
├── website/
│   ├── app.js
│   ├── App.vue
│   ├── routes.js
│   ├── Api.js
│   ├── style.scss
│   ├── components/_index.scss
│   ├── layouts/
│   └── views/_index.scss
└── admin/
    └── ...              # same shape
```

See docs/ARCHITECTURE.md § Multiple entry points for the full rationale.

## Scaffolding a new entrypoint

Mirror the existing app's shape exactly — same files, per vulkano-frontend-component:

```
frontend/<name>/
  app.js            # Vue entry — mounts App.vue, registers $api
  App.vue           # <router-view></router-view>
  routes.js         # Vue Router routes for this app
  Api.js            # its own fetch wrapper (or share one, project's call)
  style.scss        # this app's own style entry
  components/_index.scss
  layouts/
  views/_index.scss
```

**Alias per entrypoint:** `vite.config.mjs` `resolve.alias` defines one alias per entrypoint, named after it (e.g. `@website` → `frontend/website/`, `@admin` → `frontend/admin/`). A new entrypoint needs its own alias entry added at the same time — copy the pattern, don't reuse another entrypoint's. Use **relative imports** inside each entrypoint (`./style.scss`, `./routes`, `./App.vue`, `./Api`) for its own files; reach for the entrypoint's own alias only when a deep import reads clearer absolute (e.g. `@admin/components/ui/Button.vue` from a nested file). Never reference another entrypoint's alias (`@website` from inside `frontend/admin/`, or vice versa) — entrypoints stay isolated; share code via a `frontend/shared/` folder instead, imported by relative path.

**Router base path — required for any non-root entrypoint:** `createWebHistory()` defaults to base `/`, so Vue Router matches routes against the full URL path with no prefix stripped. An entrypoint mounted under a path prefix (e.g. `/admin`) MUST pass that prefix as the base — `createWebHistory('/admin')` in `app.js` — or every route in `routes.js` silently fails to match once served from the real backend URL (works fine in isolation/dev-root testing, breaks only once the catch-all route actually serves it under its prefix). Only the entrypoint mounted at `/` (the public front) omits the base. This must match the catch-all path registered in `app/config/routes.js` exactly (see Wiring below and vulkano-frontend-router § Multiple entry points).

## Wiring

- **`vite.config.mjs`** — add a key to `build.rollupOptions.input`:
  ```js
  input: {
    app: 'frontend/website/app.js',
    admin: 'frontend/admin/app.js'
  }
  ```
  Each key is a separate bundle, addressable from a template via `vite({ entry: '<key>', type: '...' })`.
- **`vite.config.mjs`** — also add the new entrypoint's own alias to `resolve.alias`:
  ```js
  resolve: {
    alias: {
      '@website': path.resolve(__dirname, 'frontend') + '/website/',
      '@admin': path.resolve(__dirname, 'frontend') + '/admin/'
    }
  }
  ```
- **`nodemon.json`** — no change needed. `ignore` already has `frontend/`, which covers every entrypoint under it.
- **Backend template** — `app/views/_shared/templates/<name>.html`, a copy of `default.html` with its own `vite({ entry: '<name>', ... })` calls. Drop the SEO meta block if the area has SEO off (see vulkano-seo).
- **Backend controller** — one per area (e.g. `AdminController.get`), rendering that area's own view (see vulkano-backend-controller):
  ```js
  module.exports = {
    get(req, res) {
      res.render('admin/index.html'); // extends _shared/templates/admin.html
    }
  };
  ```
- **Catch-all route** — in `app/config/routes.js`, scoped to the area's path prefix, registered **before** the generic `/*`:
  ```js
  module.exports = {
    '/': 'HomeController.get',
    '/admin/*': 'AdminController.get', // must come before '/*'
    '/*': 'HomeController.get'
  };
  ```
  See vulkano-frontend-router § Multiple entry points for why the order matters — convention API routes (`/api/*`) register before `config/routes.js` entries, so `/*` never shadows them regardless of where it sits, but a scoped catch-all still needs to precede the generic one or it gets shadowed by it.

## SEO / Analytics / Accessibility per area

Every new entrypoint is a new "area" per AGENTS.md § Project requirements. Before considering the entrypoint done:

1. Ask the user which kind of area this is (landing / landing+form / website / blog, embeddable widget, or CMS/admin panel) if not already stated.
2. Map it to SEO/Analytics/Accessibility on/off per the existing rule in AGENTS.md.
3. Add a row for it to the table in AGENTS.md § Project requirements, and show the user the result.

## After writing

- Confirm `vite.config.mjs` `resolve.alias` has an entry for the new entrypoint (`@<name>` → `frontend/<name>/`) — missing this doesn't break the build, it just leaves the new app without its own alias.
- Run `pnpm run build` (or `vp build`) and confirm the new entry appears in `public/.vite/manifest.<env>.json`.
- Hit the new area's path in a browser; confirm a hard refresh doesn't 404 (catch-all working, not just in-app navigation) AND the view actually renders — a 200 with a blank page is the tell for a missing/wrong `createWebHistory(base)` (see Router base path above), not a catch-all problem.
- Run `vp check` and `vp test`.

## Reference

docs/ARCHITECTURE.md § Multiple entry points, vulkano-frontend-router § Multiple entry points / Backend catch-all, vulkano-backend-controller, vulkano-seo, AGENTS.md § Project requirements.
