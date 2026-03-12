import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import es from './locales/es.json';
import en from './locales/en.json';
import pt from './locales/pt.json';
import it from './locales/it.json';

export type SupportedLocale = 'es' | 'en' | 'pt' | 'it';

export const LANGUAGES: {code: SupportedLocale; label: string; flag: string}[] = [
  {code: 'es', label: 'Español', flag: '🇪🇸'},
  {code: 'en', label: 'English', flag: '🇺🇸'},
  {code: 'pt', label: 'Português', flag: '🇵🇹'},
  {code: 'it', label: 'Italiano', flag: '🇮🇹'},
];

i18n.use(initReactI18next).init({
  resources: {
    es: {translation: es},
    en: {translation: en},
    pt: {translation: pt},
    it: {translation: it},
  },
  lng: 'es',
  fallbackLng: 'es',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
