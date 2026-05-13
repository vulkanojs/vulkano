/**
 * Express Config
 *
 * Custom Express Config
 */
module.exports = {

  // Show powered by in http headers
  poweredBy: false,

  // Request timeout (in milliseconds)
  timeout: 120000,

  // Folder to upload files
  uploadPath: 'public/files',

  // Number of proxy hops to trust for X-Forwarded-* headers.
  // Use 1 when behind a single load balancer, true to trust all (less secure).
  // See https://expressjs.com/en/guide/behind-proxies.html
  // @type Number | Boolean
  trustProxy: 1

};
