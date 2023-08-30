module.exports = (modelName) => {

  const {
    config
  } = app;

  const {
    settings
  } = config;

  const {
    database
  } = settings;

  const {
    connection
  } = database || {};

  if (!connection && !process.env.MONGO_URI) {
    return {};
  }

  if (!modelName) {
    console.log(`Invalid Model name ${modelName} to the Scaffold Controller`);
    return {};
  }

  const {
    create,
    update
  } = global[modelName] || {};

  const getAllModelName = `getAll${modelName}`;
  const getModelName = `get${modelName}`;

  if (!create || !update) {

    const invalid = [];

    if (!create) {
      invalid.push('create');
    }

    if (!update) {
      invalid.push('update');
    }

    console.log(`Invalid Model method(s) ${invalid.join(', ')} to the model ${modelName} to the Scaffold Controller. Please verify the connection and try again.`);

    return {};

  }

  return {

    get(req, res) {

      res.vsr(global[modelName][getAllModelName](req.query || {}));

    },

    'get :id': function onGetRecord(req, res) {

      const {
        id
      } = req.params || {};

      res.vsr(global[modelName][getModelName](id) );

    },

    post: function onCreateRecord(req, res) {

      const {
        body
      } = req || {};

      res.vsr(global[modelName].create(body), 201);

    },

    'put :id': function onPutRecord(req, res) {

      const {
        id
      } = req.params || {};

      const {
        body
      } = req || {};

      res.vsr(global[modelName].update(id, body), 202);

    },

    'delete :id': function onDeleteRecord(req, res) {

      const {
        id
      } = req.params || {};

      res.vsr(global[modelName].delete(id), 204);

    }

  };

};
