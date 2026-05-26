module.exports = {

  // Port
  port: process.env.PORT || 8000,

  // Connection to Database
  database: {

    // MONGO_URI connection or connetion key (development, production)
    connection: process.env.MONGO_URI || null,

    // Settings before to connect (MONGODB)
    settings: {
      strictQuery: false,
      debug: false
    },

    // Additional config to mongoose
    config: {

    }

  }

};
