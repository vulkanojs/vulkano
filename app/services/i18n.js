const i18next = require('i18next');
const moment = require('moment');

require('moment/min/locales.min');

moment.locale('en');

module.exports = (() => {

  const {
    en,
    es
  } = app.config.locales;

  // Change translations
  i18next.init({
    lng: 'en',
    fallbackLng: 'en',
    resources: {
      en: {
        translation: en
      },
      es: {
        translation: es
      }
    }
  });

  // catch the event and make changes accordingly
  i18next.on('languageChanged', (lng) => {
    if (lng === 'es' || lng === 'spanish') {
      moment.locale('es');
    } else {
      moment.locale('en');
    }
  });

  return i18next;

})();
