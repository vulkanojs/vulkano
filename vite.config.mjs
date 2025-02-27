/* eslint-disable import/no-extraneous-dependencies */

import path from 'path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import eslint from 'vite-plugin-eslint';
import devManifest from 'vite-plugin-dev-manifest';

/**
 * Allow the hash for files
 */

const allowHashForCache = String(process.env.VITE_CHUNK_NAMES || false) === 'true' ? true : false;

export default defineConfig({
  server: {
    host: process.env.VITE_HOST || 'localhost'
  },
  css: {
    preprocessorOptions: {
      scss: {
        quietDeps: true,
        silenceDeprecations: ['import'],
        loadPaths: [
          './',
        ]
      }
    }
  },
  build: {
    manifest: true,
    emptyOutDir: false,
    outDir: `${path.resolve(__dirname, 'public')}`,
    rollupOptions: {
      // overwrite default .html entry
      input: {
        app: 'client/app.js',
        cms: 'cms/cms.js',
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

        },
      }
    },
  },
  plugins: [
    eslint,
    devManifest({
      manifestName: `.vite/manifest.${process.env.NODE_ENV || 'development'}`
    }),
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => [
            // ADD YOUR CUSTOM TAGS
          ].includes(tag),
        }
      }
    })
  ],
  resolve: {
    alias: {
      '@client': `${path.resolve(__dirname, 'client')}/`,
      '@cms': `${path.resolve(__dirname, 'cms')}/`
    }
  }
});
