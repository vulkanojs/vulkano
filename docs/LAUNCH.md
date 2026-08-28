# LAUNCH.md

Pre-production launch checklist for Vulkano Framework projects. Run through this before flipping a project from private/staging to public production — it's the single place that ties together the private-mode defaults documented in `.claude/skills/vulkano-seo/SKILL.md` and `.claude/skills/vulkano-frontend-analytics/SKILL.md`.

## Launch checklist

- [ ] **Indexing enabled** — `SEO_NOINDEX=false` set in the production `.env` (default is `true`/private, see `.claude/skills/vulkano-seo/SKILL.md` § Private mode / noindex default). Verify the rendered `<head>` no longer prints `<meta name="robots" content="noindex, nofollow" />`.
- [ ] **`robots.txt` regenerated** — `public/robots.txt`'s default blanket `Disallow: /` replaced with real allow/disallow rules per `.claude/skills/vulkano-seo/SKILL.md` § Sitemap and robots (allow public backend views, disallow the SPA app-shell prefix if the project reserves one).
- [ ] **`sitemap.xml` present** — `public/sitemap.xml` lists the live backend view URLs (static or generated), per `.claude/skills/vulkano-seo/SKILL.md` § Sitemap and robots.
- [ ] **GA / GTM enabled (yes/no)** — analytics provider ID (`VITE_GA_ID`, GTM container ID, etc.) is set for the production environment and the tracking snippet/library is actually wired in, per `.claude/skills/vulkano-frontend-analytics/SKILL.md`. If tracking was intentionally deferred, record that decision here instead of leaving it ambiguous.
- [ ] **Meta tags reviewed** — `SEO_DEFAULT_TITLE`/`SEO_DEFAULT_DESCRIPTION`/`SEO_DEFAULT_IMAGE` in `app/config/common.js` reflect the real production title/description/share image, not placeholder template defaults.

Don't flip `SEO_NOINDEX` to `false` without also regenerating `robots.txt` — leaving the blanket disallow in place after enabling indexing silently blocks crawl anyway, defeating the point of enabling it.
