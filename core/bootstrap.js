/* global app, __dirname */

/**
 * Bootstrap.js
 *
 */

global.app = {};

global._ = require('underscore');

const path = require('path');
const moment = require('moment');
const merge = require('deepmerge');

global.Promise = require('bluebird');

// Include all api config
const config = require('include-all')({
  dirname: path.normalize(path.join(__dirname, '../app/config')),
  filter: /(.+)\.js$/,
  optional: true
});

// Get package.json information
const pkg = require('../package.json');

// Environment
app.PRODUCTION = (process.env.NODE_ENV || '').toLowerCase() === 'production';
const env = (process.env.NODE_ENV || 'development').toLowerCase();

// Local Config
const localConfig = config.local || {};

// NODE_ENV
const environmentConfig = config.env ? config.env[env] || {} : {};

// All config merged (default, NODE_ENV (folder env), local.js file)
const allConfig = merge.all([
  config,
  environmentConfig,
  localConfig
]);

delete allConfig.env;
delete allConfig.local;

// General Settings
app.config = allConfig;

// Package Config
app.pkg = pkg;

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
