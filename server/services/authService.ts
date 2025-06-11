import { authClient, verifyGoogleIdToken } from './googleCloudService';
import { OAuth2Client } from 'google-auth-library';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';
import { storage } from '../storage';
import { User, InsertUser } from '@shared/schema';

// JWT secret - in production, use a strong secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'telehealth-secret-key';
const TOKEN_EXPIRY = '7d'; // Token valid for 7 days

/**
 * Authentication Service - Handles user authentication with Google Cloud Identity Platform
 */
class AuthService {
  private oauth2Client: OAuth2Client;

  constructor() {
    this.oauth2Client = authClient;
  }

  /**
   * Register a new user
   */
  async registerUser(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: 'patient' | 'doctor';
    specialty?: string;
  }): Promise<{ user: User; token: string }> {
    try {
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      // Create the user data object
      const userInsertData: InsertUser = {
        email: userData.email,
        password: hashedPassword, // Store hashed password
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        profile: {
          avatar: '', // Default empty profile picture
        }
      };

      // If this is a doctor, add specialty to the user
      if (userData.role === 'doctor' && userData.specialty) {
        userInsertData.specialty = userData.specialty;
      }

      // Create user in our system
      const newUser = await storage.createUser(userInsertData);

      // If role is doctor, create a doctor record too
      if (userData.role === 'doctor') {
        await storage.createDoctor({
          userId: newUser.id,
          specialty: userData.specialty || 'General', // Default specialty
          isAvailable: true,
        });
      }

      // Generate JWT token
      const token = this.generateToken(newUser);

      return { user: newUser, token };
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  }

  /**
   * Login a user with email and password
   */
  async loginUser(credentials: {
    email: string;
    password: string;
  }): Promise<{ user: User; token: string }> {
    try {
      // Find user by email
      const user = await storage.getUserByEmail(credentials.email);
      if (!user) {
        throw new Error('Invalid credentials');
      }

      // Compare password
      const isMatch = await bcrypt.compare(credentials.password, user.password);
      if (!isMatch) {
        throw new Error('Invalid credentials');
      }

      // Generate JWT token
      const token = this.generateToken(user);

      return { user, token };
    } catch (error) {
      console.error('Error logging in user:', error);
      throw error;
    }
  }

  /**
   * Authenticate with Google (OAuth)
   */
  async authenticateWithGoogle(idToken: string): Promise<{ user: User; token: string }> {
    try {
      // Verify the Google ID token
      const payload = await verifyGoogleIdToken(idToken);
      if (!payload) {
        throw new Error('Invalid Google ID token');
      }

      // Check if user exists in our system
      let user = await storage.getUserByEmail(payload.email as string);

      // If not, create a new user
      if (!user) {
        // Create the user data object
        const userInsertData: InsertUser = {
          email: payload.email as string,
          password: '', // No password for Google-authenticated users
          firstName: payload.given_name as string || '',
          lastName: payload.family_name as string || '',
          role: 'patient', // Default role
          profile: {
            avatar: payload.picture as string || '',
          }
        };

        user = await storage.createUser(userInsertData);
      }

      // Generate JWT token
      const token = this.generateToken(user);

      return { user, token };
    } catch (error) {
      console.error('Error authenticating with Google:', error);
      throw error;
    }
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): { userId: number; email: string } {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; email: string };
      return decoded;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  /**
   * Generate JWT token
   */
  private generateToken(user: User): string {
    return jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );
  }
}

// Export a singleton instance
export const authService = new AuthService();