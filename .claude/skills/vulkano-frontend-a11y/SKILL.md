---
name: vulkano-frontend-a11y
description: Use when adding or reviewing images, navigation, forms, or other interactive elements in this Vulkano framework project's frontend/ — alt text, aria-label/aria-expanded/aria-current, form label/aria-invalid/aria-describedby wiring, focus-visible, and contrast rules.
---

# Frontend Accessibility

## Overview

Every project meets these minimums unless the user explicitly opted out for that area (check the SEO/Analytics/Accessibility table in root CLAUDE.md — Accessibility is "on" for every area type, including CMS/admin and widgets). If a task touches images, navigation, forms, or an interactive element and minimums aren't met, fix as part of the task — don't skip silently.

## When to use

Any `frontend/` change involving `<img>`, `<nav>`, dropdowns/togglers, `<form>` inputs, or custom interactive elements.

Not for the form's validation-error JS pattern itself — see vulkano-frontend-form, apply both together.

## Images

- Every `<img>` needs a descriptive `alt`. Purely decorative → `alt=""` (empty, never omitted).
- `src` is an absolute path from `public/` (`/img/...`), never `@website/...`/`@admin/...` or a bundled import — see vulkano-frontend-component § Images / static assets.
- Icon-only buttons/links need `aria-label` describing the action, not the icon: `aria-label="Close"`, not `aria-label="X icon"`.

## Navigation

- `<nav>` gets `aria-label` when there's more than one on the page (`aria-label="Main"`, `aria-label="Footer"`).
- Active link gets `aria-current="page"`.
- Dropdowns/togglers (mobile menu, accordion) need `aria-expanded` on the trigger, `aria-controls` pointing at the panel's id.

```html
<button :aria-expanded="isOpen" aria-controls="mobile-menu" @click="isOpen = !isOpen">
  Menu
</button>
<nav id="mobile-menu" aria-label="Main" v-show="isOpen">...</nav>
```

## Forms

- Every input has `<label for="...">` matched by id — placeholder is never a label substitute.
- Invalid fields get `aria-invalid="true"` + `aria-describedby` pointing at the error span's id (that span needs an `id` for this to work) — matches the `fieldErrors` pattern in vulkano-frontend-form.
- Required fields keep the native `required` attribute even though `novalidate` suppresses its browser UI (per vulkano-frontend-form) — it stays for the accessibility tree.

```html
<label for="email">Email <span class="field-required">*</span></label>
<input
  id="email"
  type="email"
  required
  :aria-invalid="!!fieldErrors.email"
  aria-describedby="email-error"
/>
<span v-if="fieldErrors.email" id="email-error">{{ fieldErrors.email }}</span>
```

## Focus and interaction

- Never `outline: none` without a `:focus-visible` replacement — keyboard users must see focus.
- Interactive elements are real `<button>`/`<a>`, never a `<div>`/`<span>` with a click handler and no keyboard support.

## Color and contrast

- Reuse existing design tokens (`--color-danger-500`, etc.) — don't introduce colors under 4.5:1 text contrast (3:1 for large text/UI components).
- Never convey state (error/required/active) through color alone — pair with text, icon, or `aria-*`.

## Structure

- Heading levels (`h1`-`h6`) follow document order, no skipped levels for styling.
- Use landmark elements (`<header>`, `<nav>`, `<main>`, `<footer>`) over generic `<div>`s where applicable.

## After writing

- Visually verify with a screen reader or the browser's accessibility tree inspector when the change is non-trivial (custom widget, dropdown).
- Run `vp check` and `vp test`.

## Reference

`reference/ACCESSIBILITY.md` (full detail).
