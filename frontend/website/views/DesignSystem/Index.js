import { ref, onMounted } from 'vue';

// Tokens shown on the page — keep in sync with scss/_tokens.scss.
const COLORS = [
  'bg',
  'surface',
  'text',
  'text-muted',
  'border',
  'primary',
  'primary-hover',
  'danger',
  'success'
];
const FONT_SIZES = ['h1', 'h2', 'h3', 'base', 'small'];
const SPACES = ['1', '2', '3', '4', '6', '8'];
const RADII = ['sm', 'md', 'lg'];
const COLUMNS = [12, 6, 4, 3];

// Current value of a CSS custom property on :root.
function readToken(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim();
}

export default {
  setup() {
    const colors = ref(COLORS.map((name) => ({ name: `color-${name}`, value: '' })));
    const fontSizes = ref(FONT_SIZES.map((name) => ({ name: `font-size-${name}`, value: '' })));
    const spaces = ref(SPACES.map((name) => ({ name: `space-${name}`, value: '' })));
    const radii = ref(RADII.map((name) => ({ name: `radius-${name}`, value: '' })));

    onMounted(() => {
      [colors, fontSizes, spaces, radii].forEach((group) => {
        group.value = group.value.map((token) => ({ ...token, value: readToken(token.name) }));
      });
    });

    return { colors, fontSizes, spaces, radii, columns: COLUMNS };
  }
};
