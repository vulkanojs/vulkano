/*
 * Enable support for Vite in this app.
 * If enabled, the app will attempt to load the Vite manifest file on startup and make it
 * available as `vite` for use in your views.
 *
 * In your template, you can define the CSS and JS entries like this:
 *
 * CSS: {{ vite({ entry: 'app', type: 'style' }) | safe }}
 * JS: {{ vite({ entry: 'app', type: 'script' }) | safe }}
 *
*/
module.exports = {

  //
  // Enable Vite support.
  // @type Boolean
  //
  enabled: true,

  //
  // The path to the Vite build folder. This is where the manifest file will be located.
  // Default: 'public/.vite'
  // @type String
  //
  buildPath: 'public/.vite',

};
