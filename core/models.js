/* global __dirname */

/**
 * Models
 */

const path = require('path');
const _ = require('underscore');

// Include all app models
const AllModels = require('include-all')({
  dirname: path.normalize(path.join(__dirname, '../app/models')),
  filter: /(.+)\.js$/,
  excludeDirs: /^\.(git|svn)$/,
  optional: true
});

const ActiveRecord = require('../app/services/ActiveRecord');

const Callbacks = {

  beforeSave: (next) => {
    next();
  },

  beforeUpdate: (next) => {
    next();
  },

  beforeRemove: (next) => {
    next();
  },

  beforeValidate: (next) => {
    next();
  },

  afterSave: () => {

  },

  afterUpdate: () => {

  },

  afterRemove: () => {

  },

  afterValidate: () => {

  }

};

module.exports = function loadModelsApplication() {

  const models = {};
  Object.keys(AllModels).forEach((i) => {
    const current = AllModels[i];
    models[i] = _({}).extend(Callbacks, ActiveRecord, current);
  });
  return models;

};
