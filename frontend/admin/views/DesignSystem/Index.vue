<template>
  <div class="design-system">
    <h1 class="design-system__title">Design system</h1>
    <p class="design-system__intro">
      Tokens from <code>scss/_tokens.scss</code> and base styles from <code>scss/_base.scss</code>.
      Dev only — not registered in production.
    </p>

    <section class="design-system__section">
      <h2 class="design-system__heading">Colors</h2>
      <div class="design-system__swatches">
        <div v-for="color in colors" :key="color.name" class="design-system__swatch">
          <span
            class="design-system__swatch-color"
            :style="{ background: `var(--${color.name})` }"
          ></span>
          <code>--{{ color.name }}</code>
          <small class="design-system__value">{{ color.value }}</small>
        </div>
      </div>
    </section>

    <section class="design-system__section">
      <h2 class="design-system__heading">Typography</h2>
      <div v-for="size in fontSizes" :key="size.name" class="design-system__type-row">
        <span :style="{ fontSize: `var(--${size.name})` }">The quick brown fox</span>
        <code>--{{ size.name }}</code>
        <small class="design-system__value">{{ size.value }}</small>
      </div>
    </section>

    <section class="design-system__section">
      <h2 class="design-system__heading">Spacing &amp; radii</h2>
      <div v-for="space in spaces" :key="space.name" class="design-system__space-row">
        <span class="design-system__space-bar" :style="{ width: `var(--${space.name})` }"></span>
        <code>--{{ space.name }}</code>
        <small class="design-system__value">{{ space.value }}</small>
      </div>
      <div class="design-system__radii">
        <div v-for="radius in radii" :key="radius.name" class="design-system__radius">
          <span
            class="design-system__radius-box"
            :style="{ borderRadius: `var(--${radius.name})` }"
          ></span>
          <code>--{{ radius.name }}</code>
        </div>
      </div>
    </section>

    <section class="design-system__section">
      <h2 class="design-system__heading">Base components</h2>
      <div class="design-system__components">
        <button type="button">Button</button>
        <button type="button" disabled>Disabled</button>
        <a href="#">Link</a>
        <label class="design-system__field">
          <span>Email <span class="field-required">*</span></span>
          <input type="email" placeholder="you@example.com" />
        </label>
      </div>
    </section>

    <section class="design-system__section">
      <h2 class="design-system__heading">Grid</h2>
      <div v-for="span in columns" :key="span" class="row design-system__grid-row">
        <div v-for="n in 12 / span" :key="n" :class="`column small-12 medium-${span}`">
          <div class="design-system__grid-cell">medium-{{ span }}</div>
        </div>
      </div>
    </section>
  </div>
</template>

<script src="./Index.js"></script>
