import { create } from 'zustand';

import { demoUsersByRole } from '@/lib/constants/demo';
import { buildPhoneUserName, formatPhoneNumberForDisplay } from '@/lib/utils/phone';
import {
  bootstrapFirebaseDemoAuth,
  type PhoneVerificationOptions,
  requestPhoneVerification,
  signOutFirebaseSession,
  verifyPhoneOtp,
} from '@/services/auth';
import { findRegisteredUser, registerUserProfile } from '@/services/users';
import type { AuthMethod, AuthStatus } from '@/types/auth';
import type { CustomerProfile } from '@/types/customerProfile';
import type { UserRole } from '@/types/user';

type HydratedPhoneSession = {
  phoneNumber: string | null;
  userId: string;
  userName: string | null;
  userRole: UserRole | null;
};

type SessionState = {
  authMethod: AuthMethod | null;
  authStatus: AuthStatus;
  beginPhoneAuth: (phoneNumber?: string, options?: PhoneVerificationOptions) => Promise<void>;
  completeRoleSelection: (role: UserRole, displayName?: string) => Promise<void>;
  currentRole: UserRole | null;
  currentUserId: string | null;
  currentUserName: string | null;
  currentUserPhoneNumber: string | null;
  currentUserProfile: CustomerProfile | null;
  editPendingPhoneNumber: () => void;
  handlePhoneSessionEnded: () => void;
  hydrateCurrentUserProfile: (profile: CustomerProfile | null) => void;
  hydratePhoneSession: (session: HydratedPhoneSession) => void;
  pendingPhoneDisplayNumber: string | null;
  pendingPhoneNumber: string | null;
  pendingRoleSelection: UserRole | null;
  pendingVerificationId: string | null;
  phoneEntryValue: string;
  setPendingRoleSelection: (role: UserRole | null) => void;
  setPhoneEntryValue: (phoneNumber: string) => void;
  signInAsDemo: (role: UserRole) => void;
  signOut: () => void;
  updateCurrentUserName: (displayName: string) => void;
  verifyOtpCode: (code: string) => Promise<void>;
};

const guestSession = {
  authMethod: null,
  authStatus: 'guest' as const,
  currentRole: null,
  currentUserId: null,
  currentUserName: null,
  currentUserPhoneNumber: null,
  currentUserProfile: null,
  pendingPhoneDisplayNumber: null,
  pendingPhoneNumber: null,
  pendingRoleSelection: null,
  pendingVerificationId: null,
  phoneEntryValue: '+7',
};

function clearPendingPhoneState() {
  return {
    pendingPhoneDisplayNumber: null,
    pendingPhoneNumber: null,
    pendingVerificationId: null,
  };
}

function getRoleRegistrationDefaults(role: UserRole, currentUserId: string, resolvedName: string) {
  if (role === 'franchisee') {
    return {
      branchAddress: demoUsersByRole.franchisee.branchAddress ?? null,
      branchId: demoUsersByRole.franchisee.branchId ?? currentUserId,
      branchName: demoUsersByRole.franchisee.branchName ?? resolvedName,
      franchiseId: demoUsersByRole.franchisee.franchiseId ?? demoUsersByRole.franchisee.id,
      franchiseName: demoUsersByRole.franchisee.franchiseName ?? demoUsersByRole.franchisee.branchName ?? resolvedName,
      linkedFranchiseIds: demoUsersByRole.franchisee.linkedFranchiseIds ?? [demoUsersByRole.franchisee.id],
      productionUnitId: null,
      productionUnitName: null,
    };
  }

  if (role === 'production') {
    return {
      branchAddress: null,
      branchId: null,
      branchName: null,
      franchiseId: null,
      franchiseName: null,
      linkedFranchiseIds: demoUsersByRole.production.linkedFranchiseIds ?? [demoUsersByRole.franchisee.id],
      productionUnitId: demoUsersByRole.production.productionUnitId ?? null,
      productionUnitName: demoUsersByRole.production.productionUnitName ?? resolvedName,
    };
  }

  return {
    branchAddress: null,
    branchId: null,
    branchName: null,
    franchiseId: demoUsersByRole.customer.franchiseId ?? null,
    franchiseName: demoUsersByRole.customer.franchiseName ?? null,
    linkedFranchiseIds: null,
    productionUnitId: null,
    productionUnitName: null,
  };
}

export const useSessionStore = create<SessionState>((set, get) => ({
  ...guestSession,
  beginPhoneAuth: async (phoneNumber, options) => {
    const input = phoneNumber ?? get().phoneEntryValue;
    const verification = await requestPhoneVerification(input, options);

    set({
      authMethod: 'phone',
      authStatus: 'pending_verification',
      pendingPhoneDisplayNumber: verification.displayPhoneNumber,
      pendingPhoneNumber: verification.normalizedPhoneNumber,
      pendingRoleSelection: null,
      pendingVerificationId: verification.verificationId,
      phoneEntryValue: verification.displayPhoneNumber,
    });
  },
  completeRoleSelection: async (role, displayName) => {
    const state = get();
    const currentUserId = state.currentUserId;
    const currentUserPhoneNumber = state.currentUserPhoneNumber;
    const currentUserProfile = state.currentUserProfile;
    const resolvedName =
      displayName?.trim().length
        ? displayName.trim()
        : state.currentUserName ?? buildPhoneUserName(currentUserPhoneNumber);

    if (!currentUserId) {
      throw new Error('MISSING_SESSION_USER');
    }

    const roleDefaults = getRoleRegistrationDefaults(role, currentUserId, resolvedName);
    const registeredUser = await registerUserProfile({
      ...roleDefaults,
      id: currentUserId,
      name: resolvedName,
      phoneNumber: currentUserPhoneNumber ?? null,
      role,
    });

    set({
      authStatus: 'authenticated',
      currentRole: role,
      currentUserName: registeredUser.displayName,
      currentUserPhoneNumber: registeredUser.phoneNumber ?? currentUserPhoneNumber,
      currentUserProfile:
        role === 'customer' && currentUserProfile
          ? {
              ...currentUserProfile,
              displayName: registeredUser.displayName,
              phone: registeredUser.phoneNumber ?? currentUserProfile.phone,
              role,
              uid: currentUserId,
            }
          : null,
      pendingRoleSelection: null,
    });
  },
  editPendingPhoneNumber: () => {
    set((state) => ({
      authMethod: 'phone',
      authStatus: 'guest',
      pendingRoleSelection: null,
      phoneEntryValue: state.pendingPhoneDisplayNumber ?? state.phoneEntryValue,
      ...clearPendingPhoneState(),
    }));
  },
  handlePhoneSessionEnded: () => {
    const state = get();

    if (state.authMethod !== 'phone' || state.authStatus === 'pending_verification') {
      return;
    }

    set({
      ...guestSession,
      phoneEntryValue: state.phoneEntryValue,
    });
  },
  hydrateCurrentUserProfile: (profile) => {
    set((state) => ({
      currentRole: profile?.role ?? state.currentRole,
      currentUserName: profile?.displayName ?? state.currentUserName,
      currentUserPhoneNumber: profile?.phone ?? state.currentUserPhoneNumber,
      currentUserProfile: profile,
    }));
  },
  hydratePhoneSession: ({ phoneNumber, userId, userName, userRole }) => {
    set({
      authMethod: 'phone',
      authStatus: userRole ? 'authenticated' : 'role_pending',
      currentRole: userRole,
      currentUserId: userId,
      currentUserName: userName?.trim().length ? userName.trim() : buildPhoneUserName(phoneNumber),
      currentUserPhoneNumber: phoneNumber,
      currentUserProfile: null,
      pendingRoleSelection: null,
      phoneEntryValue: formatPhoneNumberForDisplay(phoneNumber),
      ...clearPendingPhoneState(),
    });
  },
  setPendingRoleSelection: (role) => {
    set({
      pendingRoleSelection: role,
    });
  },
  setPhoneEntryValue: (phoneNumber) => {
    set({
      phoneEntryValue: phoneNumber,
    });
  },
  signInAsDemo: (role) => {
    const user = demoUsersByRole[role];

    void bootstrapFirebaseDemoAuth();

    set({
      authMethod: 'demo',
      authStatus: 'authenticated',
      currentRole: role,
      currentUserId: user.id,
      currentUserName: user.name,
      currentUserPhoneNumber: user.phoneNumber ?? null,
      currentUserProfile: null,
      phoneEntryValue: formatPhoneNumberForDisplay(user.phoneNumber),
      pendingRoleSelection: null,
      ...clearPendingPhoneState(),
    });
  },
  signOut: () => {
    void signOutFirebaseSession();
    set(guestSession);
  },
  updateCurrentUserName: (displayName) => {
    set((state) => ({
      currentUserName: displayName.trim().length ? displayName.trim() : state.currentUserName,
      currentUserProfile: state.currentUserProfile
        ? {
            ...state.currentUserProfile,
            displayName: displayName.trim().length ? displayName.trim() : state.currentUserProfile.displayName,
          }
        : null,
    }));
  },
  verifyOtpCode: async (code) => {
    const state = get();
    const pendingPhoneNumber = state.pendingPhoneNumber;
    const pendingVerificationId = state.pendingVerificationId;

    if (!pendingPhoneNumber || !pendingVerificationId) {
      throw new Error('MISSING_VERIFICATION');
    }

    const verifiedUser = await verifyPhoneOtp({
      code,
      phoneNumber: pendingPhoneNumber,
      verificationId: pendingVerificationId,
    });
    const existingUser = await findRegisteredUser(verifiedUser.id).catch(() => null);
    const resolvedRole = existingUser?.role ?? null;
    const resolvedPhoneNumber = existingUser?.phoneNumber ?? verifiedUser.phoneNumber ?? pendingPhoneNumber;

    set({
      authMethod: 'phone',
      authStatus: resolvedRole ? 'authenticated' : 'role_pending',
      currentRole: resolvedRole,
      currentUserId: verifiedUser.id,
      currentUserName: existingUser?.displayName ?? verifiedUser.name,
      currentUserPhoneNumber: resolvedPhoneNumber,
      currentUserProfile: null,
      pendingRoleSelection: null,
      phoneEntryValue: formatPhoneNumberForDisplay(resolvedPhoneNumber),
      ...clearPendingPhoneState(),
    });
  },
}));
