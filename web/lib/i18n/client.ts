import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { resources } from './resources';

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: 'bn',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });
}

export default i18n;
