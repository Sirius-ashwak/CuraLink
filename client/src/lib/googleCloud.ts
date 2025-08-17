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

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || ''
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

// Log configuration status (without sensitive values)
console.log('Firebase configuration status:', {
  apiKeyProvided: Boolean(firebaseConfig.apiKey),
  authDomainProvided: Boolean(firebaseConfig.authDomain),
  projectIdProvided: Boolean(firebaseConfig.projectId),
  storageBucketProvided: Boolean(firebaseConfig.storageBucket),
  isConfigured
});

// Initialize Firebase only if properly configured
if (isConfigured) {
  try {
    // Initialize Firebase
    app = initializeApp(firebaseConfig);
    console.log('Firebase app initialized');
    
    // Initialize Firestore
    firestore = getFirestore(app);
    console.log('Firestore initialized');
    
    // Initialize Storage
    storage = getStorage(app);
    console.log('Firebase Storage initialized');
    
    // Initialize Auth
    auth = getAuth(app);
    console.log('Firebase Auth initialized');
    
    // Initialize Google Auth Provider
    googleAuthProvider = new GoogleAuthProvider();
    console.log('Google Auth Provider initialized');
    
    console.log('Firebase initialized successfully on client side');
  } catch (error) {
    console.error('Firebase initialization error:', error);
    
    // Create a mock Firestore for development
    console.warn('Creating mock Firestore for development');
    
    // This is a very basic mock that allows the app to run without Firebase
    // It won't persist data or provide real-time updates
    firestore = {
      collection: () => ({
        doc: () => ({
          get: async () => ({
            exists: false,
            data: () => null
          }),
          set: async () => {},
          update: async () => {}
        }),
        where: () => ({
          get: async () => ({
            empty: true,
            docs: []
          })
        }),
        add: async () => ({
          id: 'mock-id-' + Date.now()
        })
      })
    } as unknown as Firestore;
  }
} else {
  console.warn('Firebase configuration is incomplete. Using mock Firebase services for development.');
  console.warn('Please check your .env file and make sure VITE_FIREBASE_API_KEY and VITE_FIREBASE_PROJECT_ID are set.');
  
  // Create a mock Firestore for development
  firestore = {
    collection: () => ({
      doc: () => ({
        get: async () => ({
          exists: false,
          data: () => null
        }),
        set: async () => {},
        update: async () => {}
      }),
      where: () => ({
        get: async () => ({
          empty: true,
          docs: []
        })
      }),
      add: async () => ({
        id: 'mock-id-' + Date.now()
      })
    })
  } as unknown as Firestore;
}

// Sign in with Google
const signInWithGoogle = async (): Promise<{ user: FirebaseUser; token: string | undefined }> => {
  if (!isConfigured || !auth || !googleAuthProvider) {
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
  if (!isConfigured || !auth) {
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
  if (!isConfigured || !auth) {
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