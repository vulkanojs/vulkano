/**
 * Permission Policy
 */
module.exports = {

  //
  // Enable Permission Policy
  // @type Boolean
  //
  enabled: true,

  //
  // Permissions
  // @type Array
  //
  permissions: [
    'accelerometer=()',
    'camera=()',
    'geolocation=()',
    'gyroscope=()',
    'magnetometer=()',
    'microphone=()',
    'payment=()',
    'usb=()'
  ]

};
