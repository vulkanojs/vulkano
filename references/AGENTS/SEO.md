# SEO.md

SEO convention for Vulkano Framework projects. No Vue SSR/prerendering in this framework.

**Fully covered by `.claude/skills/vulkano-skills/vulkano-seo/SKILL.md`** — `res.locals.seo` wiring, meta tags, noindex/private-mode default, robots.txt/sitemap.xml, structured data. Invoke it instead of this file for implementation detail.

## Default rule

Every public/crawlable **area** of a project must be crawlable unless the area's SEO column in [PROJECT.md § Project requirements](../../PROJECT.md#project-requirements--seo--analytics--accessibility) is off — that table is the only place that decides; this doc is a reference. Backend views are the SEO surface for public areas; the Vue SPA is never SEO-covered.

Full pre-production launch checklist (indexing, robots.txt, sitemap, analytics, meta tags together): [references/AGENTS/LAUNCH.md](LAUNCH.md).
