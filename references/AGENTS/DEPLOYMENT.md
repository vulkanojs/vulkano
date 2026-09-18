# Deployment options

Only applies when deploying, or when editing `ecosystem.config.js`, `Dockerfile`, `docker-compose.yml`, or `nixpacks.toml`. Otherwise skip this file. Which option each environment uses: [PROJECT.md § Deployment](../../PROJECT.md#deployment). Human-facing commands: `README.md` § Deployment.

- `ecosystem.config.js` — PM2 config for VPS deployment (bare-metal/VPS, no container)
- `Dockerfile` — multi-stage build: `build` stage runs `pnpm install --frozen-lockfile` + `pnpm run build` (produces `public/`), `runtime` stage installs prod-only deps and copies `public/`, `app/`, `app.js`; exposes port `8000`, runs `node app.js`
- `docker-compose.yml` — `app` service builds from the `Dockerfile`, reads `.env` via `env_file`, maps `${PORT:-8000}`; optional `mongo` service under the `local-db` profile for local Mongo without a managed DB
- **Coolify**: default build pack is Nixpacks (auto-detects Node, runs `pnpm install` + start script), not the repo's `Dockerfile` — pick "Dockerfile" as the build pack in the Coolify app settings if you want it to build from `Dockerfile`/`docker-compose.yml` instead. No dedicated Coolify config file in the repo either way
