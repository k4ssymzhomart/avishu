import type { FirebaseAuthApplicationVerifier } from 'expo-firebase-recaptcha';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import {
  onAuthStateChanged,
  PhoneAuthProvider as FirebasePhoneAuthProvider,
  signInAnonymously,
  signInWithCredential,
  signInWithPhoneNumber as signInWithPhoneNumberJs,
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
  appVerifier?: FirebaseAuthApplicationVerifier | null;
  forceResend?: boolean;
};

type NativeFirebaseAuthModule = typeof import('@react-native-firebase/auth');

export const DEMO_PHONE_OTP_CODE = '120120';
const FORCE_DEMO_PHONE_AUTH = true;

function shouldUseDemoPhoneAuth() {
  return (
    FORCE_DEMO_PHONE_AUTH ||
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
    Constants.appOwnership === 'expo'
  );
}

function getNativePhoneAuth() {
  if (shouldUseDemoPhoneAuth()) {
    return null;
  }

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

export function isDemoPhoneAuthEnabled() {
  return shouldUseDemoPhoneAuth() || (!getNativePhoneAuth() && !getFirebaseAuthInstance());
}

export function bootstrapFirebaseDemoAuth() {
  const auth = getFirebaseAuthInstance();

  if (!auth) {
    return Promise.resolve<string | null>(null);
  }

  return signInAnonymously(auth)
    .then((result) => result.user.uid)
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

  if (code === 'DEMO_CODE_INVALID') {
    return `The code did not match. For the demo, use ${DEMO_PHONE_OTP_CODE}.`;
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
  if (shouldUseDemoPhoneAuth()) {
    return () => undefined;
  }

  const nativePhoneAuth = getNativePhoneAuth();

  if (nativePhoneAuth) {
    return nativePhoneAuth.auth.onAuthStateChanged((user) => {
      onUser(
        user
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
      user
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

  if (shouldUseDemoPhoneAuth()) {
    return {
      displayPhoneNumber: formatPhoneNumberForDisplay(validation.normalizedPhoneNumber),
      normalizedPhoneNumber: validation.normalizedPhoneNumber,
      verificationId: validation.normalizedPhoneNumber,
    } satisfies PhoneVerificationRequest;
  }

  const nativePhoneAuth = getNativePhoneAuth();

  if (nativePhoneAuth) {
    const confirmation = await nativePhoneAuth.auth.signInWithPhoneNumber(
      validation.normalizedPhoneNumber,
      options?.forceResend ?? false,
    );

    return {
      displayPhoneNumber: formatPhoneNumberForDisplay(validation.normalizedPhoneNumber),
      normalizedPhoneNumber: validation.normalizedPhoneNumber,
      verificationId: confirmation.verificationId ?? validation.normalizedPhoneNumber,
    } satisfies PhoneVerificationRequest;
  }

  const auth = getFirebaseAuthInstance();

  if (!auth) {
    return {
      displayPhoneNumber: formatPhoneNumberForDisplay(validation.normalizedPhoneNumber),
      normalizedPhoneNumber: validation.normalizedPhoneNumber,
      verificationId: validation.normalizedPhoneNumber,
    } satisfies PhoneVerificationRequest;
  }

  if (!options?.appVerifier) {
    throw Object.assign(new Error('PHONE_AUTH_APP_VERIFIER_MISSING'), { code: 'PHONE_AUTH_APP_VERIFIER_MISSING' });
  }

  const confirmation = await signInWithPhoneNumberJs(auth, validation.normalizedPhoneNumber, options.appVerifier);

  return {
    displayPhoneNumber: formatPhoneNumberForDisplay(validation.normalizedPhoneNumber),
    normalizedPhoneNumber: validation.normalizedPhoneNumber,
    verificationId: confirmation.verificationId,
  } satisfies PhoneVerificationRequest;
}

export async function verifyPhoneOtp(input: {
  code: string;
  phoneNumber: string;
  verificationId: string;
}) {
  if (shouldUseDemoPhoneAuth()) {
    const validation = validateKazakhstanPhoneNumber(input.phoneNumber);
    const normalizedPhoneNumber = validation.normalizedPhoneNumber ?? input.phoneNumber;

    return {
      id: normalizedPhoneNumber,
      name: buildPhoneUserName(normalizedPhoneNumber),
      phoneNumber: normalizedPhoneNumber,
    } satisfies VerifiedPhoneUser;
  }

  const nativePhoneAuth = getNativePhoneAuth();

  if (nativePhoneAuth) {
    const credential = nativePhoneAuth.createAuth.PhoneAuthProvider.credential(input.verificationId, input.code.trim());
    const result = await nativePhoneAuth.auth.signInWithCredential(credential);

    return {
      id: result.user.uid,
      name: buildPhoneUserName(result.user.phoneNumber ?? input.phoneNumber),
      phoneNumber: result.user.phoneNumber ?? input.phoneNumber,
    } satisfies VerifiedPhoneUser;
  }

  const auth = getFirebaseAuthInstance();

  if (!auth) {
    const validation = validateKazakhstanPhoneNumber(input.phoneNumber);
    const normalizedPhoneNumber = validation.normalizedPhoneNumber ?? input.phoneNumber;

    return {
      id: normalizedPhoneNumber,
      name: buildPhoneUserName(normalizedPhoneNumber),
      phoneNumber: normalizedPhoneNumber,
    } satisfies VerifiedPhoneUser;
  }

  const credential = FirebasePhoneAuthProvider.credential(input.verificationId, input.code.trim());
  const result = await signInWithCredential(auth, credential);

  return {
    id: result.user.uid,
    name: buildPhoneUserName(result.user.phoneNumber ?? input.phoneNumber),
    phoneNumber: result.user.phoneNumber ?? input.phoneNumber,
  } satisfies VerifiedPhoneUser;
}

export async function signOutFirebaseSession() {
  const auth = getFirebaseAuthInstance();
  const nativePhoneAuth = getNativePhoneAuth();

  await Promise.allSettled([
    nativePhoneAuth ? nativePhoneAuth.auth.signOut() : Promise.resolve(),
    auth ? signOut(auth) : Promise.resolve(),
  ]);
}

export type NativeConfirmationResult = import('@react-native-firebase/auth').FirebaseAuthTypes.ConfirmationResult;
