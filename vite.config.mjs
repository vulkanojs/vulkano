import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite-plus';
import dotenv from 'dotenv';
import vue from '@vitejs/plugin-vue';
import devManifest from 'vite-plugin-dev-manifest';
import { entries } from './vite.entries.mjs';

dotenv.config({ quiet: true });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const allowHashForCache = String(process.env.VITE_CHUNK_NAMES || false) === 'true';
const outDir = path.resolve(__dirname, 'public');
const manifestDir = path.join(outDir, '.vite');
const manifestPath = path.join(manifestDir, 'manifest.json');

// '@<dir>' for every entry's own folder under frontend/ (e.g.
// 'frontend/website/app.js' -> '@website'), so a new entry in
// vite.entries.mjs gets its alias for free instead of a manual edit here.
const alias = Object.fromEntries(
  Object.values(entries).map((entryPath) => {
    const parts = entryPath.split('/');
    // 'frontend/website/app.js' -> subfolder entry, alias '@website'.
    // 'frontend/app.js' -> single root entry (no subfolder), alias '@frontend'.
    const dir = parts.length > 2 ? parts[1] : parts[0];

    return [
      `@${dir}`,
      `${path.resolve(__dirname, 'frontend')}/${dir === 'frontend' ? '' : `${dir}/`}`
    ];
  })
);

function outputOptions(singleEntry) {
  return {
    // only valid with a single input — true for every isolated production
    // build below, never for the combined dev/lint/test config
    codeSplitting: !singleEntry,
    chunkFileNames: allowHashForCache ? 'js/[name]-[hash].js' : 'js/[name].js',
    entryFileNames: allowHashForCache ? 'js/[name]-[hash].js' : 'js/[name].js',
    assetFileNames: ({ name }) => {
      const hash = allowHashForCache ? '-[hash]' : '';

      // Move files which end with the following extensions to public/images
      if (/\.(gif|jpe?g|png|svg)$/.test(name || '')) {
        return `img/[name]${hash}[extname]`;
      }

      // Move files which end with css to public/css
      if ((name || '').endsWith('.css')) {
        return `css/[name]${hash}[extname]`;
      }

      return `js/[name]${hash}[extname]`;
    }
  };
}

const shared = {
  staged: {
    '*': 'vp check --fix'
  },
  fmt: {
    singleQuote: true,
    trailingComma: 'none',
    htmlWhitespaceSensitivity: 'strict'
  },
  lint: {
    options: {
      typeAware: true,
      typeCheck: true
    }
  },
  server: {
    cors: {
      origin: '*'
    },
    host: process.env.VITE_HOST || true,
    watch: {
      ignored: ['**/.claude/**', '**/.superpowers/**', '**/.github/**']
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        quietDeps: true,
        silenceDeprecations: ['import'],
        loadPaths: ['./']
      }
    }
  },
  test: {
    environment: 'node',
    include: ['test/**/*.test.js'],
    setupFiles: ['test/helpers/bootstrap.js'],
    pool: 'forks',
    isolate: false,
    fileParallelism: false
  },
  plugins: [
    devManifest({
      manifestName: `.vite/manifest.${process.env.NODE_ENV || 'development'}`
    }),
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) =>
            [
              // ADD YOUR CUSTOM TAGS
            ].includes(tag)
        }
      }
    })
  ],
  resolve: {
    alias
  }
};

export default defineConfig(({ command, mode }) => {
  if (!(command === 'build' && mode === 'production')) {
    // dev server, `vp check`/`vp lint`/`vp test` — one combined resolution
    // covering every entry is fine here, nothing gets written to disk.
    return {
      ...shared,
      build: {
        manifest: true,
        emptyOutDir: false,
        outDir,
        rollupOptions: {
          input: entries,
          output: outputOptions(false)
        }
      }
    };
  }

  // Production build: each entry gets its own isolated Rolldown pass (Vite's
  // Environment API) instead of one combined multi-input build, so no entry
  // ever imports a chunk shared with another entry. A combined build extracts
  // shared modules (e.g. Vue's export-sfc helper) into their own chunk file
  // with no content hash in its name (VITE_CHUNK_NAMES is off by default), so
  // an entry rebuilt later can end up paired at runtime with a stale copy of
  // that shared chunk whose minified export name no longer matches — see git
  // history around Sept 2026 for the "does not provide an export named 'L'"
  // incident this prevents.
  //
  // `consumer: 'client'` is required on every custom-named environment —
  // Vite's built-in CSS plugin (and others) only run for an environment whose
  // consumer is "client"; without it, environments default to "server" and
  // CSS emission is silently dropped (confirmed empirically: same config
  // minus this line built valid JS but zero CSS output, no error/warning).
  const environments = Object.fromEntries(
    Object.entries(entries).map(([name, entry]) => [
      name,
      {
        consumer: 'client',
        build: {
          outDir,
          emptyOutDir: false,
          manifest: `manifest-${name}.json`,
          chunkSizeWarningLimit: 5000,
          copyPublicDir: false,
          rollupOptions: {
            input: { [name]: entry },
            output: outputOptions(true)
          }
        }
      }
    ])
  );

  return {
    ...shared,
    environments,
    builder: {
      async buildApp(builder) {
        const merged = {};

        for (const name of Object.keys(environments)) {
          await builder.build(builder.environments[name]);

          const partialPath = path.join(outDir, `manifest-${name}.json`);

          Object.assign(merged, JSON.parse(fs.readFileSync(partialPath, 'utf8')));
          fs.rmSync(partialPath);
        }

        fs.mkdirSync(manifestDir, { recursive: true });
        fs.writeFileSync(manifestPath, `${JSON.stringify(merged, null, 2)}\n`);
      }
    }
  };
});
