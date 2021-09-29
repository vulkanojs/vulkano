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

  // Port
  port: 5000,

  // Upload path
  uploadPath: 'public/files',

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

  // Custom Settings
  config: {
    'x-powered-by': false
  }

};
