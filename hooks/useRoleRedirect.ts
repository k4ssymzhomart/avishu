import { useMemo } from 'react';

import { useSessionStore } from '@/store/session';
import type { AuthStatus } from '@/types/auth';
import type { UserRole } from '@/types/user';

export const roleHomePaths: Record<UserRole, '/customer' | '/franchisee' | '/production'> = {
  customer: '/customer',
  franchisee: '/franchisee',
  production: '/production',
};

export function resolveEntryPath(authStatus: AuthStatus, currentRole: UserRole | null, pendingRoleSelection: UserRole | null) {
  if (authStatus === 'pending_verification') {
    return '/verify' as const;
  }

  if (authStatus === 'role_pending') {
    return pendingRoleSelection ? ('/nickname' as const) : ('/role-select' as const);
  }

  if (authStatus === 'authenticated' && currentRole) {
    return roleHomePaths[currentRole];
  }

  return '/splash' as const;
}

export function useRoleRedirect() {
  const authStatus = useSessionStore((state) => state.authStatus);
  const currentRole = useSessionStore((state) => state.currentRole);
  const pendingRoleSelection = useSessionStore((state) => state.pendingRoleSelection);

  const targetPath = useMemo(
    () => resolveEntryPath(authStatus, currentRole, pendingRoleSelection),
    [authStatus, currentRole, pendingRoleSelection],
  );

  return {
    authStatus,
    currentRole,
    isAuthenticated: authStatus === 'authenticated',
    targetPath,
  };
}
