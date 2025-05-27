import express, { Request, Response } from 'express';
import { personalizedRecommendations } from '../services/personalizedRecommendations';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

/**
 * POST /api/recommendations/generate/:userId
 * Generate personalized healthcare recommendations for a user
 */
router.post('/generate/:userId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.params;
    
    // Get the user's health profile
    const healthProfile = await personalizedRecommendations.getUserHealthProfile(userId);
    
    // Generate recommendations based on the profile
    const recommendations = await personalizedRecommendations.generateRecommendations(userId, healthProfile);
    
    res.json(recommendations);
  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

/**
 * POST /api/recommendations/profile/:userId
 * Update user health profile with custom data
 */
router.post('/profile/:userId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const healthProfile = req.body;
    
    // First get existing profile
    const existingProfile = await personalizedRecommendations.getUserHealthProfile(userId);
    
    // Then generate recommendations with merged profile
    const recommendations = await personalizedRecommendations.generateRecommendations(userId, {
      ...existingProfile,
      ...healthProfile
    });
    
    res.json(recommendations);
  } catch (error) {
    console.error('Error generating recommendations with custom profile:', error);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

/**
 * GET /api/recommendations/:userId
 * Get active recommendations for a user
 */
router.get('/:userId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const recommendations = await personalizedRecommendations.getUserRecommendations(userId);
    res.json(recommendations);
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

/**
 * PATCH /api/recommendations/:recommendationId/viewed
 * Mark a recommendation as viewed
 */
router.patch('/:recommendationId/viewed', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { recommendationId } = req.params;
    await personalizedRecommendations.markRecommendationViewed(recommendationId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking recommendation as viewed:', error);
    res.status(500).json({ error: 'Failed to update recommendation' });
  }
});

/**
 * PATCH /api/recommendations/:recommendationId/completed
 * Mark a recommendation as completed
 */
router.patch('/:recommendationId/completed', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { recommendationId } = req.params;
    await personalizedRecommendations.markRecommendationCompleted(recommendationId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking recommendation as completed:', error);
    res.status(500).json({ error: 'Failed to update recommendation' });
  }
});

export default router;