# Vite — build, dev server, backend injection

Cross-cutting: applies to both `app/` (backend template injection) and `frontend/` (build/dev config) work. See [ENTRYPOINTS.md](ENTRYPOINTS.md) for `vite.entries.mjs` (the entrypoint map itself, and how to wire a new entry) — that file is the single source of truth for the map; this one covers what `vite.config.mjs` does with it and how a backend template consumes the result.

## Build & dev server (`vite.config.mjs`)

- **Output**: assets land in `public/js/`, `public/css/`, `public/img/` — served directly by Express (`outDir: public/`, `emptyOutDir: false` so backend-served files aren't wiped). A production `vp build` runs each entry as its own isolated Rolldown pass (Vite's Environment API — `environments` + `builder.buildApp` in `vite.config.mjs`, with `consumer: 'client'` on each so Vite's CSS plugin still runs), so no entry ever imports a chunk shared with another entry, then merges every entry's own manifest into the single `public/.vite/manifest.json` (see Backend injection below).
- **Dev server**: runs alongside Express (`vp dev` + `nodemon`, via `concurrently`) with HMR (Hot Module Replacement) — edited modules are swapped in the running app over the existing socket connection, so a full page reload isn't needed; CORS is open (`origin: '*'`) so the two servers talk freely; `host: process.env.VITE_HOST || true` binds all interfaces by default so it prints a LAN URL too (`Network: http://<your-ip>:5173/`) — useful for testing from a phone on the same network. Set `VITE_HOST` in `.env` only if you need to force a specific host (e.g. a fixed IP/hostname); leave it unset for the auto-detected default. Dev keeps every entry in one combined resolution (unlike the isolated-per-entry production build above) since nothing is written to disk.
- **Manifest**: `vite-plugin-dev-manifest` writes `public/.vite/manifest.<NODE_ENV>.json` in dev; production's merged `public/.vite/manifest.json` (see Output above) is what the backend's `vite()` helper reads to inject the correct `<script>`/`<link>` tags in both cases.
- **Cache hashing**: controlled by `VITE_CHUNK_NAMES` — `true` adds `-[hash]` to output filenames, `false` (default) keeps plain names for simpler debugging.

## Backend injection — the `vite()` helper

Every backend template that mounts a Vue entry (`app/views/_shared/templates/<name>.html`) calls a `vite({ entry, type })` helper to inject that entry's built `<script>`/`<link>` tags, reading the manifest above:

- `entry` must match a key in `vite.entries.mjs`'s map — the entry name for the area this template belongs to (see ENTRYPOINTS.md).
- `type` is `'style'` (in `<head>`) or `'script'` (before `</body>`) — both calls needed per template.

Exact call syntax differs by templating engine — see `.claude/skills/vulkano-skills/vulkano-backend-views-nunjucks/SKILL.md` § Vite asset injection or `.claude/skills/vulkano-skills/vulkano-backend-views-handlebars/SKILL.md` § Vite asset injection for the engine actually configured in this project (`app/config/views.js`).
