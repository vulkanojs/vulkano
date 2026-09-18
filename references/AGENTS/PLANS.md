# Plans (superpowers)

Only applies when using `superpowers` to plan, spec, or execute multi-step work. Otherwise skip this file.

## Where output goes

Planning and specs (`superpowers:brainstorming`, `superpowers:writing-plans`) output under `.superpowers/plans/` and `.superpowers/specs/` (same root as `.superpowers/sdd/`, which the plugin hardcodes and cannot be relocated). **This overrides the brainstorming skill's own default path (`docs/superpowers/specs/`)** — that default never applies in this repo; always write specs, plans and sdd to `.superpowers`, no exceptions.

## Executing a plan

Implement plans one task at a time (`superpowers:executing-plans`): after each task, mark it done in the plan file and note which task is next, then clear the conversation or start a new session. On "continue"/"next task", read the plan file's status first to know exactly where to resume.

## Framework skills inside a plan (writing-plans / subagent-driven-development)

Only when the plan's tasks touch `app/controllers/*.js`, `app/models/*.js`, `app/views/*.html`, an auth flow, or `frontend/**` frontend code: load the matching project skill (`vulkano-backend-controller`, `vulkano-backend-model`, `vulkano-backend-views-nunjucks`/`-handlebars`, `vulkano-backend-auth`, `vulkano-frontend-*`) **before finalizing that task's code in the plan** — not later, not by hoping the implementer subagent will discover it.

Why this order matters: under `superpowers:subagent-driven-development`, implementer subagents are dispatched fresh with zero session context — they only see the task brief. If the plan-author (you) didn't consult the relevant skill before writing that task's exact code into the plan/brief, a convention violation ships silently, because the implementer has no reason to go looking for a skill it was never told about.

Checklist per task, at plan-authoring time:

1. Identify the file type(s) the task creates/modifies.
2. Load every project skill whose "When to use" matches.
3. Bake that skill's binding conventions directly into the task's code before it goes in the plan.
4. Copy the same binding conventions into that task's future task-reviewer dispatch (the "global constraints" block) — the reviewer is also a fresh subagent with no memory of which skills applied.
