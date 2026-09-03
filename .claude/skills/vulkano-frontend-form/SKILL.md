---
name: vulkano-frontend-form
description: Use when building or editing a form in this Vulkano framework project's frontend/ — required-field asterisks, JS-only validation (no native HTML5 validation UI), fieldErrors pattern, input types, and date-picker choice.
---

# Frontend Form

## Overview

Forms never rely on native browser validation UI (`required`/`:invalid` styling, error bubbles) — it can't be styled consistently and breaks the design system. Validation is always hand-rolled in JS, error state kept in component data, message rendered inline.

## When to use

Any `<form>` add/edit in `frontend/` — contact forms, login, CRUD create/edit views.

Not for component file layout — see vulkano-frontend-component. Not for a11y attributes on the form (labels, `aria-invalid`) — see vulkano-frontend-a11y, apply both together.

## Required-field pattern

- `<form novalidate>` — suppresses native validation UI, JS still handles the flow.
- `fieldErrors` reactive object in component state: `{ email: '', password: '' }`.
- Every required field's label gets a red asterisk: reuse a shared `.field-required` (or equivalent BEM element) with `color: var(--color-danger-500)` — never hardcode red per view. **Neither the class nor the `--color-danger-500` token exists in a fresh scaffold** (checked: no `frontend/**/*.scss` defines it) — the first form in a project defines both once, in a shared partial (e.g. `frontend/<entrypoint>?/scss/_tokens.scss`, imported from `style.scss`), and every form after that reuses them.
- Error message rendered inline below the input: `<span class="*__field-error">{{ fieldErrors.email }}</span>`.
- Invalid input gets a `*__input--invalid` class for the red border.
- No `frontend/<entrypoint>?/views/Login/` exists in a fresh scaffold — it's not a file to go open and copy. Follow the `novalidate` + `fieldErrors` + `<span class="*__field-error">` + `*__input--invalid` shape from the Skeleton below instead; once a project's first login/form view exists, treat _that_ as the local reference for the next one.

## Skeleton

```js
// Index.js
import { ref, getCurrentInstance } from 'vue';

export default {
  setup() {
    const { $api } = getCurrentInstance().proxy || {};
    const form = ref({ email: '', password: '' });
    const fieldErrors = ref({ email: '', password: '' });
    const isSubmitting = ref(false);

    function validate() {
      fieldErrors.value = { email: '', password: '' };
      if (!form.value.email) fieldErrors.value.email = 'Email is required';
      if (!form.value.password) fieldErrors.value.password = 'Password is required';
      return !Object.values(fieldErrors.value).some(Boolean);
    }

    async function submit() {
      if (!validate()) return;
      isSubmitting.value = true;
      try {
        await $api.post('/auth/login', form.value);
      } finally {
        isSubmitting.value = false;
      }
    }

    return { form, fieldErrors, isSubmitting, submit };
  }
};
```

```html
<form novalidate @submit.prevent="submit">
  <label class="login__label" for="email"> Email <span class="field-required">*</span> </label>
  <input
    id="email"
    type="email"
    v-model="form.email"
    :class="{ 'login__input--invalid': fieldErrors.email }"
    :aria-invalid="!!fieldErrors.email"
    :aria-describedby="fieldErrors.email ? 'email-error' : null"
  />
  <span v-if="fieldErrors.email" id="email-error" class="login__field-error"
    >{{ fieldErrors.email }}</span
  >

  <button type="submit" :disabled="isSubmitting" :class="{ 'is-loading': isSubmitting }">
    Submit
  </button>
</form>
```

## Input types — still required

Setting the correct `type` (`email`, `number`, `date`, `range`, `tel`, ...) is about semantics/mobile keyboard/a11y, not the validation-UI point above — it stays required even with `novalidate`.

## Date fields

`type="date"`'s native picker can't be restyled and varies by browser/OS. Acceptable for low-stakes internal forms. Views already carrying the redesign should use a shadcn-vue date-picker (`pnpm dlx shadcn-vue add calendar` + `popover`) instead — shadcn-vue is not installed yet, call out the install explicitly if adding it.

## Microinteractions (required on every submit)

- `loading` state on submit: disabled/`is-loading` button, spinner if the action takes noticeable time.
- Success/error toast or inline message uses a short transition (~150-250ms), never an instant jump.

## After writing

- Track both outcomes (`{section}_success` / `{section}_error`) per vulkano-frontend-analytics, unless the user opted out for this area.
- Confirm a11y requirements (labels, `aria-invalid`, `aria-describedby`) per vulkano-frontend-a11y.
- Visually verify in a browser: submit with empty fields, invalid values, and valid values.
- Run `vp check` and `vp test`.

## Reference

The Skeleton above (canonical pattern — no pre-existing `frontend/<entrypoint>?/views/Login/` to copy from in a fresh scaffold), AGENTS.md § Form fields, docs/ACCESSIBILITY.md § Forms.
