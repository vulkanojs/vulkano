module.exports = {

  //
  // Connection: you can use the same connection
  // set a custom Mongo URI connection to manage the sockets
  //
  connection: process.env.SOCKETS_MONGO_URI || null,

  // Collection to save the records
  collection: process.env.SOCKETS_MONGO_COLLECTION || 'socket.io-adapter-events'

};
