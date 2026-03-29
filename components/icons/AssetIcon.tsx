import type { LucideIcon, LucideProps } from 'lucide-react-native';
import {
  ArrowLeft,
  Award,
  BadgeCheck,
  Bell,
  Building2,
  CircleCheckBig,
  CircleUserRound,
  ClipboardList,
  Crown,
  Factory,
  Heart,
  House,
  Languages,
  LayoutGrid,
  MapPinned,
  MessageSquare,
  MessageSquareMore,
  Package,
  PackageCheck,
  PackageSearch,
  Phone,
  Rows3,
  Ruler,
  Scissors,
  Search,
  SendHorizontal,
  Shield,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Store,
  TrendingUp,
  Truck,
  Users,
  Wallet,
  X,
} from 'lucide-react-native';

const iconMap = {
  address: MapPinned,
  alarm: Bell,
  award: Award,
  backArrow: ArrowLeft,
  bag: ShoppingBag,
  badgeCheck: BadgeCheck,
  branch: Building2,
  chat: MessageSquareMore,
  clients: Users,
  crown: Crown,
  energy: Sparkles,
  factory: Factory,
  grid: LayoutGrid,
  heart: Heart,
  home: House,
  language: Languages,
  list: Rows3,
  message: MessageSquare,
  orderPlaced: CircleCheckBig,
  orders: ClipboardList,
  packageCheck: PackageCheck,
  packageSearch: PackageSearch,
  packed: Package,
  phone: Phone,
  profile: CircleUserRound,
  ruler: Ruler,
  scissors: Scissors,
  search: Search,
  security: Shield,
  send: SendHorizontal,
  settings: SlidersHorizontal,
  sparkles: Sparkles,
  store: Store,
  trendingUp: TrendingUp,
  truck: Truck,
  wallet: Wallet,
  x: X,
} satisfies Record<string, LucideIcon>;

export type AssetIconName = keyof typeof iconMap;

type AssetIconProps = {
  color?: string;
  fill?: LucideProps['fill'];
  name: AssetIconName;
  size?: number;
  strokeWidth?: number;
};

export function AssetIcon({
  color = '#111111',
  fill,
  name,
  size = 20,
  strokeWidth = 1.9,
}: AssetIconProps) {
  const Icon = iconMap[name];

  return <Icon absoluteStrokeWidth color={color} fill={fill} size={size} strokeWidth={strokeWidth} />;
}
