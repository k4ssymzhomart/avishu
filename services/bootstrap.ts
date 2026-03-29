import { collection, doc, getDocs, writeBatch } from 'firebase/firestore';

import { demoFranchises, demoProducts, demoProductionUnits, demoUsersByRole } from '@/lib/constants/demo';
import { getFirestoreInstance } from '@/lib/firebase';

const FRANCHISES_COLLECTION = 'franchises';
const PRODUCTS_COLLECTION = 'products';
const PRODUCTION_UNITS_COLLECTION = 'production_units';
const USERS_COLLECTION = 'users';

export async function bootstrapAppData() {
  const firestore = getFirestoreInstance();

  if (!firestore) {
    return;
  }

  try {
    const [franchiseSnapshot, productSnapshot, productionUnitSnapshot, userSnapshot] = await Promise.all([
      getDocs(collection(firestore, FRANCHISES_COLLECTION)),
      getDocs(collection(firestore, PRODUCTS_COLLECTION)),
      getDocs(collection(firestore, PRODUCTION_UNITS_COLLECTION)),
      getDocs(collection(firestore, USERS_COLLECTION)),
    ]);

    const batch = writeBatch(firestore);
    let operationCount = 0;

    if (franchiseSnapshot.empty) {
      demoFranchises.forEach((franchise) => {
        batch.set(doc(firestore, FRANCHISES_COLLECTION, franchise.id), franchise);
        operationCount += 1;
      });
    }

    if (productionUnitSnapshot.empty) {
      demoProductionUnits.forEach((unit) => {
        batch.set(doc(firestore, PRODUCTION_UNITS_COLLECTION, unit.id), unit);
        operationCount += 1;
      });
    }

    if (productSnapshot.empty) {
      demoProducts.forEach((product) => {
        batch.set(doc(firestore, PRODUCTS_COLLECTION, product.id), product);
        operationCount += 1;
      });
    } else {
      productSnapshot.forEach((snapshotDoc) => {
        const data = snapshotDoc.data() as Partial<(typeof demoProducts)[number]>;

        if (Array.isArray(data.assignedBranches) && data.createdBy) {
          return;
        }

        batch.set(
          snapshotDoc.ref,
          {
            assignedBranches: Array.isArray(data.assignedBranches) ? data.assignedBranches : [],
            createdBy: data.createdBy ?? 'admin',
          },
          { merge: true },
        );
        operationCount += 1;
      });
    }

    if (userSnapshot.empty) {
      Object.values(demoUsersByRole).forEach((user) => {
        batch.set(doc(firestore, USERS_COLLECTION, user.id), user);
        operationCount += 1;
      });
    } else {
      userSnapshot.forEach((snapshotDoc) => {
        const data = snapshotDoc.data() as Partial<(typeof demoUsersByRole)[keyof typeof demoUsersByRole]>;

        if (data.role !== 'franchisee' || data.franchiseId) {
          return;
        }

        batch.set(
          snapshotDoc.ref,
          {
            franchiseId: data.linkedFranchiseIds?.[0] ?? snapshotDoc.id,
            franchiseName: data.branchName ?? data.name ?? 'AVISHU Boutique',
          },
          { merge: true },
        );
        operationCount += 1;
      });
    }

    if (!operationCount) {
      return;
    }

    await batch.commit();
  } catch {
    return;
  }
}
