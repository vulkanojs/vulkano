/**
 * app.js
 *
 * To start the server, run: `node app.js`.
 *
 * For example:
 *   => `npm run start`
 *   => `node app.js`
 *   => `nodemon`
 *   => `forever start app.js`
 *   => `node debug app.js`
 *   => `pm2 start pm2.json`
 */

(function () {

  const bootstrap = require('./core/bootstrap');
  const app = new bootstrap();

})();
