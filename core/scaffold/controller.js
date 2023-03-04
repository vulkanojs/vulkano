module.exports = (modelName) => {

  if (!modelName) {
    console.log(`Invalid Model name ${modelName} to the Scaffold Controller`);
    return {};
  }

  const {
    create,
    update
  } = global[modelName] || {};

  const getAll = global[modelName][`getAll${modelName}`];
  const getById = global[modelName][`get${modelName}`];

  if (!getAll || !getById || !create || !update) {

    const invalid = [];

    if (!getAll) {
      invalid.push(`getAll${modelName}`);
    }

    if (!getById) {
      invalid.push(`get${modelName}`);
    }

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

      console.log(getAll);

      res.vsr(global[modelName].getAll(req.query || {}));

    },

    'get :id': function onGetRecord(req, res) {

      const {
        id
      } = req.params || {};

      res.vsr(global[modelName].getById(id) );

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
