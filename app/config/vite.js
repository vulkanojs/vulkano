// eslint-disable-next-line import/no-extraneous-dependencies
const Vite = require('vite');
const Proxy = require('http-proxy');

module.exports = async function setupVite(startVulkano) {

  app.viteProxy = null;

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

  console.log('inicializa');

  app.viteProxy = proxy;

  if (typeof startVulkano === 'function') {
    startVulkano();
  }

};
