/* global __dirname */

/**
 * Custom Server Config
 *
 * host
 * port
 * config: x-powered-by
 * ...
 * ...
 *
 *
 * This config is merged with Express Config
 */

const path = require('path');
const moment = require('moment');

module.exports = {

  // Hostname
  host: 'api.production.dev',

  // Port
  port: 5000,

  // Upload path
  uploadPath: 'public/files',

  // Connection to Database
  connection: null,

  // Custom Settings
  config: {
    'x-powered-by': false
  },

  // Config Views
  views: {
    path: path.join(process.cwd(), 'app/views'),
    engine: 'nunjucks', // or ejs
    globals: [
      {
        moment: () => moment()
      }
    ]
  }

};
