// Client-side authentication service
import { User } from '@shared/schema';
import { apiRequest } from './queryClient';
import { auth, signInWithGoogle, getIdToken } from './googleCloud';

// Type for authentication response
interface AuthResponse {
  user: User;
  token: string;
}

/**
 * Register a new user
 */
export const registerUser = async (
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  role: 'patient' | 'doctor',
  specialty?: string
): Promise<User> => {
  try {
    // Register with our backend which will use Google Cloud
    const response = await apiRequest<AuthResponse>({
      url: '/api/auth/register',
      method: 'POST',
      data: {
        email,
        password,
        firstName,
        lastName,
        role,
        specialty
      }
    });
    
    // Store the token for future requests
    localStorage.setItem('authToken', response.token);
    
    return response.user;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

/**
 * Login an existing user
 */
export const loginUser = async (
  email: string,
  password: string
): Promise<User> => {
  try {
    // Login with our backend which will use Google Cloud
    const response = await apiRequest<AuthResponse>({
      url: '/api/auth/login',
      method: 'POST',
      data: {
        email,
        password
      }
    });
    
    // Store the token for future requests
    localStorage.setItem('authToken', response.token);
    
    return response.user;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

/**
 * Login with Google
 */
export const loginWithGoogle = async (): Promise<User | null> => {
  try {
    // First sign in with Google using Firebase
    const { user } = await signInWithGoogle();
    
    // Get the ID token
    const idToken = await user.getIdToken();
    
    // Now send this token to our backend
    const response = await apiRequest<AuthResponse>({
      url: '/api/auth/google',
      method: 'POST',
      data: {
        idToken
      }
    });
    
    // Store the token for future requests
    localStorage.setItem('authToken', response.token);
    
    return response.user;
  } catch (error) {
    console.error('Google login error:', error);
    return null;
  }
};

/**
 * Log out user
 */
export const logoutUser = async (): Promise<void> => {
  try {
    // Call the logout endpoint
    await apiRequest({
      url: '/api/auth/logout',
      method: 'POST'
    });
    
    // Remove the token from local storage
    localStorage.removeItem('authToken');
    
    // Also sign out from Firebase if used
    if (auth) {
      await auth.signOut();
    }
  } catch (error) {
    console.error('Logout error:', error);
  }
};

/**
 * Get current user
 */
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    // Check if we have a token
    const token = localStorage.getItem('authToken');
    if (!token) {
      return null;
    }
    
    // Call the me endpoint to get the current user
    const user = await apiRequest<User>({
      url: '/api/auth/me',
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return user;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
};

/**
 * Check if Google Auth is configured
 */
export const checkGoogleAuthStatus = async (): Promise<{ 
  googleAuthConfigured: boolean; 
  geminiConfigured: boolean;
}> => {
  try {
    const status = await apiRequest<{ 
      googleAuthConfigured: boolean; 
      geminiConfigured: boolean;
    }>({
      url: '/api/auth/status',
      method: 'GET'
    });
    
    return status;
  } catch (error) {
    console.error('Check Google Auth status error:', error);
    return { 
      googleAuthConfigured: false,
      geminiConfigured: false
    };
  }
};