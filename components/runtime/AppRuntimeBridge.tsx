import { useEffect, useRef } from 'react';

import { router } from 'expo-router';

import { subscribeToPhoneAuthState } from '@/services/auth';
import { findRegisteredUser } from '@/services/users';
import {
  canUseNativeNotifications,
  getNotificationsModule,
  registerDeviceForOrderNotifications,
  unregisterDeviceFromOrderNotifications,
} from '@/services/pushNotifications';
import { useSessionStore } from '@/store/session';

type RegisteredPushSession = {
  expoPushToken: string;
  userId: string;
};

export function AppRuntimeBridge() {
  const authStatus = useSessionStore((state) => state.authStatus);
  const currentRole = useSessionStore((state) => state.currentRole);
  const currentUserId = useSessionStore((state) => state.currentUserId);
  const registeredPushSessionRef = useRef<RegisteredPushSession | null>(null);

  useEffect(() => {
    let isActive = true;

    const unsubscribe = subscribeToPhoneAuthState(async (user) => {
      if (!isActive) {
        return;
      }

      if (!user) {
        useSessionStore.getState().handlePhoneSessionEnded();
        return;
      }

      const sessionState = useSessionStore.getState();

      if (
        sessionState.authMethod === 'phone' &&
        sessionState.currentUserId === user.id &&
        sessionState.authStatus !== 'guest'
      ) {
        return;
      }

      const profile = await findRegisteredUser(user.id).catch(() => null);

      if (!isActive) {
        return;
      }

      useSessionStore.getState().hydratePhoneSession({
        phoneNumber: profile?.phoneNumber ?? user.phoneNumber,
        userId: user.id,
        userName: profile?.displayName ?? profile?.name ?? null,
        userRole: profile?.role ?? null,
      });
    });

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!canUseNativeNotifications()) {
      return;
    }

    let isMounted = true;
    let subscription: { remove: () => void } | null = null;

    const setupNotificationResponses = async () => {
      const Notifications = await getNotificationsModule();

      if (!Notifications || !isMounted) {
        return;
      }

      const redirect = (notification: { request: { content: { data?: { url?: unknown } } } }) => {
        const url = notification.request.content.data?.url;

        if (typeof url === 'string' && url.length) {
          router.push(url as never);
        }
      };

      const response = await Notifications.getLastNotificationResponseAsync();

      if (!isMounted) {
        return;
      }

      if (response?.notification) {
        redirect(response.notification);
      }

      subscription = Notifications.addNotificationResponseReceivedListener((nextResponse) => {
        redirect(nextResponse.notification);
      });
    };

    void setupNotificationResponses();

    return () => {
      isMounted = false;
      subscription?.remove();
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const syncPushRegistration = async () => {
      if (authStatus !== 'authenticated' || !currentUserId || !currentRole) {
        const previousSession = registeredPushSessionRef.current;

        if (previousSession) {
          registeredPushSessionRef.current = null;
          await unregisterDeviceFromOrderNotifications(previousSession.userId, previousSession.expoPushToken).catch(
            () => undefined,
          );
        }

        return;
      }

      const registration = await registerDeviceForOrderNotifications({
        role: currentRole,
        userId: currentUserId,
      }).catch(() => null);

      if (isCancelled || !registration || registration.status !== 'registered') {
        return;
      }

      const previousSession = registeredPushSessionRef.current;

      if (
        previousSession &&
        (previousSession.userId !== currentUserId || previousSession.expoPushToken !== registration.expoPushToken)
      ) {
        await unregisterDeviceFromOrderNotifications(previousSession.userId, previousSession.expoPushToken).catch(
          () => undefined,
        );
      }

      registeredPushSessionRef.current = {
        expoPushToken: registration.expoPushToken,
        userId: currentUserId,
      };
    };

    void syncPushRegistration();

    return () => {
      isCancelled = true;
    };
  }, [authStatus, currentRole, currentUserId]);

  return null;
}
