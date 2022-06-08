/* global Jwt */

/**
 *
 * Sockets Config
 *
 */

module.exports = {

  // Enable sockets
  enabled: false,

  // Cors
  cors: '*:*',

  // Socket timeout
  timeout: 4000,

  // Interval
  interval: 2000,

  // Connections
  connections: {

    users: 0,

    // Clients connected
    clients: {}

  },

  middleware(socket, next) {

    // Security
    const user = Jwt.socket(socket);

    const {
      id
    } = user || {};

    if (!id) {
      next(new Error(`Invalid user ${id || 'or token'}`));
    }

    // eslint-disable-next-line no-param-reassign
    socket.request.user = user || {};

    next();

  },

  onConnect: (socket) => {

    app.config.sockets.connections.users += 1;

    console.log('connections', app.config.sockets.connections.users);

    socket.on('disconnect', () => {
      app.config.sockets.connections.users -= 1;
      console.log('connections', app.config.sockets.connections.users);
    });

  },

  // Custom evetns
  events: {

    // Examples Chat
    // event: folder.YourController.method
    // 'chat:signin': 'sockets.ChatController.signin',
    // 'chat:message': 'sockets.ChatController.save',
    // 'chat:history': 'sockets.ChatController.get'

  }

};
