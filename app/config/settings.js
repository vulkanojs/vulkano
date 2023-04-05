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

  // Salt for password
  salt: 'qS~2QWTo]q-91ho4dtz/-,[-WS6+]%8}|@1.@G@V#A9T}LPO,?Qd.|zw!P?5=8S',

  // Connection to Database
  database: {

    // MONGO_URI connection or connetion key (development, production)
    connection: process.env.MONGO_URI || null,

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
