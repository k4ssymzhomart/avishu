import { useEffect, useMemo, useState } from 'react';

import { demoUsersByRole } from '@/lib/constants/demo';
import { useSessionStore } from '@/store/session';
import type { User } from '@/types/user';
import { buildUserProfile, ensureUserProfile, subscribeToUserProfile } from '@/services/users';

const workspaceCache = new Map<string, User>();

export function useFranchiseeWorkspace() {
  const currentRole = useSessionStore((state) => state.currentRole);
  const currentUserId = useSessionStore((state) => state.currentUserId);
  const currentUserName = useSessionStore((state) => state.currentUserName);
  const currentUserPhoneNumber = useSessionStore((state) => state.currentUserPhoneNumber);

  const fallbackProfile = useMemo(() => {
    if (!currentUserId || currentRole !== 'franchisee') {
      return null;
    }

    const demoProfile = demoUsersByRole.franchisee;

    return buildUserProfile({
      branchAddress: demoProfile.branchAddress ?? null,
      branchId: demoProfile.branchId ?? currentUserId,
      branchName: currentUserName ?? demoProfile.branchName ?? demoProfile.name,
      id: currentUserId,
      linkedFranchiseIds: demoProfile.linkedFranchiseIds ?? [demoProfile.id],
      name: currentUserName ?? demoProfile.name,
      phoneNumber: currentUserPhoneNumber ?? demoProfile.phoneNumber ?? null,
      role: 'franchisee',
    });
  }, [currentRole, currentUserId, currentUserName, currentUserPhoneNumber]);

  const [profile, setProfile] = useState<User | null>(() => {
    if (!currentUserId) {
      return null;
    }

    return workspaceCache.get(currentUserId) ?? fallbackProfile;
  });
  const [isLoading, setIsLoading] = useState(() => Boolean(currentUserId && !workspaceCache.has(currentUserId) && !fallbackProfile));

  useEffect(() => {
    if (!currentUserId || !fallbackProfile || currentRole !== 'franchisee') {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    const cachedProfile = workspaceCache.get(currentUserId);

    if (cachedProfile) {
      setProfile(cachedProfile);
      setIsLoading(false);
    } else {
      setProfile(fallbackProfile);
      setIsLoading(false);
    }

    void ensureUserProfile({
      branchAddress: fallbackProfile.branchAddress ?? null,
      branchId: fallbackProfile.branchId ?? currentUserId,
      branchName: fallbackProfile.branchName ?? fallbackProfile.name,
      id: currentUserId,
      linkedFranchiseIds: fallbackProfile.linkedFranchiseIds ?? demoUsersByRole.franchisee.linkedFranchiseIds ?? [demoUsersByRole.franchisee.id],
      name: fallbackProfile.name,
      phoneNumber: fallbackProfile.phoneNumber ?? null,
      role: 'franchisee',
    });

    const unsubscribe = subscribeToUserProfile(currentUserId, (nextProfile) => {
      const resolvedProfile = nextProfile ?? fallbackProfile;
      workspaceCache.set(currentUserId, resolvedProfile);
      setProfile(resolvedProfile);
      setIsLoading(false);
    });

    return unsubscribe;
  }, [currentRole, currentUserId, fallbackProfile]);

  return {
    branchId: profile?.branchId ?? fallbackProfile?.branchId ?? currentUserId,
    branchName: profile?.branchName ?? fallbackProfile?.branchName ?? currentUserName ?? 'AVISHU Boutique',
    franchiseId:
      profile?.linkedFranchiseIds?.[0] ??
      fallbackProfile?.linkedFranchiseIds?.[0] ??
      demoUsersByRole.franchisee.linkedFranchiseIds?.[0] ??
      demoUsersByRole.franchisee.id,
    isLoading,
    profile,
    userId: profile?.id ?? currentUserId,
  };
}
