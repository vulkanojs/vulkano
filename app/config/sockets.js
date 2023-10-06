/**
 *
 * Sockets Config
 *
 */

module.exports = {

  //
  // Enable Sockets
  // @type Boolean
  //
  enabled: false,

  //
  // Transports
  // @type Array
  //
  transports: ['websocket', 'polling'],

  //
  // Adapter for REDIS.
  // If is enabled, the transports for the client and server should be websocket only.
  // @type Boolean
  //
  redis: false,

  //
  // Sockets Cors
  // @type Function
  //
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

  //
  // Sockets Timeout
  // @type Number
  //
  timeout: 4000,

  //
  // Sockets Interval
  // @type Number
  //
  interval: 2000,

  //
  // Sockets Connections
  // @type Object
  //
  connections: {

    users: 0,

    // Clients connected
    clients: {}

  },

  //
  // Sockets Middleware
  // @type Function
  //
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

  //
  // When a new client is connected
  // @type Function
  //
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

  //
  // Events: methods to run when the server listen an event from the client
  // @type Object
  //
  events: {

    // Examples Chat
    // event: folder.YourController.method
    // 'chat:signin': 'sockets.ChatController.signin',
    // 'chat:message': 'sockets.ChatController.save',
    // 'chat:history': 'sockets.ChatController.get'

  }

};
