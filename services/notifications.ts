import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  writeBatch,
} from 'firebase/firestore';

import { getFirestoreInstance } from '@/lib/firebase';
import type { AppNotification, PushTokenRecord } from '@/types/notification';
import type { OrderStatus } from '@/types/order';
import type { UserRole } from '@/types/user';

const USERS_COLLECTION = 'users';
const USER_NOTIFICATIONS_SUBCOLLECTION = 'notifications';
const USER_PUSH_TOKENS_SUBCOLLECTION = 'pushTokens';

export const DEFAULT_ORDER_NOTIFICATION_CHANNEL = 'order-status';

type FirestoreNotificationRecord = {
  body?: string | null;
  createdAt?: Timestamp | string | null;
  eventKey?: AppNotification['eventKey'] | null;
  id?: string | null;
  orderId?: string | null;
  orderStatus?: OrderStatus | null;
  readAt?: Timestamp | string | null;
  recipientRole?: UserRole | null;
  title?: string | null;
  updatedAt?: Timestamp | string | null;
  url?: string | null;
};

type PushTokenInput = {
  appOwnership: string | null;
  deviceName: string | null;
  devicePushToken: string | null;
  expoPushToken: string;
  platform: 'android' | 'ios';
  projectId: string;
  recipientRole: UserRole;
  userId: string;
};

function toIsoString(value: Timestamp | string | null | undefined) {
  if (!value) {
    return new Date().toISOString();
  }

  if (typeof value === 'string') {
    return value;
  }

  return value.toDate().toISOString();
}

function getUserNotificationsCollection(userId: string) {
  const firestore = getFirestoreInstance();

  if (!firestore) {
    return null;
  }

  return collection(doc(firestore, USERS_COLLECTION, userId), USER_NOTIFICATIONS_SUBCOLLECTION);
}

function getUserPushTokensCollection(userId: string) {
  const firestore = getFirestoreInstance();

  if (!firestore) {
    return null;
  }

  return collection(doc(firestore, USERS_COLLECTION, userId), USER_PUSH_TOKENS_SUBCOLLECTION);
}

function normalizeNotification(record: FirestoreNotificationRecord, fallbackId: string) {
  return {
    body: record.body?.trim() || 'Order update available.',
    createdAt: toIsoString(record.createdAt),
    eventKey: record.eventKey ?? 'order_placed',
    id: record.id ?? fallbackId,
    orderId: record.orderId ?? null,
    orderStatus: record.orderStatus ?? null,
    readAt: record.readAt ? toIsoString(record.readAt) : null,
    recipientRole: record.recipientRole ?? 'customer',
    title: record.title?.trim() || 'Order update',
    updatedAt: toIsoString(record.updatedAt ?? record.createdAt),
    url: record.url ?? null,
  } satisfies AppNotification;
}

export function buildNotificationUrlForRole(role: UserRole, orderId: string | null) {
  if (role === 'customer') {
    return orderId ? '/customer/orders' : '/customer/notifications';
  }

  if (role === 'franchisee') {
    return orderId ? '/franchisee/orders' : '/franchisee/notifications';
  }

  return orderId ? '/production' : '/production/notifications';
}

export function subscribeToUserNotifications(userId: string, onNotifications: (notifications: AppNotification[]) => void) {
  const notificationsCollection = getUserNotificationsCollection(userId);

  if (!notificationsCollection) {
    onNotifications([]);
    return () => undefined;
  }

  const notificationsQuery = query(notificationsCollection, orderBy('createdAt', 'desc'));

  return onSnapshot(
    notificationsQuery,
    (snapshot) => {
      const notifications = snapshot.docs.map((snapshotDoc) =>
        normalizeNotification(snapshotDoc.data() as FirestoreNotificationRecord, snapshotDoc.id),
      );

      onNotifications(notifications);
    },
    () => {
      onNotifications([]);
    },
  );
}

export async function markNotificationsRead(userId: string, notificationIds: string[]) {
  const firestore = getFirestoreInstance();

  if (!firestore || !notificationIds.length) {
    return;
  }

  const batch = writeBatch(firestore);

  notificationIds.forEach((notificationId) => {
    batch.set(
      doc(firestore, USERS_COLLECTION, userId, USER_NOTIFICATIONS_SUBCOLLECTION, notificationId),
      {
        readAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  });

  await batch.commit();
}

export async function upsertPushTokenRecord(input: PushTokenInput) {
  const pushTokensCollection = getUserPushTokensCollection(input.userId);

  if (!pushTokensCollection) {
    return null;
  }

  await setDoc(
    doc(pushTokensCollection, input.expoPushToken),
    {
      appOwnership: input.appOwnership,
      createdAt: serverTimestamp(),
      deviceName: input.deviceName,
      devicePushToken: input.devicePushToken,
      expoPushToken: input.expoPushToken,
      id: input.expoPushToken,
      lastSeenAt: serverTimestamp(),
      platform: input.platform,
      projectId: input.projectId,
      recipientRole: input.recipientRole,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  return input.expoPushToken;
}

export async function removePushTokenRecord(userId: string, expoPushToken: string) {
  const firestore = getFirestoreInstance();

  if (!firestore || !expoPushToken) {
    return;
  }

  await deleteDoc(doc(firestore, USERS_COLLECTION, userId, USER_PUSH_TOKENS_SUBCOLLECTION, expoPushToken));
}

export function normalizePushTokenRecord(record: PushTokenRecord) {
  return {
    ...record,
    createdAt: toIsoString(record.createdAt),
    lastSeenAt: toIsoString(record.lastSeenAt),
  };
}
