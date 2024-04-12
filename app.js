/**
 * app.js
 *
 * To start the server, run: `node app.js`.
 *
 * For example:
 *   => `npm run start`
 *   => `node app.js`
 */

const vulkano = require('@vulkano/core');

// eslint-disable-next-line import/no-extraneous-dependencies
const Vite = require('vite');
const Proxy = require('http-proxy');

app.viteProxy = null;

if (process.env.NODE_ENV !== 'production') {

  ( async () => {

    // start our vite dev server
    const vite = await Vite.createServer({ server: { port: process.env.VITE_PROXY_PORT } });
    vite.listen();

    // eslint-disable-next-line new-cap
    const proxy = new Proxy.createProxyServer({
      target: {
        host: 'localhost',
        port: process.env.VITE_PROXY_PORT
      }
    });

    app.viteProxy = proxy;

  })();

}

vulkano();
