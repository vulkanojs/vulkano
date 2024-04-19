/**
 *
 * Sockets Config
 *
 */

module.exports = {

  // Enable sockets
  enabled: false,

  // Socket IO Adapter (redis|mongodb|memory)
  adapter: 'memory',

  // Socket configuration
  config: {

    // Transports
    transports: ['websocket', 'polling'],

    // Socket timeout
    timeout: 4000,

    // Interval
    interval: 2000,

  },

  // Connections
  connections: {

    users: 0,

    // Clients connected
    clients: {}

  },

  onConnect: (socket) => {

    const {
      request
    } = socket;

    app.config.sockets.connections.users += 1;

    const {
      user
    } = request;

    if (user && user._id) {

      app.config.sockets.connections.clients[user._id] = user._id;

      io.sockets.emit('users:counter', {
        counter: app.config.sockets.connections.users,
      });

      socket.on('disconnect', () => {

        app.config.sockets.connections.users -= 1;

        delete app.config.sockets.connections.clients[user._id];

        io.sockets.emit('users:counter', {
          counter: app.config.sockets.connections.users,
        });

      });

    }

  }

};
