/* global Example, VSError */

/**
 * WelcomeController.js
 */

module.exports = {

  get: (req, res) => {

    res.render('welcome/index.html');

  },

  'get :id': (req, res) => {

    const id = req.params.id || null;
    Example.findOne({ _id: id }).then( (example) => {
      if (!example) {
        res.vsr(Promise.reject( (new VSError('Object Not Found', 404)) ));
        return null;
      }
      res.vsr(Promise.resolve(example));
      return null;
    }).catch( (err) => {
      res.vsr(Promise.reject( (new VSError(err, 500)) ));
    });

  },

  post: (req, res) => {

    const data = req.body || {};
    const obj = new Example(data);
    res.vsr(obj.save(), 201);

  },

  'put :id': (req, res) => {

    const data = req.body || {};
    const id = req.params.id || null;
    Example.findOne({ _id: id }).then( (example) => {
      if (!example) {
        res.vsr(Promise.reject( (new VSError('Object Not Found', 404)) ));
        return null;
      }
      const merge = Object.assign(example, data);
      const result = Example.findOneAndUpdate({ _id: id }, merge, { new: true });
      res.vsr(result, 202);
      return null;
    }).catch( (err) => {
      res.vsr(Promise.reject( (new VSError(err, 500)) ));
    });

  },

  'delete :id': (req, res) => {

    const id = req.params.id || null;
    Example.findOne({ _id: id }).then( (example) => {
      if (!example) {
        res.vsr(Promise.reject( (new VSError('Object Not Found', 404)) ));
        return null;
      }
      res.vsr(Example.remove({ _id: id }), 204);
      return null;
    }).catch( (err) => {
      res.vsr(Promise.reject( (new VSError(err, 500)) ));
    });

  },

  'post custom/:id': (req, res) => {

    res.vsr(Promise.resolve({ hello: 'Custom Post Method!' }));

  }

};
