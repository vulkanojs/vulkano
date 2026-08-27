# SEO.md

SEO convention for Vulkano Framework projects. No Vue SSR/prerendering in this framework — see [Default rule](#default-rule).

## Default rule

Every public/crawlable **area** of a project must be crawlable unless the user explicitly says SEO is not required for it — see [AGENTS.md § Project requirements](../AGENTS.md#project-requirements--seo--analytics--accessibility) for the per-area decision (a single project can mix a public front with a CMS/admin area, and only the public one gets SEO).

- **Backend views** (`app/views/*.html`, Nunjucks, server-rendered via `res.vsr`/`res.render` — see [BACKEND.md § Backend conventions](BACKEND.md#backend-conventions--owned-by-vulkanocore)) are the SEO surface **for public/crawlable areas**. Any page that needs to rank (landing, blog, product/listing pages) is built here, not as a Vue route. A backend view that belongs to a non-public area (a server-rendered CMS/admin panel, for instance) is still not a SEO target just because it's server-rendered — rendering layer alone doesn't decide SEO scope, the area does.
- **The Vue 3 SPA** (`client/`) is client-rendered and not SEO-covered — treat it as the logged-in/app area (dashboard, admin, account settings) where indexing doesn't matter. Do not add Vue SSR or a prerendering step to make SPA routes indexable; that's out of scope for this framework. If a page needs to rank, build it as a backend view instead.

## Meta tags

Every backend view that's a crawl target needs a `<title>`/`<meta name="description">`/canonical/OG/Twitter payload. Generate it via a global middleware, override it per route where needed:

- **`app/config/middlewares/seo.js`** sets defaults on `res.locals.seo` for every request, before any controller runs (files under `app/config/middlewares/` are auto-loaded as named global middleware — see `app.config.middlewares` in [`@vulkano/core` README § JWT Authentication](../node_modules/@vulkano/core/README.md#jwt-authentication) for the loading mechanism):

  ```js
  // app/config/middlewares/seo.js
  module.exports = (req, res, next) => {
    res.locals.seo = {
      title: app.config.common.SEO_DEFAULT_TITLE,
      description: app.config.common.SEO_DEFAULT_DESCRIPTION,
      image: app.config.common.SEO_DEFAULT_IMAGE,
      url: `${req.protocol}://${req.get('host')}${req.originalUrl}`
    };
    next();
  };
  ```

  Defaults live in `app/config/common.js` (`SEO_DEFAULT_TITLE`, `SEO_DEFAULT_DESCRIPTION`, `SEO_DEFAULT_IMAGE`) per the [BACKEND.md § Global constants](BACKEND.md#global-constants-hardcoded--appconfigcommonjs-or-bootstrapjs) convention.

  **This middleware runs on every request** (`app/config/middlewares/*.js` is global, not route-scoped — see the loading mechanism linked above). On a project with a non-SEO area (a CMS/admin panel — see [docs/ARCHITECTURE.md § Multiple entry points](ARCHITECTURE.md#multiple-entry-points--front--cms-or-any-other-split-app)), skip it early for that area's path prefix so it does nothing there:

  ```js
  // app/config/middlewares/seo.js
  module.exports = (req, res, next) => {
    if (req.path.startsWith('/cms')) { // match this project's CMS/admin prefix
      return next();
    }
    res.locals.seo = { /* ...as above */ };
    next();
  };
  ```

  That said, the CMS/admin backend layout (its own base template, per Multiple entry points above) shouldn't reference `seo.*` at all — it doesn't need per-route dynamic SEO data, so its `<title>` and any meta tags are just hardcoded plain strings in the Nunjucks/Handlebars template, not interpolated from locals. The early return above is defense-in-depth (and saves the wasted work), not something the CMS template relies on.

- **A route needing a different title/description/image** merges into `res.locals.seo` in its controller before calling `res.render(...)` — the middleware already ran, so this overrides only what changes:

  ```js
  // app/controllers/BlogController.js
  module.exports = {
    'get :slug'(req, res) {
      Post.findOne({ slug: req.params.slug }).then((post) => {
        res.locals.seo = {
          ...res.locals.seo,
          title: post.title,
          description: post.excerpt,
          image: post.coverImage
        };
        res.render('blog/show', { post });
      });
    }
  };
  ```

- **The template** prints `seo.*` — Nunjucks reads `res.locals` automatically, no extra wiring needed:

  ```html
  <title>{{ seo.title }}</title>
  <meta name="description" content="{{ seo.description }}" />
  <link rel="canonical" href="{{ seo.url }}" />
  <meta property="og:title" content="{{ seo.title }}" />
  <meta property="og:description" content="{{ seo.description }}" />
  <meta property="og:image" content="{{ seo.image }}" />
  <meta property="og:url" content="{{ seo.url }}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="{{ seo.title }}" />
  <meta name="twitter:description" content="{{ seo.description }}" />
  <meta name="twitter:image" content="{{ seo.image }}" />
  ```

## Private mode / noindex default

New projects start **not indexable** by default — no site should be crawled/ranked before it actually launches.

- `app/config/common.js` — `SEO_NOINDEX: process.env.SEO_NOINDEX !== 'false'` — defaults to `true` (private) unless `SEO_NOINDEX=false` is set in `.env`.
- `app/config/middlewares/seo.js` — copies it onto `res.locals.seo.noindex` for every request.
- `app/views/_shared/templates/default.html` — prints `<meta name="robots" content="noindex, nofollow" />` whenever `seo.noindex` is true.
- `public/robots.txt` ships `Disallow: /` for all user agents by default (private mode) — see below, replace it with real allow rules at launch.

Full pre-production launch checklist (indexing, robots.txt, sitemap, analytics, meta tags together): [docs/LAUNCH.md](LAUNCH.md).

Whenever a task touches analytics/tracking on a project still in this default private state, surface a warning per [docs/ANALYTICS.md § Private mode warning](ANALYTICS.md#private-mode-warning) — tracking on an unindexed site is easy to forget to flip alongside indexing.

## Sitemap and robots

- `public/robots.txt` — allow crawl of public backend views; disallow the SPA's app-shell prefix if the project reserves one (e.g. `/app/*`) since it has nothing to index anyway. Starts as blanket `Disallow: /` per private mode above — update at launch.
- `public/sitemap.xml` — list backend view URLs. Static file for a fixed page set; generate it from a controller/service when the page set is data-driven (e.g. blog posts, products).

## Structured data

Add JSON-LD (`Article`, `Product`, `Organization`, etc.) in the backend view template where relevant, sourced from the same locals passed to the meta tags above — don't duplicate content into a separate data source.

## Headings and images

Already covered by [ACCESSIBILITY.md](ACCESSIBILITY.md) (`alt` text, heading order, landmark elements) — those minimums double as SEO signals, nothing extra to add here.

## Handoff checklist

For every new or changed crawlable backend view, these three are required unless the user explicitly says SEO is not required for that page:

- [ ] **Title** — unique `res.locals.seo.title` set (route override or default), printed in `<title>` and `og:title`/`twitter:title`.
- [ ] **Description** — unique `res.locals.seo.description` set, printed in `<meta name="description">` and `og:description`/`twitter:description`.
- [ ] **Share image** — `res.locals.seo.image` set (route override or default), printed in `og:image`/`twitter:image`.

Don't skip these silently — if a page is missing a custom title/description/image, ask the user whether the shared default is acceptable or a page-specific one is needed.
