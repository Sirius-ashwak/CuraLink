import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';

// Interface for authenticated request
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    email: string;
  };
}

/**
 * Auth middleware to protect routes
 * Verifies the JWT token in the request header
 */
export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Get token from header
    const token = req.headers.authorization?.split(' ')[1]; // Bearer token
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Verify token
    const decoded = authService.verifyToken(token);
    
    // Add user data to request
    req.user = decoded;
    
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

/**
 * Role-based authorization middleware
 * Ensures the authenticated user has the required role
 */
export const authorizeRole = (roles: string[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      // Get user from storage
      const { storage } = await import('../storage');
      const user = await storage.getUser(req.user.userId);
      
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }
      
      // Check if user has the required role
      if (!roles.includes(user.role)) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }
      
      next();
    } catch (error) {
      console.error('Authorization error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  };
};