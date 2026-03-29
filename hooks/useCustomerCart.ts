import { useEffect, useState } from 'react';

import { subscribeToCustomerCart } from '@/services/cart';
import { useCartStore } from '@/store/cart';
import type { CartItem } from '@/types/cart';

const cartCache = new Map<string, CartItem[]>();

export function useCustomerCart(customerId: string | null) {
  const [items, setItems] = useState<CartItem[]>(() => (customerId ? cartCache.get(customerId) ?? [] : []));
  const [isLoading, setIsLoading] = useState(() => !!customerId && !cartCache.has(customerId));

  useEffect(() => {
    if (!customerId) {
      setItems([]);
      setIsLoading(false);
      return;
    }

    const cachedItems = cartCache.get(customerId);

    if (cachedItems) {
      setItems(cachedItems);
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }

    const unsubscribe = subscribeToCustomerCart(customerId, (nextItems) => {
      cartCache.set(customerId, nextItems);
      setItems(nextItems);
      setIsLoading(false);
    });

    return unsubscribe;
  }, [customerId]);

  return {
    isLoading,
    items,
  };
}

export function useCustomerCartSync(customerId: string | null) {
  const bindCustomer = useCartStore((state) => state.bindCustomer);
  const hydratePersistedCart = useCartStore((state) => state.hydratePersistedCart);
  const { isLoading, items } = useCustomerCart(customerId);

  useEffect(() => {
    bindCustomer(customerId);
  }, [bindCustomer, customerId]);

  useEffect(() => {
    hydratePersistedCart(customerId, items, !isLoading);
  }, [customerId, hydratePersistedCart, isLoading, items]);

  return {
    isLoading,
    items,
  };
}
