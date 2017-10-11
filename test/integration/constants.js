/* global __dirname */

const _ = require('underscore');
const fs = require('fs');
const path = require('path');

// Include all api config
const config = require('include-all')({
  dirname: path.normalize(path.join(__dirname, '../../app/config')),
  filter: /(.+)\.js$/,
  optional: true
});

// Environment
const env = 'development';
const settings = Object.assign(config.settings, config.env ? config.env[env] || {} : {}, config.local || {});

delete config.env;
delete config.local;

let data = Object.assign(config, {settings: settings});
let opts = {
  email: '',
  password: ''
};

if (!settings.host) {
  console.log("Invalid Hostname in your app/config/local.js file", settings.host || '');
  process.exit();
}

module.exports = _.extend(data, opts);
