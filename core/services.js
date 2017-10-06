/* global __dirname */

/**
 * Services
 */

const path = require('path');
const _ = require('underscore');

// Include all services
const AllServices = require('include-all')({
  dirname: path.join(__dirname, '../app/services'),
  filter: /(.+)\.js$/,
  optional: true
});

module.exports = function () {

  delete AllServices.ActiveRecord;
  delete AllServices.AppController;

  for (let service in AllServices) {
    global[service] = AllServices[service];
  }

};