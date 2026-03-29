import { collection, doc, getDocs, writeBatch } from 'firebase/firestore';

import { demoProducts, demoUsersByRole } from '@/lib/constants/demo';
import { getFirestoreInstance } from '@/lib/firebase';

const PRODUCTS_COLLECTION = 'products';
const USERS_COLLECTION = 'users';

export async function bootstrapAppData() {
  const firestore = getFirestoreInstance();

  if (!firestore) {
    return;
  }

  try {
    const [productSnapshot, userSnapshot] = await Promise.all([
      getDocs(collection(firestore, PRODUCTS_COLLECTION)),
      getDocs(collection(firestore, USERS_COLLECTION)),
    ]);

    if (!productSnapshot.empty && !userSnapshot.empty) {
      return;
    }

    const batch = writeBatch(firestore);

    if (productSnapshot.empty) {
      demoProducts.forEach((product) => {
        batch.set(doc(firestore, PRODUCTS_COLLECTION, product.id), product);
      });
    }

    if (userSnapshot.empty) {
      Object.values(demoUsersByRole).forEach((user) => {
        batch.set(doc(firestore, USERS_COLLECTION, user.id), user);
      });
    }

    await batch.commit();
  } catch {
    return;
  }
}
