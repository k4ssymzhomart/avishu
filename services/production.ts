import {
  Timestamp,
  collection,
  documentId,
  getDocs,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';

import { demoProducts } from '@/lib/constants/demo';
import { getFirestoreInstance } from '@/lib/firebase';
import { updateOrderStatus, updateProductionNote } from '@/services/orders';
import { useDemoRealtimeStore } from '@/store/demoRealtime';
import type { Order } from '@/types/order';
import type { User } from '@/types/user';

const ORDERS_COLLECTION = 'orders';
const PRODUCTS_COLLECTION = 'products';
const PRODUCTION_STATUSES: Order['status'][] = ['accepted', 'in_production', 'ready'];

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
  productionUnitId?: string | null;
  productionNote?: string | null;
  productionNoteUpdatedAt?: Timestamp | string | null;
  productionUnitName?: string | null;
  selectedColorId?: string | null;
  selectedColorLabel?: string | null;
  selectedSize?: string | null;
  status: Order['status'];
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

type ProductPreview = {
  collection?: string | null;
  imageUrl?: string | null;
  name?: string | null;
};

export type ProductionUserContext = User & {
  linkedFranchiseIds: string[];
  productionUnitId: string | null;
  productionUnitName: string | null;
};

const productPreviewCache = new Map<string, ProductPreview>();
const productionOrdersCache = new Map<string, Order[]>();

function toIsoString(value: Timestamp | string | null | undefined) {
  if (!value) {
    return new Date().toISOString();
  }

  if (typeof value === 'string') {
    return value;
  }

  return value.toDate().toISOString();
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

function sortOrders(orders: Order[]) {
  return [...orders].sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt));
}

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

function applyProductPreview(order: Order) {
  const preview = productPreviewCache.get(order.productId);

  return {
    ...order,
    productCollection: order.productCollection ?? preview?.collection ?? null,
    productImageUrl: order.productImageUrl ?? preview?.imageUrl ?? null,
    productName: order.productName || preview?.name || order.productName,
  } satisfies Order;
}

async function hydrateProductPreviews(orders: Order[]) {
  const firestore = getFirestoreInstance();
  const missingIds = [...new Set(orders.filter((order) => !order.productImageUrl).map((order) => order.productId))].filter(
    (productId) => !productPreviewCache.has(productId),
  );

  if (!missingIds.length) {
    return;
  }

  if (!firestore) {
    demoProducts.forEach((product) => {
      productPreviewCache.set(product.id, {
        collection: product.collection ?? null,
        imageUrl: product.imageUrl ?? null,
        name: product.name,
      });
    });
    return;
  }

  const productSnapshots = await Promise.all(
    chunk(missingIds, 10).map((productIds) =>
      getDocs(query(collection(firestore, PRODUCTS_COLLECTION), where(documentId(), 'in', productIds))),
    ),
  );

  productSnapshots.forEach((snapshot) => {
    snapshot.forEach((snapshotDoc) => {
      const data = snapshotDoc.data() as ProductPreview;

      productPreviewCache.set(snapshotDoc.id, {
        collection: data.collection ?? null,
        imageUrl: data.imageUrl ?? null,
        name: data.name ?? null,
      });
    });
  });
}

async function hydrateOrders(orders: Order[]) {
  await hydrateProductPreviews(orders);
  return orders.map(applyProductPreview);
}

function filterRelevantProductionOrders(orders: Order[], context: ProductionUserContext) {
  if (context.productionUnitId) {
    return orders.filter(
      (order) => PRODUCTION_STATUSES.includes(order.status) && order.productionUnitId === context.productionUnitId,
    );
  }

  if (!context.linkedFranchiseIds.length) {
    return orders.filter((order) => PRODUCTION_STATUSES.includes(order.status));
  }

  return orders.filter(
    (order) =>
      PRODUCTION_STATUSES.includes(order.status) && context.linkedFranchiseIds.includes(order.franchiseId),
  );
}

export function getProductionBoardCacheKey(context: ProductionUserContext) {
  const franchiseScope = context.linkedFranchiseIds.length ? context.linkedFranchiseIds.join(',') : 'all';
  return `production:${context.productionUnitId ?? context.id}:${franchiseScope}`;
}

export function getCachedProductionOrders(cacheKey: string | null) {
  if (!cacheKey) {
    return null;
  }

  return productionOrdersCache.get(cacheKey) ?? null;
}

export function setCachedProductionOrders(cacheKey: string | null, orders: Order[]) {
  if (!cacheKey) {
    return;
  }

  productionOrdersCache.set(cacheKey, orders);
}

function subscribeToDemoProductionOrders(
  context: ProductionUserContext,
  cacheKey: string,
  onOrders: (orders: Order[]) => void,
) {
  const emit = async (orders: Order[]) => {
    const relevantOrders = filterRelevantProductionOrders(orders, context);
    const nextOrders = await hydrateOrders(sortOrders(relevantOrders));

    productionOrdersCache.set(cacheKey, nextOrders);
    onOrders(nextOrders);
  };

  void emit(useDemoRealtimeStore.getState().orders);

  return useDemoRealtimeStore.subscribe((state) => {
    void emit(state.orders);
  });
}

export function subscribeToProductionOrders(
  context: ProductionUserContext,
  onOrders: (orders: Order[]) => void,
) {
  const cacheKey = getProductionBoardCacheKey(context);
  const cachedOrders = productionOrdersCache.get(cacheKey);

  if (cachedOrders) {
    onOrders(cachedOrders);
  }

  const firestore = getFirestoreInstance();

  if (!firestore) {
    return subscribeToDemoProductionOrders(context, cacheKey, onOrders);
  }

  const ordersQuery = context.productionUnitId
    ? query(collection(firestore, ORDERS_COLLECTION), where('productionUnitId', '==', context.productionUnitId))
    : query(collection(firestore, ORDERS_COLLECTION), where('status', 'in', PRODUCTION_STATUSES));

  return onSnapshot(
    ordersQuery,
    async (snapshot) => {
      const orders = snapshot.docs.map((snapshotDoc) =>
        normalizeOrder(snapshotDoc.data() as FirestoreOrderRecord, snapshotDoc.id),
      );
      const nextOrders = await hydrateOrders(sortOrders(filterRelevantProductionOrders(orders, context)));

      productionOrdersCache.set(cacheKey, nextOrders);
      onOrders(nextOrders);
    },
    () => {
      productionOrdersCache.set(cacheKey, []);
      onOrders([]);
    },
  );
}

export async function startProductionTask(orderId: string) {
  await updateOrderStatus(orderId, 'in_production', {
    senderId: 'avishu-production-floor',
    senderName: 'AVISHU Atelier',
    senderRole: 'production',
  });
}

export async function completeProductionTask(orderId: string) {
  await updateOrderStatus(orderId, 'ready', {
    senderId: 'avishu-production-floor',
    senderName: 'AVISHU Atelier',
    senderRole: 'production',
  });
}

export async function saveProductionTaskNote(orderId: string, note: string) {
  await updateProductionNote(orderId, note);
}
