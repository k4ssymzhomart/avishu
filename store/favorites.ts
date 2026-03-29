import { create } from 'zustand';

import { persistCustomerFavorites } from '@/services/favorites';

type FavoritesState = {
  bindCustomer: (customerId: string | null) => void;
  customerId: string | null;
  favoriteProductIds: string[];
  hasHydratedFavorites: boolean;
  hydrateFavorites: (customerId: string | null, productIds: string[], hasLoaded: boolean) => void;
  toggleFavorite: (productId: string) => void;
};

function persistNextFavorites(customerId: string | null, productIds: string[]) {
  if (!customerId) {
    return;
  }

  void persistCustomerFavorites(customerId, productIds);
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  bindCustomer: (customerId) => {
    set((state) => {
      if (state.customerId === customerId) {
        return state;
      }

      return {
        customerId,
        favoriteProductIds: [],
        hasHydratedFavorites: !customerId,
      };
    });
  },
  customerId: null,
  favoriteProductIds: [],
  hasHydratedFavorites: false,
  hydrateFavorites: (customerId, productIds, hasLoaded) => {
    set((state) => {
      if (state.customerId !== customerId) {
        return {
          customerId,
          favoriteProductIds: customerId ? productIds : [],
          hasHydratedFavorites: hasLoaded || !customerId,
        };
      }

      return {
        favoriteProductIds: customerId ? productIds : [],
        hasHydratedFavorites: hasLoaded || !customerId,
      };
    });
  },
  toggleFavorite: (productId) => {
    const currentIds = get().favoriteProductIds;
    const nextProductIds = currentIds.includes(productId)
      ? currentIds.filter((id) => id !== productId)
      : [productId, ...currentIds];

    set({
      favoriteProductIds: nextProductIds,
    });
    persistNextFavorites(get().customerId, nextProductIds);
  },
}));
