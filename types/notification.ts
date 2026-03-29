import type { OrderStatus } from '@/types/order';
import type { UserRole } from '@/types/user';

export type OrderNotificationEventKey =
  | 'order_placed'
  | 'order_accepted'
  | 'sent_to_production'
  | 'production_started'
  | 'order_ready'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export type AppNotification = {
  body: string;
  createdAt: string;
  eventKey: OrderNotificationEventKey;
  id: string;
  orderId: string | null;
  orderStatus: OrderStatus | null;
  readAt: string | null;
  recipientRole: UserRole;
  title: string;
  updatedAt: string;
  url: string | null;
};

export type PushTokenRecord = {
  appOwnership: string | null;
  createdAt: string;
  deviceName: string | null;
  devicePushToken: string | null;
  expoPushToken: string;
  id: string;
  lastSeenAt: string;
  platform: 'android' | 'ios';
  projectId: string;
  recipientRole: UserRole;
};
