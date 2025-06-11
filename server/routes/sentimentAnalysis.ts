import express, { Request, Response } from 'express';
import { sentimentAnalysis } from '../services/sentimentAnalysis';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

/**
 * POST /api/sentiment/analyze
 * Analyze patient feedback for sentiment and key entities
 */
router.post('/analyze', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { patientId, doctorId, feedbackText, appointmentId } = req.body;
    
    if (!patientId || !doctorId || !feedbackText) {
      return res.status(400).json({ error: 'Patient ID, doctor ID, and feedback text are required' });
    }
    
    const analysis = await sentimentAnalysis.analyzeFeedback(patientId, doctorId, feedbackText, appointmentId);
    res.json(analysis);
  } catch (error) {
    console.error('Error analyzing feedback:', error);
    res.status(500).json({ error: 'Failed to analyze feedback' });
  }
});

/**
 * GET /api/sentiment/doctor/:doctorId/trends
 * Get sentiment analysis trends for a doctor
 */
router.get('/doctor/:doctorId/trends', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { doctorId } = req.params;
    const days = req.query.days ? parseInt(req.query.days as string) : 30;
    
    const trends = await sentimentAnalysis.getDoctorSentimentTrends(doctorId, days);
    res.json(trends);
  } catch (error) {
    console.error('Error getting doctor sentiment trends:', error);
    res.status(500).json({ error: 'Failed to get doctor sentiment trends' });
  }
});

/**
 * GET /api/sentiment/doctor/:doctorId/themes
 * Analyze and extract common themes from patient feedback
 */
router.get('/doctor/:doctorId/themes', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { doctorId } = req.params;
    const days = req.query.days ? parseInt(req.query.days as string) : 90;
    
    const themes = await sentimentAnalysis.analyzeFeedbackThemes(doctorId, days);
    res.json(themes);
  } catch (error) {
    console.error('Error analyzing feedback themes:', error);
    res.status(500).json({ error: 'Failed to analyze feedback themes' });
  }
});

export default router;