import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
  type Firestore,
  type Timestamp,
} from 'firebase/firestore';

import { demoUsersByRole } from '@/lib/constants/demo';
import { getFirestoreInstance } from '@/lib/firebase';
import { buildLoyaltySummary } from '@/lib/utils/loyalty';
import type { CustomerAddress, LoyaltySummary } from '@/types/customerProfile';
import type { User, UserRole } from '@/types/user';

const USERS_COLLECTION = 'users';

type FirestoreUserRecord = {
  addresses?: CustomerAddress[] | null;
  branchAddress?: string | null;
  branchId?: string | null;
  branchName?: string | null;
  createdAt?: Timestamp | string | null;
  displayName?: string | null;
  franchiseId?: string | null;
  franchiseName?: string | null;
  id?: string;
  linkedFranchiseIds?: string[] | null;
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
  nickname?: string | null;
  phone?: string | null;
  phoneNumber?: string | null;
  productionUnitId?: string | null;
  productionUnitName?: string | null;
  role?: UserRole | null;
  uid?: string | null;
  updatedAt?: Timestamp | string | null;
};

type FirestoreRegisteredUserRecord = FirestoreUserRecord & {
  role: UserRole;
};

export type RegisteredUserRecord = User & {
  createdAt: string | null;
  displayName: string;
  nickname: string | null;
  uid: string;
  updatedAt: string | null;
};

export type EnsureUserProfileInput = {
  branchAddress?: string | null;
  branchId?: string | null;
  branchName?: string | null;
  franchiseId?: string | null;
  franchiseName?: string | null;
  id: string;
  linkedFranchiseIds?: string[] | null;
  name?: string | null;
  phoneNumber?: string | null;
  productionUnitId?: string | null;
  productionUnitName?: string | null;
  role: UserRole;
};

export type RegisterUserProfileInput = Omit<EnsureUserProfileInput, 'name'> & {
  name: string;
};

export type ResolveFallbackUserProfileInput = {
  branchAddress?: string | null;
  branchId?: string | null;
  branchName?: string | null;
  fallbackName?: string | null;
  fallbackPhoneNumber?: string | null;
  franchiseId?: string | null;
  franchiseName?: string | null;
  linkedFranchiseIds?: string[] | null;
  productionUnitId?: string | null;
  productionUnitName?: string | null;
  role: UserRole;
  userId: string;
};

const registeredUserCache = new Map<string, RegisteredUserRecord | null>();
const registeredUserRequests = new Map<string, Promise<RegisteredUserRecord | null>>();

function getDemoUserByRole(role: UserRole) {
  return demoUsersByRole[role];
}

function normalizeDisplayName(value: string | null | undefined) {
  const trimmed = value?.trim() ?? '';

  return trimmed.length ? trimmed : null;
}

function hasRegisteredRole(role: FirestoreUserRecord['role']): role is UserRole {
  return role === 'customer' || role === 'franchisee' || role === 'production';
}

function toIsoString(value: Timestamp | string | null | undefined) {
  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    return value;
  }

  return value.toDate().toISOString();
}

function buildNormalizedLoyalty(record?: FirestoreUserRecord | null) {
  const points = typeof record?.loyalty?.points === 'number' ? record.loyalty.points : 0;
  const lifetimeSpent = typeof record?.loyalty?.lifetimeSpent === 'number' ? record.loyalty.lifetimeSpent : 0;
  const totalOrders = typeof record?.loyalty?.totalOrders === 'number' ? record.loyalty.totalOrders : 0;

  return buildLoyaltySummary({
    lifetimeSpent,
    points,
    totalOrders,
  });
}

function buildBranchDefaults(input: EnsureUserProfileInput) {
  if (input.role !== 'franchisee') {
    return {
      branchAddress: input.branchAddress ?? null,
      branchId: input.branchId ?? null,
      branchName: input.branchName ?? null,
      franchiseId: input.franchiseId ?? null,
      franchiseName: input.franchiseName ?? null,
      linkedFranchiseIds: input.linkedFranchiseIds ?? null,
    };
  }

  const demoFranchisee = getDemoUserByRole('franchisee');
  const branchId = input.branchId ?? input.id ?? demoFranchisee.branchId ?? demoFranchisee.id;
  const branchName =
    input.branchName ?? normalizeDisplayName(input.name) ?? demoFranchisee.branchName ?? demoFranchisee.name;
  const linkedFranchiseIds = input.linkedFranchiseIds ?? demoFranchisee.linkedFranchiseIds ?? [demoFranchisee.id];

  return {
    branchAddress: input.branchAddress ?? demoFranchisee.branchAddress ?? null,
    branchId,
    branchName,
    franchiseId: input.franchiseId ?? demoFranchisee.franchiseId ?? linkedFranchiseIds[0] ?? demoFranchisee.id,
    franchiseName: input.franchiseName ?? demoFranchisee.franchiseName ?? branchName,
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
    franchiseId: branchDefaults.franchiseId ?? null,
    franchiseName: branchDefaults.franchiseName ?? null,
    id: input.id,
    linkedFranchiseIds: branchDefaults.linkedFranchiseIds,
    name: normalizeDisplayName(input.name) ?? demoUser.name,
    phoneNumber: input.phoneNumber ?? null,
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
    franchiseId: input.franchiseId ?? null,
    franchiseName: input.franchiseName ?? null,
    id: input.userId,
    linkedFranchiseIds: input.linkedFranchiseIds ?? null,
    name: input.fallbackName ?? null,
    phoneNumber: input.fallbackPhoneNumber ?? null,
    productionUnitId: input.productionUnitId ?? null,
    productionUnitName: input.productionUnitName ?? null,
    role: input.role,
  });
}

function normalizeUser(record: FirestoreRegisteredUserRecord, fallbackId: string) {
  const resolvedName =
    normalizeDisplayName(record.displayName) ??
    normalizeDisplayName(record.nickname) ??
    normalizeDisplayName(record.name) ??
    'AVISHU User';

  return {
    branchAddress: record.branchAddress ?? null,
    branchId: record.branchId ?? null,
    branchName: record.branchName ?? null,
    franchiseId: record.franchiseId ?? null,
    franchiseName: record.franchiseName ?? null,
    id: record.uid ?? record.id ?? fallbackId,
    linkedFranchiseIds: record.linkedFranchiseIds ?? null,
    name: resolvedName,
    phoneNumber: record.phoneNumber ?? record.phone ?? null,
    productionUnitId: record.productionUnitId ?? null,
    productionUnitName: record.productionUnitName ?? null,
    role: record.role,
  } satisfies User;
}

function normalizeRegisteredUser(record: FirestoreUserRecord, fallbackId: string) {
  if (!hasRegisteredRole(record.role)) {
    return null;
  }

  const normalizedUser = normalizeUser(record as FirestoreRegisteredUserRecord, fallbackId);

  return {
    ...normalizedUser,
    createdAt: toIsoString(record.createdAt),
    displayName:
      normalizeDisplayName(record.displayName) ??
      normalizeDisplayName(record.nickname) ??
      normalizedUser.name,
    nickname:
      normalizeDisplayName(record.nickname) ??
      normalizeDisplayName(record.displayName) ??
      normalizeDisplayName(record.name),
    uid: record.uid?.trim().length ? record.uid.trim() : normalizedUser.id,
    updatedAt: toIsoString(record.updatedAt),
  } satisfies RegisteredUserRecord;
}

function buildRegisteredUserRecordPatch(
  profile: User,
  existingRecord?: FirestoreUserRecord | null,
  displayName?: string | null,
) {
  const resolvedDisplayName =
    normalizeDisplayName(displayName) ??
    normalizeDisplayName(profile.name) ??
    normalizeDisplayName(existingRecord?.displayName) ??
    normalizeDisplayName(existingRecord?.nickname) ??
    normalizeDisplayName(existingRecord?.name) ??
    'AVISHU User';
  const resolvedPhoneNumber = profile.phoneNumber ?? existingRecord?.phoneNumber ?? existingRecord?.phone ?? null;
  const existingAddresses = Array.isArray(existingRecord?.addresses) ? existingRecord.addresses : [];

  return {
    ...profile,
    ...(profile.role === 'customer' || existingAddresses.length > 0 ? { addresses: existingAddresses } : {}),
    createdAt: existingRecord?.createdAt ?? serverTimestamp(),
    displayName: resolvedDisplayName,
    id: profile.id,
    loyalty: buildNormalizedLoyalty(existingRecord),
    name: resolvedDisplayName,
    nickname: resolvedDisplayName,
    phone: resolvedPhoneNumber,
    phoneNumber: resolvedPhoneNumber,
    uid: profile.id,
    updatedAt: serverTimestamp(),
  };
}

function buildRegisteredUserResult(
  profile: User,
  existingRecord: FirestoreUserRecord | null | undefined,
  displayName?: string | null,
) {
  const resolvedDisplayName =
    normalizeDisplayName(displayName) ??
    normalizeDisplayName(profile.name) ??
    normalizeDisplayName(existingRecord?.displayName) ??
    normalizeDisplayName(existingRecord?.nickname) ??
    normalizeDisplayName(existingRecord?.name) ??
    'AVISHU User';
  const now = new Date().toISOString();

  return {
    ...profile,
    createdAt: toIsoString(existingRecord?.createdAt) ?? now,
    displayName: resolvedDisplayName,
    nickname: resolvedDisplayName,
    uid: profile.id,
    updatedAt: now,
  } satisfies RegisteredUserRecord;
}

async function loadRegisteredUserById(firestore: Firestore, userId: string) {
  if (userId.startsWith('mock-user-')) {
    registeredUserCache.set(userId, null);
    return null;
  }

  const snapshot = await getDoc(doc(firestore, USERS_COLLECTION, userId));

  if (!snapshot.exists()) {
    registeredUserCache.set(userId, null);
    return null;
  }

  const normalizedUser = normalizeRegisteredUser(snapshot.data() as FirestoreUserRecord, snapshot.id);

  registeredUserCache.set(userId, normalizedUser);
  return normalizedUser;
}

function findDemoUserById(userId: string) {
  return Object.values(demoUsersByRole).find((user) => user.id === userId) ?? null;
}

export async function ensureUserProfile(input: EnsureUserProfileInput) {
  const profile = buildUserProfile(input);
  const firestore = getFirestoreInstance();

  if (!firestore || profile.id.startsWith('mock-user-')) {
    return profile;
  }

  const profileRef = doc(firestore, USERS_COLLECTION, profile.id);
  const existingSnapshot = await getDoc(profileRef);
  const existingRecord = existingSnapshot.exists() ? (existingSnapshot.data() as FirestoreUserRecord) : null;

  await setDoc(profileRef, buildRegisteredUserRecordPatch(profile, existingRecord), { merge: true });

  registeredUserCache.set(profile.id, buildRegisteredUserResult(profile, existingRecord));
  registeredUserRequests.delete(profile.id);

  return profile;
}

export async function isNicknameAvailable(nickname: string, excludeUserId?: string | null) {
  const firestore = getFirestoreInstance();
  const normalizedNickname = normalizeDisplayName(nickname);

  if (!firestore || !normalizedNickname || excludeUserId?.startsWith('mock-user-')) {
    return true;
  }

  const snapshot = await getDocs(
    query(collection(firestore, USERS_COLLECTION), where('nickname', '==', normalizedNickname), limit(1)),
  );

  if (snapshot.empty) {
    return true;
  }

  return snapshot.docs.every((entry) => entry.id === excludeUserId);
}

export async function registerUserProfile(input: RegisterUserProfileInput) {
  const normalizedDisplayName = normalizeDisplayName(input.name) ?? 'AVISHU User';
  const nicknameAvailable = await isNicknameAvailable(normalizedDisplayName, input.id);

  if (!nicknameAvailable) {
    throw Object.assign(new Error('NICKNAME_TAKEN'), { code: 'NICKNAME_TAKEN' });
  }

  const profile = buildUserProfile({
    ...input,
    name: normalizedDisplayName,
  });
  const firestore = getFirestoreInstance();

  if (!firestore || profile.id.startsWith('mock-user-')) {
    const registeredUser = buildRegisteredUserResult(profile, null, normalizedDisplayName);

    registeredUserCache.set(profile.id, registeredUser);
    registeredUserRequests.delete(profile.id);

    return registeredUser;
  }

  const profileRef = doc(firestore, USERS_COLLECTION, profile.id);

  await setDoc(profileRef, buildRegisteredUserRecordPatch(profile, null, normalizedDisplayName), {
    merge: true,
  });

  const registeredUser = buildRegisteredUserResult(profile, null, normalizedDisplayName);

  registeredUserCache.set(profile.id, registeredUser);
  registeredUserRequests.delete(profile.id);

  return registeredUser;
}

export async function findRegisteredUser(userId: string | null | undefined) {
  const resolvedUserId = userId?.trim() ?? '';

  if (!resolvedUserId) {
    return null;
  }

  if (registeredUserCache.has(resolvedUserId)) {
    return registeredUserCache.get(resolvedUserId) ?? null;
  }

  const inFlightRequest = registeredUserRequests.get(resolvedUserId);

  if (inFlightRequest) {
    return inFlightRequest;
  }

  const firestore = getFirestoreInstance();

  if (!firestore) {
    return null;
  }

  const request = loadRegisteredUserById(firestore, resolvedUserId).finally(() => {
    registeredUserRequests.delete(resolvedUserId);
  });

  registeredUserRequests.set(resolvedUserId, request);

  return request;
}

export async function getUserProfile(userId: string) {
  const firestore = getFirestoreInstance();
  const fallbackUser = findDemoUserById(userId);

  if (!firestore || userId.startsWith('mock-user-')) {
    return fallbackUser;
  }

  const snapshot = await getDoc(doc(firestore, USERS_COLLECTION, userId));

  if (!snapshot.exists()) {
    return fallbackUser;
  }

  return normalizeRegisteredUser(snapshot.data() as FirestoreUserRecord, snapshot.id) ?? fallbackUser;
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

  if (!firestore || userId.startsWith('mock-user-')) {
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

      onUser(normalizeRegisteredUser(snapshot.data() as FirestoreUserRecord, snapshot.id) ?? fallbackUser);
    },
    () => {
      onUser(fallbackUser);
    },
  );
}
