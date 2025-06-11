import express, { Request, Response } from 'express';
import { geminiService } from '../services/geminiService';

const router = express.Router();

/**
 * POST /api/ai-chat
 * Send a message to the AI assistant and get a response
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { message, history = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get response from Gemini AI
    const response = await geminiService.getMedicalResponse(message, history);
    
    return res.status(200).json({ 
      message: response,
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    console.error('Error in AI chat endpoint:', error);
    return res.status(500).json({ error: 'Failed to process your request' });
  }
});

/**
 * POST /api/ai-chat/analyze-symptoms
 * Analyze symptoms and provide recommendations
 */
router.post('/analyze-symptoms', async (req: Request, res: Response) => {
  try {
    const { symptoms, description = '' } = req.body;

    if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
      return res.status(400).json({ error: 'Symptoms array is required' });
    }

    // Analyze symptoms with Gemini AI
    const analysis = await geminiService.analyzeSymptoms(symptoms, description);
    
    return res.status(200).json(analysis);
  } catch (error) {
    console.error('Error in symptom analysis endpoint:', error);
    return res.status(500).json({ error: 'Failed to analyze symptoms' });
  }
});

/**
 * GET /api/ai-chat/medicine-info/:name
 * Get information about a specific medicine
 */
router.get('/medicine-info/:name', async (req: Request, res: Response) => {
  try {
    const medicineName = req.params.name;

    if (!medicineName) {
      return res.status(400).json({ error: 'Medicine name is required' });
    }

    // Get medicine information with Gemini AI
    const medicineInfo = await geminiService.getMedicineInfo(medicineName);
    
    return res.status(200).json(medicineInfo);
  } catch (error) {
    console.error('Error in medicine info endpoint:', error);
    return res.status(500).json({ error: 'Failed to retrieve medicine information' });
  }
});

/**
 * POST /api/ai-chat/process-voice
 * Process and improve voice transcript using Gemini AI
 */
router.post('/process-voice', async (req: Request, res: Response) => {
  try {
    const { transcript } = req.body;

    if (!transcript || typeof transcript !== 'string') {
      return res.status(400).json({ error: 'Valid voice transcript is required' });
    }

    // Process voice transcript with Gemini AI
    const processedTranscript = await geminiService.processVoiceTranscript(transcript);
    
    return res.status(200).json({ 
      transcript: processedTranscript,
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    console.error('Error in voice processing endpoint:', error);
    return res.status(500).json({ error: 'Failed to process voice transcript' });
  }
});

/**
 * POST /api/ai-chat/analyze-image
 * Analyze a medical image using Gemini AI
 */
router.post('/analyze-image', async (req: Request, res: Response) => {
  try {
    const { imageData, description = '' } = req.body;

    if (!imageData || typeof imageData !== 'string') {
      return res.status(400).json({ error: 'Valid image data is required' });
    }

    // Analyze image with Gemini AI
    const analysis = await geminiService.analyzeImage(imageData, description);
    
    return res.status(200).json(analysis);
  } catch (error) {
    console.error('Error in image analysis endpoint:', error);
    return res.status(500).json({ error: 'Failed to analyze image' });
  }
});

export default router;