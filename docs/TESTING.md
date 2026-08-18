# Testing

Runner: **Vitest**, via `vp test` (see [AGENTS.md § Using Vite+](../AGENTS.md#using-vite-the-unified-toolchain-for-the-web)) — `vp test` runs it with the config already in `vite.config.mjs`'s `test` block:

```js
test: {
  environment: 'node',
  include: ['test/**/*.test.js'],
  setupFiles: ['test/helpers/bootstrap.js'],
  pool: 'forks',
  isolate: false,
  fileParallelism: false
}
```

- `environment: 'node'` — right for this project today: backend tests boot a real server, frontend tests (once added) are unit tests over plain `.js` logic (stores, composables), not component-mount tests needing a DOM. If a `client/`/`cms/` unit test needs a DOM (mounting a `.vue` component, not just testing its `.js`), that test file needs its own `// @vitest-environment jsdom` docblock, or `environment` becomes per-`include`-glob — don't flip the whole config to `jsdom` for one suite.
- `isolate: false` + `fileParallelism: false` — already required here: `test/helpers/bootstrap.js` boots the real Vulkano app once (`vulkano()`, real DB connection, real listening port) and shares that boot across every test file via `global.__vulkanoBootState`. Don't change these without also changing the bootstrap to tolerate parallel/isolated runs.
- `setupFiles: ['test/helpers/bootstrap.js']` — runs once, exposes `waitForReady()` (see [Patterns by test type](#patterns-by-test-type) below). It does not auto-call `waitForReady()` — every test that needs the booted app calls it explicitly.

## Directory layout

Mirror the source tree so each test's location tells you what it covers — one top-level `test/` folder per source folder at the repo root (`app/` → `test/app/`, `client/` → `test/client/`, and a `test/cms/` if a `cms/` entrypoint gets added later, per [ARCHITECTURE.md § Multiple entry points](ARCHITECTURE.md#multiple-entry-points--front--cms-or-any-other-split-app)) — never merge two source folders' tests into one, they have separate boot paths and dependencies:

```
test/
  helpers/                   bootstrap + shared fixtures, not test files themselves
    bootstrap.js             sets test env vars, boots the app once, exports waitForReady()
    dbCleanup.js             clearCollections(...) — wipe state between tests
    testUser.js              makeUser(overrides) factory, one per model that needs one

  # app/ — mirrors app/'s own layout
  app/
    models/                    one file per Mongoose model, e.g. models/User.test.js
    controllers/               *.http.test.js — real HTTP round trips against the running app,
                                e.g. controllers/Home.http.test.js (the existing example)
    services/                  unit tests for app/services/*.js modules
    middlewares/               unit/integration tests for app/config/middlewares/*.js (e.g. seo.js)
    integration/               multi-model business-flow tests
  <script>.test.js           unit tests for a standalone script/module, not under app/ (existing: cleanup.test.js, inbox-webp.test.js — these test scripts/*.js, so they stay at test/ root)

  # client/ — pure unit tests, no app/DB boot. Add a sibling test/cms/ folder, same shape, if that entrypoint exists
  client/
    store/                   client/store/*.js unit tests, once that folder has content
    components/              component unit tests, if the project tests components in isolation
    integration/              multi-view business-flow tests
```

Add/rename folders as the project's actual layers grow (drop `controllers/` if `app/` never serves HTTP, add `test/cms/` only once that entrypoint exists per ARCHITECTURE.md) — the principle is one `test/<source-folder>/` per top-level source folder, and one layer subfolder per architectural layer inside it.

## Environment

`test/helpers/bootstrap.js` forces, before calling `vulkano()`:

```js
process.env.PORT = process.env.TEST_PORT || '8199'; // distinct from the dev/prod PORT in .env
process.env.NODE_ENV = 'test';
```

**`TEST_MONGO_URI` is mandatory, closed — no fallback to `MONGO_URI`.** `bootstrap.js` throws before booting anything if it's missing:

```js
if (!process.env.TEST_MONGO_URI) {
  throw new Error('TEST_MONGO_URI is not set. Refusing to run tests against MONGO_URI (dev/prod). ...');
}
process.env.MONGO_URI = process.env.TEST_MONGO_URI;
```

Set `TEST_MONGO_URI` in `.env` (a dedicated test database — local MongoDB or a separate disposable Atlas database, never the same one as `MONGO_URI`) before running `vp test` at all. **This blocks the entire suite, not just DB-touching tests** — `setupFiles` runs once for every test file, so `cleanup.test.js`/`inbox-webp.test.js` (pure script unit tests, no DB) fail alongside `controllers/Home.http.test.js` if `TEST_MONGO_URI` is unset. That's the intended trade-off: one shared setup file, one hard gate, no accidental writes to the real database from any test run.

Vulkano auto-loads models/services as globals (`User`, `Post`, `app/services/*`, ...) — tests get the same globals as app code, don't `require`/`import` them.

## Patterns by test type

**Model tests** (`test/app/models/*.test.js`, e.g. `test/app/models/User.test.js`)
- `beforeAll(() => waitForReady())` once per file — boot is shared across the whole run.
- `afterEach(() => dbCleanup.clearCollections('User'))` — clear only the collection(s) that test touches.
- Assert business rules/validation directly against the model, Vulkano-style: `await User.create({...})`, `.rejects.toThrow(...)` for invalid input, `Encrypter`-based methods for password hashing (it's a global, no import needed — see [COVERAGE.md](COVERAGE.md)).

**Controller/HTTP tests** (`test/app/controllers/*.http.test.js`, e.g. the existing `test/app/controllers/Home.http.test.js`)
- Same `waitForReady()` + cleanup setup as model tests.
- Hit the real running app with native `fetch` against `http://localhost:${process.env.PORT}` — no `supertest`, matching the no-axios/native-fetch convention already used by `client/Api.js`.
- For API controllers (`app/controllers/api/*`), assert on the `res.vsr()` envelope: `{ success, statusCode, data }` — e.g. `expect(json.success).toBe(true); expect(json.data).toMatchObject({...})`.
- For backend-view controllers (`res.render(...)`), assert on the rendered HTML body, as `Home.http.test.js` does for the SEO tags.
- Mock outbound external calls (`ApiClient`, third-party APIs) with `vi.spyOn(...).mockResolvedValue(...)`, restored in `afterEach` — never hit a real third-party endpoint from a test.
- Covers the full request → middleware → controller → model → response round trip, including auth flows (`req.auth`, JWT cookie).

**Service tests** (`test/app/services/*.test.js`, mirroring `app/services/*.js`)
- Same boot/mock pattern as controller tests, but call the service function directly instead of going through HTTP.

**Middleware tests** (`test/app/middlewares/*.test.js`, mirroring `app/config/middlewares/*.js`)
- Two options depending on what's being verified: unit-test the middleware function directly with mock `req`/`res`/`next` (`res.locals = {}`, spy on `next`) for pure logic (e.g. does `seo.js` skip `/cms` paths correctly) — no boot needed; or verify it end-to-end through a real controller/route via a controller/HTTP test (as `Home.http.test.js` already does for `seo.js`'s defaults + a controller override reaching the rendered template).

**Integration tests** (`test/app/integration/*.test.js`)
- Exercise a full business flow across several models (e.g. signup → login → protected route).
- Use factory helpers (`test/helpers/testUser.js`'s `makeUser(overrides)`, etc.) instead of duplicating fixture setup.
- `afterEach` clears every collection the flow touches, in dependency order.

**Script/utility tests** (`test/<script>.test.js` — existing: `cleanup.test.js`, `inbox-webp.test.js`)
- Plain unit tests against pure functions exported from `scripts/*.js`, no boot/DB involved. (Still gated by `TEST_MONGO_URI` today, per the shared `setupFiles` trade-off above.)

**Frontend store tests** (`test/client/store/*.test.js`, mirroring `client/store/*.js` — add a sibling `test/cms/store/` if/when a `cms/` entrypoint exists)
- Pure unit tests, no app boot/DB — the backend is irrelevant to a Pinia/Vuex store (see [FRONTEND.md § State](FRONTEND.md#state--clientstore) for which one this project uses).
- Reset store state fresh in `beforeEach`.
- Inject a mock `$api`/`Api.js` client for tests; production code uses the real one — never hit real network from a store test.
- Shim any browser-only global (`localStorage`, `window`, ...) manually since `environment: 'node'` — or mark the file `jsdom` per the [Runner](#testing) note above if it needs a real DOM.
- `client/` and (once it exists) `cms/` tests mock/boot independently — don't share fixtures between them beyond the common `test/helpers/`.

## Running

```
vp test          # runs the full suite once — requires TEST_MONGO_URI set, or it throws immediately
vp test watch    # watch mode (see AGENTS.md § Using Vite+ — vp test does not watch by default)
```

No coverage threshold or CI script is configured today — CI/CD itself is TBD (see [ARCHITECTURE.md § Deployment](ARCHITECTURE.md#deployment)). Don't claim one exists without checking `package.json`/`vite.config.mjs` first.

## Browser E2E

No Playwright/Cypress suite is installed or committed — `vp test` above covers backend `test/*.test.js` and (once added) frontend unit tests only. For end-to-end verification of a user flow, use the **Playwright MCP** or **chrome-devtools MCP** to drive a real browser interactively (navigate, click, fill forms, screenshot, read console/network) as part of verifying the change — same tools already called for in [AGENTS.md § Visual verification](../AGENTS.md#visual-verification-frontend) for `client/` changes. This is agent-driven verification for the task at hand, not a regression suite that runs in CI.

## Writing new tests

1. Put the test under `test/<source-folder>/<layer>/` — e.g. `test/app/models/`, `test/app/controllers/`, `test/app/services/`, `test/app/middlewares/`, `test/app/integration/` for backend; `test/client/store/` etc. for frontend — mirroring the source structure.
2. Reuse `test/helpers/bootstrap.js` (`waitForReady()`) and `test/helpers/dbCleanup.js` (`clearCollections(...)`) instead of duplicating boot or cleanup logic. Add a new `test/helpers/test<Model>.js` factory when a model needs one, following the same shape.
3. Always clear the collection(s) your test writes to, in `afterEach` — `isolate: false` means all files share one module registry/DB connection, so leftover documents leak into the next file.
4. Mock outbound calls (`ApiClient`, third-party APIs) and restore mocks in `afterEach` — never hit a real third-party endpoint from a test.
5. Run `vp check` and `vp test` before considering the change done, per [AGENTS.md § Quick workflow](../AGENTS.md#quick-workflow).
