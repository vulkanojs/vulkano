# ANALYTICS.md

Analytics/tracking convention for Vulkano Framework projects.

**Fully covered by `.claude/skills/vulkano-skills/vulkano-frontend-analytics/SKILL.md`** — provider wiring (vue-gtag/gtag.js), GA4 event naming, GTM element ids, custom-dimension and private-mode warnings. Invoke it instead of this file for implementation detail.

## Default rule

Every project tracks analytics unless the area's Analytics column in `PROJECT.md` § Project requirements is off — that table is the only place that decides; this doc is a reference. If a task touches a form, button, download, video, or page and no tracking exists yet, ask the user which provider(s) to wire up before considering the task done — don't skip silently.

Full pre-production launch checklist (indexing, robots.txt, sitemap, GA/GTM, meta tags together): [references/AGENTS/LAUNCH.md](LAUNCH.md).
