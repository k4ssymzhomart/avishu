import { useMemo } from 'react';

import { useRouter } from 'expo-router';
import { useWindowDimensions } from 'react-native';

import { NotificationFeed, type NotificationFeedItem } from '@/components/notifications/NotificationFeed';
import { AppHeader } from '@/components/layout/AppHeader';
import { Screen } from '@/components/layout/Screen';
import { useCustomerChatThreads } from '@/hooks/useChat';
import { useUserNotifications } from '@/hooks/useNotifications';
import { resolveOrderNotificationIcon } from '@/lib/utils/notifications';
import { useSessionStore } from '@/store/session';

function getMaxWidth(width: number) {
  if (width >= 1360) {
    return 880;
  }

  if (width >= 780) {
    return 760;
  }

  return undefined;
}

export default function CustomerNotificationsScreen() {
  const router = useRouter();
  const currentUserId = useSessionStore((state) => state.currentUserId);
  const { isLoading: isThreadsLoading, threads } = useCustomerChatThreads(currentUserId);
  const { isLoading: isNotificationsLoading, notifications } = useUserNotifications(currentUserId);
  const { width } = useWindowDimensions();
  const maxContentWidth = useMemo(() => getMaxWidth(width), [width]);

  const items = useMemo<NotificationFeedItem[]>(() => {
    const statusItems = notifications.map((notification) => ({
      action: () => router.push(notification.url ?? '/customer/orders'),
      body: notification.body,
      icon: resolveOrderNotificationIcon({
        eventKey: notification.eventKey,
        orderStatus: notification.orderStatus,
      }),
      id: `notification-${notification.id}`,
      timestamp: notification.createdAt,
      title: notification.title,
      unread: !notification.readAt,
    }));

    const threadItems = threads.map((thread) => ({
      action: () => router.push(`/customer/chat/${thread.orderId}`),
      body: thread.lastMessageText,
      icon: 'message' as const,
      id: `thread-${thread.id}-${thread.updatedAt}`,
      timestamp: thread.updatedAt,
      title: thread.productName,
      unread: thread.unreadCountForCustomer > 0,
    }));

    return [...statusItems, ...threadItems]
      .sort((left, right) => Date.parse(right.timestamp) - Date.parse(left.timestamp))
      .slice(0, 12);
  }, [notifications, router, threads]);

  return (
    <Screen maxContentWidth={maxContentWidth} scroll>
      <AppHeader
        eyebrow="AVISHU / NOTIFICATIONS"
        onBackPress={() => router.back()}
        showBackButton
        subtitle="System order pushes and in-app support updates stay together here."
        title="Notifications"
      />

      <NotificationFeed
        emptyDescription="Once order movement or boutique support generates new activity, it will appear here."
        emptyTitle="No notifications yet"
        isLoading={isThreadsLoading && isNotificationsLoading}
        items={items}
      />
    </Screen>
  );
}
