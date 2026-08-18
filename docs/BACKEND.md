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

### Authentication

The core wires JWT (`Jwt.encode`/`Jwt.decode`, `express-jwt` middleware — see [`@vulkano/core` README § JWT Authentication](../node_modules/@vulkano/core/README.md)), but doesn't prescribe a model/controller shape. Recommended convention for this template:

- **Dedicated model** — `Auth`/`User` (whichever this app calls it), not login logic bolted onto an unrelated model.
- **Dedicated controller** — `app/controllers/api/AuthController.js`, following the core's method-key convention: `'post login'` (`POST /api/auth/login`), `'post logout'` (`POST /api/auth/logout`), `me` (`GET /api/auth/me` — no verb prefix needed, `GET` is the default; returns the current session's user or `401`).
- **`httpOnly` cookie, not `localStorage`** — on successful login, set the JWT as an `httpOnly` (and `secure` in production) cookie rather than returning it in the response body for client-side storage. `Jwt.getToken(req)` already reads from cookie, header, or query param, so this doesn't require custom token-extraction logic. `localStorage`/`sessionStorage` are readable by any script on the page — a stored token there is exposed to XSS.
