import { type FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

import { firebaseConfig, hasFirebaseConfig } from '@/lib/firebase/config';

let cachedApp: FirebaseApp | null = null;

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
  return app ? getAuth(app) : null;
}

export function getFirestoreInstance(): Firestore | null {
  const app = getFirebaseAppInstance();
  return app ? getFirestore(app) : null;
}

export { firebaseConfig, hasFirebaseConfig };
