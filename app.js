/**
 * vulkano.js
 *
 * To start the server, run: `node vulkano.js`.
 *
 * For example:
 *   => `npm run start`
 *   => `node vulkano.js`
 */

const path = require('path');

global.START_TIME = new Date();

global.ABS_PATH = path.resolve(__dirname, './');
global.APP_PATH = path.join(__dirname, './app');
global.PUBLIC_PATH = path.join(__dirname, './public');

const vulkano = require('@vulkano/core');

vulkano();
