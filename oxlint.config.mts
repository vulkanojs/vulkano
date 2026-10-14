// Oxlint config, imported as vite.config.ts `lint` — read by `vp lint`/`vp check`
// and the editor's oxc extension (vite-plus wrapper reads only vite.config.ts).
import type { OxlintConfig } from 'vite-plus/lint';

export default {
  env: {
    node: true,
    browser: true,
    es6: true
  },
  globals: {
    app: 'readonly',
    io: 'readonly',
    ApiClient: 'readonly',
    Crontab: 'readonly',
    Encrypter: 'readonly',
    Filter: 'readonly',
    i18n: 'readonly',
    Merge: 'readonly',
    Paginate: 'readonly',
    VSError: 'readonly',
    ABS_PATH: 'readonly',
    APP_PATH: 'readonly',
    CORE_PATH: 'readonly',
    PUBLIC_PATH: 'readonly'
  },
  rules: {
    curly: 'error',
    'no-console': 'off',
    'no-underscore-dangle': 'off',
    'no-throw-literal': 'off',
    'no-unneeded-ternary': 'off',
    'guard-for-in': 'off',
    'no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_'
      }
    ],
    // FRONTEND.md § UI library: confirm/alert/prompt go through the UI library
    'no-restricted-globals': [
      'error',
      { name: 'confirm', message: 'Use the UI library confirm (FRONTEND.md § UI library).' },
      { name: 'alert', message: 'Use the UI library message/toast (FRONTEND.md § UI library).' },
      { name: 'prompt', message: 'Use the UI library dialog (FRONTEND.md § UI library).' }
    ],
    'no-restricted-properties': [
      'error',
      { object: 'window', property: 'confirm', message: 'Use the UI library confirm.' },
      { object: 'window', property: 'alert', message: 'Use the UI library message/toast.' },
      { object: 'window', property: 'prompt', message: 'Use the UI library dialog.' }
    ]
  },
  ignorePatterns: ['node_modules', 'public', 'test', 'bundle', 'tasks', 'docs', 'clean'],
  options: {
    typeAware: true,
    typeCheck: true
  }
} satisfies OxlintConfig;
