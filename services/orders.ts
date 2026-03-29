import {
  Timestamp,
  collection,
  doc,
  getDoc,
  increment,
  onSnapshot,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from 'firebase/firestore';

import { demoUsersByRole } from '@/lib/constants/demo';
import { getFirestoreInstance } from '@/lib/firebase';
import { applyCustomerLoyaltyReward } from '@/services/customerProfile';
import { useDemoRealtimeStore } from '@/store/demoRealtime';
import type { CreateOrderInput, FranchiseeOrderScope, Order, OrderStatus } from '@/types/order';

const ORDERS_COLLECTION = 'orders';
const ORDER_CHATS_COLLECTION = 'orderChats';
const ORDER_MESSAGES_SUBCOLLECTION = 'messages';
const USERS_COLLECTION = 'users';
const PRODUCTION_STATUSES: OrderStatus[] = ['accepted', 'in_production', 'ready'];

type FirestoreOrderRecord = {
  branchId?: string | null;
  branchName?: string | null;
  createdAt: Timestamp | string | null;
  customerId: string;
  customerName: string;
  customerPhoneNumber?: string | null;
  delivery: Order['delivery'];
  franchiseId: string;
  id?: string;
  paymentMethod?: Order['paymentMethod'];
  preferredReadyDate?: string | null;
  productCollection?: string | null;
  productId: string;
  productImageUrl?: string | null;
  productName: string;
  productPrice: number;
  productionNote?: string | null;
  productionNoteUpdatedAt?: Timestamp | string | null;
  selectedColorId?: string | null;
  selectedColorLabel?: string | null;
  selectedSize?: string | null;
  status: OrderStatus;
  timeline: {
    acceptedAt?: Timestamp | string | null;
    cancelledAt?: Timestamp | string | null;
    deliveredAt?: Timestamp | string | null;
    inProductionAt?: Timestamp | string | null;
    outForDeliveryAt?: Timestamp | string | null;
    placedAt: Timestamp | string | null;
    readyAt?: Timestamp | string | null;
  };
  type: Order['type'];
  updatedAt: Timestamp | string | null;
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

function sortOrders(orders: Order[]) {
  return [...orders].sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt));
}

function normalizeOrder(record: FirestoreOrderRecord, fallbackId: string) {
  return {
    branchId: record.branchId ?? null,
    branchName: record.branchName ?? null,
    createdAt: toIsoString(record.createdAt),
    customerId: record.customerId,
    customerName: record.customerName,
    customerPhoneNumber: record.customerPhoneNumber ?? null,
    delivery: {
      address: record.delivery?.address ?? null,
      mapPreviewLabel: record.delivery?.mapPreviewLabel ?? null,
      method: record.delivery?.method ?? 'boutique_pickup',
      note: record.delivery?.note ?? null,
    },
    franchiseId: record.franchiseId,
    id: record.id ?? fallbackId,
    paymentMethod: record.paymentMethod ?? null,
    preferredReadyDate: record.preferredReadyDate ?? null,
    productCollection: record.productCollection ?? null,
    productId: record.productId,
    productImageUrl: record.productImageUrl ?? null,
    productName: record.productName,
    productPrice: record.productPrice,
    productionNote: record.productionNote?.trim().length ? record.productionNote.trim() : null,
    productionNoteUpdatedAt: record.productionNoteUpdatedAt ? toIsoString(record.productionNoteUpdatedAt) : null,
    selectedColorId: record.selectedColorId ?? null,
    selectedColorLabel: record.selectedColorLabel ?? null,
    selectedSize: record.selectedSize ?? null,
    status: record.status,
    timeline: {
      acceptedAt: record.timeline.acceptedAt ? toIsoString(record.timeline.acceptedAt) : null,
      cancelledAt: record.timeline.cancelledAt ? toIsoString(record.timeline.cancelledAt) : null,
      deliveredAt: record.timeline.deliveredAt ? toIsoString(record.timeline.deliveredAt) : null,
      inProductionAt: record.timeline.inProductionAt ? toIsoString(record.timeline.inProductionAt) : null,
      outForDeliveryAt: record.timeline.outForDeliveryAt ? toIsoString(record.timeline.outForDeliveryAt) : null,
      placedAt: toIsoString(record.timeline.placedAt),
      readyAt: record.timeline.readyAt ? toIsoString(record.timeline.readyAt) : null,
    },
    type: record.type,
    updatedAt: toIsoString(record.updatedAt),
  } satisfies Order;
}

function subscribeToDemoOrders(filter: (order: Order) => boolean, onOrders: (orders: Order[]) => void) {
  onOrders(sortOrders(useDemoRealtimeStore.getState().orders.filter(filter)));

  return useDemoRealtimeStore.subscribe((state) => {
    onOrders(sortOrders(state.orders.filter(filter)));
  });
}

function statusMessage(status: OrderStatus) {
  if (status === 'accepted') {
    return 'Boutique confirmed your order and queued it for production.';
  }

  if (status === 'in_production') {
    return 'Your order has entered production.';
  }

  if (status === 'ready') {
    return 'Your piece is ready for delivery preparation.';
  }

  if (status === 'out_for_delivery') {
    return 'Your order is out for delivery.';
  }

  if (status === 'delivered') {
    return 'Your order has been delivered.';
  }

  if (status === 'cancelled') {
    return 'Your order was cancelled. Boutique support will follow up if needed.';
  }

  return 'Your order is placed. Boutique confirmation is in progress.';
}

function timelineUpdate(status: OrderStatus) {
  return buildTimelinePatch(status, null);
}

function buildTimelinePatch(
  status: OrderStatus,
  timeline: FirestoreOrderRecord['timeline'] | null | undefined,
) {
  const nextPatch: Record<string, ReturnType<typeof serverTimestamp>> = {};
  const hasAcceptedAt = Boolean(timeline?.acceptedAt);
  const hasCancelledAt = Boolean(timeline?.cancelledAt);
  const hasDeliveredAt = Boolean(timeline?.deliveredAt);
  const hasInProductionAt = Boolean(timeline?.inProductionAt);
  const hasOutForDeliveryAt = Boolean(timeline?.outForDeliveryAt);
  const hasReadyAt = Boolean(timeline?.readyAt);

  if (status === 'accepted' && !hasAcceptedAt) {
    nextPatch['timeline.acceptedAt'] = serverTimestamp();
  }

  if (status === 'in_production') {
    if (!hasAcceptedAt) {
      nextPatch['timeline.acceptedAt'] = serverTimestamp();
    }

    if (!hasInProductionAt) {
      nextPatch['timeline.inProductionAt'] = serverTimestamp();
    }
  }

  if (status === 'ready') {
    if (!hasAcceptedAt) {
      nextPatch['timeline.acceptedAt'] = serverTimestamp();
    }

    if (!hasInProductionAt) {
      nextPatch['timeline.inProductionAt'] = serverTimestamp();
    }

    if (!hasReadyAt) {
      nextPatch['timeline.readyAt'] = serverTimestamp();
    }
  }

  if (status === 'out_for_delivery') {
    if (!hasAcceptedAt) {
      nextPatch['timeline.acceptedAt'] = serverTimestamp();
    }

    if (!hasInProductionAt) {
      nextPatch['timeline.inProductionAt'] = serverTimestamp();
    }

    if (!hasReadyAt) {
      nextPatch['timeline.readyAt'] = serverTimestamp();
    }

    if (!hasOutForDeliveryAt) {
      nextPatch['timeline.outForDeliveryAt'] = serverTimestamp();
    }
  }

  if (status === 'delivered') {
    if (!hasAcceptedAt) {
      nextPatch['timeline.acceptedAt'] = serverTimestamp();
    }

    if (!hasInProductionAt) {
      nextPatch['timeline.inProductionAt'] = serverTimestamp();
    }

    if (!hasReadyAt) {
      nextPatch['timeline.readyAt'] = serverTimestamp();
    }

    if (!hasOutForDeliveryAt) {
      nextPatch['timeline.outForDeliveryAt'] = serverTimestamp();
    }

    if (!hasDeliveredAt) {
      nextPatch['timeline.deliveredAt'] = serverTimestamp();
    }
  }

  if (status === 'cancelled' && !hasCancelledAt) {
    nextPatch['timeline.cancelledAt'] = serverTimestamp();
  }

  return nextPatch;
}

function resolveBranchScope(input: Pick<CreateOrderInput, 'branchId' | 'branchName' | 'franchiseId'>) {
  const demoFranchisee = demoUsersByRole.franchisee;

  return {
    branchId: input.branchId ?? demoFranchisee.branchId ?? input.franchiseId,
    branchName: input.branchName ?? demoFranchisee.branchName ?? demoFranchisee.name,
  };
}

function resolveFranchiseeScope(scopeOrFranchiseId: FranchiseeOrderScope | string) {
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

function rewardPointsForOrderTotal(total: number) {
  return Math.max(40, Math.round(total / 300));
}

function getOrderMessagesCollection(orderId: string) {
  const firestore = getFirestoreInstance();

  if (!firestore) {
    return null;
  }

  return collection(doc(firestore, ORDERS_COLLECTION, orderId), ORDER_MESSAGES_SUBCOLLECTION);
}

function queueOrderCreation(
  firestore: NonNullable<ReturnType<typeof getFirestoreInstance>>,
  batch: ReturnType<typeof writeBatch>,
  orderRef: ReturnType<typeof doc>,
  input: CreateOrderInput,
) {
  const branchScope = resolveBranchScope(input);
  const supportMessage = statusMessage('placed');
  const orderMessagesCollection = collection(doc(firestore, ORDERS_COLLECTION, orderRef.id), ORDER_MESSAGES_SUBCOLLECTION);
  const messageRef = doc(orderMessagesCollection);

  batch.set(orderRef, {
    branchId: branchScope.branchId,
    branchName: branchScope.branchName,
    createdAt: serverTimestamp(),
    customerId: input.customerId,
    customerName: input.customerName,
    customerPhoneNumber: input.customerPhoneNumber ?? null,
    delivery: input.delivery,
    franchiseId: input.franchiseId,
    id: orderRef.id,
    paymentMethod: input.paymentMethod ?? null,
    preferredReadyDate: input.preferredReadyDate ?? null,
    productCollection: input.productCollection ?? null,
    productId: input.productId,
    productImageUrl: input.productImageUrl ?? null,
    productName: input.productName,
    productPrice: input.productPrice,
    productionNote: null,
    productionNoteUpdatedAt: null,
    selectedColorId: input.selectedColorId ?? null,
    selectedColorLabel: input.selectedColorLabel ?? null,
    selectedSize: input.selectedSize ?? null,
    status: 'placed' satisfies OrderStatus,
    timeline: {
      acceptedAt: null,
      cancelledAt: null,
      deliveredAt: null,
      inProductionAt: null,
      outForDeliveryAt: null,
      placedAt: serverTimestamp(),
      readyAt: null,
    },
    type: input.type,
    updatedAt: serverTimestamp(),
  });

  batch.set(doc(firestore, ORDER_CHATS_COLLECTION, orderRef.id), {
    branchId: branchScope.branchId,
    branchName: branchScope.branchName,
    customerId: input.customerId,
    customerName: input.customerName,
    customerPhoneNumber: input.customerPhoneNumber ?? null,
    franchiseId: input.franchiseId,
    id: orderRef.id,
    lastMessageAt: serverTimestamp(),
    lastMessageText: supportMessage,
    orderId: orderRef.id,
    orderStatus: 'placed',
    productName: input.productName,
    unreadCountForCustomer: 1,
    unreadCountForSupport: 0,
    updatedAt: serverTimestamp(),
  });

  batch.set(
    doc(firestore, USERS_COLLECTION, input.customerId),
    {
      displayName: input.customerName,
      phone: input.customerPhoneNumber ?? null,
      role: 'customer',
      uid: input.customerId,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  batch.set(messageRef, {
    createdAt: serverTimestamp(),
    id: messageRef.id,
    orderId: orderRef.id,
    senderId: 'avishu-support',
    senderName: 'AVISHU Care',
    senderRole: 'support',
    text: supportMessage,
  });
}

export async function createOrder(input: CreateOrderInput) {
  const firestore = getFirestoreInstance();

  if (!firestore) {
    return useDemoRealtimeStore.getState().createOrder(input).id;
  }

  const orderRef = doc(collection(firestore, ORDERS_COLLECTION));
  const batch = writeBatch(firestore);
  queueOrderCreation(firestore, batch, orderRef, input);

  await batch.commit();
  await applyCustomerLoyaltyReward(
    {
      displayName: input.customerName,
      phone: input.customerPhoneNumber ?? null,
      role: 'customer',
      uid: input.customerId,
    },
    rewardPointsForOrderTotal(input.productPrice),
  );

  return orderRef.id;
}

export async function createOrders(inputs: CreateOrderInput[]) {
  if (!inputs.length) {
    return [];
  }

  const firestore = getFirestoreInstance();

  if (!firestore) {
    return inputs.map((input) => useDemoRealtimeStore.getState().createOrder(input).id);
  }

  const batch = writeBatch(firestore);
  const orderIds: string[] = [];

  inputs.forEach((input) => {
    const orderRef = doc(collection(firestore, ORDERS_COLLECTION));
    orderIds.push(orderRef.id);
    queueOrderCreation(firestore, batch, orderRef, input);
  });

  await batch.commit();

  const seedInput = inputs[0];
  const orderTotal = inputs.reduce((sum, input) => sum + input.productPrice, 0);

  await applyCustomerLoyaltyReward(
    {
      displayName: seedInput.customerName,
      phone: seedInput.customerPhoneNumber ?? null,
      role: 'customer',
      uid: seedInput.customerId,
    },
    rewardPointsForOrderTotal(orderTotal),
  );

  return orderIds;
}

export function subscribeToCustomerOrders(customerId: string, onOrders: (orders: Order[]) => void) {
  const firestore = getFirestoreInstance();

  if (!firestore) {
    return subscribeToDemoOrders((order) => order.customerId === customerId, onOrders);
  }

  const ordersQuery = query(collection(firestore, ORDERS_COLLECTION), where('customerId', '==', customerId));

  return onSnapshot(
    ordersQuery,
    (snapshot) => {
      const orders = snapshot.docs.map((snapshotDoc) =>
        normalizeOrder(snapshotDoc.data() as FirestoreOrderRecord, snapshotDoc.id),
      );

      onOrders(sortOrders(orders));
    },
    () => {
      onOrders([]);
    },
  );
}

export function subscribeToFranchiseeOrders(
  scopeOrFranchiseId: FranchiseeOrderScope | string,
  onOrders: (orders: Order[]) => void,
) {
  const firestore = getFirestoreInstance();
  const scope = resolveFranchiseeScope(scopeOrFranchiseId);

  if (!firestore) {
    return subscribeToDemoOrders(
      (order) =>
        order.franchiseId === scope.franchiseId &&
        (!scope.branchId || !order.branchId || order.branchId === scope.branchId),
      onOrders,
    );
  }

  const ordersQuery = query(collection(firestore, ORDERS_COLLECTION), where('franchiseId', '==', scope.franchiseId));

  return onSnapshot(
    ordersQuery,
    (snapshot) => {
      const orders = snapshot.docs
        .map((snapshotDoc) => normalizeOrder(snapshotDoc.data() as FirestoreOrderRecord, snapshotDoc.id))
        .filter((order) => !scope.branchId || !order.branchId || order.branchId === scope.branchId);

      onOrders(sortOrders(orders));
    },
    () => {
      onOrders([]);
    },
  );
}

export function subscribeToProductionOrders(onOrders: (orders: Order[]) => void) {
  const firestore = getFirestoreInstance();

  if (!firestore) {
    return subscribeToDemoOrders((order) => PRODUCTION_STATUSES.includes(order.status), onOrders);
  }

  const ordersQuery = query(collection(firestore, ORDERS_COLLECTION), where('status', 'in', PRODUCTION_STATUSES));

  return onSnapshot(
    ordersQuery,
    (snapshot) => {
      const orders = snapshot.docs.map((snapshotDoc) =>
        normalizeOrder(snapshotDoc.data() as FirestoreOrderRecord, snapshotDoc.id),
      );

      onOrders(sortOrders(orders));
    },
    () => {
      onOrders([]);
    },
  );
}

export function subscribeToProductionQueue(onOrders: (orders: Order[]) => void) {
  return subscribeToProductionOrders(onOrders);
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  options?: {
    branchId?: string | null;
    branchName?: string | null;
    franchiseId?: string | null;
    senderId?: string | null;
    senderName?: string | null;
    senderRole?: 'support' | 'franchisee' | 'production';
  },
) {
  const firestore = getFirestoreInstance();

  if (!firestore) {
    useDemoRealtimeStore.getState().updateOrderStatus(orderId, status);
    return;
  }

  const orderRef = doc(firestore, ORDERS_COLLECTION, orderId);
  const orderSnapshot = await getDoc(orderRef);
  const currentOrder = orderSnapshot.exists() ? (orderSnapshot.data() as FirestoreOrderRecord) : null;
  const orderMessagesCollection = getOrderMessagesCollection(orderId);
  const messageRef = orderMessagesCollection ? doc(orderMessagesCollection) : null;
  const note = statusMessage(status);
  const batch = writeBatch(firestore);
  const senderRole = options?.senderRole ?? 'support';
  const senderName =
    options?.senderName ??
    (senderRole === 'franchisee' ? 'AVISHU Boutique' : senderRole === 'production' ? 'AVISHU Atelier' : 'AVISHU Care');
  const senderId =
    options?.senderId ??
    (senderRole === 'franchisee'
      ? 'avishu-franchisee'
      : senderRole === 'production'
        ? 'avishu-production-floor'
        : 'avishu-support');
  const orderPatch = {
    ...(options?.branchId !== undefined ? { branchId: options.branchId } : null),
    ...(options?.branchName !== undefined ? { branchName: options.branchName } : null),
    status,
    updatedAt: serverTimestamp(),
    ...buildTimelinePatch(status, currentOrder?.timeline),
  };

  batch.update(orderRef, orderPatch);

  batch.set(
    doc(firestore, ORDER_CHATS_COLLECTION, orderId),
    {
      ...(options?.branchId !== undefined ? { branchId: options.branchId } : null),
      ...(options?.branchName !== undefined ? { branchName: options.branchName } : null),
      ...(options?.franchiseId !== undefined ? { franchiseId: options.franchiseId } : null),
      id: orderId,
      orderId,
      orderStatus: status,
      lastMessageAt: serverTimestamp(),
      lastMessageText: note,
      unreadCountForCustomer: increment(1),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  if (messageRef) {
    batch.set(messageRef, {
      createdAt: serverTimestamp(),
      id: messageRef.id,
      orderId,
      senderId,
      senderName,
      senderRole,
      text: note,
    });
  }

  await batch.commit();
}

export async function updateProductionNote(orderId: string, note: string) {
  const firestore = getFirestoreInstance();
  const normalizedNote = note.trim();

  if (!firestore) {
    useDemoRealtimeStore.getState().updateProductionNote(orderId, normalizedNote);
    return;
  }

  const batch = writeBatch(firestore);

  batch.update(doc(firestore, ORDERS_COLLECTION, orderId), {
    productionNote: normalizedNote || null,
    productionNoteUpdatedAt: normalizedNote ? serverTimestamp() : null,
    updatedAt: serverTimestamp(),
  });

  await batch.commit();
}

export function getDefaultFranchiseId() {
  return demoUsersByRole.franchisee.id;
}
