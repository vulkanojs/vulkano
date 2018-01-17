/* global VSError, app */

const i18next = require('i18next');
const moment = require('moment');
require('moment/min/locales.min');
moment.locale('es');

module.exports = function() {

  // Change translations
  i18next.init({
    lng: 'es',
    fallbackLng: 'en',
    resources: { en: { translation: app.config.locales.en }, es: { translation: app.config.locales.es } }
  });

  // catch the event and make changes accordingly
  i18next.on('languageChanged', (lng) => {
    if (lng === 'en' || lng === 'english') {
      moment.locale('en');
    } else {
      moment.locale('es');
    }
  });

  return i18next;

}();
