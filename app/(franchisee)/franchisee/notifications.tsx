import { useMemo } from 'react';

import { useRouter } from 'expo-router';

import { NotificationFeed, type NotificationFeedItem } from '@/components/notifications/NotificationFeed';
import { AppHeader } from '@/components/layout/AppHeader';
import { Screen } from '@/components/layout/Screen';
import { useUserNotifications } from '@/hooks/useNotifications';
import { resolveOrderNotificationIcon } from '@/lib/utils/notifications';
import { useSessionStore } from '@/store/session';

export default function FranchiseeNotificationsScreen() {
  const router = useRouter();
  const currentUserId = useSessionStore((state) => state.currentUserId);
  const { isLoading, notifications } = useUserNotifications(currentUserId);

  const items = useMemo<NotificationFeedItem[]>(
    () =>
      notifications.map((notification) => ({
        action: () => router.push(notification.url ?? '/franchisee/orders'),
        body: notification.body,
        icon: resolveOrderNotificationIcon({
          eventKey: notification.eventKey,
          orderStatus: notification.orderStatus,
        }),
        id: notification.id,
        timestamp: notification.createdAt,
        title: notification.title,
        unread: !notification.readAt,
      })),
    [notifications, router],
  );

  return (
    <Screen maxContentWidth={840} scroll>
      <AppHeader
        eyebrow="AVISHU / NOTIFICATIONS"
        onBackPress={() => router.back()}
        showBackButton
        subtitle="New order intake, production movement, and delivery updates surface here."
        title="Notifications"
      />

      <NotificationFeed
        emptyDescription="Franchisee order-status activity will appear here as orders move through the shared flow."
        emptyTitle="No notifications yet"
        isLoading={isLoading}
        items={items}
      />
    </Screen>
  );
}
