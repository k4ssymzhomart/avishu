import { useEffect, useState } from 'react';

import { getCachedProducts, subscribeToProducts } from '@/services/products';
import type { Product } from '@/types/product';

let productsCache: Product[] | null = getCachedProducts();

export function useProducts() {
  const [products, setProducts] = useState<Product[]>(() => productsCache ?? []);
  const [isLoading, setIsLoading] = useState(() => !productsCache);

  useEffect(() => {
    const unsubscribe = subscribeToProducts((nextProducts) => {
      productsCache = nextProducts;
      setProducts(nextProducts);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  return {
    isLoading,
    products,
  };
}
