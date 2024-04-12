/* eslint-disable import/no-extraneous-dependencies */

import path from 'path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

/**
 * Allow the hash for files
 */
const allowHashForCache = false;

// https://vitejs.dev/config/
export default defineConfig({
  css: {
    preprocessorOptions: {
      scss: {
        quietDeps: true
      }
    }
  },
  build: {
    emptyOutDir: false,
    outDir: `${path.resolve(__dirname, 'public')}`,
    rollupOptions: {
      external: /\/img\/.*/,
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
      },
    },
  },
  plugins: [
    vue()
  ],
  resolve: {
    alias: {
      '@client': `${path.resolve(__dirname, 'client')}/`
    }
  }
});
