import {
  onAuthStateChanged,
  signInAnonymously,
  signOut,
} from 'firebase/auth';

import { getFirebaseAuthInstance } from '@/lib/firebase';
import { buildPhoneUserName, formatPhoneNumberForDisplay, validateKazakhstanPhoneNumber } from '@/lib/utils/phone';

export type PhoneVerificationRequest = {
  displayPhoneNumber: string;
  normalizedPhoneNumber: string;
  verificationId: string;
};

export type VerifiedPhoneUser = {
  id: string;
  name: string;
  phoneNumber: string | null;
};

export type PhoneAuthStateUser = {
  id: string;
  phoneNumber: string | null;
};

export type PhoneVerificationOptions = {
  forceResend?: boolean;
};

type NativeFirebaseAuthModule = typeof import('@react-native-firebase/auth');

type PhoneConfirmationResultLike = {
  verificationId?: string;
  confirm: (verificationCode: string) => Promise<{
    user: {
      phoneNumber: string | null;
      uid: string;
    };
  }>;
};

const confirmationResults = new Map<string, PhoneConfirmationResultLike>();

function getNativePhoneAuth() {
  try {
    const nativeFirebaseAuthModule = require('@react-native-firebase/auth') as NativeFirebaseAuthModule;

    if (typeof nativeFirebaseAuthModule.default !== 'function') {
      return null;
    }

    return {
      auth: nativeFirebaseAuthModule.default(),
      createAuth: nativeFirebaseAuthModule.default,
    };
  } catch {
    return null;
  }
}

function cacheConfirmationResult(verificationId: string, confirmation: PhoneConfirmationResultLike) {
  confirmationResults.set(verificationId, confirmation);
}

function clearConfirmationResult(verificationId: string) {
  confirmationResults.delete(verificationId);
}

export function isDemoPhoneAuthEnabled() {
  return false;
}

export function bootstrapFirebaseDemoAuth() {
  const auth = getFirebaseAuthInstance();

  if (!auth) {
    return Promise.resolve<string | null>(null);
  }

  if (auth.currentUser) {
    return Promise.resolve(auth.currentUser.uid);
  }

  return signInAnonymously(auth)
    .then((credential) => credential.user.uid)
    .catch(() => null);
}

export function resolvePhoneAuthErrorMessage(error: unknown, context: 'request' | 'verify' | 'restore' = 'request') {
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';

  if (code === 'auth/invalid-phone-number' || code === 'PHONE_NUMBER_INVALID') {
    return 'Enter a valid Kazakhstan number in +7-777-123-45-67 format.';
  }

  if (code === 'auth/missing-phone-number') {
    return 'Enter a phone number before requesting a code.';
  }

  if (code === 'auth/too-many-requests' || code === 'auth/quota-exceeded') {
    return 'Too many attempts were made. Please wait a moment and try again.';
  }

  if (code === 'auth/network-request-failed') {
    return 'Network connection was interrupted. Please try again.';
  }

  if (code === 'auth/session-expired' || code === 'auth/code-expired') {
    return 'That code expired. Request a fresh 6-digit code and try again.';
  }

  if (code === 'auth/invalid-verification-code' || code === 'auth/missing-verification-code') {
    return 'The 6-digit code is incorrect. Check the SMS and try again.';
  }

  if (code === 'PHONE_AUTH_APP_VERIFIER_MISSING') {
    return 'The phone verification screen is not ready yet. Please wait a second and try again.';
  }

  if (code === 'PHONE_AUTH_UNAVAILABLE') {
    return 'Firebase phone authentication is not configured for this build yet.';
  }

  if (context === 'verify') {
    return 'We could not verify that code right now. Please try again.';
  }

  if (context === 'restore') {
    return 'We could not restore the phone session right now.';
  }

  return "We couldn't send the verification code right now. Please try again.";
}

export function subscribeToPhoneAuthState(onUser: (user: PhoneAuthStateUser | null) => void) {
  const nativePhoneAuth = getNativePhoneAuth();

  if (nativePhoneAuth) {
    return nativePhoneAuth.auth.onAuthStateChanged((user) => {
      onUser(
        user && !user.isAnonymous
          ? {
              id: user.uid,
              phoneNumber: user.phoneNumber ?? null,
            }
          : null,
      );
    });
  }

  const auth = getFirebaseAuthInstance();

  if (!auth) {
    return () => undefined;
  }

  return onAuthStateChanged(auth, (user) => {
    onUser(
      user && !user.isAnonymous
        ? {
            id: user.uid,
            phoneNumber: user.phoneNumber ?? null,
          }
        : null,
    );
  });
}

export async function requestPhoneVerification(rawPhoneNumber: string, options?: PhoneVerificationOptions) {
  const validation = validateKazakhstanPhoneNumber(rawPhoneNumber);

  if (!validation.isValid || !validation.normalizedPhoneNumber) {
    throw Object.assign(new Error('PHONE_NUMBER_INVALID'), { code: 'PHONE_NUMBER_INVALID' });
  }

  await bootstrapFirebaseDemoAuth();
  await new Promise((resolve) => setTimeout(resolve, 600));

  return {
    displayPhoneNumber: formatPhoneNumberForDisplay(validation.normalizedPhoneNumber),
    normalizedPhoneNumber: validation.normalizedPhoneNumber,
    verificationId: 'mock-verify-' + validation.normalizedPhoneNumber,
  } satisfies PhoneVerificationRequest;
}

export async function verifyPhoneOtp(input: {
  code: string;
  phoneNumber: string;
  verificationId: string;
}) {
  const normalizedCode = input.code.trim();

  if (normalizedCode.length !== 6) {
    throw Object.assign(new Error('auth/missing-verification-code'), { code: 'auth/missing-verification-code' });
  }

  await bootstrapFirebaseDemoAuth();
  await new Promise((resolve) => setTimeout(resolve, 600));

  return {
    id: 'mock-user-' + input.phoneNumber.replace(/\\D/g, ''),
    name: buildPhoneUserName(input.phoneNumber),
    phoneNumber: input.phoneNumber,
  } satisfies VerifiedPhoneUser;
}

export async function signOutFirebaseSession() {
  confirmationResults.clear();

  const auth = getFirebaseAuthInstance();
  const nativePhoneAuth = getNativePhoneAuth();

  await Promise.allSettled([
    nativePhoneAuth ? nativePhoneAuth.auth.signOut() : Promise.resolve(),
    auth ? signOut(auth) : Promise.resolve(),
  ]);
}
