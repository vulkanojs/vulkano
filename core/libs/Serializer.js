/**
 * Serializers
 *
 * Serializer.get(mongoose.promise());
 * return jsonapi serialized
 *
 */
const path = require('path');
const JSONAPISerializer = require('jsonapi-serializer').Serializer;

// Include all api controllers
const coreSerializers = require('include-all')({
  dirname: path.join(CORE_PATH, '/libs/serializers'),
  filter: /(.+)\.js$/,
  optional: true
});

const appSerializers = require('include-all')({
  dirname: path.join(APP_PATH, '/services/serializers'),
  filter: /(.+)\.js$/,
  optional: true
});

const allSerializers = { ...coreSerializers, ...appSerializers };

module.exports = {

  get(prom, data) {

    if (!prom || !prom.then) {

      if (data !== undefined) {
        return Serializer._convert(String(prom).toLowerCase(), data);
      }

      return {};

    }

    return prom.then( (r) => {

      if (prom.model && prom.model.name === 'model') {
        const modelName = prom.model.modelName.toLowerCase();
        return Serializer._convert(modelName, r);
      }

      return r;

    });

  },

  _convert(model, data) {

    const props = allSerializers[model] || {};

    if (!props.attributes) {
      return data;
    }
    const result = new JSONAPISerializer(model, data, props || {});

    const merged = {
      ...result,
      serialized: true
    };

    return merged;

  }

};
