import { useEffect, useMemo, useState } from 'react';

import {
  subscribeToCustomerProfile,
  updateCustomerProfile,
} from '@/services/customerProfile';
import type { CustomerProfile, CustomerProfileSeed } from '@/types/customerProfile';

const profileCache = new Map<string, CustomerProfile>();

export function useCustomerProfile(seed: CustomerProfileSeed | null) {
  const uid = seed?.uid ?? null;
  const [profile, setProfile] = useState<CustomerProfile | null>(() => (uid ? profileCache.get(uid) ?? null : null));
  const [isLoading, setIsLoading] = useState(() => !!uid && !profileCache.has(uid));

  useEffect(() => {
    if (!seed || !uid) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    const cachedProfile = profileCache.get(uid);

    if (cachedProfile) {
      setProfile(cachedProfile);
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }

    const unsubscribe = subscribeToCustomerProfile(seed, (nextProfile) => {
      profileCache.set(uid, nextProfile);
      setProfile(nextProfile);
      setIsLoading(false);
    });

    return unsubscribe;
  }, [seed?.displayName, seed?.phone, seed?.role, uid]);

  const saveProfile = useMemo(
    () =>
      async (
        patch: Partial<
          Pick<
            CustomerProfile,
            'addresses' | 'assignedFranchiseId' | 'assignedFranchiseName' | 'displayName' | 'phone' | 'role'
          >
        >,
      ) => {
        if (!uid) {
          return;
        }

        const cachedProfile = profileCache.get(uid);

        if (cachedProfile) {
          const nextProfile: CustomerProfile = {
            ...cachedProfile,
            ...patch,
            displayName:
              patch.displayName !== undefined
                ? patch.displayName.trim() || cachedProfile.displayName
                : cachedProfile.displayName,
            updatedAt: new Date().toISOString(),
          };

          profileCache.set(uid, nextProfile);
          setProfile(nextProfile);
        }

        await updateCustomerProfile(uid, patch);
      },
    [uid],
  );

  return {
    isLoading,
    profile,
    saveProfile,
  };
}
