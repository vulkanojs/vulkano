# Backend (`app/`)

See [ARCHITECTURE.md](ARCHITECTURE.md) for the project structure overview and [AGENTS.md](../../AGENTS.md) for workflow/safety rules.

**Controller/route, model, view, and auth work is covered by Claude Code skills** — invoke them for detailed conventions and worked code instead of relying on this file alone:

- `.claude/skills/vulkano-skills/vulkano-backend-controller/SKILL.md` — controller placement, routing convention, `res.vsr`/`res.render`, scaffold, sockets
- `.claude/skills/vulkano-skills/vulkano-backend-model/SKILL.md` — model naming, schema, standard CRUD methods, hooks, `active`/soft-delete, `autopopulate`/`_buildPopulate`
- `.claude/skills/vulkano-skills/vulkano-backend-views/SKILL.md` — `res.render` vs `res.vsr` decision; routes to the Nunjucks or Handlebars skill for actual template syntax (layouts, SEO locals, i18n, formatting helpers, Vite injection)
- `.claude/skills/vulkano-skills/vulkano-backend-auth/SKILL.md` — Auth/User model, `AuthController` convention, JWT via `httpOnly` cookie

This file keeps only what those skills don't cover.

## Code principles

- **DB field/data scripts — singular collection names**: before writing any script that reads/changes a DB field (one-off migration, ad-hoc fix, not just a new model), load `.claude/skills/vulkano-skills/vulkano-backend-model/SKILL.md` first. Collections are singular (`order`, `user`), never pluralized (`orders`, `users`) — don't write the script from memory of generic Mongo/Node conventions.
- **Global constants hardcoded — `app/config/<sectionName>.js` or `bootstrap.js`**: shared constants used across controllers/services/models go in a config file, exported like any other config file. The core exposes every `app/config/*.js` file as `app.config.<sectionName>` (filename minus `.js`, see `app.config = allConfig` in `@vulkano/core/app.js`) — name the file after what it holds (e.g. `app/config/common.js` → `app.config.common`, `app/config/limits.js` → `app.config.limits`):

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

  (Unused-variable naming is a repo-wide rule, not backend-specific — see [AGENTS.md § Code principles](../../AGENTS.md#code-principles--dry-kiss-divide-and-conquer).)

## Security

- Escape dynamic view output for its rendered context, and avoid exposing sensitive values in responses, exceptions, fixtures, or logs like passwords and API keys, etc.
- No endpoint response (`res.vsr`/`res.render` payload, error body, list/detail serialization) may expose passwords, hashes, tokens, or API keys — strip/select fields explicitly rather than returning a full model document. Only exception: the user explicitly asks, for that specific case.
- When implementing authentication: use a dedicated `Auth`/`User` model — don't bolt login logic onto an unrelated model. Route login/logout/session-check through their own controller (e.g. `AuthController`, following the core's `login`/`logout`/`current` action convention — see `.claude/skills/vulkano-skills/vulkano-backend-auth/SKILL.md`). On successful login, set the session token as an `httpOnly` cookie, not `localStorage`/`sessionStorage` or a plain response body field — client-readable storage is exposed to XSS.
- If credentials for Amazon S3, DigitalOcean Spaces, or any other S3-compatible storage are present (env vars, config), never use them to delete objects from the bucket — no `DeleteObjectCommand`/`DeleteObjectsCommand` or equivalent, in app code, scripts, or ad-hoc commands run during a task. Uploads/reads are fine; deletion is off-limits regardless of what the task asks for.

## Framework core conventions

Cron jobs (`Crontab.schedule(...)` registered in `app/config/bootstrap.js`) and auto-loaded globals are defined by the framework core, not by this template. Source of truth: [`@vulkano/core` README](../../node_modules/@vulkano/core/README.md) (also mirrored at https://github.com/vulkanojs/vulkano-core). Routing, controllers, models, views, and auth are covered by the skills linked above.

**Don't pre-scaffold `app/config/express/*.js` or `app/config/middlewares/*.js` files "just in case."** Every file in both folders is optional — an absent file means the core's default behavior applies, and that's fine until a project actually needs to change it. When a task needs to customize one (enable CORS for a specific origin, add a CSP rule, add a new global middleware, etc.), copy the matching reference from [`@vulkano/core/examples/config/express/`](../../node_modules/@vulkano/core/examples/config/express) (or `examples/config/middlewares/`) into `app/config/express/<file>.js` (or `app/config/middlewares/<file>.js`) and edit only what the task requires — don't copy the whole examples folder wholesale.

## Before handoff checklist

- For changes with no automated test coverage, the server was started (`vp run dev` / `vp run start`) and the affected endpoints/controllers were verified manually.
- No `require(...)` of a project model or service (`app/models/`, `app/services/`) — both are auto-loaded as globals; reference them by name directly (e.g. `User`, `Project`) instead.
