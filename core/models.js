/* global __dirname */

/**
 * Models
 */

const path = require('path');
const _ = require('underscore');
const ActiveRecord = require('../app/services/ActiveRecord');

// Include all app models
const AllModels = require('include-all')({
  dirname: path.normalize(path.join(__dirname, '../app/models')),
  filter: /(.+)\.js$/,
  excludeDirs: /^\.(git|svn)$/,
  optional: true
});

const Callbacks = {

  beforeSave: function (next) {
    next();
  },

  beforeUpdate: function (next) {
    next();
  },

  beforeRemove: function (next) {
    next();
  },

  beforeValidate: function (next) {
    next();
  },

  afterSave: function (doc) {

  },

  afterUpdate: function () {

  },

  afterRemove: function () {

  },

  afterValidate: function () {

  }

};

module.exports = function () {

  let models = {};
  for (let i in AllModels) {
    let current = AllModels[i];
    models[i] = _({}).extend(Callbacks, ActiveRecord, current);
  }
  return models;

}();