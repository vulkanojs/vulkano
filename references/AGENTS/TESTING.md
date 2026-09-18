# Testing

Test convention for the Vulkano Framework. Runner: **Vitest**, via `vp test`.

**Fully covered by `.claude/skills/vulkano-skills/vulkano-testing/SKILL.md`** — directory layout, `TEST_MONGO_URI` gate, `waitForReady`/`dbCleanup` helpers, and per-layer test patterns (model, controller/HTTP, service, middleware, integration, script, frontend store). Invoke it instead of this file for implementation detail.

## Default rule

Every new/changed controller, model, service, or middleware gets a test — same rule applies frontend-side for a `frontend/<entrypoint>/store/`, `composables/`, or `utils/` file.

## Environment — `TEST_MONGO_URI`, optional

Set `TEST_MONGO_URI` in `.env` to a dedicated test database — never the same value as `MONGO_URI` (dev/prod) — as soon as a test needs a real database (a model, or anything that reads/writes one). Without it, `test/helpers/bootstrap.js` clears `MONGO_URI` for the test run and the app boots with no database connection at all (`@vulkano/core` skips `mongoose.connect()` when the connection setting is falsy) — DB-free tests (scripts, frontend store/composable/util) run fine either way, DB-dependent ones fail until it's set.
