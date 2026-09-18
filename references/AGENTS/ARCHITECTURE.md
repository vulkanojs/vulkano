# Architecture

Project structure overview for the Vulkano Framework. See [BACKEND.md](BACKEND.md) for backend (`app/`) conventions, [FRONTEND.md](FRONTEND.md) for frontend (`frontend/`) conventions, and [SEO.md](SEO.md) for the SEO convention referenced in [ENTRYPOINTS.md](ENTRYPOINTS.md). See [../../AGENTS.md](../../AGENTS.md) for workflow, safety, and security rules. See [ANALYTICS.md](ANALYTICS.md) for the tracking convention and [ACCESSIBILITY.md](ACCESSIBILITY.md) for accessibility minimums — both apply to frontend work. See [VITE.md](VITE.md) for `vite.config.mjs` build/dev mechanics and the backend `vite()` injection helper, and [ROUTING.md](ROUTING.md) for frontend routes + the backend SPA catch-all convention.

## Project structure

```
framework/
├── app.js                  # Entry point — calls vulkano()
├── vite.config.mjs         # Vite config — reads vite.entries.mjs for build.rollupOptions.input/aliases
├── vite.entries.mjs        # One key per entrypoint (e.g. { website: 'frontend/website/app.js' }) — see [ENTRYPOINTS.md](ENTRYPOINTS.md)
├── nodemon.json            # Nodemon watches app/ only (ignores public/, frontend/, references/, test, scripts)
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
├── frontend/                # Vue 3 apps — always one folder per entrypoint, even with only 1 (below); ships
│   │                        # with 2 by default — see [ENTRYPOINTS.md](ENTRYPOINTS.md)
│   ├── website/             # Public front — see [ENTRYPOINTS.md](ENTRYPOINTS.md)
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

(`.claude/`, `.github/`, `references/`, `scripts/`, and `test/` sit alongside the above at the repo root — omitted from the tree since it's dotfiles/tooling, not app structure.)

---

## Skills submodule (`.claude/skills/vulkano-skills/`)

The `vulkano-*` Claude Code skills referenced throughout this doc and [AGENTS.md](../../AGENTS.md) don't live in this repo directly — they're a separate repo, [github.com/vulkanojs/vulkano-skills](https://github.com/vulkanojs/vulkano-skills), mounted here as a git submodule at `.claude/skills/vulkano-skills/`. This keeps the skills versioned and shareable across every Vulkano-based project instead of copy-pasted per project.

Adding the submodule to a new project, pulling updates, adding/editing a skill — see `.claude/skills/vulkano-skills/README.md`, that repo's own doc and single source of truth for those steps.

---

## Multiple entry points — front + CMS (or any other split app)

Moved to [ENTRYPOINTS.md](ENTRYPOINTS.md) — read it only when creating, renaming, removing, or wiring a frontend entrypoint.
