import {
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

import { getFirestoreInstance } from '@/lib/firebase';

const CUSTOMER_FAVORITES_COLLECTION = 'customerFavorites';

type FirestoreFavoritesRecord = {
  productIds?: string[] | null;
};

function normalizeFavoriteIds(record: FirestoreFavoritesRecord | null | undefined) {
  if (!record?.productIds || !Array.isArray(record.productIds)) {
    return [];
  }

  return Array.from(new Set(record.productIds.filter((value): value is string => typeof value === 'string' && value.trim().length > 0)));
}

export function subscribeToCustomerFavorites(
  customerId: string,
  onFavorites: (productIds: string[]) => void,
) {
  const firestore = getFirestoreInstance();

  if (!firestore) {
    onFavorites([]);
    return () => undefined;
  }

  return onSnapshot(
    doc(firestore, CUSTOMER_FAVORITES_COLLECTION, customerId),
    (snapshot) => {
      if (!snapshot.exists()) {
        onFavorites([]);
        return;
      }

      onFavorites(normalizeFavoriteIds(snapshot.data() as FirestoreFavoritesRecord));
    },
    () => {
      onFavorites([]);
    },
  );
}

export async function persistCustomerFavorites(customerId: string, productIds: string[]) {
  const firestore = getFirestoreInstance();

  if (!firestore) {
    return;
  }

  await setDoc(
    doc(firestore, CUSTOMER_FAVORITES_COLLECTION, customerId),
    {
      customerId,
      productIds: Array.from(new Set(productIds)),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
