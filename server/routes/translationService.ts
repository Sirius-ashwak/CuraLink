import express, { Request, Response } from 'express';
import { translationService } from '../services/translationService';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

/**
 * POST /api/translation/text
 * Translate text between languages
 */
router.post('/text', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { text, targetLanguage, sourceLanguage } = req.body;
    
    if (!text || !targetLanguage) {
      return res.status(400).json({ error: 'Text and target language are required' });
    }
    
    const translation = await translationService.translateText(text, targetLanguage, sourceLanguage);
    res.json(translation);
  } catch (error) {
    console.error('Error translating text:', error);
    res.status(500).json({ error: 'Failed to translate text' });
  }
});

/**
 * POST /api/translation/detect
 * Detect the language of text
 */
router.post('/detect', async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    const language = await translationService.detectLanguage(text);
    res.json({ language });
  } catch (error) {
    console.error('Error detecting language:', error);
    res.status(500).json({ error: 'Failed to detect language' });
  }
});

/**
 * GET /api/translation/languages
 * Get list of supported languages
 */
router.get('/languages', async (req: Request, res: Response) => {
  try {
    const languages = await translationService.getSupportedLanguages();
    res.json(languages);
  } catch (error) {
    console.error('Error getting supported languages:', error);
    res.status(500).json({ error: 'Failed to get supported languages' });
  }
});

/**
 * POST /api/translation/conversation
 * Translate conversational messages in real-time
 */
router.post('/conversation', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { text, sourceLanguage, targetLanguage } = req.body;
    
    if (!text || !sourceLanguage || !targetLanguage) {
      return res.status(400).json({ error: 'Text, source language, and target language are required' });
    }
    
    const translation = await translationService.translateConversation(text, sourceLanguage, targetLanguage);
    res.json(translation);
  } catch (error) {
    console.error('Error translating conversation:', error);
    res.status(500).json({ error: 'Failed to translate conversation' });
  }
});

/**
 * POST /api/translation/medical
 * Translate medical content with specialized terminology
 */
router.post('/medical', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { text, sourceLanguage, targetLanguage } = req.body;
    
    if (!text || !sourceLanguage || !targetLanguage) {
      return res.status(400).json({ error: 'Text, source language, and target language are required' });
    }
    
    const translation = await translationService.translateMedicalContent(text, sourceLanguage, targetLanguage);
    res.json(translation);
  } catch (error) {
    console.error('Error translating medical content:', error);
    res.status(500).json({ error: 'Failed to translate medical content' });
  }
});

export default router;