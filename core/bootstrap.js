/* global app, __dirname */

/**
 * Bootstrap.js
 *
 */

global.app = {};

global._ = require('underscore');

const path = require('path');
const moment = require('moment');

global.Promise = require('bluebird');

// Include all api config
const config = require('include-all')({
  dirname: path.normalize(path.join(__dirname, '../app/config')),
  filter: /(.+)\.js$/,
  optional: true
});

// Environment
app.PRODUCTION = (process.env.NODE_ENV || '').toLowerCase() === 'production';
const env = (process.env.NODE_ENV || 'development').toLowerCase();

const envSettings = Object.assign(config.env ? config.env[env] || {} : {}, config.local || {});
const settings = Object.assign(config.settings, envSettings);

delete config.env;
delete config.local;

settings.host = (process.env.HOST || settings.host || '').replace(/(^\w+:|^)\/\//, '');

// General Settings
app.config = Object.assign({}, config, { settings });

// Override custom config with the localfile
Object.keys(settings).forEach((key) => {
  if (app.config[key] !== undefined) {
    app.config[key] = Object.assign({}, config[key], settings[key]);
  }
});

// Include all components
require('./services')();
require('./database')();
const controllers = require('./controllers')();
const server = require('./server');

module.exports = function loadBootstrapApplication() {

  console.log('');
  console.log('');
  console.log('------------------------------');
  console.log('');
  console.log('          VULKANO');
  console.log('');
  console.log('------------------------------');

  // Routes
  app.routes = controllers;

  // Server Config
  app.server = Object.assign({}, server, app.config.settings || {});

  // Server Routes
  app.server.routes = Object.assign({}, app.config.routes || {});

  if (config.bootstrap && typeof config.bootstrap === 'function') {
    config.bootstrap(() => {

      // Start Express
      app.server.start(() => {

        console.log(`Vulkano is running on port ${app.server.get('port')} in ${env} mode`);

        if (!app.config.settings.connection) {
          console.log('The value for config.settings.connection is empty. Skipping database connection.');
        } else {
          console.log(`Database Environment: ${app.config.settings.connection}`);
        }

        console.log(`Startup Time: ${moment(moment().diff(global.STARTTIME)).format('ss.SSS')} sec`);

      });
    });
  } else {
    console.log('Missing the boostrap file to start app: config/bootstrap.js');
  }

};
