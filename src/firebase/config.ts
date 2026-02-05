import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getMessaging, Messaging, isSupported } from 'firebase/messaging';

// Firebase configuration - replace these values with your project's config
// Get these from: Firebase Console > Project Settings > General > Your apps > Web app
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

// VAPID key for push notifications
// Get this from: Firebase Console > Project Settings > Cloud Messaging > Web Push certificates
export const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || '';

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let messaging: Messaging | null = null;

export function isFirebaseConfigured(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.messagingSenderId &&
    VAPID_KEY
  );
}

export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase is not configured. Please add your Firebase config to .env file.');
    }
    app = initializeApp(firebaseConfig);
  }
  return app;
}

export function getFirestoreDB(): Firestore {
  if (!db) {
    db = getFirestore(getFirebaseApp());
  }
  return db;
}

export async function getFirebaseMessaging(): Promise<Messaging | null> {
  if (messaging) return messaging;

  const supported = await isSupported();
  if (!supported) {
    console.warn('Firebase Messaging is not supported in this browser');
    return null;
  }

  messaging = getMessaging(getFirebaseApp());
  return messaging;
}

// Generate a unique device ID for this browser
export function getDeviceId(): string {
  let deviceId = localStorage.getItem('goal-game-device-id');
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem('goal-game-device-id', deviceId);
  }
  return deviceId;
}
