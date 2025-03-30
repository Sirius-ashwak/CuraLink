import express, { Request, Response } from 'express';
import { z } from 'zod';
import { twilioService } from '../services/twilioService';

const router = express.Router();

// Validation schema for token request
const tokenRequestSchema = z.object({
  identity: z.string().min(1, "Identity is required"),
  roomName: z.string().min(1, "Room name is required"),
});

/**
 * POST /api/video/token
 * Generate a Twilio video token for a user to join a room
 */
router.post('/token', async (req: Request, res: Response) => {
  try {
    // Check if Twilio is configured
    if (!twilioService.isConfigured()) {
      return res.status(500).json({ 
        error: 'Twilio is not properly configured. Missing credentials.' 
      });
    }

    // Validate request body
    const validationResult = tokenRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Invalid request',
        details: validationResult.error.format() 
      });
    }

    const { identity, roomName } = validationResult.data;
    
    // Generate token
    const token = twilioService.generateToken(identity, roomName);
    
    // Return the token
    return res.json({ token });
  } catch (error) {
    console.error('Error generating video token:', error);
    return res.status(500).json({ error: 'Failed to generate token' });
  }
});

/**
 * GET /api/video/status
 * Check if Twilio video service is configured properly
 */
router.get('/status', (_req: Request, res: Response) => {
  const isConfigured = twilioService.isConfigured();
  return res.json({ 
    configured: isConfigured,
    message: isConfigured 
      ? 'Twilio video service is configured properly' 
      : 'Twilio video service is not configured. Missing credentials.'
  });
});

export default router;