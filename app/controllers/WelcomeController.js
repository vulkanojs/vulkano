/**
 * WelcomeController.js
 */

module.exports = {

  get: function (req, res) {

    var result = Example.find();
    res.vsr(Serializer.get(result));

  },

  post: function (req, res) {

    res.json({hello: 'Post Method!'});

  },

  'put :id': function (req, res) {

    res.json({hello: 'Put Method!'});

  },

  'delete :id': function (req, res) {

    res.json({hello: 'Delete Method!'});

  },

  'put custom/:id': function (req, res) {

    res.json({hello: 'Custom Put Method!'});

  }

};
