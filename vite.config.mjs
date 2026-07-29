import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite-plus';
import dotenv from 'dotenv';
import vue from '@vitejs/plugin-vue';
import devManifest from 'vite-plugin-dev-manifest';

dotenv.config({ quiet: true });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const allowHashForCache = String(process.env.VITE_CHUNK_NAMES || false) === 'true';

export default defineConfig({
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
    host: process.env.VITE_HOST || 'localhost'
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
  build: {
    manifest: true,
    emptyOutDir: false,
    outDir: path.resolve(__dirname, 'public'),
    rollupOptions: {
      // overwrite default .html entry
      input: {
        app: 'client/app.js'
      },
      output: {
        chunkFileNames: allowHashForCache ? 'js/[name]-[hash].js' : 'js/[name].js',
        entryFileNames: allowHashForCache ? 'js/[name]-[hash].js' : 'js/[name].js',
        assetFileNames: ({ name }) => {
          const hash = allowHashForCache ? '-[hash]' : '';

          // Move files which end with the following extensions to public/images
          if (/\.(gif|jpe?g|png|svg)$/.test(name || '')) {
            return `img/[name]${hash}[extname]`;
          }

          // Move files which end with css to public/css
          if (/\.css$/.test(name || '')) {
            return `css/[name]${hash}[extname]`;
          }

          return `js/[name]${hash}[extname]`;
        }
      }
    }
  },
  test: {
    environment: 'node',
    include: ['test/**/*.test.js']
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
    alias: {
      '@client': path.resolve(__dirname, 'client') + '/'
    }
  }
});
