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

  verifyToken(socket) {

    const {
      token
    } = socket.handshake.auth || {};

    if (token === null || typeof token === 'undefined' || !token) {
      return false;
    }

    // Development
    let payload = Jwt.decode(token);

    // Production
    if (!payload) {
      payload = Jwt.decode(token);
    }

    const {
      data
    } = payload || {};

    const {
      user
    } = data || {};

    const {
      id
    } = user || {};

    if (!id) {
      return false;
    }

    return user;

  },

  middleware(socket, next) {

    // Security
    // const user = app.config.sockets.verifyToken(socket);

    // const {
    //   id
    // } = user || {};

    // if (!id) {
    //   next(new Error(`Invalid user ${id || ''}`));
    // }

    // // eslint-disable-next-line no-param-reassign
    // socket.request.user = user || {};

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
