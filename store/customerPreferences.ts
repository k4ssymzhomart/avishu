import { create } from 'zustand';

export type CustomerLanguage = 'en' | 'ru';

type CustomerPreferencesState = {
  language: CustomerLanguage;
  setLanguage: (language: CustomerLanguage) => void;
};

export const useCustomerPreferencesStore = create<CustomerPreferencesState>((set) => ({
  language: 'ru',
  setLanguage: (language) => {
    set({ language });
  },
}));
