import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { translations } from '../i18n/translations';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

const LANG_KEY = '@easemind_lang';

const getStoredLanguage = async () => {
  try {
    return await AsyncStorage.getItem(LANG_KEY);
  } catch {
    return null;
  }
};

export const setStoredLanguage = async (lang: string) => {
  try {
    await AsyncStorage.setItem(LANG_KEY, lang);
  } catch {}
};

// Detect system language
const getSystemLanguage = (): string => {
  const locale = Localization.locale || 'en-US';
  if (locale.startsWith('pt')) return 'pt-BR';
  if (locale.startsWith('es')) return 'es';
  return 'en';
};

i18n.use(initReactI18next).init({
  compatibilityJSON: 'v3',
  resources: {
    en: { translation: translations.en },
    'pt-BR': { translation: translations['pt-BR'] },
    es: { translation: translations.es },
  },
  lng: getSystemLanguage(), // Use system language as default
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

// Load stored language (overrides system language if previously set)
getStoredLanguage().then((lang) => {
  if (lang) {
    i18n.changeLanguage(lang);
  }
});

export default i18n;
