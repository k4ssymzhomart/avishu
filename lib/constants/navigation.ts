export type BottomNavItem = {
  href: string;
  key: string;
  label: string;
};

export const customerBottomNav: BottomNavItem[] = [
  { href: '/customer', key: 'home', label: 'HOME' },
  { href: '/customer/orders', key: 'orders', label: 'ORDERS' },
  { href: '/customer/chat', key: 'chat', label: 'CHAT' },
  { href: '/customer/profile', key: 'profile', label: 'PROFILE' },
];

export const franchiseeBottomNav: BottomNavItem[] = [
  { href: '/franchisee', key: 'dashboard', label: 'HOME' },
  { href: '/franchisee/orders', key: 'orders', label: 'ORDERS' },
  { href: '/franchisee/clients', key: 'clients', label: 'CLIENTS' },
  { href: '/franchisee/profile', key: 'profile', label: 'PROFILE' },
];

export const productionBottomNav: BottomNavItem[] = [
  { href: '/production', key: 'queue', label: 'QUEUE' },
  { href: '/production/active', key: 'active', label: 'ACTIVE' },
  { href: '/production/ready', key: 'ready', label: 'READY' },
  { href: '/production/profile', key: 'profile', label: 'PROFILE' },
];
