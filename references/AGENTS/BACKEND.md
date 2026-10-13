# Backend (`app/`)

Rules only. Worked code lives in the skills named per section — they load automatically when the task matches. Core internals not covered here: [`@vulkano/core` README](../../node_modules/@vulkano/core/README.md) (search the section you need, don't read it whole).

## Controllers — skill `vulkano-backend-controller`

- Routing is by convention: `/:resource/:method?/:param?` → `<Resource>Controller.<method>`. Filename plural PascalCase; URL segment = filename kebab-cased (`VatTypesController` → `/vat-types`).
- Method keys: `get`, `'get :id'`, `post`, `'put :id'`, `'delete :id'`, `'post save'`. No verb = GET.
- View controller → `app/controllers/` + `res.render()`. API → `app/controllers/api/` + `res.vsr(promise, status?)`. Socket → `app/controllers/sockets/` + `app/config/sockets/events.js`.
- Thin: read params → call model/service → respond. Nothing top-level besides `require` and the exported object. Lookup/mapping tables are domain logic → model.
- Create + edit share one method/template, branching on `:id`.

## Scaffold

- Every model inherits the CRUD methods; the controller decides exposure. Full CRUD API with no code: controller `{ scaffold: 'Product', allowedMethods: [...] }` + model with `attributes` + `fillable` (the only fields the inherited `update` writes).
- CRUD routes for an embedded array field: `subdocs` (off by default; only listed keys, optional methods per key) — skill `vulkano-backend-controller`.
- Write CRUD methods by hand only when overriding scaffold behavior.

## Models — skill `vulkano-backend-model` (only if `MONGO_URI` is set)

- `app/models/<Name>.js`, singular PascalCase; collection singular (`order`, never `orders`) — also in migration/fix scripts.
- Business logic and validation live in the model, never in the controller. No repository layer, no shared CRUD factory.
- `getAll` returns a page object (`.items`) — or a bare array when `?page=all`.
- `active` = soft-delete only. `createdAt`/`updatedAt` are automatic — never hand-roll timestamps.
- Populate only through `autopopulate: true` / `_buildPopulate`; `select: false` does not protect fields from `?populate=`.

## Auth — skill `vulkano-backend-auth`

- `Auth` model (login/token/current-user logic) + `User` model (bcrypt hash with `SALT_KEY`, `password` `select: false`) + `app/controllers/api/AuthController.js` (`post login`, `post logout`, `get current`).
- Enable `app/config/express/jwt.js` + copy `app/config/middlewares/auth.js` (decrypts `req.auth`). Public `/api` endpoints go in `jwt.js` `ignore`; everything else requires the token.
- JWT only in an `httpOnly` cookie (`secure` in production, `sameSite: 'lax'`, `maxAge` = token `expiration`); never in the body, `localStorage` or `sessionStorage`. `JWT_SECRET_KEY` empty with jwt enabled → server doesn't boot.
- Passwords: `bcryptjs` (project dependency), never `Encrypter` (reversible).

## Views — skills `vulkano-backend-views` (render vs vsr) + `vulkano-backend-templates` (syntax)

- Page a browser opens directly (landing, about, blog post, product) → `res.render`, never a Vue SPA route: the SPA isn't crawlable.
- Engine from `app/config/views.js` → `{ engine: 'nunjucks' | 'handlebars' }` (absent = Nunjucks). `app/config/views/config.js` also works; never both (the file wins). One base layout per entrypoint under `app/views/_shared/templates/`.
- HTML outside a request (PDF, email) → `View.render(view, data)` inside a service, not the controller.

## SEO wiring

How to do SEO well = any SEO skill. Where Vulkano wires it:

- `app/config/middlewares/seo.js` sets `res.locals.seo` (`title`, `description`, `image`, `url`, `noindex`) from `app/config/common.js` `SEO_DEFAULT_*`. Override per route: `res.locals.seo = { ...res.locals.seo, title }` before `res.render`. The public layout prints `seo.*`. A CMS/admin layout has no SEO: only `<title>{{ seo.title }}</title>` + fixed `noindex, nofollow` (no description/canonical/og). Its controller sets the title (`res.locals.seo = { ...res.locals.seo, title: 'VulkanoJS - Admin' }`); any admin controller may override it.
- Private by default: `SEO_NOINDEX` (env, default `true`) → `<meta name="robots" content="noindex">`, and `public/robots.txt` ships `Disallow: /`. At launch flip both together (`SEO_NOINDEX=false` + real robots rules) — one without the other still blocks crawl.
- `public/sitemap.xml` is not shipped — the project creates it: by hand for a fixed page set, or with a script/service (cron, `Crontab` in `bootstrap.js`) that regenerates it when content changes. Absolute URLs from `SITE_URL` in `.env`. Don't create or edit it unless the task asks.

## Autoload and libraries

- `app/models/*` and `app/services/*` are auto-loaded globals (`Order`, `Upload`) — never `require()` them.
- Core libs are globals too (no `require`, core README § Built-in Global Libs): `VSError` (errors), `Paginate`, `Jwt`, `Encrypter` (reversible encryption — never passwords), `Filter` (sanitize input), `Merge`, `ApiClient` (external HTTP), `Upload`/`Download` (files), `View`, `Crontab`, `i18n`, `mongoose`. Use them before adding an npm dependency.
- Shared helper logic → `app/services/<Name>.js`. Shared constants → `app/config/<section>.js` (read as `app.config.<section>.X`); a true global → `global.X` in `app/config/bootstrap.js`.
- Cron jobs: `Crontab.schedule(...)` in `app/config/bootstrap.js` (core README § Cron Jobs).
- `app/config/express/*` and `app/config/middlewares/*` are optional — don't pre-scaffold. To customize one, copy only that file from `node_modules/@vulkano/core/examples/config/` and edit what the task needs.

## Routes — `app/config/routes.js` (catch-all code: skill `vulkano-frontend-entrypoint`)

- Add an explicit entry only when convention can't express it (absolute path, catch-all). Never duplicate a convention route.
- SPA catch-all only for an area that mounts a Vue app (`<div id="app">` in its layout): scoped `'/<area>/*'` before generic `'/*'`, all last. Always paired with a frontend `NotFound` route. Missing → in-app navigation works, hard refresh 404s.
- Fully server-rendered area → no catch-all; the core returns a real 404 (`app/views/_shared/errors/404.html`).
- `/api/*` convention routes register first — a catch-all never shadows an `/api` route that exists; a non-existent `/api` URL gets the SPA's HTML (200) instead of a 404.

## Security

- Escape dynamic output for its context. No response (`res.vsr`, `res.render`, error body) exposes passwords, hashes, tokens or API keys — select fields explicitly, never return a raw document. Exception: user asks explicitly for that case.
- S3/Spaces/S3-compatible credentials: never delete objects (`DeleteObjectCommand` etc.), in app code, scripts or ad-hoc commands. Uploads/reads are fine.

## Before handoff

- New/changed controller, model, service or middleware has a test (skill `vulkano-testing`).
- No automated test → start the server (`vp run dev`) and hit the endpoint manually.
