import { useMemo } from 'react';

import { useFranchiseeI18n } from '@/hooks/useFranchiseeI18n';
import type { BottomNavItem } from '@/lib/constants/navigation';

export function useFranchiseeBottomNav() {
  const { copy } = useFranchiseeI18n();

  return useMemo<BottomNavItem[]>(
    () => [
      { href: '/franchisee', key: 'dashboard', label: copy.nav.home },
      { href: '/franchisee/orders', key: 'orders', label: copy.nav.orders },
      { href: '/franchisee/clients', key: 'clients', label: copy.nav.clients },
      { href: '/franchisee/profile', key: 'profile', label: copy.nav.profile },
    ],
    [copy.nav.clients, copy.nav.home, copy.nav.orders, copy.nav.profile],
  );
}
