/**
 * Local Bootstrap
 */

module.exports = (startVulkano) => {

  // Start app
  startVulkano( () => {

    if (process.env.NODE_ENV !== 'production') {

      // proxy hmr ws back to vite
      app.server.on('upgrade', (req, socket, head) => {
        if (req.url === '/') {
          app.viteProxy.ws(req, socket, head);
        }
      });

    }

  });

};
