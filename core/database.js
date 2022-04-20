/**
 * Database connection
 */

const Promise = require('bluebird');
const paginate = require('mongoose-paginate');
const merge = require('deepmerge');

const mongoose = require('mongoose');

global.mongoose = mongoose;
global.Virtual = 'Virtual';

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
    database
  } = settings;

  const {
    connection
  } = database || {};

  if (!connection) {
    return;
  }

  const toConnect = connections[connection];

  if (!toConnect) {
    throw `Invalid conection to user MongoDB with source ${connection}`;
  }

  const defaultProps = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    family: 4
  };

  const connectionProps = merge.all([
    defaultProps,
    (database ? database.config || {} : {})
  ]);

  if (!mongoose.connection.readyState) {
    mongoose.connect(toConnect, connectionProps);
  }

  const db = mongoose.connection;

  // Each Model
  Object.keys(AllModels).forEach((model) => {

    const current = AllModels[model];
    if (!current.attributes) {
      global[model] = current;
    } else {

      // Allow trim all attributes
      const attributes = {};
      const virtuals = {};

      Object.keys(current.attributes).forEach( (attr) => {

        const currentAttr = current.attributes[attr];
        const type = currentAttr.type || '';

        if ( type !== Boolean) {
          if (currentAttr.trim !== false) {
            currentAttr.trim = true;
          }
        }

        if ( String(type).toLowerCase() === 'virtual' ) {
          virtuals[attr] = currentAttr;
          delete attributes[attr];
        } else {
          attributes[attr] = currentAttr;
        }

      });

      if (!attributes.createdAt) {
        attributes.createdAt = {
          type: Date,
          default: Date.now
        };
      }

      const schema = mongoose.Schema(attributes);

      Object.keys(virtuals).forEach( (v) => {
        schema.virtual(v, virtuals[v]);
      });

      schema.set('toObject', { virtuals: true });
      schema.set('toJSON', { virtuals: true });

      delete current.attributes;
      schema.statics = { ...current };
      schema.plugin(paginate);

      // Indexes
      if (current.indexes !== undefined) {
        if (Array.isArray(current.indexes)) {
          const tmp = current.indexes;
          Object.keys(tmp).forEach( (index) => schema.index(tmp[index]));
        } else if (typeof current.indexes === 'object') {
          schema.index(current.indexes);
        }
      }

      // Plugins
      if (current.plugins !== undefined) {
        if (Array.isArray(current.plugins)) {
          const tmp = current.plugins;
          Object.keys(tmp).forEach( (plugin) => schema.plugin(tmp[plugin]));
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
