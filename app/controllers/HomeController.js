/**
 * HomeController.js
 */

const fs = require('fs');

module.exports = {

  get(req, res) {

    Promise
      .resolve()
      .then( () => {

        if (process.env.NODE_ENV !== 'production') {
          return fetch(`http://localhost:${process.env.VITE_PROXY_PORT}`)
            .then( (template) => template.text())
            .catch( () => fs.readFileSync(`${APP_PATH}/views/home/index.html`).toString());
        }

        return fs.readFileSync(`${ABS_PATH}/public/client/index.html`).toString();

      })
      .then( async (template) => {

        const html = app.nunjucks.renderString(template, { app });
        res.send(html);

      });

  },

  proxy(req, res, next) {

    if (app.viteProxy) {
      app.viteProxy.web(req, res);
      return;
    }

    console.log('entra 2');

    req.url = '/';
    next('route');

  },

  test(req, res) {

    res.vsr(Promise.resolve({ hola: 'mundo' }));

  }

};
