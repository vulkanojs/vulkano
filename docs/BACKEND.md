# Backend

Backend conventions for the Vulkano Framework (`app/`). See [ARCHITECTURE.md](ARCHITECTURE.md) for the project structure overview and [AGENTS.md](../AGENTS.md) for workflow/safety rules.

**Controller/route, model, and view work is now covered by Claude Code skills** — invoke them for detailed conventions and worked code instead of relying on this file alone:
- `.claude/skills/vulkano-backend-controller/SKILL.md` — controller placement, routing convention, `res.vsr`/`res.render`, scaffold, sockets
- `.claude/skills/vulkano-backend-model/SKILL.md` — model naming, schema, standard CRUD methods, hooks, `active`/soft-delete, `autopopulate`/`_buildPopulate`
- `.claude/skills/vulkano-backend-views/SKILL.md` — `res.render` vs `res.vsr` decision; routes to the Nunjucks or Handlebars skill for actual template syntax (layouts, SEO locals, i18n, formatting helpers, Vite injection)

This file keeps only what those skills don't cover: general backend conventions (unused vars, global constants), the pointer to the core's own docs, and authentication.

## Key conventions

### Unused variables — prefix with `_`

When a function parameter or binding is intentionally unused (e.g. a `catch` block that doesn't need the error), prefix it with `_` so the linter's `no-unused-vars` rule doesn't flag it: `catch (_err) {`.

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

Cron jobs (`Crontab.schedule(...)` registered in `app/config/bootstrap.js`) and auto-loaded globals are defined by the framework core, not by this template. Source of truth: [`@vulkano/core` README](../node_modules/@vulkano/core/README.md) (also mirrored at https://github.com/vulkanojs/vulkano-core). Routing, controllers, models, and views are covered by the skills linked at the top of this file.

This template only adds what's documented here: the conventions above and authentication below.

**Don't pre-scaffold `app/config/express/*.js` or `app/config/middlewares/*.js` files "just in case."** Every file in both folders is optional — an absent file means the core's default behavior applies, and that's fine until a project actually needs to change it. When a task needs to customize one (enable CORS for a specific origin, add a CSP rule, add a new global middleware, etc.), copy the matching reference from [`@vulkano/core/examples/config/express/`](../node_modules/@vulkano/core/examples/config/express) (or `examples/config/middlewares/`) into `app/config/express/<file>.js` (or `app/config/middlewares/<file>.js`) and edit only what the task requires — don't copy the whole examples folder wholesale.

### Authentication

The core wires JWT (`Jwt.encode`/`Jwt.decode`, `express-jwt` middleware — see [`@vulkano/core` README § JWT Authentication](../node_modules/@vulkano/core/README.md)), but doesn't prescribe a model/controller shape. Recommended convention for this template:

- **Dedicated model** — `Auth`/`User` (whichever this app calls it), not login logic bolted onto an unrelated model.
- **Dedicated controller** — `app/controllers/api/AuthController.js`, following the core's method-key convention: `'post login'` (`POST /api/auth/login`), `'post logout'` (`POST /api/auth/logout`), `me` (`GET /api/auth/me` — no verb prefix needed, `GET` is the default; returns the current session's user or `401`).
- **`httpOnly` cookie, not `localStorage`** — on successful login, set the JWT as an `httpOnly` (and `secure` in production) cookie rather than returning it in the response body for client-side storage. `Jwt.getToken(req)` already reads from cookie, header, or query param, so this doesn't require custom token-extraction logic. `localStorage`/`sessionStorage` are readable by any script on the page — a stored token there is exposed to XSS.
