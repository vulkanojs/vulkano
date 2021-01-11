module.exports = {

  // Enable sockets
  enabled: false,

  // Socket timeout
  timeout: 4000,

  // Interval
  interval: 2000,

  // Connections
  connections: {

    // Clients connected
    clients: {}

  },

  onConnect: () => {

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
