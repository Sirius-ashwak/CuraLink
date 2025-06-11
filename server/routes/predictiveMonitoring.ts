import express, { Request, Response } from 'express';
import { predictiveMonitoring } from '../services/predictiveMonitoring';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

/**
 * GET /api/predictive-monitoring/vitals/:userId
 * Get patient vitals for predictive monitoring
 */
router.get('/vitals/:userId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const days = req.query.days ? parseInt(req.query.days as string) : 30;
    
    const vitals = await predictiveMonitoring.getPatientVitals(userId, days);
    res.json(vitals);
  } catch (error) {
    console.error('Error fetching patient vitals:', error);
    res.status(500).json({ error: 'Failed to fetch patient vitals' });
  }
});

/**
 * POST /api/predictive-monitoring/analyze/:userId
 * Analyze patient vitals and generate predictions
 */
router.post('/analyze/:userId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.params;
    
    // First get the patient's vitals
    const vitals = await predictiveMonitoring.getPatientVitals(userId);
    
    // Then analyze them
    const predictions = await predictiveMonitoring.analyzeVitals(userId, vitals);
    res.json(predictions);
  } catch (error) {
    console.error('Error analyzing patient vitals:', error);
    res.status(500).json({ error: 'Failed to analyze patient vitals' });
  }
});

/**
 * GET /api/predictive-monitoring/notifications/:userId
 * Get high-risk notifications for a patient
 */
router.get('/notifications/:userId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const notifications = await predictiveMonitoring.getHighRiskNotifications(userId);
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

export default router;