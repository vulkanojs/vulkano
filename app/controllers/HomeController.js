/**
 * HomeController.js
 */

module.exports = {

  get(req, res) {

    res.render('home/index.html');

  },

  cms(req, res) {

    res.render('home/cms.html');

  },

};
