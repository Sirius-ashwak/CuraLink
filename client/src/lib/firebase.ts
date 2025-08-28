// Firebase configuration and initialization
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth, initializeAuth, browserLocalPersistence } from "firebase/auth";

// Firebase configuration - using the values from .env
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Log Firebase configuration for debugging (without sensitive values)
console.log('Firebase configuration:', {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? '✓ Set' : '✗ Not set',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? '✓ Set' : '✗ Not set',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ? '✓ Set' : '✗ Not set',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ? '✓ Set' : '✗ Not set',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ? '✓ Set' : '✗ Not set',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ? '✓ Set' : '✗ Not set'
});

// Initialize Firebase with error handling
let app;
let db;
let storage;
let auth;

try {
  // Check if Firebase is already initialized
  if (!app) {
    console.log('Initializing Firebase with project:', import.meta.env.VITE_FIREBASE_PROJECT_ID);
    console.log('Storage bucket:', import.meta.env.VITE_FIREBASE_STORAGE_BUCKET);
    
    app = initializeApp(firebaseConfig);
    console.log('✅ Firebase app initialized successfully');
    
    // Initialize Firestore
    try {
      db = getFirestore(app);
      console.log('✅ Firestore initialized successfully');
    } catch (firestoreError) {
      console.error('❌ Failed to initialize Firestore:', firestoreError);
      db = null;
    }
    
    // Initialize Storage
    try {
      storage = getStorage(app);
      console.log('✅ Firebase Storage initialized successfully');
    } catch (storageError) {
      console.error('❌ Failed to initialize Firebase Storage:', storageError);
      storage = null;
    }
    
    // Initialize Auth with more robust error handling
    try {
      // Use initializeAuth with local persistence
      auth = initializeAuth(app, {
        persistence: browserLocalPersistence
      });
      console.log('✅ Firebase Auth initialized successfully');
    } catch (authError) {
      console.error('❌ Failed to initialize Firebase Auth:', authError);
      
      // Detailed error logging
      if (authError instanceof Error) {
        console.error('Error details:', {
          name: authError.name,
          message: authError.message,
          stack: authError.stack
        });
      }
      
      auth = null;
    }
  }
} catch (error) {
  console.error('❌ Error initializing Firebase:', error);
  
  // Detailed error logging
  if (error instanceof Error) {
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
  }
  
  // Create fallback objects to prevent app crashes
  app = null;
  db = null;
  storage = null;
  auth = null;
}

export { app, db, storage, auth };