import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

import { DEFAULT_ORDER_NOTIFICATION_CHANNEL, removePushTokenRecord, upsertPushTokenRecord } from '@/services/notifications';
import type { UserRole } from '@/types/user';

type RegisterForPushNotificationsInput = {
  role: UserRole;
  userId: string;
};

type RegisterForPushNotificationsResult =
  | {
      expoPushToken: string;
      status: 'registered';
    }
  | {
      reason: string;
      status: 'denied' | 'unavailable';
    };

type DevicePushTokenLike = {
  data: unknown;
};

let notificationsModulePromise: Promise<typeof import('expo-notifications') | null> | null = null;
let notificationHandlerReady = false;

export function canUseNativeNotifications() {
  return Platform.OS !== 'web' && Constants.appOwnership !== 'expo';
}

async function getNotificationsModule() {
  if (!canUseNativeNotifications()) {
    return null;
  }

  if (!notificationsModulePromise) {
    notificationsModulePromise = import('expo-notifications')
      .then((module) => {
        if (!notificationHandlerReady) {
          module.setNotificationHandler({
            handleNotification: async () => ({
              shouldPlaySound: true,
              shouldSetBadge: false,
              shouldShowBanner: true,
              shouldShowList: true,
            }),
          });
          notificationHandlerReady = true;
        }

        return module;
      })
      .catch(() => null);
  }

  return notificationsModulePromise;
}

function getExpoProjectId() {
  return (
    process.env.EXPO_PUBLIC_EXPO_PROJECT_ID ??
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId ??
    null
  );
}

function serializeDevicePushToken(devicePushToken: DevicePushTokenLike | null) {
  if (!devicePushToken) {
    return null;
  }

  if (typeof devicePushToken.data === 'string') {
    return devicePushToken.data;
  }

  return JSON.stringify(devicePushToken.data);
}

async function ensureNotificationChannel(Notifications: typeof import('expo-notifications')) {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync(DEFAULT_ORDER_NOTIFICATION_CHANNEL, {
    importance: Notifications.AndroidImportance.MAX,
    lightColor: '#111111',
    name: 'Order status updates',
    vibrationPattern: [0, 160, 120, 160],
  });
}

export async function registerDeviceForOrderNotifications(
  input: RegisterForPushNotificationsInput,
): Promise<RegisterForPushNotificationsResult> {
  if (!canUseNativeNotifications()) {
    return {
      reason: 'Push notifications require a development build or native install.',
      status: 'unavailable',
    };
  }

  if (!Device.isDevice) {
    return {
      reason: 'Push notifications are available on physical iOS and Android devices only.',
      status: 'unavailable',
    };
  }

  const Notifications = await getNotificationsModule();

  if (!Notifications) {
    return {
      reason: 'expo-notifications is unavailable in the current runtime.',
      status: 'unavailable',
    };
  }

  await ensureNotificationChannel(Notifications);

  const existingPermissions = await Notifications.getPermissionsAsync();
  let finalStatus = existingPermissions.status;

  if (existingPermissions.status !== 'granted') {
    const requestedPermissions = await Notifications.requestPermissionsAsync();
    finalStatus = requestedPermissions.status;
  }

  if (finalStatus !== 'granted') {
    return {
      reason: 'Notification permission was not granted.',
      status: 'denied',
    };
  }

  const projectId = getExpoProjectId();

  if (!projectId) {
    return {
      reason: 'Expo projectId is missing for push token registration.',
      status: 'unavailable',
    };
  }

  const expoPushToken = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  const devicePushToken = await Notifications.getDevicePushTokenAsync().catch(() => null);

  await upsertPushTokenRecord({
    appOwnership: Constants.appOwnership ?? null,
    deviceName: Device.deviceName ?? null,
    devicePushToken: serializeDevicePushToken(devicePushToken),
    expoPushToken,
    platform: Platform.OS === 'ios' ? 'ios' : 'android',
    projectId,
    recipientRole: input.role,
    userId: input.userId,
  });

  return {
    expoPushToken,
    status: 'registered',
  };
}

export function unregisterDeviceFromOrderNotifications(userId: string, expoPushToken: string) {
  return removePushTokenRecord(userId, expoPushToken);
}

export { getNotificationsModule };
