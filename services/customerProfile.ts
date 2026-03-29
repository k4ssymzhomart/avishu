import { Timestamp, doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';

import { getFirestoreInstance } from '@/lib/firebase';
import { buildLoyaltySummary } from '@/lib/utils/loyalty';
import type { CustomerAddress, CustomerProfile, CustomerProfileSeed, LoyaltySummary } from '@/types/customerProfile';

const USERS_COLLECTION = 'users';

type FirestoreCustomerProfileRecord = {
  addresses?: CustomerAddress[] | null;
  assignedFranchiseId?: string | null;
  assignedFranchiseName?: string | null;
  createdAt?: Timestamp | string | null;
  displayName?: string | null;
  id?: string | null;
  loyalty?: {
    benefits?: LoyaltySummary['benefits'] | null;
    lifetimeSpent?: number | null;
    nextTier?: LoyaltySummary['nextTier'] | null;
    nextTierThreshold?: number | null;
    points?: number | null;
    pointsToNextTier?: number | null;
    progressPercent?: number | null;
    tier?: LoyaltySummary['tier'] | null;
    totalOrders?: number | null;
  } | null;
  name?: string | null;
  phone?: string | null;
  phoneNumber?: string | null;
  role?: CustomerProfile['role'] | null;
  uid?: string | null;
  updatedAt?: Timestamp | string | null;
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

function normalizeAddress(address: CustomerAddress, index: number): CustomerAddress {
  return {
    city: address.city ?? null,
    id: address.id?.trim().length ? address.id : `address-${index + 1}`,
    isDefault: !!address.isDefault,
    label: address.label?.trim().length ? address.label.trim() : `Address ${index + 1}`,
    line1: address.line1?.trim().length ? address.line1.trim() : 'Address pending',
    line2: address.line2?.trim().length ? address.line2.trim() : null,
    note: address.note?.trim().length ? address.note.trim() : null,
  };
}

function createOptimisticProfile(seed: CustomerProfileSeed): CustomerProfile {
  const now = new Date().toISOString();

  return {
    addresses: [],
    assignedFranchiseId: seed.franchiseId ?? null,
    assignedFranchiseName: seed.franchiseName ?? null,
    createdAt: now,
    displayName: seed.displayName?.trim().length ? seed.displayName.trim() : 'AVISHU Client',
    loyalty: buildLoyaltySummary(),
    phone: seed.phone ?? null,
    role: seed.role ?? 'customer',
    uid: seed.uid,
    updatedAt: now,
  };
}

function normalizeProfile(
  record: FirestoreCustomerProfileRecord | null | undefined,
  fallbackId: string,
  seed: CustomerProfileSeed,
): CustomerProfile {
  const optimisticProfile = createOptimisticProfile(seed);
  const points = record?.loyalty?.points ?? 0;
  const lifetimeSpent = record?.loyalty?.lifetimeSpent ?? 0;
  const totalOrders = record?.loyalty?.totalOrders ?? 0;

  return {
    addresses: Array.isArray(record?.addresses)
      ? record.addresses.map((address, index) => normalizeAddress(address, index))
      : optimisticProfile.addresses,
    assignedFranchiseId: record?.assignedFranchiseId ?? optimisticProfile.assignedFranchiseId,
    assignedFranchiseName: record?.assignedFranchiseName ?? optimisticProfile.assignedFranchiseName,
    createdAt: toIsoString(record?.createdAt ?? optimisticProfile.createdAt),
    displayName:
      record?.displayName?.trim().length
        ? record.displayName.trim()
        : record?.name?.trim().length
          ? record.name.trim()
          : optimisticProfile.displayName,
    loyalty: buildLoyaltySummary({
      lifetimeSpent: typeof lifetimeSpent === 'number' ? lifetimeSpent : 0,
      points: typeof points === 'number' ? points : 0,
      totalOrders: typeof totalOrders === 'number' ? totalOrders : 0,
    }),
    phone: record?.phone ?? record?.phoneNumber ?? optimisticProfile.phone,
    role: record?.role ?? optimisticProfile.role,
    uid: record?.uid ?? record?.id ?? fallbackId,
    updatedAt: toIsoString(record?.updatedAt ?? optimisticProfile.updatedAt),
  };
}

function buildProfileMerge(seed: CustomerProfileSeed) {
  return {
    assignedFranchiseId: seed.franchiseId ?? null,
    assignedFranchiseName: seed.franchiseName ?? null,
    displayName: seed.displayName?.trim().length ? seed.displayName.trim() : 'AVISHU Client',
    loyalty: buildLoyaltySummary(),
    phone: seed.phone ?? null,
    role: seed.role ?? 'customer',
    uid: seed.uid,
  };
}

export function subscribeToCustomerProfile(
  seed: CustomerProfileSeed,
  onProfile: (profile: CustomerProfile) => void,
) {
  const firestore = getFirestoreInstance();
  const optimisticProfile = createOptimisticProfile(seed);

  onProfile(optimisticProfile);

  if (!firestore) {
    return () => undefined;
  }

  const profileRef = doc(firestore, USERS_COLLECTION, seed.uid);

  return onSnapshot(
    profileRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        onProfile(optimisticProfile);
        void setDoc(
          profileRef,
          {
            ...buildProfileMerge(seed),
            addresses: [],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );
        return;
      }

      const snapshotData = snapshot.data() as FirestoreCustomerProfileRecord;
      const profile = normalizeProfile(snapshotData, snapshot.id, seed);
      onProfile(profile);

      const mergePatch: Partial<FirestoreCustomerProfileRecord> = {};
      const snapshotLoyalty = snapshotData.loyalty;

      if (!snapshotData.uid) {
        mergePatch.uid = seed.uid;
      }

      if (!snapshotData.displayName && seed.displayName?.trim().length) {
        mergePatch.displayName = seed.displayName.trim();
      }

      if (snapshotData.assignedFranchiseId == null && seed.franchiseId) {
        mergePatch.assignedFranchiseId = seed.franchiseId;
      }

      if (snapshotData.assignedFranchiseName == null && seed.franchiseName) {
        mergePatch.assignedFranchiseName = seed.franchiseName;
      }

      if (!snapshotData.role && seed.role) {
        mergePatch.role = seed.role;
      }

      if (snapshotData.phone == null && seed.phone) {
        mergePatch.phone = seed.phone;
      }

      if (
        !snapshotLoyalty ||
        snapshotLoyalty.points !== profile.loyalty.points ||
        snapshotLoyalty.tier !== profile.loyalty.tier ||
        snapshotLoyalty.nextTier !== profile.loyalty.nextTier ||
        snapshotLoyalty.nextTierThreshold !== profile.loyalty.nextTierThreshold ||
        snapshotLoyalty.pointsToNextTier !== profile.loyalty.pointsToNextTier ||
        snapshotLoyalty.progressPercent !== profile.loyalty.progressPercent ||
        snapshotLoyalty.lifetimeSpent !== profile.loyalty.lifetimeSpent ||
        snapshotLoyalty.totalOrders !== profile.loyalty.totalOrders
      ) {
        mergePatch.loyalty = profile.loyalty;
      }

      if (Object.keys(mergePatch).length > 0) {
        void setDoc(
          profileRef,
          {
            ...mergePatch,
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );
      }
    },
    () => {
      onProfile(optimisticProfile);
    },
  );
}

export async function updateCustomerProfile(
  uid: string,
  patch: Partial<
    Pick<CustomerProfile, 'addresses' | 'assignedFranchiseId' | 'assignedFranchiseName' | 'displayName' | 'phone' | 'role'>
  >,
) {
  const firestore = getFirestoreInstance();

  if (!firestore) {
    return;
  }

  await setDoc(
    doc(firestore, USERS_COLLECTION, uid),
    {
      ...(patch.addresses ? { addresses: patch.addresses.map(normalizeAddress) } : {}),
      ...(patch.assignedFranchiseId !== undefined ? { assignedFranchiseId: patch.assignedFranchiseId } : {}),
      ...(patch.assignedFranchiseName !== undefined ? { assignedFranchiseName: patch.assignedFranchiseName } : {}),
      ...(patch.displayName !== undefined ? { displayName: patch.displayName.trim() || 'AVISHU Client' } : {}),
      ...(patch.phone !== undefined ? { phone: patch.phone } : {}),
      ...(patch.role ? { role: patch.role } : {}),
      updatedAt: serverTimestamp(),
      uid,
    },
    { merge: true },
  );
}
