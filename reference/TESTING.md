# Testing

Test convention for the Vulkano Framework. Runner: **Vitest**, via `vp test`.

**Fully covered by `.claude/skills/vulkano-testing/SKILL.md`** — directory layout, `TEST_MONGO_URI` gate, `waitForReady`/`dbCleanup` helpers, and per-layer test patterns (model, controller/HTTP, service, middleware, integration, script, frontend store). Invoke it instead of this file for implementation detail.

## Default rule

Every new/changed controller, model, service, or middleware gets a test. `TEST_MONGO_URI` must be set in `.env` (a dedicated test database, never `MONGO_URI`) before running `vp test` at all — the suite throws immediately otherwise.
