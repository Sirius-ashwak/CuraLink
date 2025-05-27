// Google Cloud configuration and initialization for client-side
import { FirebaseApp, initializeApp } from 'firebase/app';
import { Firestore, getFirestore } from 'firebase/firestore';
import { FirebaseStorage, getStorage } from 'firebase/storage';
import { 
  Auth, 
  User as FirebaseUser,
  UserCredential,
  GoogleAuthProvider, 
  getAuth, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  Unsubscribe,
  NextOrObserver
} from 'firebase/auth';

// Firebase configuration - using environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_GOOGLE_CLOUD_API_KEY,
  authDomain: `${import.meta.env.VITE_GOOGLE_CLOUD_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_GOOGLE_CLOUD_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_GOOGLE_CLOUD_PROJECT_ID}.appspot.com`,
  messagingSenderId: '', // Optional for our use case
  appId: '', // Optional for our use case
};

// Check if we have the required configuration
const isConfigured = Boolean(
  firebaseConfig.apiKey && 
  firebaseConfig.projectId
);

// Create mock implementations for when Firebase is not configured
const mockUnsubscribe: Unsubscribe = () => {};

// Initialize default empty values
let app: FirebaseApp | undefined;
let firestore: Firestore | undefined;
let storage: FirebaseStorage | undefined;
let auth: Auth | undefined;
let googleAuthProvider: GoogleAuthProvider | undefined;

// Initialize Firebase only if properly configured
if (isConfigured) {
  try {
    // Initialize Firebase
    app = initializeApp(firebaseConfig);
    
    // Initialize Firestore
    firestore = getFirestore(app);
    
    // Initialize Storage
    storage = getStorage(app);
    
    // Initialize Auth
    auth = getAuth(app);
    
    // Initialize Google Auth Provider
    googleAuthProvider = new GoogleAuthProvider();
    
    console.log('Firebase initialized successfully on client side');
  } catch (error) {
    console.error('Firebase initialization error:', error);
  }
} else {
  console.warn('Firebase configuration is incomplete. Client-side Firebase services will not be available.');
}

// Sign in with Google
const signInWithGoogle = async (): Promise<{ user: FirebaseUser; token: string | undefined }> => {
  if (!isConfigured) {
    throw new Error('Firebase Auth is not initialized');
  }
  
  try {
    const result: UserCredential = await signInWithPopup(auth, googleAuthProvider);
    // Get the Google Access Token
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;
    // The signed-in user info
    const user = result.user;
    
    return { user, token };
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

// Sign out
const signOut = async (): Promise<boolean> => {
  if (!isConfigured) {
    throw new Error('Firebase Auth is not initialized');
  }
  
  try {
    await firebaseSignOut(auth);
    return true;
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

// Get current user
const getCurrentUser = (): FirebaseUser | null => {
  return auth?.currentUser || null;
};

// Listen to auth state changes
const onAuthStateChanged = (callback: NextOrObserver<FirebaseUser>): Unsubscribe => {
  if (!isConfigured) {
    console.warn('Firebase Auth is not initialized');
    return mockUnsubscribe;
  }
  
  return auth.onAuthStateChanged(callback);
};

// Get ID token for backend authentication
const getIdToken = async (): Promise<string | null> => {
  const user = getCurrentUser();
  if (!user) {
    return null;
  }
  
  try {
    return await user.getIdToken();
  } catch (error) {
    console.error('Error getting ID token:', error);
    return null;
  }
};

export {
  app,
  firestore,
  storage,
  auth,
  googleAuthProvider,
  isConfigured,
  signInWithGoogle,
  signOut,
  getCurrentUser,
  onAuthStateChanged,
  getIdToken,
};