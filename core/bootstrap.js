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
  dirname: `${APP_PATH}/config`,
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

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  fg: {
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    crimson: '\x1b[38m' // Scarlet
  },
  bg: {
    black: '\x1b[40m',
    red: '\x1b[41m',
    green: '\x1b[42m',
    yellow: '\x1b[43m',
    blue: '\x1b[44m',
    magenta: '\x1b[45m',
    cyan: '\x1b[46m',
    white: '\x1b[47m',
    crimson: '\x1b[48m'
  }
};

module.exports = function loadBootstrapApplication() {

  console.log('');
  console.log('');
  console.log(`${colors.fg.magenta}--------------------------------------`, colors.reset);
  console.log('');
  console.log(colors.fg.cyan, '               🌋', colors.reset);
  console.log(colors.fg.cyan, `         VULKANO ${pkg.version}`, colors.reset);
  console.log('');
  console.log(colors.fg.blue, 'https://github.com/vulkanojs/vulkano', colors.reset);
  console.log('');
  console.log(`${colors.fg.magenta}--------------------------------------`, colors.reset);

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

  const {
    bootstrap
  } = config;

  if (!bootstrap || typeof bootstrap !== 'function') {
    console.log('Missing the boostrap file to start app: config/bootstrap.js');
    return;
  }

  bootstrap( (callbackAfterInitVulkano) => {

    // Start Express
    app.server.start( () => {

      console.log('PORT:', `${colors.fg.green}${app.server.get('port')}${colors.reset}`);
      console.log('ENVIRONMENT:', `${app.PRODUCTION ? colors.fg.red : colors.fg.green}${env}${colors.reset}`);

      const {
        database
      } = app.config.settings || {};

      const {
        connection
      } = database || {};

      if (connection) {
        console.log('DATABASE:', `${colors.fg.green}${connection}${colors.reset}`);
      }

      console.log('STARTUP TIME:', `${colors.fg.green}${moment(moment().diff(global.START_TIME)).format('ss.SSS')} sec${colors.reset}`);

      if (!connection) {
        console.log(`${colors.fg.blue}The value for config.settings.database.connection is empty. Skipping database connection.`);
      }

      // Run custom callback after init vulkano
      if (callbackAfterInitVulkano && typeof callbackAfterInitVulkano === 'function') {
        callbackAfterInitVulkano();
      }

    });

  });

};
