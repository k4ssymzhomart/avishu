import { collection, doc, getDocs, writeBatch } from 'firebase/firestore';

import { demoChatMessages, demoChatThreads, demoOrders, demoProducts, demoUsersByRole } from '@/lib/constants/demo';
import { getFirestoreInstance } from '@/lib/firebase';
import { useDemoRealtimeStore } from '@/store/demoRealtime';

const ORDERS_COLLECTION = 'orders';
const ORDER_CHATS_COLLECTION = 'orderChats';
const ORDER_CHAT_MESSAGES_COLLECTION = 'orderChatMessages';
const PRODUCTS_COLLECTION = 'products';
const USERS_COLLECTION = 'users';

async function seedUsersAndProducts() {
  const firestore = getFirestoreInstance();

  if (!firestore) {
    useDemoRealtimeStore.getState().seedProducts();
    return;
  }

  const batch = writeBatch(firestore);

  demoProducts.forEach((product) => {
    batch.set(doc(firestore, PRODUCTS_COLLECTION, product.id), product);
  });

  Object.values(demoUsersByRole).forEach((user) => {
    batch.set(doc(firestore, USERS_COLLECTION, user.id), user);
  });

  await batch.commit();
}

async function clearRemoteOrders() {
  const firestore = getFirestoreInstance();

  if (!firestore) {
    useDemoRealtimeStore.getState().clearOrders();
    return;
  }

  const [orderSnapshot, chatSnapshot, messageSnapshot] = await Promise.all([
    getDocs(collection(firestore, ORDERS_COLLECTION)),
    getDocs(collection(firestore, ORDER_CHATS_COLLECTION)),
    getDocs(collection(firestore, ORDER_CHAT_MESSAGES_COLLECTION)),
  ]);
  const batch = writeBatch(firestore);

  orderSnapshot.forEach((snapshotDoc) => {
    batch.delete(snapshotDoc.ref);
  });

  chatSnapshot.forEach((snapshotDoc) => {
    batch.delete(snapshotDoc.ref);
  });

  messageSnapshot.forEach((snapshotDoc) => {
    batch.delete(snapshotDoc.ref);
  });

  await batch.commit();
}

export async function seedDemoCatalog() {
  await seedUsersAndProducts();
}

export async function clearDemoOrders() {
  await clearRemoteOrders();
}

export async function prepareDemoWalkthrough() {
  await clearRemoteOrders();
  await seedUsersAndProducts();
}

export async function resetDemoState() {
  const firestore = getFirestoreInstance();

  if (!firestore) {
    useDemoRealtimeStore.getState().resetDemo();
    return;
  }

  const [orderSnapshot, chatSnapshot, messageSnapshot] = await Promise.all([
    getDocs(collection(firestore, ORDERS_COLLECTION)),
    getDocs(collection(firestore, ORDER_CHATS_COLLECTION)),
    getDocs(collection(firestore, ORDER_CHAT_MESSAGES_COLLECTION)),
  ]);
  const batch = writeBatch(firestore);

  orderSnapshot.forEach((snapshotDoc) => {
    batch.delete(snapshotDoc.ref);
  });

  chatSnapshot.forEach((snapshotDoc) => {
    batch.delete(snapshotDoc.ref);
  });

  messageSnapshot.forEach((snapshotDoc) => {
    batch.delete(snapshotDoc.ref);
  });

  demoProducts.forEach((product) => {
    batch.set(doc(firestore, PRODUCTS_COLLECTION, product.id), product);
  });

  Object.values(demoUsersByRole).forEach((user) => {
    batch.set(doc(firestore, USERS_COLLECTION, user.id), user);
  });

  demoOrders.forEach((order) => {
    batch.set(doc(firestore, ORDERS_COLLECTION, order.id), order);
  });

  demoChatThreads.forEach((thread) => {
    batch.set(doc(firestore, ORDER_CHATS_COLLECTION, thread.id), thread);
  });

  demoChatMessages.forEach((message) => {
    batch.set(doc(firestore, ORDER_CHAT_MESSAGES_COLLECTION, message.id), message);
  });

  await batch.commit();
}
