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

  onConnect: (socket) => {

    app.config.sockets.connections.users += 1;
    // io.sockets.emit('admin:users:counter', { counter: app.config.sockets.connections.users });
    console.log('connections', app.config.sockets.connections.users);

    socket.on('disconnect', () => {
      app.config.sockets.connections.users -= 1;
      // io.sockets.emit('admin:users:counter', { counter: app.config.sockets.connections.users });
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
