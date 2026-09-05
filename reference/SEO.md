# SEO.md

SEO convention for Vulkano Framework projects. No Vue SSR/prerendering in this framework.

**Fully covered by `.claude/skills/vulkano-skills/vulkano-seo/SKILL.md`** — `res.locals.seo` wiring, meta tags, noindex/private-mode default, robots.txt/sitemap.xml, structured data. Invoke it instead of this file for implementation detail.

## Default rule

Every public/crawlable **area** of a project must be crawlable unless the user explicitly says SEO is not required for it — see [AGENTS.md § Project requirements](../AGENTS.md#project-requirements--seo--analytics--accessibility) for the per-area decision. Backend views are the SEO surface for public areas; the Vue SPA is never SEO-covered.

Full pre-production launch checklist (indexing, robots.txt, sitemap, analytics, meta tags together): [reference/LAUNCH.md](LAUNCH.md).
