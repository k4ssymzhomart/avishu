import { useEffect, useRef } from 'react';

import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';

import { subscribeToPhoneAuthState } from '@/services/auth';
import { getUserProfile } from '@/services/users';
import { registerDeviceForOrderNotifications, unregisterDeviceFromOrderNotifications } from '@/services/pushNotifications';
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

      const profile = await getUserProfile(user.id).catch(() => null);

      if (!isActive) {
        return;
      }

      useSessionStore.getState().hydratePhoneSession({
        phoneNumber: profile?.phoneNumber ?? user.phoneNumber,
        userId: user.id,
        userName: profile?.name ?? null,
        userRole: profile?.role ?? null,
      });
    });

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const redirect = (notification: Notifications.Notification) => {
      const url = notification.request.content.data?.url;

      if (typeof url === 'string' && url.length) {
        router.push(url as never);
      }
    };

    const response = Notifications.getLastNotificationResponse();

    if (response?.notification) {
      redirect(response.notification);
    }

    const subscription = Notifications.addNotificationResponseReceivedListener((nextResponse) => {
      redirect(nextResponse.notification);
    });

    return () => {
      subscription.remove();
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
