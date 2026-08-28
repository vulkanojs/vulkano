# ANALYTICS.md

Analytics/tracking convention for Vulkano Framework projects.

**Fully covered by `.claude/skills/vulkano-frontend-analytics/SKILL.md`** — provider wiring (vue-gtag/gtag.js), GA4 event naming, GTM element ids, custom-dimension and private-mode warnings. Invoke it instead of this file for implementation detail.

## Default rule

Every project tracks analytics unless the user explicitly says tracking is not required for this project (see the SEO/Analytics/Accessibility area table in the root `CLAUDE.md`). If a task touches a form, button, download, video, or page and no tracking exists yet, ask the user which provider(s) to wire up before considering the task done — don't skip silently.

Full pre-production launch checklist (indexing, robots.txt, sitemap, GA/GTM, meta tags together): [docs/LAUNCH.md](LAUNCH.md).
