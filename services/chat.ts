import {
  Timestamp,
  collection,
  doc,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore';

import { getFirestoreInstance } from '@/lib/firebase';
import { useDemoRealtimeStore } from '@/store/demoRealtime';
import type { CreateOrderChatMessageInput, OrderChatMessage, OrderChatThread } from '@/types/chat';
import type { FranchiseeOrderScope } from '@/types/order';

const ORDER_CHATS_COLLECTION = 'orderChats';
const ORDER_MESSAGES_SUBCOLLECTION = 'messages';

type FirestoreChatThreadRecord = {
  branchId?: string | null;
  branchName?: string | null;
  customerId: string;
  customerName: string;
  customerPhoneNumber?: string | null;
  franchiseId?: string | null;
  id?: string;
  lastMessageAt: Timestamp | string | null;
  lastMessageText: string;
  orderId: string;
  orderStatus: OrderChatThread['orderStatus'];
  productName: string;
  unreadCountForCustomer?: number | null;
  unreadCountForSupport?: number | null;
  updatedAt: Timestamp | string | null;
};

type FirestoreChatMessageRecord = {
  createdAt: Timestamp | string | null;
  id?: string;
  orderId: string;
  senderId: string;
  senderName: string;
  senderRole: OrderChatMessage['senderRole'];
  text: string;
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

function sortThreads(threads: OrderChatThread[]) {
  return [...threads].sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt));
}

function sortMessages(messages: OrderChatMessage[]) {
  return [...messages].sort((left, right) => Date.parse(left.createdAt) - Date.parse(right.createdAt));
}

function normalizeThread(record: FirestoreChatThreadRecord, fallbackId: string) {
  return {
    branchId: record.branchId ?? null,
    branchName: record.branchName ?? null,
    customerId: record.customerId,
    customerName: record.customerName,
    customerPhoneNumber: record.customerPhoneNumber ?? null,
    franchiseId: record.franchiseId ?? null,
    id: record.id ?? fallbackId,
    lastMessageAt: toIsoString(record.lastMessageAt),
    lastMessageText: record.lastMessageText,
    orderId: record.orderId,
    orderStatus: record.orderStatus,
    productName: record.productName,
    unreadCountForCustomer: record.unreadCountForCustomer ?? 0,
    unreadCountForSupport: record.unreadCountForSupport ?? 0,
    updatedAt: toIsoString(record.updatedAt),
  } satisfies OrderChatThread;
}

function normalizeMessage(record: FirestoreChatMessageRecord, fallbackId: string) {
  return {
    createdAt: toIsoString(record.createdAt),
    id: record.id ?? fallbackId,
    orderId: record.orderId,
    senderId: record.senderId,
    senderName: record.senderName,
    senderRole: record.senderRole,
    text: record.text,
  } satisfies OrderChatMessage;
}

function resolveThreadScope(scopeOrFranchiseId: FranchiseeOrderScope | string) {
  if (typeof scopeOrFranchiseId === 'string') {
    return {
      branchId: null,
      franchiseId: scopeOrFranchiseId,
    };
  }

  return {
    branchId: scopeOrFranchiseId.branchId ?? null,
    franchiseId: scopeOrFranchiseId.franchiseId,
  };
}

function getOrderMessagesCollection(orderId: string) {
  const firestore = getFirestoreInstance();

  if (!firestore) {
    return null;
  }

  return collection(doc(firestore, 'orders', orderId), ORDER_MESSAGES_SUBCOLLECTION);
}

export function subscribeToCustomerChatThreads(customerId: string, onThreads: (threads: OrderChatThread[]) => void) {
  const firestore = getFirestoreInstance();

  if (!firestore) {
    onThreads(sortThreads(useDemoRealtimeStore.getState().chatThreads.filter((thread) => thread.customerId === customerId)));

    return useDemoRealtimeStore.subscribe((state) => {
      onThreads(sortThreads(state.chatThreads.filter((thread) => thread.customerId === customerId)));
    });
  }

  const threadsQuery = query(collection(firestore, ORDER_CHATS_COLLECTION), where('customerId', '==', customerId));

  return onSnapshot(
    threadsQuery,
    (snapshot) => {
      const threads = snapshot.docs.map((snapshotDoc) =>
        normalizeThread(snapshotDoc.data() as FirestoreChatThreadRecord, snapshotDoc.id),
      );

      onThreads(sortThreads(threads));
    },
    () => {
      onThreads([]);
    },
  );
}

export function subscribeToSupportChatThreads(onThreads: (threads: OrderChatThread[]) => void) {
  const firestore = getFirestoreInstance();

  if (!firestore) {
    onThreads(sortThreads(useDemoRealtimeStore.getState().chatThreads));

    return useDemoRealtimeStore.subscribe((state) => {
      onThreads(sortThreads(state.chatThreads));
    });
  }

  return onSnapshot(
    collection(firestore, ORDER_CHATS_COLLECTION),
    (snapshot) => {
      const threads = snapshot.docs.map((snapshotDoc) =>
        normalizeThread(snapshotDoc.data() as FirestoreChatThreadRecord, snapshotDoc.id),
      );

      onThreads(sortThreads(threads));
    },
    () => {
      onThreads([]);
    },
  );
}

export function subscribeToFranchiseeChatThreads(
  scopeOrFranchiseId: FranchiseeOrderScope | string,
  onThreads: (threads: OrderChatThread[]) => void,
) {
  const firestore = getFirestoreInstance();
  const scope = resolveThreadScope(scopeOrFranchiseId);

  if (!firestore) {
    onThreads(
      sortThreads(
        useDemoRealtimeStore
          .getState()
          .chatThreads.filter(
            (thread) =>
              thread.franchiseId === scope.franchiseId &&
              (!scope.branchId || !thread.branchId || thread.branchId === scope.branchId),
          ),
      ),
    );

    return useDemoRealtimeStore.subscribe((state) => {
      onThreads(
        sortThreads(
          state.chatThreads.filter(
            (thread) =>
              thread.franchiseId === scope.franchiseId &&
              (!scope.branchId || !thread.branchId || thread.branchId === scope.branchId),
          ),
        ),
      );
    });
  }

  const threadsQuery = query(collection(firestore, ORDER_CHATS_COLLECTION), where('franchiseId', '==', scope.franchiseId));

  return onSnapshot(
    threadsQuery,
    (snapshot) => {
      const threads = snapshot.docs
        .map((snapshotDoc) => normalizeThread(snapshotDoc.data() as FirestoreChatThreadRecord, snapshotDoc.id))
        .filter((thread) => !scope.branchId || !thread.branchId || thread.branchId === scope.branchId);

      onThreads(sortThreads(threads));
    },
    () => {
      onThreads([]);
    },
  );
}

export function subscribeToOrderMessages(orderId: string, onMessages: (messages: OrderChatMessage[]) => void) {
  const firestore = getFirestoreInstance();

  if (!firestore) {
    onMessages(sortMessages(useDemoRealtimeStore.getState().chatMessages.filter((message) => message.orderId === orderId)));

    return useDemoRealtimeStore.subscribe((state) => {
      onMessages(sortMessages(state.chatMessages.filter((message) => message.orderId === orderId)));
    });
  }

  const orderMessagesCollection = getOrderMessagesCollection(orderId);

  if (!orderMessagesCollection) {
    onMessages([]);
    return () => undefined;
  }

  const messagesQuery = query(orderMessagesCollection, orderBy('createdAt', 'asc'));

  return onSnapshot(
    messagesQuery,
    (snapshot) => {
      const messages = snapshot.docs.map((snapshotDoc) =>
        normalizeMessage(snapshotDoc.data() as FirestoreChatMessageRecord, snapshotDoc.id),
      );

      onMessages(sortMessages(messages));
    },
    () => {
      onMessages([]);
    },
  );
}

export async function sendOrderMessage(input: CreateOrderChatMessageInput) {
  const firestore = getFirestoreInstance();

  if (!firestore) {
    return useDemoRealtimeStore.getState().sendMessage(input);
  }

  const orderMessagesCollection = getOrderMessagesCollection(input.orderId);

  if (!orderMessagesCollection) {
    return null;
  }

  const messageRef = doc(orderMessagesCollection);
  const batch = writeBatch(firestore);

  batch.set(messageRef, {
    createdAt: serverTimestamp(),
    id: messageRef.id,
    orderId: input.orderId,
    senderId: input.senderId,
    senderName: input.senderName,
    senderRole: input.senderRole,
    text: input.text.trim(),
  });

  batch.set(
    doc(firestore, ORDER_CHATS_COLLECTION, input.orderId),
    {
      id: input.orderId,
      orderId: input.orderId,
      lastMessageAt: serverTimestamp(),
      lastMessageText: input.text.trim(),
      unreadCountForCustomer: input.senderRole === 'customer' ? 0 : increment(1),
      unreadCountForSupport: input.senderRole === 'customer' ? increment(1) : 0,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  await batch.commit();

  return messageRef.id;
}

export async function markCustomerThreadRead(orderId: string) {
  const firestore = getFirestoreInstance();

  if (!firestore) {
    useDemoRealtimeStore.getState().markCustomerThreadRead(orderId);
    return;
  }

  await setDoc(doc(firestore, ORDER_CHATS_COLLECTION, orderId), {
    unreadCountForCustomer: 0,
  }, { merge: true });
}

export async function markSupportThreadRead(orderId: string) {
  const firestore = getFirestoreInstance();

  if (!firestore) {
    useDemoRealtimeStore.getState().markSupportThreadRead(orderId);
    return;
  }

  await setDoc(doc(firestore, ORDER_CHATS_COLLECTION, orderId), {
    unreadCountForSupport: 0,
  }, { merge: true });
}
