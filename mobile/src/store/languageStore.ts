import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n, {SupportedLocale} from '../i18n';

interface LanguageState {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    set => ({
      locale: 'es',
      setLocale: (locale: SupportedLocale) => {
        i18n.changeLanguage(locale);
        set({locale});
      },
    }),
    {
      name: 'velle-language',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => state => {
        if (state?.locale) {
          i18n.changeLanguage(state.locale);
        }
      },
    },
  ),
);
