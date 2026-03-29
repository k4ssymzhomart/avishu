import { create } from 'zustand';

import { demoUsersByRole } from '@/lib/constants/demo';
import { buildPhoneUserName, formatPhoneNumberForDisplay } from '@/lib/utils/phone';
import {
  bootstrapFirebaseDemoAuth,
  requestPhoneVerification,
  signOutFirebaseSession,
  verifyPhoneOtp,
} from '@/services/auth';
import { ensureUserProfile, getUserProfile } from '@/services/users';
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
  beginPhoneAuth: (phoneNumber?: string, options?: { forceResend?: boolean }) => Promise<void>;
  completeRoleSelection: (role: UserRole, displayName?: string) => void;
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
  completeRoleSelection: (role, displayName) => {
    const currentUserId = get().currentUserId;
    const currentUserPhoneNumber = get().currentUserPhoneNumber;
    const currentUserProfile = get().currentUserProfile;
    const resolvedName =
      displayName?.trim().length ? displayName.trim() : get().currentUserName ?? demoUsersByRole[role].name;

    if (currentUserId) {
      void ensureUserProfile({
        branchAddress: role === 'franchisee' ? demoUsersByRole.franchisee.branchAddress ?? null : null,
        branchId:
          role === 'franchisee'
            ? demoUsersByRole.franchisee.branchId ?? currentUserId
            : null,
        branchName:
          role === 'franchisee'
            ? demoUsersByRole.franchisee.branchName ?? resolvedName
            : null,
        id: currentUserId,
        linkedFranchiseIds:
          role === 'franchisee'
            ? demoUsersByRole.franchisee.linkedFranchiseIds ?? [demoUsersByRole.franchisee.id]
            : role === 'production'
              ? demoUsersByRole.production.linkedFranchiseIds ?? [demoUsersByRole.franchisee.id]
              : null,
        name: resolvedName,
        phoneNumber: currentUserPhoneNumber ?? null,
        productionUnitId: role === 'production' ? demoUsersByRole.production.productionUnitId ?? null : null,
        productionUnitName: role === 'production' ? demoUsersByRole.production.productionUnitName ?? resolvedName : null,
        role,
      });
    }

    set({
      authStatus: 'authenticated',
      currentRole: role,
      currentUserName: resolvedName,
      currentUserProfile:
        role === 'customer' && currentUserProfile
          ? {
              addresses: currentUserProfile.addresses,
              createdAt: currentUserProfile.createdAt,
              displayName: resolvedName,
              loyalty: currentUserProfile.loyalty,
              phone: currentUserProfile.phone,
              role,
              uid: currentUserProfile.uid,
              updatedAt: currentUserProfile.updatedAt,
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
    const pendingPhoneNumber = get().pendingPhoneNumber;
    const pendingVerificationId = get().pendingVerificationId;

    if (!pendingPhoneNumber || !pendingVerificationId) {
      throw new Error('MISSING_VERIFICATION');
    }

    const user = await verifyPhoneOtp({
      code,
      phoneNumber: pendingPhoneNumber,
      verificationId: pendingVerificationId,
    });
    const existingProfile = await getUserProfile(user.id);
    const restoredRole = existingProfile?.role ?? null;

    set({
      authMethod: 'phone',
      authStatus: restoredRole ? 'authenticated' : 'role_pending',
      currentRole: restoredRole,
      currentUserId: user.id,
      currentUserName: existingProfile?.name ?? user.name,
      currentUserPhoneNumber: existingProfile?.phoneNumber ?? user.phoneNumber,
      currentUserProfile: null,
      pendingRoleSelection: null,
      phoneEntryValue: formatPhoneNumberForDisplay(existingProfile?.phoneNumber ?? user.phoneNumber),
      ...clearPendingPhoneState(),
    });
  },
}));
