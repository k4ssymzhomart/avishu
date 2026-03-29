import { useEffect, useMemo, useState } from 'react';

import {
  getCachedFranchiseById,
  getCachedFranchises,
  subscribeToFranchises,
} from '@/services/franchises';
import type { Franchise } from '@/types/franchise';

let franchisesCache: Franchise[] | null = getCachedFranchises();

export function useFranchises() {
  const [franchises, setFranchises] = useState<Franchise[]>(() => franchisesCache ?? []);
  const [isLoading, setIsLoading] = useState(() => !franchisesCache);

  useEffect(() => {
    const unsubscribe = subscribeToFranchises((nextFranchises) => {
      franchisesCache = nextFranchises;
      setFranchises(nextFranchises);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  return {
    franchises,
    isLoading,
  };
}

export function useFranchise(franchiseId: string | null | undefined) {
  const { franchises, isLoading } = useFranchises();

  const franchise = useMemo(
    () => (franchiseId ? franchises.find((entry) => entry.id === franchiseId) ?? getCachedFranchiseById(franchiseId) : null),
    [franchiseId, franchises],
  );

  return {
    franchise,
    isLoading,
  };
}
