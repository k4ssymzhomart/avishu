import { useMemo } from 'react';

import { useRouter } from 'expo-router';
import { useWindowDimensions } from 'react-native';

import { NotificationFeed, type NotificationFeedItem } from '@/components/notifications/NotificationFeed';
import { AppHeader } from '@/components/layout/AppHeader';
import { Screen } from '@/components/layout/Screen';
import { useCustomerChatThreads } from '@/hooks/useChat';
import { useCustomerI18n } from '@/hooks/useCustomerI18n';
import { useUserNotifications } from '@/hooks/useNotifications';
import { resolveOrderNotificationIcon } from '@/lib/utils/notifications';
import { useSessionStore } from '@/store/session';
import type { AppNotification } from '@/types/notification';

function getMaxWidth(width: number) {
  if (width >= 1360) {
    return 880;
  }

  if (width >= 780) {
    return 760;
  }

  return undefined;
}

function getLocalizedNotificationTitle(language: 'en' | 'ru', notification: AppNotification) {
  if (notification.orderStatus) {
    if (language === 'ru') {
      return notification.orderStatus === 'cancelled'
        ? 'Заказ отменен'
        : notification.orderStatus === 'delivered'
          ? 'Заказ доставлен'
          : notification.orderStatus === 'ready'
            ? 'Заказ готов'
            : notification.orderStatus === 'out_for_delivery'
              ? 'Заказ в доставке'
              : notification.orderStatus === 'in_production'
                ? 'Заказ в производстве'
                : notification.orderStatus === 'accepted'
                  ? 'Заказ принят'
                  : 'Заказ размещен';
    }

    return notification.orderStatus === 'cancelled'
      ? 'Order cancelled'
      : notification.orderStatus === 'delivered'
        ? 'Order delivered'
        : notification.orderStatus === 'ready'
          ? 'Order ready'
          : notification.orderStatus === 'out_for_delivery'
            ? 'Order out for delivery'
            : notification.orderStatus === 'in_production'
              ? 'Order in production'
              : notification.orderStatus === 'accepted'
                ? 'Order accepted'
                : 'Order placed';
  }

  return notification.title;
}

function getLocalizedNotificationBody(language: 'en' | 'ru', notification: AppNotification) {
  if (!notification.orderStatus) {
    return notification.body;
  }

  if (language === 'ru') {
    if (notification.orderStatus === 'accepted') {
      return 'Бутик подтвердил заказ и готовит следующий этап.';
    }

    if (notification.orderStatus === 'in_production') {
      return 'Изделие уже находится в производстве.';
    }

    if (notification.orderStatus === 'ready') {
      return 'Изделие готово к выдаче или передаче курьеру.';
    }

    if (notification.orderStatus === 'out_for_delivery') {
      return 'Доставка уже началась.';
    }

    if (notification.orderStatus === 'delivered') {
      return 'Заказ доставлен и перемещен в архив.';
    }

    if (notification.orderStatus === 'cancelled') {
      return 'Заказ отменен. Поддержка при необходимости продолжит диалог в чате.';
    }

    return 'Бутик получил заказ и готовит подтверждение.';
  }

  if (notification.orderStatus === 'accepted') {
    return 'Boutique confirmed the order and is preparing the next handoff.';
  }

  if (notification.orderStatus === 'in_production') {
    return 'Your piece is now in production.';
  }

  if (notification.orderStatus === 'ready') {
    return 'Your piece is ready for pickup or courier handoff.';
  }

  if (notification.orderStatus === 'out_for_delivery') {
    return 'Delivery is now underway.';
  }

  if (notification.orderStatus === 'delivered') {
    return 'The order has been delivered and archived.';
  }

  if (notification.orderStatus === 'cancelled') {
    return 'The order was cancelled. Support can continue the conversation in chat if needed.';
  }

  return 'Boutique received the order and is preparing confirmation.';
}

export default function CustomerNotificationsScreen() {
  const router = useRouter();
  const { copy, language } = useCustomerI18n();
  const currentUserId = useSessionStore((state) => state.currentUserId);
  const { isLoading: isThreadsLoading, threads } = useCustomerChatThreads(currentUserId);
  const { isLoading: isNotificationsLoading, notifications } = useUserNotifications(currentUserId);
  const { width } = useWindowDimensions();
  const maxContentWidth = useMemo(() => getMaxWidth(width), [width]);

  const items = useMemo<NotificationFeedItem[]>(() => {
    const statusItems = notifications.map((notification) => ({
      action: () => router.push(notification.url ?? '/customer/orders'),
      body: getLocalizedNotificationBody(language, notification),
      icon: resolveOrderNotificationIcon({
        eventKey: notification.eventKey,
        orderStatus: notification.orderStatus,
      }),
      id: `notification-${notification.id}`,
      timestamp: notification.createdAt,
      title: getLocalizedNotificationTitle(language, notification),
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
  }, [language, notifications, router, threads]);

  return (
    <Screen maxContentWidth={maxContentWidth} scroll>
      <AppHeader
        eyebrow={language === 'ru' ? 'AVISHU / УВЕДОМЛЕНИЯ' : 'AVISHU / NOTIFICATIONS'}
        onBackPress={() => router.back()}
        showBackButton
        subtitle={copy.notifications.subtitle}
        title={copy.notifications.title}
      />

      <NotificationFeed
        emptyDescription={copy.notifications.emptyDescription}
        emptyTitle={copy.notifications.emptyTitle}
        isLoading={isThreadsLoading || isNotificationsLoading}
        items={items}
        language={language}
        loadingLabel={copy.notifications.loading}
      />
    </Screen>
  );
}
