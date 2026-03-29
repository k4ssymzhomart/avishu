import { useEffect, useMemo, useState } from 'react';

import {
  getCachedProducts,
  getManageableProductsForFranchise,
  getVisibleProductsForBranch,
  subscribeToProducts,
} from '@/services/products';
import type { Product } from '@/types/product';

let productsCache: Product[] | null = getCachedProducts();

type UseProductsOptions = {
  branchId?: string | null;
  franchiseId?: string | null;
  scope?: 'all' | 'branch' | 'franchise';
};

export function useProducts(options?: UseProductsOptions) {
  const [allProducts, setAllProducts] = useState<Product[]>(() => productsCache ?? []);
  const [isLoading, setIsLoading] = useState(() => !productsCache);

  useEffect(() => {
    const unsubscribe = subscribeToProducts((nextProducts) => {
      productsCache = nextProducts;
      setAllProducts(nextProducts);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const products = useMemo(() => {
    if (options?.scope === 'branch') {
      return getVisibleProductsForBranch(allProducts, options.branchId ?? null);
    }

    if (options?.scope === 'franchise') {
      return getManageableProductsForFranchise(allProducts, options.franchiseId ?? null);
    }

    return allProducts;
  }, [allProducts, options?.branchId, options?.franchiseId, options?.scope]);

  return {
    isLoading,
    products,
  };
}
