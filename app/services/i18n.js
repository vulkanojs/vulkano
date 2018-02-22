/* global app */

const i18next = require('i18next');
const moment = require('moment');
require('moment/min/locales.min');

moment.locale('es');

module.exports = (() => {

  const { en, es } = app.config.locales;

  // Change translations
  i18next.init({
    lng: 'es',
    fallbackLng: 'en',
    resources: { en: { translation: en }, es: { translation: es } }
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

})();
