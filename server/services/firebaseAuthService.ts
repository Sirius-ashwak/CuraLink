import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import * as fs from 'fs';
import * as path from 'path';

let firebaseInitialized = false;

function initializeFirebaseAdmin() {
  if (firebaseInitialized || getApps().length > 0) {
    return;
  }

  try {
    // Use environment variables for Firebase config
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
    
    if (!projectId) {
      throw new Error('Firebase project ID not found in environment variables');
    }

    // Try to use GOOGLE_APPLICATION_CREDENTIALS if set
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      const credentialsPath = path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS);
      if (fs.existsSync(credentialsPath)) {
        const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
        
        initializeApp({
          credential: cert(credentials),
          projectId: projectId
        });
        
        console.log('✅ Firebase Admin initialized with service account from GOOGLE_APPLICATION_CREDENTIALS');
        firebaseInitialized = true;
        return;
      }
    }

    // Fallback: try local credentials file
    const serviceAccountPath = path.join(process.cwd(), 'google-cloud-credentials.json');
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      
      initializeApp({
        credential: cert(serviceAccount),
        projectId: projectId
      });
      
      console.log('✅ Firebase Admin initialized with local service account file');
      firebaseInitialized = true;
      return;
    }

    // Last resort: try environment variables
    const clientEmail = `firebase-adminsdk@${projectId}.iam.gserviceaccount.com`;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    
    if (privateKey) {
      initializeApp({
        credential: cert({
          projectId: projectId,
          clientEmail: clientEmail,
          privateKey: privateKey
        })
      });
      
      console.log('✅ Firebase Admin initialized with environment variables');
      firebaseInitialized = true;
    } else {
      throw new Error('No valid Firebase credentials found');
    }
    
  } catch (error) {
    console.error('❌ Firebase Admin initialization failed:', error);
    console.error('Available environment variables:', {
      GOOGLE_CLOUD_PROJECT_ID: !!process.env.GOOGLE_CLOUD_PROJECT_ID,
      VITE_FIREBASE_PROJECT_ID: !!process.env.VITE_FIREBASE_PROJECT_ID,
      GOOGLE_APPLICATION_CREDENTIALS: !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
      FIREBASE_PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY
    });
  }
}

export class FirebaseAuthService {
  static async createUser(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
    specialty?: string;
  }) {
    try {
      // Ensure Firebase is initialized before using it
      initializeFirebaseAdmin();
      
      if (getApps().length === 0) {
        throw new Error('Firebase Admin failed to initialize');
      }
      
      const auth = getAuth();
      
      // Create user in Firebase Authentication
      const firebaseUser = await auth.createUser({
        email: userData.email,
        password: userData.password,
        displayName: `${userData.firstName} ${userData.lastName}`,
        emailVerified: false
      });
      
      // Set custom claims for role-based access
      await auth.setCustomUserClaims(firebaseUser.uid, {
        role: userData.role,
        specialty: userData.specialty || null,
        firstName: userData.firstName,
        lastName: userData.lastName
      });
      
      console.log('Firebase user created successfully:', firebaseUser.uid);
      return firebaseUser;
    } catch (error) {
      console.error('Firebase user creation error:', error);
      throw error;
    }
  }

  static async deleteUser(uid: string) {
    try {
      // Ensure Firebase is initialized before using it
      initializeFirebaseAdmin();
      
      if (getApps().length === 0) {
        throw new Error('Firebase Admin failed to initialize');
      }
      
      const auth = getAuth();
      await auth.deleteUser(uid);
      console.log('Firebase user deleted successfully:', uid);
    } catch (error) {
      console.error('Firebase user deletion error:', error);
      throw error;
    }
  }
}