import { AssetIcon } from '@/components/icons/AssetIcon';

import { theme } from '@/lib/theme/tokens';

type NavIconProps = {
  active: boolean;
  name: string;
};

export function NavIcon({ active, name }: NavIconProps) {
  const color = active ? theme.colors.text.inverse : theme.colors.text.secondary;

  if (name === 'home' || name === 'dashboard') {
    return <AssetIcon color={color} name="home" size={18} />;
  }

  if (name === 'chat' || name === 'clients') {
    return <AssetIcon color={color} name="message" size={18} />;
  }

  if (name === 'orders' || name === 'queue') {
    return <AssetIcon color={color} name="packed" size={18} />;
  }

  if (name === 'profile') {
    return <AssetIcon color={color} name="profile" size={18} />;
  }

  if (name === 'active') {
    return <AssetIcon color={color} name="energy" size={18} />;
  }

  if (name === 'ready') {
    return <AssetIcon color={color} name="orderPlaced" size={18} />;
  }

  return <AssetIcon color={color} name="energy" size={18} />;
}
