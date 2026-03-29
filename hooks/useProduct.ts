import { useEffect, useState } from 'react';

import { getCachedProductById, subscribeToProduct } from '@/services/products';
import type { Product } from '@/types/product';

export function useProduct(productId: string | null) {
  const cachedProduct = productId ? getCachedProductById(productId) : null;
  const [product, setProduct] = useState<Product | null>(cachedProduct);
  const [isLoading, setIsLoading] = useState(() => !!productId && !cachedProduct);

  useEffect(() => {
    if (!productId) {
      setProduct(null);
      setIsLoading(false);
      return;
    }

    const nextCachedProduct = getCachedProductById(productId);

    if (nextCachedProduct) {
      setProduct(nextCachedProduct);
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }

    const unsubscribe = subscribeToProduct(productId, (nextProduct) => {
      setProduct(nextProduct);
      setIsLoading(false);
    });

    return unsubscribe;
  }, [productId]);

  return {
    isLoading,
    product,
  };
}
