/* global Example */

/*
 * This endpoint is protected by JWT, please disabled it to test
 */

module.exports = {

  get(req, res) {

    // Status code: 200 (default)
    res.vsr(Example.getAll(req.query || {}));

  },

  post(req, res) {

    const {
      body
    } = req || {};

    // Status code: 201 (created)
    res.vsr(Example.create(body), 201);

  },

  'get :id': (req, res) => {

    const {
      id
    } = req.params;

    // Status code: 200 (default)
    res.vsr(Example.getExample(id));

  },

  'put :id': (req, res) => {

    const {
      id
    } = req.params;

    const {
      body
    } = req || {};

    // Status code: 202 (accepted)
    res.vsr(Example.update(id, body), 202);

  },

  'delete :id': (req, res) => {

    const {
      id
    } = req.params;

    res.vsr(Example.remove(id), 204);

  }

};
