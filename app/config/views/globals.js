const moment = require('moment');
const _ = require('underscore');

const helpers = require('./helpers');

const globals = {
  moment,
  _
};

module.exports = Object.assign(globals, helpers);
