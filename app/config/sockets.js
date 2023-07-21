/* global Jwt */

/**
 *
 * Sockets Config
 *
 */

module.exports = {

  // Enable sockets
  enabled: false,

  // Transports
  transports: ['websocket', 'polling'],

  // Redis
  redis: false,

  // Cors
  cors: (req, callback) => {

    const {
      origin,
      host,
    } = req.headers || {};

    const realOrigin = origin || host;

    const allowedOrigin = [
      'yourdomain.com'
    ];

    let found = false;

    allowedOrigin.forEach( (o) => {

      if ( (realOrigin || '' ).indexOf(o) !== -1 ) {
        found = true;
      }

    });

    if (found) {
      callback(null, true);
    } else {
      console.log('Invalid origin', realOrigin || 'No Origin');
      callback(new Error(`Invalid origin ${realOrigin} - Socket CORS`));
    }

  },

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
      _id
    } = user || {};

    if (!_id) {
      next(new Error(`Invalid user ${_id || 'or token'}`));
    }

    // eslint-disable-next-line no-param-reassign
    socket.request.user = user || {};

    next();

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
