# Backend (`app/`)

**Controller/route, model, view, and auth work is covered by Claude Code skills** — invoke them for detailed conventions and worked code instead of relying on this file alone:

- `.claude/skills/vulkano-skills/vulkano-backend-controller/SKILL.md` — controller placement, routing convention, `res.vsr`/`res.render`, scaffold, sockets
- `.claude/skills/vulkano-skills/vulkano-backend-model/SKILL.md` — model naming, schema, standard CRUD methods, hooks, `active`/soft-delete, `autopopulate`/`_buildPopulate`
- `.claude/skills/vulkano-skills/vulkano-backend-views/SKILL.md` — `res.render` vs `res.vsr` decision; routes to the Nunjucks or Handlebars skill for actual template syntax (layouts, SEO locals, i18n, formatting helpers, Vite injection)
- `.claude/skills/vulkano-skills/vulkano-backend-auth/SKILL.md` — Auth/User model, `AuthController` convention, JWT via `httpOnly` cookie

This file keeps only what those skills don't cover. `app/config/routes.js` explicit mappings and the SPA catch-all convention are in [ROUTING.md](ROUTING.md) (cross-cutting with `frontend/`).

## Code principles

- **DB field/data scripts — singular collection names**: before writing any script that reads/changes a DB field (one-off migration, ad-hoc fix, not just a new model), load `.claude/skills/vulkano-skills/vulkano-backend-model/SKILL.md` first. Collections are singular (`order`, `user`), never pluralized (`orders`, `users`) — don't write the script from memory of generic Mongo/Node conventions.
  (Unused-variable naming is a repo-wide rule, not backend-specific — see [AGENTS.md § Code principles](../../AGENTS.md#code-principles--dry-kiss-divide-and-conquer).)

## Security

- Escape dynamic view output for its rendered context, and avoid exposing sensitive values in responses, exceptions, fixtures, or logs like passwords and API keys, etc.
- No endpoint response (`res.vsr`/`res.render` payload, error body, list/detail serialization) may expose passwords, hashes, tokens, or API keys — strip/select fields explicitly rather than returning a full model document. Only exception: the user explicitly asks, for that specific case.
- When implementing authentication: use a dedicated `Auth`/`User` model — don't bolt login logic onto an unrelated model. Route login/logout/session-check through their own controller (e.g. `AuthController`, following the core's `login`/`logout`/`current` action convention — see `.claude/skills/vulkano-skills/vulkano-backend-auth/SKILL.md`). On successful login, set the session token as an `httpOnly` cookie, not `localStorage`/`sessionStorage` or a plain response body field — client-readable storage is exposed to XSS.
- If credentials for Amazon S3, DigitalOcean Spaces, or any other S3-compatible storage are present (env vars, config), never use them to delete objects from the bucket — no `DeleteObjectCommand`/`DeleteObjectsCommand` or equivalent, in app code, scripts, or ad-hoc commands run during a task. Uploads/reads are fine; deletion is off-limits regardless of what the task asks for.

## Framework core conventions

Adding a shared constant (`app/config/<sectionName>.js` / `bootstrap.js`), customizing `app/config/express/*` or `app/config/middlewares/*`, or scheduling a cron job — read [CONFIG.md](CONFIG.md) first. Source of truth for everything else in the core: [`@vulkano/core` README](../../node_modules/@vulkano/core/README.md).

## Before handoff checklist

- For changes with no automated test coverage, the server was started (`vp run dev` / `vp run start`) and the affected endpoints/controllers were verified manually.
- No `require(...)` of a project model or service (`app/models/`, `app/services/`) — both are auto-loaded as globals; reference them by name directly (e.g. `User`, `Project`) instead.
