/**
 * Content Security Policy
 *
 * Important: you must be have an endpoint
 * to get the report
 */
module.exports = {

  // Enabled
  enabled: false,

  // Endpoint
  report: {

    group: 'csp-endpoint',
    max_age: '10886400',
    endpoints: [
      {
        url: 'https://yourdomain.com/__cspreport__'
      }
    ]

  },

  // Values
  rules: [
    "default-src 'self'",
    "font-src 'self' data:",
    "img-src 'self'",
    "script-src 'self' 'sha256-AF490//jIflwN/2nTDszvAx/KI2V9GJG8gdwvGhO/zw='",
    "style-src 'self'",
    "frame-src 'self'",
    "frame-ancestors 'self' https://yourdomain.com https://yourlocal.local",
    'report-to csp-endpoint; report-uri /__cspreport__'
  ]

};
