/* global mongoose, app */

/**
 * Database connection
 */

global.mongoose = require('mongoose');
const AllModels = require('./models');
const _ = require('underscore');
const Promise = require('bluebird');
const paginate = require('mongoose-paginate');
mongoose.Promise = Promise;

module.exports = function () {

  const config = app.config;
  const connection = config.settings.connection;
  const connections = config.connections;
  const toConnect = connections[connection];

  if (!connection) {
    console.log("Ignoring database connection. Connection is empty.");
    return;
  }

  if (!toConnect) {
    throw "Invalid conection to user MongoDB with source " + connection;
  }

  if (!mongoose.connection.readyState) {
    console.log("Database Environment:", connection);
    mongoose.connect(toConnect, { useMongoClient: true });
  }

  const db = mongoose.connection;

  for (let model in AllModels) {

    let current = AllModels[model];
    if (!current.attributes) {
      global[model] = current;
    } else {
      let schema = mongoose.Schema(current.attributes);
      delete current.attributes;
      schema.statics = _.extend({}, current);
      schema.plugin(paginate);

      //
      // Callbacks
      //

      // Save
      if (current.beforeSave) {
        schema.pre('save', current.beforeSave);
        delete schema.statics.beforeSave;
      }
      if (current.afterSave) {
        schema.post('save', current.afterSave);
        delete schema.statics.afterSave;
      }

      // Update
      if (current.beforeUpdate) {
        schema.pre('update', current.beforeUpdate);
        delete schema.statics.beforeUpdate;
      }
      if (current.afterUpdate) {
        schema.post('update', current.afterUpdate);
        delete schema.statics.afterUpdate;
      }

      // Remove
      if (current.beforeRemove) {
        schema.pre('remove', current.beforeRemove);
        delete schema.statics.beforeRemove;
      }
      if (current.afterRemove) {
        schema.post('remove', current.afterRemove);
        delete schema.statics.afterRemove;
      }

      // Validation
      if (current.beforeValidate) {
        schema.pre('validate', current.beforeValidate);
        delete schema.statics.beforeValidate;
      }
      if (current.afterValidate) {
        schema.post('validate', current.afterValidate);
        delete schema.statics.afterValidate;
      }

      global[model] = db.model(model, schema, model.toLowerCase());

    }

  }

  return mongoose;

};