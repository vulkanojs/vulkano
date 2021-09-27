/**
 * Models
 */

// Include all app models
const AllModels = require('include-all')({
  dirname: `${APP_PATH}/models`,
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

  },

  beforeFindOneAndUpdate: (next) => {
    next();
  }

};

module.exports = function loadModelsApplication() {

  const models = {};

  Object.keys(AllModels).forEach((i) => {

    const current = AllModels[i];

    models[i] = {
      ...Callbacks,
      ...ActiveRecord,
      ...current
    };

  });

  return models;

};
