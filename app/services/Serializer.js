/* global __dirname, Serializer */

/**
 * Serializers
 *
 * Serializer.get(mongoose.promise());
 * return jsonapi serialized
 *
 */
const path = require('path');
const JSONAPISerializer = require('jsonapi-serializer').Serializer;

// Include all serializers
const AllSerializers = require('include-all')({
  dirname: path.normalize(path.join(__dirname, '/serializers')),
  filter: /(.+)\.js$/,
  optional: true
});

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

    const props = AllSerializers[model] || {};
    if (!props.attributes) {
      return data;
    }
    const result = new JSONAPISerializer(model, data, props || {});
    return Object.assign({}, result, { serialized: true });

  }

};
