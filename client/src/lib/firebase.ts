// Firebase configuration and initialization
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// Firebase configuration - using the values from .env
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase with error handling
let app;
let db;
let storage;
let auth;

try {
  // Check if Firebase is already initialized
  if (!app) {
    console.log('Initializing Firebase with config:', {
      projectId: firebaseConfig.projectId,
      storageBucket: firebaseConfig.storageBucket
    });
    
    app = initializeApp(firebaseConfig);
    console.log('Firebase app initialized successfully');
    
    // Initialize Firestore
    try {
      db = getFirestore(app);
      console.log('Firestore initialized successfully');
    } catch (firestoreError) {
      console.error('Failed to initialize Firestore:', firestoreError);
      db = null;
    }
    
    // Initialize Storage
    try {
      storage = getStorage(app);
      console.log('Firebase Storage initialized successfully');
    } catch (storageError) {
      console.error('Failed to initialize Firebase Storage:', storageError);
      storage = null;
    }
    
    // Initialize Auth
    try {
      auth = getAuth(app);
      console.log('Firebase Auth initialized successfully');
    } catch (authError) {
      console.error('Failed to initialize Firebase Auth:', authError);
      auth = null;
    }
  }
} catch (error) {
  console.error('Error initializing Firebase:', error);
  // Create fallback objects to prevent app crashes
  app = null;
  db = null;
  storage = null;
  auth = null;
}

export { app, db, storage, auth };