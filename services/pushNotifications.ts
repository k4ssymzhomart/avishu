import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { DEFAULT_ORDER_NOTIFICATION_CHANNEL, removePushTokenRecord, upsertPushTokenRecord } from '@/services/notifications';
import type { UserRole } from '@/types/user';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

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

function getExpoProjectId() {
  return (
    process.env.EXPO_PUBLIC_EXPO_PROJECT_ID ??
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId ??
    null
  );
}

function serializeDevicePushToken(devicePushToken: Notifications.DevicePushToken | null) {
  if (!devicePushToken) {
    return null;
  }

  if (typeof devicePushToken.data === 'string') {
    return devicePushToken.data;
  }

  return JSON.stringify(devicePushToken.data);
}

async function ensureNotificationChannel() {
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
  if (Platform.OS === 'web' || !Device.isDevice) {
    return {
      reason: 'Push notifications are available on physical iOS and Android devices only.',
      status: 'unavailable',
    };
  }

  await ensureNotificationChannel();

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
