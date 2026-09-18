# PROJECT.md

Project-specific source of truth. Never touched by a template update (pulling a newer `AGENTS.md` from the Vulkano template) — the only place project name, purpose, and per-area decisions belong. `AGENTS.md` includes this file via `@PROJECT.md`.

## What this project is

This is the **Vulkano Framework** — the full-stack app template built on top of `@vulkano/core`. It is the starting point for new Vulkano-based applications.

<!-- On project init: replace the paragraph above with this project's actual name and one-line purpose. -->

## Project requirements — SEO / Analytics / Accessibility

Decision process, category mapping, and doc pointers: `references/AGENTS/AREAS.md`. This table is this project's actual state — treat it as the answer, don't ask again for a listed area:

| Area (path/entry point)                    | SEO | Analytics | Accessibility |
| ------------------------------------------ | --- | --------- | ------------- |
| `/` (`frontend/website/`) — public site    | on  | on        | on            |
| `/admin` (`frontend/admin/`) — admin panel | off | off       | on            |

## Deployment

**CI/CD pipeline: TBD.** No automated pipeline (GitHub Actions or otherwise) exists yet — deploys today are manual, via one of PM2/Docker/Coolify below.

- `ecosystem.config.js` — PM2 config for VPS deployment (bare-metal/VPS, no container)
- `Dockerfile` — multi-stage build: `build` stage runs `pnpm install --frozen-lockfile` + `pnpm run build` (produces `public/`), `runtime` stage installs prod-only deps and copies `public/`, `app/`, `app.js`; exposes port `8000`, runs `node app.js`
- `docker-compose.yml` — `app` service builds from the `Dockerfile`, reads `.env` via `env_file`, maps `${PORT:-8000}`; optional `mongo` service under the `local-db` profile for local Mongo without a managed DB
- **Coolify**: default build pack is Nixpacks (auto-detects Node, runs `pnpm install` + start script), not the repo's `Dockerfile` — pick "Dockerfile" as the build pack in the Coolify app settings if you want it to build from `Dockerfile`/`docker-compose.yml` instead. No dedicated Coolify config file in the repo either way

<!-- On project init: pick the deployment mechanism this project actually uses and trim the rest. -->
