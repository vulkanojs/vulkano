/**
 * Local Bootstrap
 */

module.exports = (start) => {

  // Start app
  start( () => {

    if (!app.viteProxy) {
      return;
    }

    // proxy hmr ws back to vite
    app.server.on('upgrade', (req, socket, head) => {
      if (req.url === '/') {
        app.viteProxy.ws(req, socket, head);
      }
    });

  });

};
