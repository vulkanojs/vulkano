# Architecture

How the code is organized and what each piece is. Read when creating a file or folder, or when unsure where something lives.

## Project structure

```
framework/
├── app.js                  # Entry point — calls vulkano()
├── vite.config.mjs         # Vite config — reads vite.entries.mjs (see BUILD.md)
├── vite.entries.mjs        # One key per frontend entrypoint, e.g. { website: 'frontend/website/app.js' }
├── nodemon.json            # Restarts Express on app/, app.js, .env changes only
│
├── app/                    # Backend — Express MVC on @vulkano/core (see BACKEND.md)
│   ├── config/
│   │   ├── settings.js     # Port, DB URI (auth setup adds the salt)
│   │   ├── routes.js       # Explicit routes only (convention covers the rest)
│   │   ├── <section>.js    # Any file here → app.config.<section> (e.g. common.js)
│   │   ├── env/<NODE_ENV>/ # Optional per-environment overrides (not shipped — BACKEND.md § Config)
│   │   ├── local.js        # Optional per-machine overrides, gitignored (not shipped)
│   │   ├── bootstrap.js    # Boot hook — true globals, cron jobs
│   │   ├── express/        # Optional core overrides: cookies, cors, csp, helmet, json, jwt…
│   │   ├── middlewares/    # Optional global middlewares (e.g. seo.js)
│   │   ├── vite.js         # Vite manifest loading → the vite() helper in templates
│   │   ├── sockets/        # Optional — Socket.io config + events.js (not shipped)
│   │   └── locales/        # Optional — i18n files (not shipped)
│   ├── controllers/        # View controllers (res.render) — URL = controller name
│   │   ├── api/            # JSON API controllers (res.vsr) — /api/<resource>
│   │   └── sockets/        # Optional — Socket.io handlers (not shipped)
│   ├── models/             # Mongoose models — auto-loaded globals (Order.js → Order)
│   ├── services/           # Shared libs — auto-loaded globals
│   └── views/              # Nunjucks/Handlebars templates
│       ├── _shared/templates/  # Base layouts, one per entrypoint (default.html, admin.html)
│       ├── _shared/partials/
│       ├── _shared/errors/     # 404/500
│       └── <resource>/*.html   # Page views
│
├── frontend/               # Vue 3 apps — always one folder per entrypoint, even with only 1 (see FRONTEND.md)
│   ├── website/            # Public front (fixed name)
│   │   ├── app.js          # Vue entry — mounts App.vue, registers $api
│   │   ├── App.vue
│   │   ├── routes.js       # Vue Router routes
│   │   ├── Api.js          # fetch wrapper → /api
│   │   ├── style.scss      # Single style entry — chains the _index.scss aggregators
│   │   ├── scss/           # _tokens.scss (design tokens), _base.scss (element styles), _grid.scss
│   │   ├── components/<Name>/   # <Name>.vue + <Name>.js + _index.scss
│   │   ├── components/ui/       # Vendored UI-library components (created on demand)
│   │   ├── layouts/
│   │   ├── views/<Name>/Index.* # One folder per route
│   │   ├── views/DesignSystem/        # /design-system page (dev only)
│   │   ├── views/NotFound/  # catch-all route
│   │   ├── store/          # Pinia stores — use<Entity>Store.js (created on demand)
│   │   ├── composables/    # (created on demand)
│   │   └── utils/          # (created on demand)
│   └── admin/              # Admin panel — same shape, minimal by default
│
├── public/                 # Served as-is by Express
│   ├── js/ css/            # Vite build output
│   ├── img/ fonts/         # Static assets — referenced as /img/…, /fonts/…
│   ├── files/              # Downloadable/uploaded files
│   ├── robots.txt
│   └── sitemap.xml         # not shipped — created by the project (see BACKEND.md § SEO wiring)
│
├── test/                   # Vitest — mirrors source path (test/app/…, test/frontend/…, test/scripts/…)
├── scripts/                # Tooling (webp.js, clean…)
└── references/             # Agent docs (this folder)
```

## Request flow

- **Page** — browser → `app/controllers/<Name>Controller.js` → `res.render('<resource>/x.html')` → template under `app/views/` extends a base layout that injects one frontend entrypoint via `vite()`.
- **API** — Vue (`$api`) → `/api/<resource>` → `app/controllers/api/<Name>Controller.js` → model/service → `res.vsr()` envelope `{ success, statusCode, data }`.
- **SPA route** — client route inside a mounted Vue app; a hard refresh hits the backend catch-all, which re-renders the same layout.
- **Socket** — `app/config/sockets/events.js` → `app/controllers/sockets/<Name>Controller.js`.

## Entrypoints

Each separate area (public front, admin panel, one-off landing) is its own Vue app (or vanilla JS bundle), its own Vite entry, its own backend layout and its own catch-all — never one shared app with route conditionals. Template ships 2 (`website` + `admin`); `pnpm run clean` → "1" removes `admin`. Wiring: [BUILD.md](BUILD.md).

## Skills submodule

`.claude/skills/vulkano-skills/` is a git submodule ([vulkanojs/vulkano-skills](https://github.com/vulkanojs/vulkano-skills)), shared across Vulkano projects. Install/update/edit: its own `README.md`.
