# Backend config — shared constants, express/middleware overrides, core

Only applies when adding a shared constant, customizing `app/config/express/*` or `app/config/middlewares/*`, or scheduling a cron job in `app/`. Otherwise skip this file.

## Shared constants

Shared constants used across controllers/services/models go in a config file, exported like any other config file. The core exposes every `app/config/*.js` file as `app.config.<sectionName>` (filename minus `.js`, see `app.config = allConfig` in `@vulkano/core/app.js`) — name the file after what it holds (e.g. `app/config/common.js` → `app.config.common`, `app/config/limits.js` → `app.config.limits`):

```js
// app/config/<sectionName>.js
module.exports = {
  HOLDER_TYPES: ['user', 'company']
};

// usage anywhere: app.config.<sectionName>.HOLDER_TYPES
```

For a constant that should behave as a true global (not nested under `config`), register it in `app/config/bootstrap.js` instead:

```js
// app/config/bootstrap.js
global.HOLDER_TYPES = ['user', 'company']; // usage anywhere: HOLDER_TYPES
module.exports = (start) => {
  start(() => {});
};
```

## Framework core conventions

Cron jobs (`Crontab.schedule(...)` registered in `app/config/bootstrap.js`) and auto-loaded globals are defined by the framework core, not by this template. Source of truth: [`@vulkano/core` README](../../node_modules/@vulkano/core/README.md) (also mirrored at https://github.com/vulkanojs/vulkano-core). Routing, controllers, models, views, and auth are covered by the skills linked above.

**Don't pre-scaffold `app/config/express/*.js` or `app/config/middlewares/*.js` files "just in case."** Every file in both folders is optional — an absent file means the core's default behavior applies, and that's fine until a project actually needs to change it. When a task needs to customize one (enable CORS for a specific origin, add a CSP rule, add a new global middleware, etc.), copy the matching reference from [`@vulkano/core/examples/config/express/`](../../node_modules/@vulkano/core/examples/config/express) (or `examples/config/middlewares/`) into `app/config/express/<file>.js` (or `app/config/middlewares/<file>.js`) and edit only what the task requires — don't copy the whole examples folder wholesale.
