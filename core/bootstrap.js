/* global app, __dirname, _ */

/**
 * Bootstrap.js
 *
 */

global.app = {};

global._ = require('underscore');
const path = require('path');

global.Promise = require('bluebird');

// Include all api config
const config = require('include-all')({
  dirname: path.normalize(path.join(__dirname, '../app/config')),
  filter: /(.+)\.js$/,
  optional: true
});

// Environment
app.PRODUCTION = process.env.NODE_ENV !== 'production' ? false : true;
const env = (app.PRODUCTION) ? 'production' : 'development';

let settings = Object.assign(config.settings, config.env ? config.env[env] || {} : {}, config.local || {});

delete config.env;
delete config.local;

// General Settings
app.config = Object.assign(config, {settings: settings});

// Override custom config with the localfile
for (const key in settings) {
  if (app.config[key] !== undefined) {
    app.config[key] = Object.assign(config[key], settings[key]);
  }
}

// Include all components
const services = require('./services')();
const database = require('./database');
const controllers = require('./controllers');
const server = require('./server');

module.exports = function () {

  console.log('');
  console.log('');
  console.log('------------------------------');
  console.log('');
  console.log('VULCANO - MVC');
  console.log('');
  console.log('------------------------------');

  // Database
  (new database());

  // Routes
  app.routes = controllers;

  // Server Config
  app.server = _({}).extend(server, app.config.settings || {});

  // Server Routes
  app.server.routes = _({}).extend(app.config.routes || {});

  // Start Express
  app.server.start(function () {
    let mode = app.PRODUCTION ? 'production' : 'development';
    if (config.bootstrap && typeof config.bootstrap === 'function') {
      config.bootstrap();
    }
    console.log('Node app is running on port', app.server.get('port'), 'in:', mode, 'mode');
  });

};
