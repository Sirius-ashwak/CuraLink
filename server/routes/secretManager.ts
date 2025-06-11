/**
 * Secret Manager API Routes
 * Provides a secure way to manage API keys and sensitive credentials
 */

import { Router, Request, Response } from 'express';
import { secretManagerService } from '../services/secretManagerService';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

/**
 * GET /api/secrets/status
 * Check if Secret Manager is properly configured
 */
router.get('/status', async (_req: Request, res: Response) => {
  try {
    const status = secretManagerService.getStatus();
    return res.status(200).json(status);
  } catch (error) {
    console.error('Error checking Secret Manager status:', error);
    return res.status(500).json({ error: 'Failed to check Secret Manager status' });
  }
});

/**
 * GET /api/secrets/:name
 * Get a secret value (admin only)
 */
router.get('/:name', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // This would need proper role-based authorization in production
    // In a real app, you'd check if the user has admin privileges
    
    const { name } = req.params;
    const value = await secretManagerService.getSecret(name);
    
    // Don't return the actual value, just confirmation that it exists
    return res.status(200).json({ 
      name, 
      exists: !!value,
      length: value ? value.length : 0
    });
  } catch (error) {
    console.error('Error getting secret:', error);
    return res.status(500).json({ error: 'Failed to get secret' });
  }
});

/**
 * POST /api/secrets/:name
 * Create or update a secret (admin only)
 */
router.post('/:name', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // This would need proper role-based authorization in production
    // In a real app, you'd check if the user has admin privileges
    
    const { name } = req.params;
    const { value } = req.body;
    
    if (!value) {
      return res.status(400).json({ error: 'Secret value is required' });
    }
    
    const success = await secretManagerService.setSecret(name, value);
    
    if (success) {
      return res.status(200).json({ 
        name,
        success: true,
        message: 'Secret stored successfully'
      });
    } else {
      return res.status(500).json({ error: 'Failed to store secret' });
    }
  } catch (error) {
    console.error('Error setting secret:', error);
    return res.status(500).json({ error: 'Failed to set secret' });
  }
});

export default router;