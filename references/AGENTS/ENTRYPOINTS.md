# Entrypoints — front + CMS (or any other split app)

Only applies when the task creates, renames, removes, or wires a frontend entrypoint (`frontend/<name>/`, its Vite entry, backend layout, or catch-all). Otherwise skip this file. Project structure overview: [ARCHITECTURE.md](ARCHITECTURE.md).

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
