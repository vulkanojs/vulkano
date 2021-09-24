/**
 * Bootstrap.js
 *
 */

const path = require('path');
const moment = require('moment');
const merge = require('deepmerge');
const _ = require('underscore');
const Promise = require('bluebird');

global.app = {};
global._ = _;
global.Promise = Promise;

global.CORE_PATH = path.join(__dirname, '../core');
global.APP_PATH = path.join(__dirname, '../app');
global.PUBLIC_PATH = path.join(__dirname, '../public');

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

const {
  views
} = config;

// Local Config
const localConfig = config.local || {};

// NODE_ENV
const environmentConfig = config.env ? config.env[env] || {} : {};
const settings = {
  ...config.settings,
  views: views.config
};

// All config merged (default, NODE_ENV (folder env), local.js file)
const allConfig = merge.all([
  config,
  { settings },
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
  app.server = {
    ...server,
    ...app.config.settings
  };

  // Server Routes
  app.server.routes = {
    ...app.config.routes
  };

  if (config.bootstrap && typeof config.bootstrap === 'function') {
    config.bootstrap(() => {

      // Start Express
      app.server.start(() => {

        console.log(`Vulkano is running on port ${app.server.get('port')} in ${env} mode`);

        const {
          database
        } = app.config.settings || {};

        const {
          connection
        } = database || {};

        if (!connection) {
          console.log('The value for config.settings.database.connection is empty. Skipping database connection.');
        } else {
          console.log(`Database Environment: ${connection}`);
        }

        console.log(`Startup Time: ${moment(moment().diff(global.STARTTIME)).format('ss.SSS')} sec`);

      });
    });
  } else {
    console.log('Missing the boostrap file to start app: config/bootstrap.js');
  }

};
