import {
  Timestamp,
  doc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

import { getFirestoreInstance } from '@/lib/firebase';
import type {
  CustomerAddress,
  CustomerProfile,
  CustomerProfileSeed,
  LoyaltySummary,
  LoyaltyTier,
} from '@/types/customerProfile';

const USERS_COLLECTION = 'users';

const loyaltyTiers: Array<{ minimumPoints: number; tier: LoyaltyTier }> = [
  { minimumPoints: 0, tier: 'Slate' },
  { minimumPoints: 800, tier: 'Monolith' },
  { minimumPoints: 1800, tier: 'Obsidian' },
];

type FirestoreCustomerProfileRecord = {
  addresses?: CustomerAddress[] | null;
  createdAt?: Timestamp | string | null;
  displayName?: string | null;
  id?: string | null;
  loyalty?: {
    currentTier?: LoyaltyTier | null;
    nextTierProgress?: number | null;
    points?: number | null;
    pointsToNextTier?: number | null;
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

export function buildLoyaltySummary(points: number): LoyaltySummary {
  const normalizedPoints = Math.max(0, Math.round(points));
  const currentTier =
    [...loyaltyTiers].reverse().find((tier) => normalizedPoints >= tier.minimumPoints) ?? loyaltyTiers[0];
  const nextTier = loyaltyTiers.find((tier) => tier.minimumPoints > normalizedPoints) ?? null;
  const pointsToNextTier = nextTier ? Math.max(nextTier.minimumPoints - normalizedPoints, 0) : 0;
  const nextTierProgress = nextTier
    ? Math.min(
        1,
        (normalizedPoints - currentTier.minimumPoints) /
          Math.max(nextTier.minimumPoints - currentTier.minimumPoints, 1),
      )
    : 1;

  return {
    currentTier: currentTier.tier,
    nextTier: nextTier?.tier ?? null,
    nextTierProgress,
    points: normalizedPoints,
    pointsToNextTier,
  };
}

function createOptimisticProfile(seed: CustomerProfileSeed): CustomerProfile {
  const now = new Date().toISOString();

  return {
    addresses: [],
    createdAt: now,
    displayName: seed.displayName?.trim().length ? seed.displayName.trim() : 'AVISHU Client',
    loyalty: buildLoyaltySummary(0),
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

  return {
    addresses: Array.isArray(record?.addresses)
      ? record.addresses.map((address, index) => normalizeAddress(address, index))
      : optimisticProfile.addresses,
    createdAt: toIsoString(record?.createdAt ?? optimisticProfile.createdAt),
    displayName:
      record?.displayName?.trim().length
        ? record.displayName.trim()
        : record?.name?.trim().length
          ? record.name.trim()
          : optimisticProfile.displayName,
    loyalty: buildLoyaltySummary(typeof points === 'number' ? points : 0),
    phone: record?.phone ?? record?.phoneNumber ?? optimisticProfile.phone,
    role: record?.role ?? optimisticProfile.role,
    uid: record?.uid ?? record?.id ?? fallbackId,
    updatedAt: toIsoString(record?.updatedAt ?? optimisticProfile.updatedAt),
  };
}

function buildProfileMerge(seed: CustomerProfileSeed) {
  return {
    displayName: seed.displayName?.trim().length ? seed.displayName.trim() : 'AVISHU Client',
    loyalty: buildLoyaltySummary(0),
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

      const profile = normalizeProfile(snapshot.data() as FirestoreCustomerProfileRecord, snapshot.id, seed);
      onProfile(profile);

      const mergePatch: Partial<FirestoreCustomerProfileRecord> = {};

      if (!snapshot.data().uid) {
        mergePatch.uid = seed.uid;
      }

      if (!snapshot.data().displayName && seed.displayName?.trim().length) {
        mergePatch.displayName = seed.displayName.trim();
      }

      if (!snapshot.data().role && seed.role) {
        mergePatch.role = seed.role;
      }

      if (snapshot.data().phone == null && seed.phone) {
        mergePatch.phone = seed.phone;
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
  patch: Partial<Pick<CustomerProfile, 'addresses' | 'displayName' | 'phone' | 'role'>>,
) {
  const firestore = getFirestoreInstance();

  if (!firestore) {
    return;
  }

  await setDoc(
    doc(firestore, USERS_COLLECTION, uid),
    {
      ...(patch.addresses ? { addresses: patch.addresses.map(normalizeAddress) } : {}),
      ...(patch.displayName !== undefined ? { displayName: patch.displayName.trim() || 'AVISHU Client' } : {}),
      ...(patch.phone !== undefined ? { phone: patch.phone } : {}),
      ...(patch.role ? { role: patch.role } : {}),
      updatedAt: serverTimestamp(),
      uid,
    },
    { merge: true },
  );
}

export async function applyCustomerLoyaltyReward(
  seed: CustomerProfileSeed,
  rewardPoints: number,
) {
  const firestore = getFirestoreInstance();
  const awardedPoints = Math.max(0, Math.round(rewardPoints));

  if (!firestore || awardedPoints <= 0) {
    return buildLoyaltySummary(0);
  }

  const profileRef = doc(firestore, USERS_COLLECTION, seed.uid);

  const nextLoyalty = await runTransaction(firestore, async (transaction) => {
    const snapshot = await transaction.get(profileRef);
    const currentProfile = snapshot.exists()
      ? normalizeProfile(snapshot.data() as FirestoreCustomerProfileRecord, snapshot.id, seed)
      : createOptimisticProfile(seed);
    const updatedLoyalty = buildLoyaltySummary(currentProfile.loyalty.points + awardedPoints);

    transaction.set(
      profileRef,
      {
        ...(snapshot.exists()
          ? {}
          : {
              addresses: currentProfile.addresses,
              createdAt: serverTimestamp(),
            }),
        displayName: currentProfile.displayName,
        loyalty: updatedLoyalty,
        phone: currentProfile.phone,
        role: currentProfile.role,
        uid: seed.uid,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );

    return updatedLoyalty;
  });

  return nextLoyalty;
}
