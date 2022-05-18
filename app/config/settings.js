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

  // Custom Server Config
  host: process.env.HOST || 'api.production.dev',

  // Port
  port: process.env.PORT || 8000,

  // Connection to Database
  database: {

    // Connection key
    connection: null,

    // Additional config to mongoose
    config: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // family: 4 // 4 (IPv4), 6 (IPv6), or null (default: OS family)
      // useFindAndModify: false,
      // useCreateIndex: true
    }

  }

};
