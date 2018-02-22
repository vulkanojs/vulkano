/* global Example */

/**
 * WelcomeController.js
 */

module.exports = {

  get: (req, res) => {

    res.vsr(Example.find());

  },

  post: (req, res) => {

    const data = req.body || {};
    const obj = new Example(data);
    res.json(obj.save());

  },

  'put :id': (req, res) => {

    res.json({ hello: 'Put Method!' });

  },

  'delete :id': (req, res) => {

    res.json({ hello: 'Delete Method!' });

  },

  'put custom/:id': (req, res) => {

    res.json({ hello: 'Custom Put Method!' });

  }

};
