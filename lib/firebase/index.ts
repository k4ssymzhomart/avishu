import { type FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { Platform } from 'react-native';

import firebaseCompat from 'firebase/compat/app';
import 'firebase/compat/auth';

import { firebaseConfig, hasFirebaseConfig } from '@/lib/firebase/config';

if (Platform.OS === 'web' && hasFirebaseConfig) {
  if (!firebaseCompat.apps.length) {
    firebaseCompat.initializeApp(firebaseConfig);
  }
}

let cachedApp: FirebaseApp | null = null;
let cachedAuth: Auth | null | undefined;
let cachedFirestore: Firestore | null | undefined;

export function getFirebaseAppInstance() {
  if (!hasFirebaseConfig) {
    return null;
  }

  if (cachedApp) {
    return cachedApp;
  }

  cachedApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return cachedApp;
}

export function getFirebaseAuthInstance(): Auth | null {
  const app = getFirebaseAppInstance();

  if (!app) {
    return null;
  }

  if (cachedAuth !== undefined) {
    return cachedAuth;
  }

  if (Platform.OS !== 'web') {
    try {
      const firebaseAuthModule = require('@firebase/auth') as {
        getReactNativePersistence?: (storage: unknown) => unknown;
      };
      const asyncStorageModule = require('@react-native-async-storage/async-storage');
      const asyncStorage = asyncStorageModule.default ?? asyncStorageModule;
      const reactNativePersistence = firebaseAuthModule.getReactNativePersistence;

      if (typeof reactNativePersistence !== 'function') {
        throw new Error('REACT_NATIVE_PERSISTENCE_UNAVAILABLE');
      }

      cachedAuth = initializeAuth(app, {
        persistence: reactNativePersistence(asyncStorage) as never,
      });

      return cachedAuth;
    } catch {
      cachedAuth = getAuth(app);
      return cachedAuth;
    }
  }

  cachedAuth = getAuth(app);
  return cachedAuth;
}

export function getFirestoreInstance(): Firestore | null {
  const app = getFirebaseAppInstance();

  if (!app) {
    return null;
  }

  if (cachedFirestore !== undefined) {
    return cachedFirestore;
  }

  cachedFirestore = getFirestore(app);
  return cachedFirestore;
}

export { firebaseConfig, hasFirebaseConfig };
