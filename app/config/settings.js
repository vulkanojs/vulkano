/**
 * Custom Server Config
 *
 * host
 * port
 * config: x-powered-by
 * ...
 * ...
 *
 *
 * This config is merged with Express Config
 */

module.exports = {

  host: process.env.HOST || 'api.production.dev',

  // Connection to Database
  database: {

    // Connection key
    connection: null,

    // Additional config to mongoose
    config: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // useFindAndModify: false,
      // useCreateIndex: true
    }

  },

  // Express Settings
  express: {

    port: 8000,

    uploadPath: 'public/files',

    poweredBy: false

  }

};
