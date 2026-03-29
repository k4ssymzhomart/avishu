import { useEffect, useState } from 'react';

import { subscribeToCustomerFavorites } from '@/services/favorites';
import { useFavoritesStore } from '@/store/favorites';

const favoritesCache = new Map<string, string[]>();

export function useCustomerFavorites(customerId: string | null) {
  const [favoriteProductIds, setFavoriteProductIds] = useState<string[]>(() =>
    customerId ? favoritesCache.get(customerId) ?? [] : [],
  );
  const [isLoading, setIsLoading] = useState(() => !!customerId && !favoritesCache.has(customerId));

  useEffect(() => {
    if (!customerId) {
      setFavoriteProductIds([]);
      setIsLoading(false);
      return;
    }

    const cachedFavorites = favoritesCache.get(customerId);

    if (cachedFavorites) {
      setFavoriteProductIds(cachedFavorites);
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }

    const unsubscribe = subscribeToCustomerFavorites(customerId, (nextProductIds) => {
      favoritesCache.set(customerId, nextProductIds);
      setFavoriteProductIds(nextProductIds);
      setIsLoading(false);
    });

    return unsubscribe;
  }, [customerId]);

  return {
    favoriteProductIds,
    isLoading,
  };
}

export function useCustomerFavoritesSync(customerId: string | null) {
  const bindCustomer = useFavoritesStore((state) => state.bindCustomer);
  const hydrateFavorites = useFavoritesStore((state) => state.hydrateFavorites);
  const { favoriteProductIds, isLoading } = useCustomerFavorites(customerId);

  useEffect(() => {
    bindCustomer(customerId);
  }, [bindCustomer, customerId]);

  useEffect(() => {
    hydrateFavorites(customerId, favoriteProductIds, !isLoading);
  }, [customerId, favoriteProductIds, hydrateFavorites, isLoading]);

  return {
    favoriteProductIds,
    isLoading,
  };
}
