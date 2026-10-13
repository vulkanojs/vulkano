# Build — entrypoints and Vite

Read when creating/renaming/removing a frontend entrypoint, or editing `vite.config.mjs`, `vite.entries.mjs`, or a template's `vite()` call. Full new-entrypoint scaffold and checklist: skill `vulkano-frontend-entrypoint`. Why one app per area: [ARCHITECTURE.md § Entrypoints](ARCHITECTURE.md#entrypoints).

## Wiring an entrypoint

- **`vite.entries.mjs`** — one key per entry (`admin: 'frontend/admin/app.js'`). `vite.config.mjs` derives `build` input, the `@<name>` alias and the manifest entry from it — nothing else to edit.
- **Backend layout** — `app/views/_shared/templates/<name>.html` calling `vite({ entry: '<name>', type: 'style' })` in `<head>` and `type: 'script'` before `</body>`. `entry` = the key above. Exact syntax per engine: skills `vulkano-backend-views-nunjucks` / `-handlebars`.
- **Controller + catch-all** — `<Name>Controller.get` renders the layout; scoped `'/<name>/*'` in `app/config/routes.js` before `'/*'` (BACKEND.md § Routes). Vanilla-JS entries (server-rendered page, no Vue) get no catch-all.
- **Vue side** — `createWebHistory('/<name>')`, `NotFound` route.
- `nodemon.json` needs nothing: it already ignores `frontend/`.

## Vite (`vite.config.mjs`)

- Output to `public/` (`js/`, `css/`, `img/`), `emptyOutDir: false` so backend-served files survive.
- `vp build` builds each entry as its own isolated Rolldown pass (Environment API, `consumer: 'client'`) — no chunk shared across entries — then merges the manifests into `public/.vite/manifest.json`.
- Dev: `vp dev` + nodemon via `concurrently`, HMR, CORS open. `host: VITE_HOST || true` (all interfaces, prints a LAN URL). Dev writes `public/.vite/manifest.<NODE_ENV>.json` (`vite-plugin-dev-manifest`).
- `VITE_CHUNK_NAMES=true` adds `-[hash]` to filenames; default off (cache is busted via `?v={version}`).
- The backend `vite()` helper reads the manifest to inject `<script>`/`<link>` tags.
