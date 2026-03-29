import { useEffect, useMemo, useState } from 'react';

import {
  getCachedProductionUnitById,
  getCachedProductionUnits,
  subscribeToProductionUnits,
} from '@/services/productionUnits';
import type { ProductionUnit } from '@/types/productionUnit';

let productionUnitsCache: ProductionUnit[] | null = getCachedProductionUnits();

export function useProductionUnits() {
  const [productionUnits, setProductionUnits] = useState<ProductionUnit[]>(() => productionUnitsCache ?? []);
  const [isLoading, setIsLoading] = useState(() => !productionUnitsCache);

  useEffect(() => {
    const unsubscribe = subscribeToProductionUnits((nextUnits) => {
      productionUnitsCache = nextUnits;
      setProductionUnits(nextUnits);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  return {
    isLoading,
    productionUnits,
  };
}

export function useProductionUnit(unitId: string | null | undefined) {
  const { isLoading, productionUnits } = useProductionUnits();

  const productionUnit = useMemo(
    () =>
      unitId
        ? productionUnits.find((entry) => entry.id === unitId) ?? getCachedProductionUnitById(unitId)
        : null,
    [productionUnits, unitId],
  );

  return {
    isLoading,
    productionUnit,
  };
}
