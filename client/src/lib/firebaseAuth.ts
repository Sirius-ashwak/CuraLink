// Firebase Authentication service for secure client-side auth
import { auth } from './firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'patient' | 'doctor';
  specialty?: string;
}

// Register new user with Firebase Authentication
export const registerWithFirebase = async (userData: RegisterData): Promise<FirebaseUser> => {
  try {
    if (!auth) {
      throw new Error('Firebase Auth is not initialized');
    }
    
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      userData.email, 
      userData.password
    );
    
    // Update the user's display name
    await updateProfile(userCredential.user, {
      displayName: `${userData.firstName} ${userData.lastName}`
    });
    
    console.log('✅ Firebase user created successfully:', userCredential.user.uid);
    return userCredential.user;
  } catch (error) {
    console.error('❌ Firebase registration error:', error);
    throw error;
  }
};

// Sign in existing user
export const signInWithFirebase = async (email: string, password: string): Promise<FirebaseUser> => {
  try {
    if (!auth) {
      throw new Error('Firebase Auth is not initialized');
    }
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('✅ Firebase sign-in successful:', userCredential.user.uid);
    return userCredential.user;
  } catch (error) {
    console.error('❌ Firebase sign-in error:', error);
    throw error;
  }
};

// Sign out user
export const signOutFirebase = async (): Promise<void> => {
  try {
    if (!auth) {
      throw new Error('Firebase Auth is not initialized');
    }
    
    await signOut(auth);
    console.log('✅ Firebase sign-out successful');
  } catch (error) {
    console.error('❌ Firebase sign-out error:', error);
    throw error;
  }
};

// Get current user
export const getCurrentFirebaseUser = (): FirebaseUser | null => {
  return auth?.currentUser || null;
};