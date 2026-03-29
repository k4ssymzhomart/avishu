import { doc, getDoc, onSnapshot, serverTimestamp, setDoc, type Timestamp } from 'firebase/firestore';

import { demoUsersByRole } from '@/lib/constants/demo';
import { getFirestoreInstance } from '@/lib/firebase';
import type { User, UserRole } from '@/types/user';

const USERS_COLLECTION = 'users';

type FirestoreUserRecord = {
  branchAddress?: string | null;
  branchId?: string | null;
  branchName?: string | null;
  displayName?: string | null;
  id?: string;
  linkedFranchiseIds?: string[] | null;
  name?: string | null;
  phone?: string | null;
  phoneNumber?: string | null;
  productionUnitId?: string | null;
  productionUnitName?: string | null;
  role: UserRole;
  uid?: string | null;
  updatedAt?: Timestamp | string | null;
};

export type EnsureUserProfileInput = {
  branchAddress?: string | null;
  branchId?: string | null;
  branchName?: string | null;
  id: string;
  linkedFranchiseIds?: string[] | null;
  name?: string | null;
  phoneNumber?: string | null;
  productionUnitId?: string | null;
  productionUnitName?: string | null;
  role: UserRole;
};

export type ResolveFallbackUserProfileInput = {
  branchAddress?: string | null;
  branchId?: string | null;
  branchName?: string | null;
  fallbackName?: string | null;
  fallbackPhoneNumber?: string | null;
  linkedFranchiseIds?: string[] | null;
  productionUnitId?: string | null;
  productionUnitName?: string | null;
  role: UserRole;
  userId: string;
};

function getDemoUserByRole(role: UserRole) {
  return demoUsersByRole[role];
}

function buildBranchDefaults(input: EnsureUserProfileInput) {
  if (input.role !== 'franchisee') {
    return {
      branchAddress: input.branchAddress ?? null,
      branchId: input.branchId ?? null,
      branchName: input.branchName ?? null,
      linkedFranchiseIds: input.linkedFranchiseIds ?? null,
    };
  }

  const demoFranchisee = getDemoUserByRole('franchisee');
  const branchId = input.branchId ?? input.id ?? demoFranchisee.branchId ?? demoFranchisee.id;
  const branchName = input.branchName ?? input.name?.trim() ?? demoFranchisee.branchName ?? demoFranchisee.name;
  const linkedFranchiseIds = input.linkedFranchiseIds ?? demoFranchisee.linkedFranchiseIds ?? [demoFranchisee.id];

  return {
    branchAddress: input.branchAddress ?? demoFranchisee.branchAddress ?? null,
    branchId,
    branchName,
    linkedFranchiseIds,
  };
}

export function buildUserProfile(input: EnsureUserProfileInput): User {
  const demoUser = getDemoUserByRole(input.role);
  const branchDefaults = buildBranchDefaults(input);

  return {
    branchAddress: branchDefaults.branchAddress,
    branchId: branchDefaults.branchId,
    branchName: branchDefaults.branchName,
    id: input.id,
    linkedFranchiseIds: branchDefaults.linkedFranchiseIds,
    name: input.name?.trim() || demoUser.name,
    phoneNumber: input.phoneNumber ?? demoUser.phoneNumber ?? null,
    productionUnitId: input.productionUnitId ?? demoUser.productionUnitId ?? null,
    productionUnitName: input.productionUnitName ?? demoUser.productionUnitName ?? null,
    role: input.role,
  };
}

export function resolveFallbackUserProfile(input: ResolveFallbackUserProfileInput) {
  return buildUserProfile({
    branchAddress: input.branchAddress ?? null,
    branchId: input.branchId ?? null,
    branchName: input.branchName ?? null,
    id: input.userId,
    linkedFranchiseIds: input.linkedFranchiseIds ?? null,
    name: input.fallbackName ?? null,
    phoneNumber: input.fallbackPhoneNumber ?? null,
    productionUnitId: input.productionUnitId ?? null,
    productionUnitName: input.productionUnitName ?? null,
    role: input.role,
  });
}

function normalizeUser(record: FirestoreUserRecord, fallbackId: string) {
  return {
    branchAddress: record.branchAddress ?? null,
    branchId: record.branchId ?? null,
    branchName: record.branchName ?? null,
    id: record.id ?? record.uid ?? fallbackId,
    linkedFranchiseIds: record.linkedFranchiseIds ?? null,
    name: record.name?.trim().length ? record.name.trim() : record.displayName?.trim() || 'AVISHU User',
    phoneNumber: record.phoneNumber ?? record.phone ?? null,
    productionUnitId: record.productionUnitId ?? null,
    productionUnitName: record.productionUnitName ?? null,
    role: record.role,
  } satisfies User;
}

function findDemoUserById(userId: string) {
  return Object.values(demoUsersByRole).find((user) => user.id === userId) ?? null;
}

export async function ensureUserProfile(input: EnsureUserProfileInput) {
  const profile = buildUserProfile(input);
  const firestore = getFirestoreInstance();

  if (!firestore) {
    return profile;
  }

  await setDoc(
    doc(firestore, USERS_COLLECTION, profile.id),
    {
      ...profile,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  return profile;
}

export async function getUserProfile(userId: string) {
  const firestore = getFirestoreInstance();
  const fallbackUser = findDemoUserById(userId);

  if (!firestore) {
    return fallbackUser;
  }

  const snapshot = await getDoc(doc(firestore, USERS_COLLECTION, userId));

  if (!snapshot.exists()) {
    return fallbackUser;
  }

  return normalizeUser(snapshot.data() as FirestoreUserRecord, snapshot.id);
}

export function subscribeToUserProfile(
  userIdOrInput: string | ResolveFallbackUserProfileInput,
  onUser: (user: User | null) => void,
) {
  const firestore = getFirestoreInstance();
  const userId = typeof userIdOrInput === 'string' ? userIdOrInput : userIdOrInput.userId;
  const fallbackUser =
    typeof userIdOrInput === 'string'
      ? findDemoUserById(userId)
      : resolveFallbackUserProfile(userIdOrInput);

  if (!firestore) {
    onUser(fallbackUser);
    return () => undefined;
  }

  return onSnapshot(
    doc(firestore, USERS_COLLECTION, userId),
    (snapshot) => {
      if (!snapshot.exists()) {
        onUser(fallbackUser);
        return;
      }

      onUser(normalizeUser(snapshot.data() as FirestoreUserRecord, snapshot.id));
    },
    () => {
      onUser(fallbackUser);
    },
  );
}
