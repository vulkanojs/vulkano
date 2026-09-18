# Microinteractions

Only applies when adding or editing a button or other clickable element, an async action (fetch, submit, delete), or a transition/animation in `frontend/`. Otherwise skip this file.

- Every async action (fetch, submit, delete) needs a `loading` state: spinner/skeleton, disabled or `--loading` button state, visual feedback while waiting for the response.
- Interactive elements (buttons, table rows, cards, links) need hover/rollover: subtle color/shadow/scale transition, never an abrupt change.
- Every `<button>` (and any clickable non-native element, e.g. a `div`/`span` acting as one) gets `cursor: pointer`, disabled state excepted (`cursor: not-allowed` or default). Reuse a shared base button style/mixin instead of setting it per view.
- State transitions (modal/toast/dropdown/error appearing or disappearing) use a short `transition`/`animation` (~150-250ms), no instant jump.
- Reuse shared utilities (`.is-loading`, transition mixins in `_index.scss` or design tokens) instead of repeating the animation per view — see [AGENTS.md § Code principles](../../AGENTS.md#code-principles--dry-kiss-divide-and-conquer).
- For polished/complex animations (staggered lists, timeline sequences, scroll-triggered effects) CSS transitions can't cleanly express, GSAP is allowed — not yet a dependency, install with `pnpm add gsap` before first use and call this out explicitly in the diff.
- For scroll-reveal effects (fade/slide-in as elements enter viewport), AOS is allowed — not yet a dependency, install with `pnpm add aos` before first use and call this out explicitly in the diff.
