import {
  Timestamp,
  collection,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

import { demoFranchises } from '@/lib/constants/demo';
import { getFirestoreInstance } from '@/lib/firebase';
import type { Franchise, FranchiseDraft } from '@/types/franchise';

const FRANCHISES_COLLECTION = 'franchises';

type FirestoreFranchiseRecord = {
  activeOrdersCount?: number | null;
  address?: string | null;
  createdAt?: Timestamp | string | null;
  id?: string | null;
  location?: string | null;
  managerName?: string | null;
  name?: string | null;
  phone?: string | null;
  productionLinked?: string[] | null;
};

const franchiseListeners = new Set<(franchises: Franchise[]) => void>();
let franchiseListCache: Franchise[] | null = null;
let franchiseListUnsubscribe: (() => void) | null = null;

function toIsoString(value: Timestamp | string | null | undefined) {
  if (!value) {
    return new Date().toISOString();
  }

  if (typeof value === 'string') {
    return value;
  }

  return value.toDate().toISOString();
}

function sortFranchises(franchises: Franchise[]) {
  return [...franchises].sort((left, right) => left.name.localeCompare(right.name, 'ru'));
}

function normalizeFranchise(record: FirestoreFranchiseRecord, fallbackId: string): Franchise {
  return {
    activeOrdersCount: Math.max(0, Math.round(record.activeOrdersCount ?? 0)),
    address: record.address?.trim().length ? record.address.trim() : 'Address pending',
    createdAt: toIsoString(record.createdAt),
    id: record.id?.trim().length ? record.id.trim() : fallbackId,
    location: record.location?.trim().length ? record.location.trim() : 'Location pending',
    managerName: record.managerName?.trim().length ? record.managerName.trim() : 'Manager pending',
    name: record.name?.trim().length ? record.name.trim() : 'AVISHU Franchise',
    phone: record.phone?.trim().length ? record.phone.trim() : 'Phone pending',
    productionLinked: Array.isArray(record.productionLinked) ? record.productionLinked.filter(Boolean) : [],
  };
}

function emitFranchises(franchises: Franchise[]) {
  franchiseListCache = sortFranchises(franchises);
  franchiseListeners.forEach((listener) => listener(franchiseListCache ?? []));
}

function startFranchiseListSubscription() {
  if (franchiseListUnsubscribe) {
    return;
  }

  const firestore = getFirestoreInstance();

  if (!firestore) {
    return;
  }

  franchiseListUnsubscribe = onSnapshot(
    collection(firestore, FRANCHISES_COLLECTION),
    (snapshot) => {
      emitFranchises(snapshot.docs.map((snapshotDoc) => normalizeFranchise(snapshotDoc.data(), snapshotDoc.id)));
    },
    () => {
      emitFranchises([]);
    },
  );
}

export function getCachedFranchises() {
  return franchiseListCache;
}

export function getCachedFranchiseById(franchiseId: string | null | undefined) {
  if (!franchiseId) {
    return null;
  }

  if (franchiseListCache?.length) {
    return franchiseListCache.find((franchise) => franchise.id === franchiseId) ?? null;
  }

  return demoFranchises.find((franchise) => franchise.id === franchiseId) ?? null;
}

export function getDefaultFranchise() {
  return (franchiseListCache ?? demoFranchises)[0] ?? null;
}

export function subscribeToFranchises(onFranchises: (franchises: Franchise[]) => void) {
  const firestore = getFirestoreInstance();

  if (!firestore) {
    onFranchises(sortFranchises(demoFranchises));
    return () => undefined;
  }

  if (franchiseListCache) {
    onFranchises(franchiseListCache);
  }

  franchiseListeners.add(onFranchises);
  startFranchiseListSubscription();

  return () => {
    franchiseListeners.delete(onFranchises);

    if (!franchiseListeners.size && franchiseListUnsubscribe) {
      franchiseListUnsubscribe();
      franchiseListUnsubscribe = null;
    }
  };
}

export function subscribeToFranchise(franchiseId: string, onFranchise: (franchise: Franchise | null) => void) {
  const cachedFranchise = getCachedFranchiseById(franchiseId);
  const firestore = getFirestoreInstance();

  if (cachedFranchise) {
    onFranchise(cachedFranchise);
  }

  if (!firestore) {
    onFranchise(cachedFranchise);
    return () => undefined;
  }

  return onSnapshot(
    doc(firestore, FRANCHISES_COLLECTION, franchiseId),
    (snapshot) => {
      if (!snapshot.exists()) {
        onFranchise(null);
        return;
      }

      const franchise = normalizeFranchise(snapshot.data(), snapshot.id);

      if (franchiseListCache?.length) {
        const nextFranchises = [...franchiseListCache];
        const franchiseIndex = nextFranchises.findIndex((entry) => entry.id === franchise.id);

        if (franchiseIndex === -1) {
          nextFranchises.push(franchise);
        } else {
          nextFranchises[franchiseIndex] = franchise;
        }

        franchiseListCache = sortFranchises(nextFranchises);
      }

      onFranchise(franchise);
    },
    () => {
      onFranchise(cachedFranchise);
    },
  );
}

export async function getFranchiseById(franchiseId: string) {
  const cachedFranchise = getCachedFranchiseById(franchiseId);
  const firestore = getFirestoreInstance();

  if (cachedFranchise || !firestore) {
    return cachedFranchise;
  }

  const snapshot = await getDoc(doc(firestore, FRANCHISES_COLLECTION, franchiseId));

  if (!snapshot.exists()) {
    return null;
  }

  return normalizeFranchise(snapshot.data(), snapshot.id);
}

export async function upsertFranchise(input: FranchiseDraft) {
  const firestore = getFirestoreInstance();

  if (!firestore) {
    return input.id?.trim().length ? input.id.trim() : `franchise-${Date.now().toString(36)}`;
  }

  const franchiseId = input.id?.trim().length ? input.id.trim() : doc(collection(firestore, FRANCHISES_COLLECTION)).id;

  const franchiseRef = doc(firestore, FRANCHISES_COLLECTION, franchiseId);
  const existingSnapshot = await getDoc(franchiseRef);
  const existingData = existingSnapshot.exists() ? (existingSnapshot.data() as FirestoreFranchiseRecord) : null;

  await setDoc(
    franchiseRef,
    {
      activeOrdersCount: existingData?.activeOrdersCount ?? 0,
      address: input.address.trim() || 'Address pending',
      createdAt: existingData?.createdAt ?? serverTimestamp(),
      id: franchiseId,
      location: input.location.trim() || 'Location pending',
      managerName: input.managerName.trim() || 'Manager pending',
      name: input.name.trim() || 'AVISHU Franchise',
      phone: input.phone.trim() || 'Phone pending',
      productionLinked: input.productionLinked.filter(Boolean),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  return franchiseId;
}
