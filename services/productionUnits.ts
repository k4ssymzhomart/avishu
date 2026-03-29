import { collection, doc, getDoc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';

import { demoProductionUnits } from '@/lib/constants/demo';
import { getFirestoreInstance } from '@/lib/firebase';
import type { ProductionUnit, ProductionUnitDraft } from '@/types/productionUnit';

const PRODUCTION_UNITS_COLLECTION = 'production_units';

type FirestoreProductionUnitRecord = {
  activeTasks?: number | null;
  capacity?: number | null;
  id?: string | null;
  linkedFranchises?: string[] | null;
  location?: string | null;
  name?: string | null;
  status?: ProductionUnit['status'] | null;
  workersCount?: number | null;
};

const productionUnitListeners = new Set<(units: ProductionUnit[]) => void>();
let productionUnitListCache: ProductionUnit[] | null = null;
let productionUnitListUnsubscribe: (() => void) | null = null;

function sortProductionUnits(units: ProductionUnit[]) {
  return [...units].sort((left, right) => left.name.localeCompare(right.name, 'ru'));
}

function normalizeProductionUnit(
  record: FirestoreProductionUnitRecord,
  fallbackId: string,
): ProductionUnit {
  return {
    activeTasks: Math.max(0, Math.round(record.activeTasks ?? 0)),
    capacity: typeof record.capacity === 'number' ? Math.max(0, Math.round(record.capacity)) : null,
    id: record.id?.trim().length ? record.id.trim() : fallbackId,
    linkedFranchises: Array.isArray(record.linkedFranchises) ? record.linkedFranchises.filter(Boolean) : [],
    location: record.location?.trim().length ? record.location.trim() : 'Location pending',
    name: record.name?.trim().length ? record.name.trim() : 'AVISHU Production Unit',
    status: record.status === 'busy' ? 'busy' : 'active',
    workersCount: Math.max(0, Math.round(record.workersCount ?? 0)),
  };
}

function emitProductionUnits(units: ProductionUnit[]) {
  productionUnitListCache = sortProductionUnits(units);
  productionUnitListeners.forEach((listener) => listener(productionUnitListCache ?? []));
}

function startProductionUnitListSubscription() {
  if (productionUnitListUnsubscribe) {
    return;
  }

  const firestore = getFirestoreInstance();

  if (!firestore) {
    return;
  }

  productionUnitListUnsubscribe = onSnapshot(
    collection(firestore, PRODUCTION_UNITS_COLLECTION),
    (snapshot) => {
      emitProductionUnits(snapshot.docs.map((snapshotDoc) => normalizeProductionUnit(snapshotDoc.data(), snapshotDoc.id)));
    },
    () => {
      emitProductionUnits([]);
    },
  );
}

export function getCachedProductionUnits() {
  return productionUnitListCache;
}

export function getCachedProductionUnitById(unitId: string | null | undefined) {
  if (!unitId) {
    return null;
  }

  if (productionUnitListCache?.length) {
    return productionUnitListCache.find((unit) => unit.id === unitId) ?? null;
  }

  return demoProductionUnits.find((unit) => unit.id === unitId) ?? null;
}

export function getCachedProductionUnitForFranchise(franchiseId: string | null | undefined) {
  if (!franchiseId) {
    return null;
  }

  const units = productionUnitListCache ?? demoProductionUnits;
  return units.find((unit) => unit.linkedFranchises.includes(franchiseId)) ?? null;
}

export function subscribeToProductionUnits(onUnits: (units: ProductionUnit[]) => void) {
  const firestore = getFirestoreInstance();

  if (!firestore) {
    onUnits(sortProductionUnits(demoProductionUnits));
    return () => undefined;
  }

  if (productionUnitListCache) {
    onUnits(productionUnitListCache);
  }

  productionUnitListeners.add(onUnits);
  startProductionUnitListSubscription();

  return () => {
    productionUnitListeners.delete(onUnits);

    if (!productionUnitListeners.size && productionUnitListUnsubscribe) {
      productionUnitListUnsubscribe();
      productionUnitListUnsubscribe = null;
    }
  };
}

export async function getProductionUnitById(unitId: string) {
  const cachedUnit = getCachedProductionUnitById(unitId);
  const firestore = getFirestoreInstance();

  if (cachedUnit || !firestore) {
    return cachedUnit;
  }

  const snapshot = await getDoc(doc(firestore, PRODUCTION_UNITS_COLLECTION, unitId));

  if (!snapshot.exists()) {
    return null;
  }

  return normalizeProductionUnit(snapshot.data(), snapshot.id);
}

export async function upsertProductionUnit(input: ProductionUnitDraft) {
  const firestore = getFirestoreInstance();

  if (!firestore) {
    return input.id?.trim().length ? input.id.trim() : `unit-${Date.now().toString(36)}`;
  }

  const unitId = input.id?.trim().length ? input.id.trim() : doc(collection(firestore, PRODUCTION_UNITS_COLLECTION)).id;

  const unitRef = doc(firestore, PRODUCTION_UNITS_COLLECTION, unitId);
  const existingSnapshot = await getDoc(unitRef);
  const existingData = existingSnapshot.exists() ? (existingSnapshot.data() as FirestoreProductionUnitRecord) : null;

  await setDoc(
    unitRef,
    {
      activeTasks: existingData?.activeTasks ?? 0,
      capacity: typeof input.capacity === 'number' ? Math.max(0, Math.round(input.capacity)) : null,
      id: unitId,
      linkedFranchises: input.linkedFranchises.filter(Boolean),
      location: input.location.trim() || 'Location pending',
      name: input.name.trim() || 'AVISHU Production Unit',
      status: input.status === 'busy' ? 'busy' : 'active',
      updatedAt: serverTimestamp(),
      workersCount: Math.max(0, Math.round(input.workersCount)),
    },
    { merge: true },
  );

  return unitId;
}
