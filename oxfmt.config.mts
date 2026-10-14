// Oxfmt config, imported as vite.config.ts `fmt` — read by `vp fmt`/`vp check`
// and the editor's oxc extension (vite-plus wrapper reads only vite.config.ts).
import type { OxfmtConfig } from 'vite-plus/fmt';

export default {
  printWidth: 100,
  singleQuote: true,
  trailingComma: 'none',
  htmlWhitespaceSensitivity: 'strict'
} satisfies OxfmtConfig;
