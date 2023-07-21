/**
 * Bootstrap.js
 *
 */

const dotenv = require('dotenv');
const path = require('path');
const moment = require('moment');
const merge = require('deepmerge');
const _ = require('underscore');
const Promise = require('bluebird');
const v8 = require('v8');

global.app = {};
global._ = _;
global.Promise = Promise;

global.ABS_PATH = path.resolve(__dirname, '../');
global.CORE_PATH = path.join(__dirname, '../core');
global.APP_PATH = path.join(__dirname, '../app');
global.PUBLIC_PATH = path.join(__dirname, '../public');

// Read Dontenv config
dotenv.config();

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
  console.log(colors.fg.cyan, '☕ https://buymeacoffee.com/argordmel', colors.reset);
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

      const {
        sockets,
        settings: configSettings,
        redis
      } = app.config || {};

      const {
        database
      } = configSettings || {};

      const {
        connection
      } = database || {};

      const connectionToShow = connection && process.env.MONGO_URI ? 'MONGO_URI' : connection;

      const serverConfig = [];

      const nodeVersion = process.version.match(/^v(\d+\.\d+\.\d+)/)[1];
      const portText = String(app.server.get('port') || 8000).padEnd(nodeVersion.length, ' ');
      const socketText = (sockets.enabled ? 'YES' : 'NO').padEnd(nodeVersion.length - 3, ' ');

      serverConfig.push(` PORT: ${colors.fg.green}${portText}${colors.reset}`);
      serverConfig.push(' | ');
      serverConfig.push(` ENV: ${app.PRODUCTION ? colors.fg.red : colors.fg.green}${env}${colors.reset}`);

      console.log(serverConfig.join(''));

      const totalHeapSize = v8.getHeapStatistics().total_available_size;
      const totalHeapSizeGb = (totalHeapSize / 1024 / 1024 / 1024).toFixed(2);

      const nodeConfig = [];
      nodeConfig.push(` NODE: ${colors.fg.green}${nodeVersion}${colors.reset}`);
      nodeConfig.push(' | ');
      nodeConfig.push(' MAX MEM: ', `${colors.fg.green}${totalHeapSizeGb} GB${colors.reset}`);
      console.log(nodeConfig.join(''));

      const startUpConfig = [];
      if (sockets.redis && redis && redis.enabled) {
        startUpConfig.push(' SOCKETS: ', `${colors.fg.green}${socketText}${colors.reset}`);
      } else {
        startUpConfig.push(' SOCKETS: ', `${colors.fg.green}${socketText}${colors.reset}`);
      }
      startUpConfig.push(' | ');
      startUpConfig.push(` STARTUP: ${colors.fg.green}${moment(moment().diff(global.START_TIME)).format('ss.SSS')} sec${colors.reset}`);
      console.log(startUpConfig.join(''));

      const dbConfig = [];
      if (redis && redis.enabled) {
        dbConfig.push(' REDIS: ', `${colors.fg.green}YES   ${colors.reset}`);
      } else {
        dbConfig.push(' REDIS: ', `${colors.fg.green}NO    ${colors.reset}`);
      }

      dbConfig.push(' | ');
      dbConfig.push(' DB: ', connection ? `${colors.fg.green}${connectionToShow}${colors.reset}` : `${colors.fg.blue}The connection is empty${colors.reset}`);
      console.log(dbConfig.join(''));

      console.log(`${colors.fg.magenta}--------------------------------------`, colors.reset);

      // Run custom callback after init vulkano
      if (callbackAfterInitVulkano && typeof callbackAfterInitVulkano === 'function') {
        callbackAfterInitVulkano();
      }

    });

  });

};
