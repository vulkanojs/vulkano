# ACCESSIBILITY.md

Accessibility convention for Vulkano Framework projects.

## Default rule

Every project meets these minimums unless the user explicitly says accessibility is not required for this project. If a task touches images, navigation, forms, or any interactive element and these minimums aren't met, fix them as part of the task — don't skip silently.

## Images

- Every `<img>` needs a descriptive `alt`. Purely decorative images use `alt=""` (empty, not omitted).
- Icon-only buttons/links (no visible text) need `aria-label` describing the action, not the icon (`aria-label="Close"`, not `aria-label="X icon"`).

## Navigation / menus

- `<nav>` elements get an `aria-label` when there's more than one on the page (e.g. `aria-label="Main"`, `aria-label="Footer"`).
- The active link gets `aria-current="page"`.
- Dropdowns/togglers (mobile menu, accordions, expandable menus) need `aria-expanded` on the trigger and `aria-controls` pointing at the panel id.

## Forms

- Every input has a `<label for="...">` associated by id — placeholder text is not a label substitute.
- Invalid fields get `aria-invalid="true"` and `aria-describedby` pointing at the error message id, matching the existing `fieldErrors` / `*__field-error` pattern (see [AGENTS.md § Form fields](../AGENTS.md#form-fields-frontend)) — the error span needs an `id` for this to work.
- Required fields: the visual `*` asterisk (already required by AGENTS.md) is not enough alone — the input itself still needs `required` in the accessibility tree context (fine to keep `novalidate` on the `<form>` per existing convention; `required` attribute + JS validation both stay, the attribute just isn't relied on for browser validation UI).

## Focus and interaction

- Never remove focus outline (`outline: none`) without a visible replacement (`:focus-visible` style). Keyboard users must always see what's focused.
- Interactive elements are real `<button>`/`<a>`, never a `<div>`/`<span>` with a click handler and no keyboard/focus support.

## Color and contrast

- Reuse existing design tokens (`--color-danger-500`, etc.) instead of introducing custom colors that break the ≥4.5:1 text contrast ratio (≥3:1 for large text/UI components).
- Never convey state (error, required, active) through color alone — pair it with text, icon, or `aria-*` attribute.

## Structure

- Heading levels (`h1`-`h6`) follow document order, no skipped levels for styling convenience.
- Landmark elements (`<header>`, `<nav>`, `<main>`, `<footer>`) used for page structure instead of generic `<div>`s where applicable.
