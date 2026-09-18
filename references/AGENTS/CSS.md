# CSS — layout, units, grid system

Only applies when writing or editing `.scss`/styles or page layout in `frontend/`. Otherwise skip this file.

Covered by `.claude/skills/vulkano-skills/vulkano-frontend-css/SKILL.md`: CSS Grid layout (no Flexbox), BEM naming, and the project's Foundation-style column system below.

Foundation-style responsive grid, built on CSS Grid, imported once per entrypoint's `style.scss` (e.g. `frontend/website/style.scss`):

```html
<div class="row">
  <div class="column small-12 medium-6 large-4">...</div>
</div>
```

- `.row`: `display: grid; grid-template-columns: repeat(12, 1fr);` — 12-column grid.
- `.column`: `grid-column: span 12` default (mobile-first, full row).
- Size classes `.small-N` / `.medium-N` / `.large-N` / `.xlarge-N` (1-12), each `grid-column: span N` — `small` unscoped (base), `medium`/`large`/`xlarge` wrapped in `min-width` media queries (`$breakpoints` map: medium 40rem/640px, large 64rem/1024px, xlarge 75rem/1200px).
- Gutter: `0.875rem` (small), `0.9375rem` from `medium` up. `.row--collapsed` removes it (`gap: 0`).
- Nesting: any `.column` can also carry `.row` to nest a grid inside it — no special helper needed.
- No offset/push-pull classes (not needed yet — add only when a task requires them).

## Units and layout rules

- CSS units: use `rem`, `px`, `dvh`, `vw`, or `%` only — no `ch`, `em`, `vh` (use `dvh`), or other units. `ch` in particular renders inconsistently across the font stacks a host page might cascade in.
- CSS `rem` values (`frontend/**/*.scss`): only use a `rem` value whose px equivalent (at the 16px root) is a whole number — never a decimal px. E.g. use `0.75rem` (12px) not `0.7rem` (11.2px); use `0.375rem` (6px) not `0.3rem` (4.8px); `1px` is `0.0625rem`.
- Frontend layout (`frontend/**/*.scss`): use `display: grid` for layout, not `display: flex` — keep the layout system consistent across the front. Only reach for flex when a component genuinely needs flex-only behavior grid can't express.
