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
        // @TODO replace it for your domain name
        url: 'https://yourdomain.com/__cspreport__'
      }
    ]

  },

  // Values
  rules: {

    // Default
    'default-src': [
      "'self'"
    ],

    // Form
    'form-action': [
      "'self'"
    ],

    // Fonts
    'font-src': [
      "'self'",
      'data:',
      // 'fonts.googleapis.com',
      // 'fonts.gstatic.com',
      // 'yourS3orCDN.com'
    ],

    // Imgages
    'img-src': [
      "'self'",
      'data:',
      // '*.google-analytics.com',
      // '*.googletagmanager.com',
      // 'yourS3orCDN.com'
    ],

    // Scripts
    'script-src': [
      "'self'",
      // "'unsafe-inline'",
      // "'unsafe-eval'",
      // 'cdnjs.cloudflare.com',
      // '*.googletagmanager.com',
      // 'yourS3orCDN.com'
    ],

    // Styles
    'style-src': [
      "'self'",
      "'unsafe-inline'",
      'cdnjs.cloudflare.com'
    ],

    'style-src-elem': [
      "'self'",
      // 'cdnjs.cloudflare.com',
      // 'fonts.googleapis.com',
      // 'fonts.gstatic.com',
      // 'yourS3orCDN.com'
    ],

    // Frame
    'frame-src': [
      "'self'"
    ],
    'frame-ancestors': [
      "'self'"
    ],

    // Connection
    'connect-src': [
      "'self'",
      // '*.googletagmanager.com',
      // '*.google-analytics.com',
      // '*.analytics.google.com',
    ],

    // CSP Report
    'report-to': [
      'csp-endpoint'
    ]

  }

};
