import {
  Timestamp,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

import { getFirestoreInstance } from '@/lib/firebase';
import type { CartItem } from '@/types/cart';

const CUSTOMER_CARTS_COLLECTION = 'customerCarts';

type FirestoreCartRecord = {
  customerId?: string | null;
  items?: CartItem[] | null;
  updatedAt?: Timestamp | string | null;
};

function normalizeCartItem(item: CartItem, index: number): CartItem {
  return {
    addedAt: item.addedAt ?? new Date().toISOString(),
    availability: item.availability,
    colorId: item.colorId ?? null,
    colorLabel: item.colorLabel ?? null,
    id: item.id?.trim().length ? item.id : `cart-item-${index + 1}`,
    imageUrl: item.imageUrl,
    preferredReadyDate: item.preferredReadyDate ?? null,
    price: item.price,
    productCollection: item.productCollection ?? null,
    productId: item.productId,
    productName: item.productName,
    quantity: Math.max(1, item.quantity ?? 1),
    size: item.size,
  };
}

function normalizeCartItems(record: FirestoreCartRecord | null | undefined) {
  if (!record?.items || !Array.isArray(record.items)) {
    return [];
  }

  return record.items.map((item, index) => normalizeCartItem(item, index));
}

export function subscribeToCustomerCart(
  customerId: string,
  onCartItems: (items: CartItem[]) => void,
) {
  const firestore = getFirestoreInstance();

  if (!firestore) {
    onCartItems([]);
    return () => undefined;
  }

  const cartRef = doc(firestore, CUSTOMER_CARTS_COLLECTION, customerId);

  return onSnapshot(
    cartRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        onCartItems([]);
        return;
      }

      onCartItems(normalizeCartItems(snapshot.data() as FirestoreCartRecord));
    },
    () => {
      onCartItems([]);
    },
  );
}

export async function persistCustomerCart(customerId: string, items: CartItem[]) {
  const firestore = getFirestoreInstance();

  if (!firestore) {
    return;
  }

  await setDoc(
    doc(firestore, CUSTOMER_CARTS_COLLECTION, customerId),
    {
      customerId,
      items: items.map((item, index) => normalizeCartItem(item, index)),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
