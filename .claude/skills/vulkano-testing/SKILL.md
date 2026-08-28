---
name: vulkano-testing
description: Use when writing or reviewing a test for a controller, model, service, middleware, socket handler, Pinia store, or script in this Vulkano framework project — Vitest config, TEST_MONGO_URI gate, directory layout mirroring source, waitForReady/dbCleanup helpers, and per-layer test patterns.
---

# Testing

## Overview
Runner is Vitest via `vp test`. Every new/changed controller, model, service, or middleware gets a test — this isn't optional per project convention.

## When to use
Any task that creates/edits `app/controllers/`, `app/models/`, `app/services/`, `app/config/middlewares/`, `app/config/sockets/`, or `client/store/` code — after writing the code, write/update its test before considering the task done.

## Before running anything — `TEST_MONGO_URI`
**Mandatory, closed — no fallback to `MONGO_URI`.** `test/helpers/bootstrap.js` throws before booting if it's missing, and this gates the *entire* suite (even DB-free script tests, since `setupFiles` runs once for every file). Set `TEST_MONGO_URI` in `.env` to a dedicated test database — never the same one as `MONGO_URI` — before running `vp test` at all.

## Directory layout — mirror the source tree
One `test/<source-folder>/` per top-level source folder, one layer subfolder per architectural layer inside it — never merge two source folders' tests into one:
```
test/
  helpers/                    bootstrap.js (waitForReady), dbCleanup.js (clearCollections), test<Model>.js factories
  app/
    models/<Name>.test.js
    controllers/<Name>.http.test.js
    services/<Name>.test.js
    middlewares/<Name>.test.js
    integration/<Flow>.test.js
  <script>.test.js            standalone scripts/*.js not under app/
  client/
    store/<name>.test.js
    integration/<Flow>.test.js
```
Add `test/cms/` (mirroring a `cms/` entry point) only once that entry point exists.

## Patterns by test type
| Type | Path | Pattern |
|---|---|---|
| Model | `test/app/models/*.test.js` | `beforeAll(() => waitForReady())`, `afterEach(() => dbCleanup.clearCollections('Name'))`, assert business rules directly (`.rejects.toThrow(...)` for invalid input) |
| Controller/HTTP | `test/app/controllers/*.http.test.js` | Same setup; hit the real running app with native `fetch` against `http://localhost:${process.env.PORT}` — no `supertest`. API: assert `res.vsr()` envelope `{ success, statusCode, data }`. View: assert rendered HTML body |
| Service | `test/app/services/*.test.js` | Same boot/mock pattern, call the function directly (no HTTP) |
| Middleware | `test/app/middlewares/*.test.js` | Unit-test with mock `req`/`res`/`next` for pure logic, OR verify end-to-end through a controller/HTTP test |
| Integration | `test/app/integration/*.test.js` | Full business flow across models (signup → login → protected route); factory helpers from `test/helpers/`; clear every touched collection in dependency order |
| Script | `test/<script>.test.js` | Plain unit tests, no boot/DB — still gated by `TEST_MONGO_URI` (shared `setupFiles`) |
| Frontend store | `test/client/store/*.test.js` | No app boot/DB; `createPinia()` + `setActivePinia()` in `beforeEach`; inject a mock `$api` — never hit real network; shim browser globals or mark `// @vitest-environment jsdom` if a real DOM is needed |

Mock outbound external calls (`ApiClient`, third-party APIs) with `vi.spyOn(...).mockResolvedValue(...)`, restored in `afterEach` — never hit a real third-party endpoint from a test.

## Writing a new test
1. Put it under `test/<source-folder>/<layer>/`, mirroring the source path.
2. Reuse `waitForReady()` and `dbCleanup.clearCollections(...)` instead of duplicating boot/cleanup logic. Add a `test/helpers/test<Model>.js` factory (`makeUser(overrides)`-style) if the model needs one.
3. Clear every collection the test writes to, in `afterEach` — `isolate: false`/`fileParallelism: false` mean all files share one DB connection, so leftovers leak into the next file.
4. Mock outbound calls, restore in `afterEach`.

## Running
```
vp test          # full suite once — throws immediately if TEST_MONGO_URI unset
vp test watch    # watch mode
```
No coverage threshold or CI script configured — don't claim one exists without checking `package.json`/`vite.config.mjs` first.

## Browser E2E — not a CI suite
No Playwright/Cypress installed. For end-to-end verification of a user flow, drive a real browser with the Playwright MCP or chrome-devtools MCP (navigate, click, fill, screenshot, console/network) as part of verifying the change — agent-driven verification for the task at hand, not a regression suite (see AGENTS.md § Visual verification).

## After writing
- Run `vp check` and `vp test` before considering the change done.
- New model/controller/service/middleware with no test yet → write one now, don't defer.

## Reference
`docs/TESTING.md` (full detail), `test/app/controllers/Home.http.test.js` (existing worked example), vulkano-backend-model, vulkano-backend-controller, vulkano-backend-auth (auth-flow test coverage: `req.auth`, JWT cookie).
