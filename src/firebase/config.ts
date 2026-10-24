import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User, 
  Auth 
} from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

export interface FirebaseCustomConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
}

// 1. Resolve configuration from environment variables or localStorage override
export function getActiveFirebaseConfig(): FirebaseCustomConfig | null {
  const metaEnv = ((import.meta as unknown) as { env?: Record<string, string> }).env || {};
  const envConfig: FirebaseCustomConfig = {
    apiKey: (metaEnv.VITE_FIREBASE_API_KEY as string) || '',
    authDomain: (metaEnv.VITE_FIREBASE_AUTH_DOMAIN as string) || '',
    projectId: (metaEnv.VITE_FIREBASE_PROJECT_ID as string) || '',
    storageBucket: (metaEnv.VITE_FIREBASE_STORAGE_BUCKET as string) || '',
    messagingSenderId: (metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID as string) || '',
    appId: (metaEnv.VITE_FIREBASE_APP_ID as string) || '',
  };

  // Dynamic reconciliation: in Firebase, authDomain is standardly `<projectId>.firebaseapp.com`
  // If projectId has a typo (like accidental trailing letters) or is missing, derive it from authDomain
  if (envConfig.authDomain && envConfig.authDomain.endsWith('.firebaseapp.com')) {
    const canonicalProjectId = envConfig.authDomain.replace('.firebaseapp.com', '');
    if (!envConfig.projectId || (envConfig.projectId !== canonicalProjectId && envConfig.projectId.startsWith(canonicalProjectId))) {
      envConfig.projectId = canonicalProjectId;
    }
  }

  // Trim any accidental leading/trailing whitespace
  if (envConfig.projectId) {
    envConfig.projectId = envConfig.projectId.trim();
  }

  if (envConfig.apiKey && envConfig.projectId) {
    return envConfig;
  }

  // Fallback: check localStorage for manual configuration via the in-app modal
  try {
    const saved = localStorage.getItem('pinboard_firebase_config');
    if (saved) {
      const parsed = JSON.parse(saved) as FirebaseCustomConfig;
      if (parsed.authDomain && parsed.authDomain.endsWith('.firebaseapp.com')) {
        const canonicalProjectId = parsed.authDomain.replace('.firebaseapp.com', '');
        if (!parsed.projectId || (parsed.projectId !== canonicalProjectId && parsed.projectId.startsWith(canonicalProjectId))) {
          parsed.projectId = canonicalProjectId;
          localStorage.setItem('pinboard_firebase_config', JSON.stringify(parsed));
        }
      }
      if (parsed.projectId) {
        parsed.projectId = parsed.projectId.trim();
      }
      if (parsed.apiKey && parsed.projectId) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse local Firebase config', e);
  }

  return null;
}

export function isFirebaseConfigured(): boolean {
  return getActiveFirebaseConfig() !== null;
}

export function saveLocalFirebaseConfig(config: FirebaseCustomConfig) {
  localStorage.setItem('pinboard_firebase_config', JSON.stringify(config));
  window.location.reload();
}

export function clearLocalFirebaseConfig() {
  localStorage.removeItem('pinboard_firebase_config');
  window.location.reload();
}

// 2. Initialize Firebase instances conditionally
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

const config = getActiveFirebaseConfig();
if (config) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(config);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (error) {
    console.error('Firebase initialization error:', error);
  }
}

export { app, auth, db, googleProvider };

// Helper sign-in method
export async function signInWithGoogle(): Promise<User> {
  if (!auth) {
    throw new Error('Firebase Authentication is not configured. Please add your Firebase project credentials.');
  }
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

// Helper sign-out method
export async function signOutUser(): Promise<void> {
  if (!auth) return;
  await signOut(auth);
}
