/* global mongoose, app */

/**
 * Database connection
 */

const Promise = require('bluebird');
const paginate = require('mongoose-paginate');

global.mongoose = require('mongoose');

const AllModels = require('./models')();

mongoose.Promise = Promise;

module.exports = function loadDatabaseApplication() {

  const {
    config
  } = app;

  const {
    connections,
    settings
  } = config;

  const {
    connection
  } = settings;

  const toConnect = connections[connection];

  if (!connection) {
    return;
  }

  if (!toConnect) {
    throw `Invalid conection to user MongoDB with source ${connection}`;
  }

  const connectionProps = {
    useNewUrlParser: true
  };

  if (!mongoose.connection.readyState) {
    mongoose.connect(toConnect, connectionProps);
  }

  const db = mongoose.connection;
  Object.keys(AllModels).forEach((model) => {

    const current = AllModels[model];
    if (!current.attributes) {
      global[model] = current;
    } else {

      // Allow trim all attributes
      const attributes = {};
      Object.keys(current.attributes).forEach( (attr) => {
        const currentAttr = current.attributes[attr];
        const type = currentAttr.type || '';
        if ( type !== Boolean) {
          if (currentAttr.trim !== false) {
            currentAttr.trim = true;
          }
        }
        attributes[attr] = currentAttr;
      });

      const schema = mongoose.Schema(attributes);
      delete current.attributes;
      schema.statics = Object.assign({}, current);
      schema.plugin(paginate);

      // Indexes
      if (current.indexes !== undefined) {
        if (Array.isArray(current.indexes)) {
          const tmp = current.indexes;
          Object.keys(tmp).forEach( index => schema.index(tmp[index]));
        } else if (typeof current.indexes === 'object') {
          schema.index(current.indexes);
        }
      }

      // Plugins
      if (current.plugins !== undefined) {
        if (Array.isArray(current.plugins)) {
          const tmp = current.plugins;
          Object.keys(tmp).forEach( plugin => schema.plugin(tmp[plugin]));
        } else if (typeof current.plugins === 'object') {
          schema.plugin(current.plugins);
        }
      }

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

      // findOneAndUpdate
      if (current.beforeFindOneAndUpdate) {
        schema.pre('findOneAndUpdate', current.beforeFindOneAndUpdate);
        delete schema.statics.beforeFindOneAndUpdate;
      }
      if (current.afterFindOneAndUpdate) {
        schema.post('findOneAndUpdate', current.afterFindOneAndUpdate);
        delete schema.statics.afterFindOneAndUpdate;
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

  });

};
