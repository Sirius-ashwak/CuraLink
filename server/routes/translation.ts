import { Router, Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { secretManagerService } from '../services/secretManagerService';

const router = Router();

// Initialize Gemini AI for fallback translation
let genAI: GoogleGenerativeAI | null = null;

// Initialize Gemini API
const initializeGemini = async () => {
  try {
    const apiKey = await secretManagerService.getSecret('GEMINI_API_KEY');
    if (apiKey) {
      genAI = new GoogleGenerativeAI(apiKey);
      console.log('Gemini API initialized for translation fallback');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to initialize Gemini API for translation:', error);
    return false;
  }
};

// Initialize on startup
initializeGemini();

/**
 * GET /api/translation/status
 * Check if the translation API is available
 */
router.get('/status', async (_req: Request, res: Response) => {
  try {
    // Check if Google Cloud Translation API is configured
    const apiKey = await secretManagerService.getSecret('GOOGLE_CLOUD_API_KEY');
    const projectId = await secretManagerService.getSecret('GOOGLE_CLOUD_PROJECT_ID');
    
    const isConfigured = Boolean(apiKey && projectId);
    
    // Check if Gemini is available as fallback
    const geminiAvailable = Boolean(genAI);
    
    res.json({
      available: isConfigured || geminiAvailable,
      primaryApi: isConfigured ? 'Google Cloud Translation API' : null,
      fallbackApi: geminiAvailable ? 'Gemini AI' : null,
      status: isConfigured ? 'ready' : (geminiAvailable ? 'fallback' : 'unavailable')
    });
  } catch (error) {
    console.error('Error checking translation API status:', error);
    res.status(500).json({ error: 'Failed to check translation API status' });
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
    
    // Use Gemini as fallback for language detection
    if (genAI) {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      
      const prompt = `
        Detect the language of this text and respond with ONLY the ISO 639-1 language code (e.g., 'en' for English, 'es' for Spanish, etc.):
        
        "${text}"
        
        Respond with ONLY the two-letter language code.
      `;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const language = response.text().trim().toLowerCase();
      
      // Validate that we got a proper language code (2 letters)
      const languageCode = language.match(/^[a-z]{2}$/) ? language : 'en';
      
      return res.json({ language: languageCode });
    }
    
    // Fallback to English if no detection method is available
    res.json({ language: 'en' });
  } catch (error) {
    console.error('Error detecting language:', error);
    res.status(500).json({ error: 'Failed to detect language' });
  }
});

/**
 * POST /api/translation/text
 * Translate text between languages
 */
router.post('/text', async (req: Request, res: Response) => {
  try {
    const { text, sourceLanguage, targetLanguage } = req.body;
    
    if (!text || !targetLanguage) {
      return res.status(400).json({ error: 'Text and target language are required' });
    }
    
    // Use Gemini as fallback for translation
    if (genAI) {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      
      const prompt = `
        Translate the following text from ${sourceLanguage || 'auto-detected language'} to ${targetLanguage}:
        
        "${text}"
        
        Respond with ONLY the translated text, no explanations or additional text.
      `;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const translatedText = response.text().trim();
      
      return res.json({
        originalText: text,
        translatedText,
        sourceLanguage: sourceLanguage || 'auto',
        targetLanguage,
        timestamp: new Date()
      });
    }
    
    // If no translation method is available
    res.status(503).json({ error: 'Translation service is not available' });
  } catch (error) {
    console.error('Error translating text:', error);
    res.status(500).json({ error: 'Failed to translate text' });
  }
});

/**
 * POST /api/translation/medical
 * Translate medical content with specialized terminology
 */
router.post('/medical', async (req: Request, res: Response) => {
  try {
    const { text, sourceLanguage, targetLanguage } = req.body;
    
    if (!text || !sourceLanguage || !targetLanguage) {
      return res.status(400).json({ error: 'Text, source language, and target language are required' });
    }
    
    // Use Gemini for medical translation
    if (genAI) {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      
      const prompt = `
        Translate the following medical text from ${sourceLanguage} to ${targetLanguage}. 
        Maintain all medical terminology and ensure accuracy for healthcare context:
        
        "${text}"
        
        Respond with ONLY the translated text, no explanations or additional text.
      `;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const translatedText = response.text().trim();
      
      return res.json({
        originalText: text,
        translatedText,
        sourceLanguage,
        targetLanguage,
        timestamp: new Date()
      });
    }
    
    // If no translation method is available
    res.status(503).json({ error: 'Translation service is not available' });
  } catch (error) {
    console.error('Error translating medical content:', error);
    res.status(500).json({ error: 'Failed to translate medical content' });
  }
});

export default router;