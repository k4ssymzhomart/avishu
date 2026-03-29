import { create } from 'zustand';

export type FranchiseeLanguage = 'en' | 'ru';

type FranchiseePreferencesState = {
  language: FranchiseeLanguage;
  setLanguage: (language: FranchiseeLanguage) => void;
};

export const useFranchiseePreferencesStore = create<FranchiseePreferencesState>((set) => ({
  language: 'ru',
  setLanguage: (language) => {
    set({ language });
  },
}));
