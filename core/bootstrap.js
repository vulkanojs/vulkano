/* global app, __dirname, _ */

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
app.PRODUCTION = process.env.NODE_ENV !== 'production';
const env = (app.PRODUCTION) ? 'production' : 'development';

const envSettings = Object.assign(config.env ? config.env[env] || {} : {}, config.local || {});
const settings = Object.assign(config.settings, envSettings);

delete config.env;
delete config.local;

settings.host = (settings.host || '').replace(/(^\w+:|^)\/\//, '');

// General Settings
app.config = Object.assign(config, { settings });

// Override custom config with the localfile
Object.keys(settings).forEach((key) => {
  if (app.config[key] !== undefined) {
    app.config[key] = Object.assign(config[key], settings[key]);
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
  console.log('VULCANO - MVC');
  console.log('');
  console.log('------------------------------');

  // Routes
  app.routes = controllers;

  // Server Config
  app.server = _({}).extend(server, app.config.settings || {});

  // Server Routes
  app.server.routes = _({}).extend(app.config.routes || {});

  const mode = app.PRODUCTION ? 'production' : 'development';
  if (config.bootstrap && typeof config.bootstrap === 'function') {
    config.bootstrap(() => {

      // Start Express
      app.server.start(() => {

        console.log('Node app is running on port', app.server.get('port'), 'in:', mode, 'mode');
        console.log('Startup Time:', moment(moment().diff(global.STARTTIME)).format('ss.SSS'), 'sec');
      });
    });
  } else {
    console.log('Missing the boostrap file to start app: config/bootstrap.js');
  }

};
