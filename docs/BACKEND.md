# Backend

Backend conventions for the Vulkano Framework (`app/`). See [ARCHITECTURE.md](ARCHITECTURE.md) for the project structure overview and [AGENTS.md](../AGENTS.md) for workflow/safety rules.

## Key conventions

### Naming: controllers in plural (recommended but not mandatory), models in singular

`@vulkano/core` pairs each model with a controller by name, so the naming convention is what makes the auto-routing work:

- **Model** → singular PascalCase (e.g., `Product.js` → `global.Product`)
- **Controller** → plural PascalCase + `Controller` suffix (e.g., `ProductsController.js`)
- **MongoDB collection naming:** a model only maps to a table/collection if it defines `attributes` (schema fields) — a model file with no `attributes` is just a plain global, not backed by a collection.

By convention, model files should be named in singular (e.g. `User.js`), and the collection binding is automatic and singular-lowercase: `User.js` → collection `user`, `Project.js` → collection `project` (never pluralized like `users`/`projects`). Any script or tool that talks to the database directly (seeds, migrations, ad-hoc queries) must target that singular lowercase collection name to match what the running app actually uses.

### Unused variables — prefix with `_`

When a function parameter or binding is intentionally unused (e.g. a `catch` block that doesn't need the error), prefix it with `_` so the linter's `no-unused-vars` rule doesn't flag it: `catch (_err) {`.

### Controllers — no top-level functions or variables (template-specific)

A controller file may only have, outside of `module.exports`, its `require`/import statements. No helper functions, no top-level `const`/`let` — only the exported object and its methods:

```js
// app/controllers/ProductsController.js
const exceljs = require('exceljs'); // ok: import
const VAR_NAME = 'value'; // no top-level constants or variables hardcoded (template-specific)

module.exports = {
  get(req, res) {
    // ok: this IS a controller method
    res.vsr(exceljs.download());
  }
};
```

If a method needs helper logic, extract it into `app/services/<Name>.js` (auto-loaded as a global by the core, like models — see `app/services/` in the tree in [ARCHITECTURE.md](ARCHITECTURE.md)) and call the service from the controller. Business rules and reusable logic belong in the service (or the model), not the controller.

### Global constants hardcoded — `app/config/common.js` or `bootstrap.js`

Shared constants used across controllers/services/models go in `app/config/common.js`, exported like any other config file. The core exposes every `app/config/*.js` file as `app.config.<filename>` (see `app.config = allConfig` in `@vulkano/core/app.js`), so `app/config/common.js` becomes readable as `app.config.common`:

```js
// app/config/common.js
module.exports = {
  HOLDER_TYPES: ['user', 'company']
};

// usage anywhere: app.config.common.HOLDER_TYPES
```

For a constant that should behave as a true global (not nested under `config`), register it in `app/config/bootstrap.js` instead:

```js
// app/config/bootstrap.js
global.HOLDER_TYPES = ['user', 'company']; // usage anywhere: HOLDER_TYPES
module.exports = (start) => {
  start(() => {});
};
```

### Backend conventions — owned by `@vulkano/core`

Routing (convention over configuration, method key convention, `app/config/routes.js`), the thin-controller/business-logic-in-model split, scaffold controllers, the model CRUD interface and hooks, cron jobs (`Crontab.schedule(...)` registered in `app/config/bootstrap.js`), auto-loaded globals, and the `res.vsr`/`res.render` response conventions are all defined by the framework core, not by this template. Source of truth: [`@vulkano/core` README](../node_modules/@vulkano/core/README.md) (also mirrored at https://github.com/vulkanojs/vulkano-core). For worked examples, see `@vulkano/core/examples/controllers` (`ExampleController.js`, `RestExampleController.js`, `RestScaffoldController.js`) and `@vulkano/core/examples/models` (`Example.js`, `ExampleWithScaffold.js`).

This template only adds what's documented here: the controller/config conventions above and authentication below.

**Don't pre-scaffold `app/config/express/*.js` or `app/config/middlewares/*.js` files "just in case."** Every file in both folders is optional — an absent file means the core's default behavior applies, and that's fine until a project actually needs to change it. When a task needs to customize one (enable CORS for a specific origin, add a CSP rule, add a new global middleware, etc.), copy the matching reference from [`@vulkano/core/examples/config/express/`](../node_modules/@vulkano/core/examples/config/express) (or `examples/config/middlewares/`) into `app/config/express/<file>.js` (or `app/config/middlewares/<file>.js`) and edit only what the task requires — don't copy the whole examples folder wholesale.

### `active` field — soft-delete only, never a business enabled/disabled toggle

Every model's `active: Boolean` is reserved for the soft-delete convention (`delete(id) { return this.update(id, { active: false }); }` — record hidden from normal queries, not removed). Do not reuse it as a generic "is this available/paused/enabled" business flag, even when a view's UI shows an "Activar/Desactivar" toggle that looks like it should map 1:1 to `active`.

When a model needs a business-level on/off, paused/live, available/unavailable state, add a dedicated field named for the domain concept instead — e.g. `Product.availability` (`Boolean`, default `true`): whether a product can currently be sold/reserved, independent of physical stock (a product can have `availability: true` with 0 stock on hand, meant to be reserved). Keep `active` exclusively for soft-delete.

### Populate query convention — opt-in joins via `?populate=field1,field2`

A list endpoint that needs related-doc data (e.g. a product's unit/vat/category name, not just its ObjectId) accepts `?populate=unit,vat,category` — a comma-separated string query param, forwarded as-is by the thin controller (`res.vsr(Model.getAll(req.query || {}))`).

Inside the model's `getAll(props)`, check `props.populate.includes('fieldName')` per relation and push a `{ path: 'fieldName', fields: ['name'] }` entry (select only what's needed, not the whole related doc) into a `populate` array. Pass that array as the third arg to `Paginate.get(Model, query, populate)` (`@vulkano/core`'s `libs/Paginate.js`), which maps it into mongoose's real `populate` option via `getPopulatedCollections`. See `app/models/Product.js` `getAll` for the reference implementation.

This is a manual per-model opt-in — the core does not read `populate` from the query automatically. `props.populate` is a plain string, not an array; `.includes()` still works as a substring match, but guard with `(props.populate || '')` in new models since the current `Product.js` implementation throws if the param is missing.

**Why this matters:** replaces the old pattern of firing several `$api.all([...])` calls per lookup table (units, vat types, categories) from the frontend just to build a name-lookup map for rendering a list — one populated list request instead of N. When a new list view needs to display a referenced doc's name, add populate support to that model's `getAll` following this shape rather than adding another parallel frontend fetch.

### Authentication

The core wires JWT (`Jwt.encode`/`Jwt.decode`, `express-jwt` middleware — see [`@vulkano/core` README § JWT Authentication](../node_modules/@vulkano/core/README.md)), but doesn't prescribe a model/controller shape. Recommended convention for this template:

- **Dedicated model** — `Auth`/`User` (whichever this app calls it), not login logic bolted onto an unrelated model.
- **Dedicated controller** — `app/controllers/api/AuthController.js`, following the core's method-key convention: `'post login'` (`POST /api/auth/login`), `'post logout'` (`POST /api/auth/logout`), `me` (`GET /api/auth/me` — no verb prefix needed, `GET` is the default; returns the current session's user or `401`).
- **`httpOnly` cookie, not `localStorage`** — on successful login, set the JWT as an `httpOnly` (and `secure` in production) cookie rather than returning it in the response body for client-side storage. `Jwt.getToken(req)` already reads from cookie, header, or query param, so this doesn't require custom token-extraction logic. `localStorage`/`sessionStorage` are readable by any script on the page — a stored token there is exposed to XSS.
