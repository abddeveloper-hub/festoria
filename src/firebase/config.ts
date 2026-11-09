import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, initializeFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, FirebaseStorage, connectStorageEmulator } from 'firebase/storage';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';

// Environment-configured Firebase credentials for project festoria-cd375
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'festoria-cd375.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'festoria-cd375',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'festoria-cd375.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '416271261412',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:416271261412:web:dd8f76c08c474a1fe516f1',
};

// Check if valid credentials have been provided
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey.trim() !== '' &&
  firebaseConfig.apiKey !== 'AIzaSyExampleKeyReplaceWithYours' &&
  firebaseConfig.projectId
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
export let storage: FirebaseStorage | null = null;
let analytics: Analytics | null = null;
export let firebaseInitError: Error | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  } catch (error: any) {
    console.error('[Firebase] Failed to initialize Firebase App:', error);
    firebaseInitError = error;
  }

  if (app) {
    try {
      auth = getAuth(app);
    } catch (authError: any) {
      console.error('[Firebase] Failed to initialize Firebase Auth:', authError);
      firebaseInitError = authError;
    }

    try {
      db = initializeFirestore(app, {
        ignoreUndefinedProperties: true
      });
    } catch (dbError) {
      try {
        db = getFirestore(app);
      } catch (fallbackError) {
        console.error('[Firebase] Failed to initialize Cloud Firestore:', dbError);
      }
    }

    try {
      storage = getStorage(app);
    } catch (storageError) {
      console.error('[Firebase] Failed to initialize Firebase Storage:', storageError);
    }

    // Initialize Analytics only in supported browser environments
    if (typeof window !== 'undefined') {
      isSupported().then((supported) => {
        if (supported && app) {
          try {
            analytics = getAnalytics(app);
            console.log('[Firebase] Analytics initialized successfully');
          } catch (analyticsErr) {
            console.warn('[Firebase] Analytics initialization skipped:', analyticsErr);
          }
        }
      }).catch(() => {
        // Analytics unsupported in this environment
      });
    }

    // Optional Emulator support for local development
    if (import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
      if (auth) {
        try {
          connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
        } catch (emuError) {
          console.warn('[Firebase] Auth Emulator connection failed:', emuError);
        }
      }
      if (db) {
        try {
          connectFirestoreEmulator(db, 'localhost', 8080);
        } catch (emuError) {
          console.warn('[Firebase] Firestore Emulator connection failed:', emuError);
        }
      }
    }

    console.log('[Firebase] Initialized successfully with project:', firebaseConfig.projectId);
  }
} else {
  console.info(
    '[Firebase] Project set to festoria-cd375. Currently in offline/demo fallback mode. To activate live Firebase, supply VITE_FIREBASE_API_KEY in .env.'
  );
}

export function getFirebaseAuth(): Auth | null {
  if (auth) return auth;
  if (!isFirebaseConfigured) return null;
  try {
    const targetApp = app || (getApps().length > 0 ? getApp() : initializeApp(firebaseConfig));
    auth = getAuth(targetApp);
    return auth;
  } catch (e: any) {
    console.error('[Firebase] getFirebaseAuth fallback failed:', e);
    return null;
  }
}

export function getFirebaseDb(): Firestore | null {
  if (db) return db;
  if (!isFirebaseConfigured) return null;
  try {
    const targetApp = app || (getApps().length > 0 ? getApp() : initializeApp(firebaseConfig));
    db = getFirestore(targetApp);
    return db;
  } catch (e: any) {
    console.error('[Firebase] getFirebaseDb fallback failed:', e);
    return null;
  }
}

export function getFirebaseStorage(): FirebaseStorage | null {
  if (storage) return storage;
  if (!isFirebaseConfigured) return null;
  try {
    const targetApp = app || (getApps().length > 0 ? getApp() : initializeApp(firebaseConfig));
    storage = getStorage(targetApp);
    return storage;
  } catch (e: any) {
    console.error('[Firebase] getFirebaseStorage fallback failed:', e);
    return null;
  }
}

export { app, auth, db, analytics };
export default app;
