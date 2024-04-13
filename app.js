/**
 * app.js
 *
 * To start the server, run: `node app.js`.
 *
 * For example:
 *   => `npm run start`
 *   => `node app.js`
 */

const vulkano = require('@vulkano/core');

// Import Vite support
const enableViteSupport = require('./app/config/vite');

const {
  NODE_ENV,
  VITE_PROXY_PORT
} = process.env || {};

if (NODE_ENV === 'production' || !VITE_PROXY_PORT) {

  vulkano();

} else {

  enableViteSupport(vulkano);

}
