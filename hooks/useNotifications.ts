import { useEffect, useMemo, useState } from 'react';

import { markNotificationsRead, subscribeToUserNotifications } from '@/services/notifications';
import type { AppNotification } from '@/types/notification';

const notificationsCache = new Map<string, AppNotification[]>();
const notificationListeners = new Map<string, Set<(notifications: AppNotification[]) => void>>();
const notificationSubscriptions = new Map<string, () => void>();

function publishNotifications(cacheKey: string, nextNotifications: AppNotification[]) {
  notificationsCache.set(cacheKey, nextNotifications);
  notificationListeners.get(cacheKey)?.forEach((listener) => listener(nextNotifications));
}

function ensureNotificationsSubscription(cacheKey: string, userId: string) {
  if (notificationSubscriptions.has(cacheKey)) {
    return;
  }

  notificationSubscriptions.set(
    cacheKey,
    subscribeToUserNotifications(userId, (nextNotifications) => {
      publishNotifications(cacheKey, nextNotifications);
    }),
  );
}

type UseUserNotificationsOptions = {
  markRead?: boolean;
};

export function useUserNotifications(userId: string | null, options?: UseUserNotificationsOptions) {
  const markRead = options?.markRead ?? true;
  const cacheKey = useMemo(() => (userId ? `user-notifications:${userId}` : null), [userId]);
  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    cacheKey ? notificationsCache.get(cacheKey) ?? [] : [],
  );
  const [isLoading, setIsLoading] = useState(() => (cacheKey ? !notificationsCache.has(cacheKey) : false));

  useEffect(() => {
    if (!cacheKey || !userId) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    const cachedNotifications = notificationsCache.get(cacheKey);
    const listener = (nextNotifications: AppNotification[]) => {
      setNotifications(nextNotifications);
      setIsLoading(false);
    };

    if (cachedNotifications) {
      setNotifications(cachedNotifications);
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }

    const listeners = notificationListeners.get(cacheKey) ?? new Set<(notifications: AppNotification[]) => void>();
    listeners.add(listener);
    notificationListeners.set(cacheKey, listeners);

    ensureNotificationsSubscription(cacheKey, userId);

    return () => {
      const activeListeners = notificationListeners.get(cacheKey);

      activeListeners?.delete(listener);

      if (!activeListeners?.size) {
        notificationListeners.delete(cacheKey);
        notificationSubscriptions.get(cacheKey)?.();
        notificationSubscriptions.delete(cacheKey);
      }
    };
  }, [cacheKey, userId]);

  useEffect(() => {
    if (!userId || !markRead) {
      return;
    }

    const unreadIds = notifications.filter((notification) => !notification.readAt).map((notification) => notification.id);

    if (!unreadIds.length) {
      return;
    }

    void markNotificationsRead(userId, unreadIds);
  }, [markRead, notifications, userId]);

  return {
    isLoading,
    notifications,
  };
}
