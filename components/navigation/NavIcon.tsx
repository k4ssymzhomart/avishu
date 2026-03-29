import { AssetIcon, type AssetIconName } from '@/components/icons/AssetIcon';

import { theme } from '@/lib/theme/tokens';

type NavIconProps = {
  active: boolean;
  name: string;
};

const iconByKey: Record<string, { name: AssetIconName; size?: number }> = {
  active: { name: 'scissors', size: 18.5 },
  chat: { name: 'chat', size: 18.5 },
  clients: { name: 'clients', size: 18.5 },
  dashboard: { name: 'store', size: 19 },
  home: { name: 'home', size: 19 },
  orders: { name: 'orders', size: 18.5 },
  profile: { name: 'profile', size: 19 },
  queue: { name: 'packageSearch', size: 18.5 },
  ready: { name: 'badgeCheck', size: 18.5 },
};

export function NavIcon({ active, name }: NavIconProps) {
  const color = active ? theme.colors.text.inverse : theme.colors.text.secondary;
  const icon = iconByKey[name] ?? { name: 'sparkles', size: 18.5 };

  return <AssetIcon color={color} name={icon.name} size={icon.size} />;
}
