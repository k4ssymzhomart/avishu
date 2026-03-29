import type { AssetIconName } from '@/components/icons/AssetIcon';
import type { AppNotification } from '@/types/notification';
import type { OrderStatus } from '@/types/order';

export function resolveOrderNotificationIcon(input: {
  eventKey?: AppNotification['eventKey'] | null;
  orderStatus?: OrderStatus | null;
}): AssetIconName {
  if (input.eventKey === 'out_for_delivery' || input.orderStatus === 'out_for_delivery') {
    return 'truck';
  }

  if (input.eventKey === 'delivered' || input.orderStatus === 'delivered') {
    return 'badgeCheck';
  }

  if (input.eventKey === 'production_started' || input.orderStatus === 'in_production') {
    return 'scissors';
  }

  return 'packed';
}
