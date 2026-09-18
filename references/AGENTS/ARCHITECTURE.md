# Architecture

Project structure overview for the Vulkano Framework. See [BACKEND.md](BACKEND.md) for backend (`app/`) conventions, [FRONTEND.md](FRONTEND.md) for frontend (`frontend/`) conventions, and [SEO.md](SEO.md) for the SEO convention referenced in [Multiple entry points](#multiple-entry-points--front--cms-or-any-other-split-app) below. See [../../AGENTS.md](../../AGENTS.md) for workflow, safety, and security rules. See [ANALYTICS.md](ANALYTICS.md) for the tracking convention and [ACCESSIBILITY.md](ACCESSIBILITY.md) for accessibility minimums — both apply to frontend work. See [VITE.md](VITE.md) for `vite.config.mjs` build/dev mechanics and the backend `vite()` injection helper, and [ROUTING.md](ROUTING.md) for frontend routes + the backend SPA catch-all convention.

## Project structure

```
framework/
├── app.js                  # Entry point — calls vulkano()
├── vite.config.mjs         # Vite config — reads vite.entries.mjs for build.rollupOptions.input/aliases
├── vite.entries.mjs        # One key per entrypoint (e.g. { website: 'frontend/website/app.js' }) — see § Multiple entry points
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
│   │                        # with 2 by default — see § Multiple entry points
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

(`.claude/`, `.github/`, `references/`, `scripts/`, and `test/` sit alongside the above at the repo root — omitted from the tree since it's dotfiles/tooling, not app structure.)

---

## Skills submodule (`.claude/skills/vulkano-skills/`)

The `vulkano-*` Claude Code skills referenced throughout this doc and [AGENTS.md](../../AGENTS.md) don't live in this repo directly — they're a separate repo, [github.com/vulkanojs/vulkano-skills](https://github.com/vulkanojs/vulkano-skills), mounted here as a git submodule at `.claude/skills/vulkano-skills/`. This keeps the skills versioned and shareable across every Vulkano-based project instead of copy-pasted per project.

Adding the submodule to a new project, pulling updates, adding/editing a skill — see `.claude/skills/vulkano-skills/README.md`, that repo's own doc and single source of truth for those steps.

---

## Multiple entry points — front + CMS (or any other split app)

A project isn't limited to one Vue app. When it has genuinely separate areas — e.g. a public front (landing + form), a CMS/admin panel, a one-off landing — each area gets **its own Vue app, its own Vite build entry, and its own backend layout**, not one shared entry with route-based conditionals. This is what makes [PROJECT.md § Project requirements](../../PROJECT.md#project-requirements--seo--analytics--accessibility) work per area: SEO/Analytics/Accessibility toggle per entry point, not per whole project. `.claude/skills/vulkano-skills/vulkano-frontend-entrypoint/SKILL.md` covers the full scaffold checklist for creating a new one — the summary below is the rationale/reference, that skill is the actionable one.

**This template ships with 2 entrypoints by default** (`frontend/website/` public front + `frontend/admin/` minimal admin panel) so both shapes are demonstrated out of the box. `frontend/admin/` only exists to demonstrate the multi-entrypoint shape — it carries no content worth keeping on its own. If a project only needs 1, run `pnpm run clean` and choose "1" — it removes `frontend/admin/`, its backend template/controller/route, and its row in the AGENTS.md table. `frontend/website/` stays exactly where it is.

**`frontend/` is always a container, one subfolder per entrypoint — never flat, even with only 1.** `frontend/website/` (public front) and `frontend/<name>/` for every other area (e.g. `frontend/admin/`, `frontend/landingx/`) keep their own subfolder regardless of how many entrypoints the project has. Adding a new entrypoint is just adding another `frontend/<name>/` sibling — no flat-to-container migration to trigger.

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

- **`vite.entries.mjs`** — add a key to the `entries` map (e.g. `admin: 'frontend/admin/app.js'`). `vite.config.mjs` reads this single map for both `build.rollupOptions.input` and its `@<dir>` alias in `resolve.alias` — no separate alias edit needed. Each key becomes a separate bundle, addressable from a template by that name, built as its own isolated Rolldown pass (Vite's Environment API) so it never shares a chunk with another entry.
- **`nodemon.json`** — no per-app entry needed: `ignore` already covers the whole tree with `frontend/`, since every app lives under that one folder.
- **Backend layout** — each entry needs its own base template under `app/views/_shared/templates/` (e.g. `default.html` for front, `admin.html` for the admin area), each calling `vite({ entry: '<name>', type: '...' })` with its own entry name (see [VITE.md § Backend injection](VITE.md#backend-injection--the-vite-helper)). Don't reuse one layout for both — the admin layout has no SEO meta block (see [SEO.md](SEO.md)), the front layout does.
- **Routing** — each area keeps its own SPA catch-all in `app/config/routes.js`, scoped to that area's path prefix (e.g. `/admin/*` → `AdminController.get`, rendering the admin layout) instead of one global `/*` for everything. Full rule: [ROUTING.md § Multiple entry points](ROUTING.md#multiple-entry-points--scoped-catch-alls).
