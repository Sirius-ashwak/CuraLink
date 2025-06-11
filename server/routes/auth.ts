import express, { Request, Response } from 'express';
import { z } from 'zod';
import { insertUserSchema } from '@shared/schema';
import { storage } from '../storage';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Registration schema extending the insertUserSchema
const registerSchema = insertUserSchema.extend({
  password: z.string().min(6),
  specialty: z.string().optional(),
});

// Login schema
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/**
 * POST /api/auth/register
 * Register a new user in both local database and Firebase Authentication
 */

router.post('/register', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = registerSchema.parse(req.body);
    const { email, password, firstName, lastName, role, specialty } = validatedData;
    
    // Check if user already exists
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }
    
    // Client-side Firebase Authentication will handle user creation
    // Server only stores additional profile data
    console.log('Creating user profile for Firebase authenticated user');
    
    // Hash the password for local storage
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user in local database
    const user = await storage.createUser({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: role as 'patient' | 'doctor'
    });
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );
    
    // If user is a doctor, create doctor profile
    if (role === 'doctor' && specialty) {
      await storage.createDoctor({
        userId: user.id,
        specialty,
        isAvailable: true,
        averageRating: 0,
        reviewCount: 0,
      });
    }
    
    // Return the user and token (excluding password)
    const { password: _, ...userWithoutPassword } = user;
    return res.status(201).json({
      user: userWithoutPassword,
      token,
      message: 'User successfully registered with secure local authentication'
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    return res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = loginSchema.parse(req.body);
    const { email, password } = validatedData;
    
    // Find user by email
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );
    
    // Return the user and token (excluding password)
    const { password: _, ...userWithoutPassword } = user;
    return res.status(200).json({
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    return res.status(500).json({ error: 'Login failed' });
  }
});

// Google login schema
const googleLoginSchema = z.object({
  idToken: z.string(),
});

/**
 * POST /api/auth/google
 * Login or register with Google
 */
router.post('/google', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = googleLoginSchema.parse(req.body);
    const { idToken } = validatedData;
    
    // Authenticate with Google
    const result = await authService.authenticateWithGoogle(idToken);
    
    // Return the user and token (excluding password)
    const { password: _, ...userWithoutPassword } = result.user;
    return res.status(200).json({
      user: userWithoutPassword,
      token: result.token
    });
  } catch (error) {
    console.error('Google authentication error:', error);
    return res.status(400).json({ error: error.message || 'Google authentication failed' });
  }
});

/**
 * POST /api/auth/logout
 * Logout the current user
 */
router.post('/logout', (req: Request, res: Response) => {
  // In a JWT-based auth system, the client simply discards the token
  // For enhanced security in a production app, you could implement token blacklisting
  return res.status(200).json({ message: 'Logged out successfully' });
});

/**
 * GET /api/auth/me
 * Get the current authenticated user
 */
router.get('/me', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Get user from storage using the user ID from the verified token
    const user = await storage.getUser(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Return the user (excluding password)
    const { password: _, ...userWithoutPassword } = user;
    return res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error('Get current user error:', error);
    return res.status(500).json({ error: error.message || 'Failed to get current user' });
  }
});

/**
 * GET /api/auth/status
 * Check the status of Google Cloud Auth
 */
router.get('/status', (req: Request, res: Response) => {
  const googleCloudConfigured = process.env.GOOGLE_CLOUD_API_KEY && 
                             process.env.GOOGLE_CLOUD_CLIENT_ID && 
                             process.env.GOOGLE_CLOUD_CLIENT_SECRET;
  
  return res.status(200).json({
    googleAuthConfigured: !!googleCloudConfigured,
    geminiConfigured: !!process.env.GEMINI_API_KEY,
  });
});

export default router;