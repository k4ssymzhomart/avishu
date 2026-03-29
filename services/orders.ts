import {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  where,
  writeBatch,
} from 'firebase/firestore';

import { demoUsersByRole } from '@/lib/constants/demo';
import { getFirestoreInstance } from '@/lib/firebase';
import { buildLoyaltySummary, calculateOrderLoyaltyReward, isCompletedOrderStatus } from '@/lib/utils/loyalty';
import { getCachedFranchiseById, getDefaultFranchise } from '@/services/franchises';
import { getCachedProductionUnitForFranchise } from '@/services/productionUnits';
import { useDemoRealtimeStore } from '@/store/demoRealtime';
import type { CreateOrderInput, FranchiseeOrderScope, Order, OrderStatus } from '@/types/order';

const FRANCHISES_COLLECTION = 'franchises';
const ORDERS_COLLECTION = 'orders';
const ORDER_CHATS_COLLECTION = 'orderChats';
const ORDER_MESSAGES_SUBCOLLECTION = 'messages';
const PRODUCTION_UNITS_COLLECTION = 'production_units';
const USERS_COLLECTION = 'users';
const PRODUCTION_STATUSES: OrderStatus[] = ['accepted', 'in_production', 'ready'];
const FRANCHISE_ACTIVE_STATUSES: OrderStatus[] = ['placed', 'accepted', 'in_production', 'ready', 'out_for_delivery'];

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
  loyalty?: {
    awardedAt?: Timestamp | string | null;
    awardedPoints?: number | null;
    basePoints?: number | null;
    bonusPoints?: number | null;
    firstOrderBonusApplied?: boolean | null;
    preorderBonusApplied?: boolean | null;
    statusAtAward?: OrderStatus | null;
  } | null;
  paymentMethod?: Order['paymentMethod'];
  preferredReadyDate?: string | null;
  productCollection?: string | null;
  productId: string;
  productImageUrl?: string | null;
  productName: string;
  productPrice: number;
  productionUnitId?: string | null;
  productionNote?: string | null;
  productionNoteUpdatedAt?: Timestamp | string | null;
  productionUnitName?: string | null;
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

type FirestoreCustomerRecord = {
  addresses?: unknown[] | null;
  assignedFranchiseId?: string | null;
  assignedFranchiseName?: string | null;
  createdAt?: Timestamp | string | null;
  displayName?: string | null;
  loyalty?: {
    lifetimeSpent?: number | null;
    points?: number | null;
    totalOrders?: number | null;
  } | null;
  phone?: string | null;
  role?: 'customer' | 'franchisee' | 'production' | null;
  uid?: string | null;
};

type RoutingMetadata = {
  branchId: string | null;
  branchName: string | null;
  productionUnitId: string | null;
  productionUnitName: string | null;
};

type ResolvedCreateOrderInput = CreateOrderInput & RoutingMetadata;

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
    loyalty: record.loyalty
      ? {
          awardedAt: record.loyalty.awardedAt ? toIsoString(record.loyalty.awardedAt) : null,
          awardedPoints: Math.max(0, Math.round(record.loyalty.awardedPoints ?? 0)),
          basePoints: Math.max(0, Math.round(record.loyalty.basePoints ?? 0)),
          bonusPoints: Math.max(0, Math.round(record.loyalty.bonusPoints ?? 0)),
          firstOrderBonusApplied: !!record.loyalty.firstOrderBonusApplied,
          preorderBonusApplied: !!record.loyalty.preorderBonusApplied,
          statusAtAward: record.loyalty.statusAtAward ?? record.status,
        }
      : null,
    paymentMethod: record.paymentMethod ?? null,
    preferredReadyDate: record.preferredReadyDate ?? null,
    productCollection: record.productCollection ?? null,
    productId: record.productId,
    productImageUrl: record.productImageUrl ?? null,
    productName: record.productName,
    productPrice: record.productPrice,
    productionUnitId: record.productionUnitId ?? null,
    productionNote: record.productionNote?.trim().length ? record.productionNote.trim() : null,
    productionNoteUpdatedAt: record.productionNoteUpdatedAt ? toIsoString(record.productionNoteUpdatedAt) : null,
    productionUnitName: record.productionUnitName ?? null,
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

function isFranchiseActiveStatus(status: OrderStatus) {
  return FRANCHISE_ACTIVE_STATUSES.includes(status);
}

function isProductionActiveStatus(status: OrderStatus) {
  return PRODUCTION_STATUSES.includes(status);
}

function statusMessage(
  status: OrderStatus,
  senderRole: 'customer' | 'support' | 'franchisee' | 'production' = 'support',
) {
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
    return senderRole === 'customer'
      ? 'The customer cancelled this order. Boutique support can follow up in chat if needed.'
      : 'Your order was cancelled. Boutique support will follow up if needed.';
  }

  return 'Your order is placed. Boutique confirmation is in progress.';
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
  const cachedFranchise = getCachedFranchiseById(input.franchiseId);

  return {
    branchId: input.branchId ?? cachedFranchise?.id ?? demoFranchisee.branchId ?? input.franchiseId,
    branchName: input.branchName ?? cachedFranchise?.name ?? demoFranchisee.branchName ?? demoFranchisee.name,
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

function getOrderMessagesCollection(orderId: string) {
  const firestore = getFirestoreInstance();

  if (!firestore) {
    return null;
  }

  return collection(doc(firestore, ORDERS_COLLECTION, orderId), ORDER_MESSAGES_SUBCOLLECTION);
}

async function resolveRoutingMetadata(
  firestore: NonNullable<ReturnType<typeof getFirestoreInstance>> | null,
  input: CreateOrderInput,
): Promise<RoutingMetadata> {
  const branchScope = resolveBranchScope(input);
  let branchName = branchScope.branchName;
  let productionUnitId = input.productionUnitId ?? null;
  let productionUnitName = input.productionUnitName ?? null;

  const cachedFranchise = getCachedFranchiseById(input.franchiseId);
  const cachedProductionUnit = getCachedProductionUnitForFranchise(input.franchiseId);

  branchName = branchName ?? cachedFranchise?.name ?? null;
  productionUnitId = productionUnitId ?? cachedProductionUnit?.id ?? demoUsersByRole.production.productionUnitId ?? null;
  productionUnitName =
    productionUnitName ?? cachedProductionUnit?.name ?? demoUsersByRole.production.productionUnitName ?? null;

  if (!firestore) {
    return {
      branchId: branchScope.branchId ?? input.franchiseId,
      branchName,
      productionUnitId,
      productionUnitName,
    };
  }

  if (!branchName || !productionUnitId || !productionUnitName) {
    const franchiseSnapshot = await getDoc(doc(firestore, FRANCHISES_COLLECTION, input.franchiseId));

    if (franchiseSnapshot.exists()) {
      const franchiseData = franchiseSnapshot.data() as {
        id?: string | null;
        name?: string | null;
        productionLinked?: string[] | null;
      };

      branchName = branchName ?? franchiseData.name ?? branchScope.branchName ?? null;

      if (!productionUnitId) {
        productionUnitId = franchiseData.productionLinked?.find(Boolean) ?? null;
      }
    }
  }

  if (!productionUnitId && firestore) {
    const unitSnapshot = await getDocs(
      query(collection(firestore, PRODUCTION_UNITS_COLLECTION), where('linkedFranchises', 'array-contains', input.franchiseId), limit(1)),
    );

    if (!unitSnapshot.empty) {
      const unitDoc = unitSnapshot.docs[0];
      const unitData = unitDoc.data() as { name?: string | null };

      productionUnitId = unitDoc.id;
      productionUnitName = productionUnitName ?? unitData.name ?? null;
    }
  } else if (productionUnitId && !productionUnitName) {
    const unitSnapshot = await getDoc(doc(firestore, PRODUCTION_UNITS_COLLECTION, productionUnitId));

    if (unitSnapshot.exists()) {
      const unitData = unitSnapshot.data() as { name?: string | null };
      productionUnitName = unitData.name ?? null;
    }
  }

  return {
    branchId: branchScope.branchId ?? input.franchiseId,
    branchName: branchName ?? branchScope.branchName ?? null,
    productionUnitId,
    productionUnitName,
  };
}

function queueOrderCreation(
  firestore: NonNullable<ReturnType<typeof getFirestoreInstance>>,
  batch: ReturnType<typeof writeBatch>,
  orderRef: ReturnType<typeof doc>,
  input: ResolvedCreateOrderInput,
) {
  const supportMessage = statusMessage('placed');
  const orderMessagesCollection = collection(doc(firestore, ORDERS_COLLECTION, orderRef.id), ORDER_MESSAGES_SUBCOLLECTION);
  const messageRef = doc(orderMessagesCollection);

  batch.set(orderRef, {
    branchId: input.branchId,
    branchName: input.branchName,
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
    productionUnitId: input.productionUnitId ?? null,
    productionNote: null,
    productionNoteUpdatedAt: null,
    productionUnitName: input.productionUnitName ?? null,
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
    branchId: input.branchId,
    branchName: input.branchName,
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
      assignedFranchiseId: input.franchiseId,
      assignedFranchiseName: input.branchName ?? null,
      phone: input.customerPhoneNumber ?? null,
      role: 'customer',
      uid: input.customerId,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  batch.set(
    doc(firestore, FRANCHISES_COLLECTION, input.franchiseId),
    {
      activeOrdersCount: increment(1),
      id: input.franchiseId,
      name: input.branchName ?? 'AVISHU Boutique',
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
    const routing = await resolveRoutingMetadata(null, input);
    return useDemoRealtimeStore.getState().createOrder({ ...input, ...routing }).id;
  }

  const resolvedInput = {
    ...input,
    ...(await resolveRoutingMetadata(firestore, input)),
  } satisfies ResolvedCreateOrderInput;
  const orderRef = doc(collection(firestore, ORDERS_COLLECTION));
  const batch = writeBatch(firestore);
  queueOrderCreation(firestore, batch, orderRef, resolvedInput);

  await batch.commit();

  return orderRef.id;
}

export async function createOrders(inputs: CreateOrderInput[]) {
  if (!inputs.length) {
    return [];
  }

  const firestore = getFirestoreInstance();

  if (!firestore) {
    const resolvedInputs = await Promise.all(
      inputs.map(async (input) => {
        return {
          ...input,
          ...(await resolveRoutingMetadata(null, input)),
        } satisfies ResolvedCreateOrderInput;
      }),
    );
    return resolvedInputs.map((input) => useDemoRealtimeStore.getState().createOrder(input).id);
  }

  const resolvedInputs = await Promise.all(
    inputs.map(async (input) => {
      return {
        ...input,
        ...(await resolveRoutingMetadata(firestore, input)),
      } satisfies ResolvedCreateOrderInput;
    }),
  );
  const batch = writeBatch(firestore);
  const orderIds: string[] = [];

  resolvedInputs.forEach((input) => {
    const orderRef = doc(collection(firestore, ORDERS_COLLECTION));
    orderIds.push(orderRef.id);
    queueOrderCreation(firestore, batch, orderRef, input);
  });

  await batch.commit();

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
    productionUnitId?: string | null;
    productionUnitName?: string | null;
    senderId?: string | null;
    senderName?: string | null;
    senderRole?: 'customer' | 'support' | 'franchisee' | 'production';
  },
) {
  const firestore = getFirestoreInstance();

  if (!firestore) {
    useDemoRealtimeStore.getState().updateOrderStatus(orderId, status, options);
    return;
  }

  const orderRef = doc(firestore, ORDERS_COLLECTION, orderId);
  const orderMessagesCollection = getOrderMessagesCollection(orderId);
  const messageRef = orderMessagesCollection ? doc(orderMessagesCollection) : null;
  const senderRole = options?.senderRole ?? 'support';
  const note = statusMessage(status, senderRole);
  const senderName =
    options?.senderName ??
    (senderRole === 'franchisee'
      ? 'AVISHU Boutique'
      : senderRole === 'production'
        ? 'AVISHU Atelier'
        : senderRole === 'customer'
          ? 'Customer'
          : 'AVISHU Care');
  const senderId =
    options?.senderId ??
    (senderRole === 'franchisee'
      ? 'avishu-franchisee'
      : senderRole === 'production'
        ? 'avishu-production-floor'
        : senderRole === 'customer'
          ? 'avishu-customer'
          : 'avishu-support');

  await runTransaction(firestore, async (transaction) => {
    const orderSnapshot = await transaction.get(orderRef);

    if (!orderSnapshot.exists()) {
      throw new Error('ORDER_NOT_FOUND');
    }

    const currentOrder = orderSnapshot.data() as FirestoreOrderRecord;
    const resolvedFranchiseId = options?.franchiseId ?? currentOrder.franchiseId;
    const resolvedProductionUnitId =
      options?.productionUnitId ??
      currentOrder.productionUnitId ??
      getCachedProductionUnitForFranchise(resolvedFranchiseId)?.id ??
      null;
    const resolvedProductionUnitName =
      options?.productionUnitName ??
      currentOrder.productionUnitName ??
      (resolvedProductionUnitId ? getCachedProductionUnitForFranchise(resolvedFranchiseId)?.name ?? null : null);
    const previousFranchiseActive = isFranchiseActiveStatus(currentOrder.status);
    const nextFranchiseActive = isFranchiseActiveStatus(status);
    const previousProductionActive = isProductionActiveStatus(currentOrder.status);
    const nextProductionActive = isProductionActiveStatus(status);
    const needsFranchiseCounterChange =
      currentOrder.status !== status && previousFranchiseActive !== nextFranchiseActive;
    const franchiseRef = needsFranchiseCounterChange ? doc(firestore, FRANCHISES_COLLECTION, resolvedFranchiseId) : null;
    const franchiseSnapshot = franchiseRef && needsFranchiseCounterChange ? await transaction.get(franchiseRef) : null;
    const needsProductionCounterChange =
      Boolean(resolvedProductionUnitId) &&
      currentOrder.status !== status &&
      previousProductionActive !== nextProductionActive;
    const productionUnitRef =
      resolvedProductionUnitId && needsProductionCounterChange
        ? doc(firestore, PRODUCTION_UNITS_COLLECTION, resolvedProductionUnitId)
        : null;
    const productionUnitSnapshot =
      productionUnitRef && needsProductionCounterChange ? await transaction.get(productionUnitRef) : null;
    const orderPatch: Record<string, unknown> = {
      ...(options?.branchId !== undefined ? { branchId: options.branchId } : {}),
      ...(options?.branchName !== undefined ? { branchName: options.branchName } : {}),
      ...(resolvedProductionUnitId ? { productionUnitId: resolvedProductionUnitId } : {}),
      ...(resolvedProductionUnitName ? { productionUnitName: resolvedProductionUnitName } : {}),
      status,
      updatedAt: serverTimestamp(),
      ...buildTimelinePatch(status, currentOrder.timeline),
    };

    if (isCompletedOrderStatus(status) && !currentOrder.loyalty?.awardedAt) {
      const profileRef = doc(firestore, USERS_COLLECTION, currentOrder.customerId);
      const profileSnapshot = await transaction.get(profileRef);
      const currentProfile = profileSnapshot.exists() ? (profileSnapshot.data() as FirestoreCustomerRecord) : null;
      const currentPoints = Math.max(0, Math.round(currentProfile?.loyalty?.points ?? 0));
      const currentLifetimeSpent = Math.max(0, Math.round(currentProfile?.loyalty?.lifetimeSpent ?? 0));
      const currentTotalOrders = Math.max(0, Math.round(currentProfile?.loyalty?.totalOrders ?? 0));
      const reward = calculateOrderLoyaltyReward({
        amountKzt: currentOrder.productPrice,
        completedOrdersBefore: currentTotalOrders,
        type: currentOrder.type,
      });
      const nextLoyalty = buildLoyaltySummary({
        lifetimeSpent: currentLifetimeSpent + currentOrder.productPrice,
        points: currentPoints + reward.awardedPoints,
        totalOrders: currentTotalOrders + 1,
      });
      const profileDisplayName =
        currentProfile?.displayName?.trim().length ? currentProfile.displayName.trim() : currentOrder.customerName;

      transaction.set(
        profileRef,
        {
          ...(profileSnapshot.exists()
            ? {}
            : {
                addresses: Array.isArray(currentProfile?.addresses) ? currentProfile.addresses : [],
                createdAt: serverTimestamp(),
              }),
          displayName: profileDisplayName || 'AVISHU Client',
          loyalty: nextLoyalty,
          phone: currentProfile?.phone ?? currentOrder.customerPhoneNumber ?? null,
          role: currentProfile?.role ?? 'customer',
          uid: currentOrder.customerId,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      orderPatch.loyalty = {
        awardedAt: serverTimestamp(),
        awardedPoints: reward.awardedPoints,
        basePoints: reward.basePoints,
        bonusPoints: reward.bonusPoints,
        firstOrderBonusApplied: reward.firstOrderBonusApplied,
        preorderBonusApplied: reward.preorderBonusApplied,
        statusAtAward: status,
      };
    }

    if (resolvedFranchiseId && franchiseRef && franchiseSnapshot && needsFranchiseCounterChange) {
      const currentActiveOrdersCount = Math.max(
        0,
        Math.round((franchiseSnapshot.exists() ? franchiseSnapshot.data()?.activeOrdersCount : 0) ?? 0),
      );
      const nextActiveOrdersCount = Math.max(0, currentActiveOrdersCount + (nextFranchiseActive ? 1 : -1));

      transaction.set(
        franchiseRef,
        {
          activeOrdersCount: nextActiveOrdersCount,
          id: resolvedFranchiseId,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    }

    if (resolvedProductionUnitId && productionUnitRef && productionUnitSnapshot && needsProductionCounterChange) {
      const currentActiveTasks = Math.max(
        0,
        Math.round((productionUnitSnapshot.exists() ? productionUnitSnapshot.data()?.activeTasks : 0) ?? 0),
      );
      const nextActiveTasks = Math.max(0, currentActiveTasks + (nextProductionActive ? 1 : -1));

      transaction.set(
        productionUnitRef,
        {
          activeTasks: nextActiveTasks,
          id: resolvedProductionUnitId,
          status: nextActiveTasks > 0 ? 'busy' : 'active',
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    }

    transaction.update(orderRef, orderPatch);

    transaction.set(
      doc(firestore, ORDER_CHATS_COLLECTION, orderId),
      {
        ...(options?.branchId !== undefined ? { branchId: options.branchId } : {}),
        ...(options?.branchName !== undefined ? { branchName: options.branchName } : {}),
        ...(options?.franchiseId !== undefined ? { franchiseId: options.franchiseId } : {}),
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
      transaction.set(messageRef, {
        createdAt: serverTimestamp(),
        id: messageRef.id,
        orderId,
        senderId,
        senderName,
        senderRole,
        text: note,
      });
    }
  });
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
  return getDefaultFranchise()?.id ?? demoUsersByRole.franchisee.id;
}
