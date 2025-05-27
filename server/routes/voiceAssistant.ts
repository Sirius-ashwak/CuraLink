import express, { Request, Response } from 'express';
import { voiceAssistant } from '../services/voiceAssistant';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

const router = express.Router();

// Set up multer for audio file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      // Store uploads in a temporary directory
      const tempDir = path.join(os.tmpdir(), 'audio-uploads');
      
      // Ensure directory exists
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      cb(null, tempDir);
    },
    filename: (req, file, cb) => {
      // Generate unique filename
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + '-' + file.originalname);
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024 // Limit to 10 MB
  }
});

/**
 * POST /api/voice-assistant/speech-to-text
 * Convert speech audio to text
 */
router.post('/speech-to-text', upload.single('audio'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file uploaded' });
    }

    const languageCode = req.body.languageCode || 'en-US';
    
    // Read file into buffer
    const audioBuffer = fs.readFileSync(req.file.path);
    
    // Process the audio
    const speechResult = await voiceAssistant.speechToText(audioBuffer, languageCode);
    
    // Clean up the temporary file
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Error deleting temporary file:', err);
    });
    
    res.json(speechResult);
  } catch (error) {
    console.error('Error processing speech:', error);
    res.status(500).json({ error: 'Failed to process speech' });
  }
});

/**
 * POST /api/voice-assistant/process-query
 * Process a medical voice query and generate a response
 */
router.post('/process-query', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }
    
    const response = await voiceAssistant.processMedicalVoiceQuery(query);
    res.json(response);
  } catch (error) {
    console.error('Error processing medical query:', error);
    res.status(500).json({ error: 'Failed to process medical query' });
  }
});

/**
 * POST /api/voice-assistant/process-audio-query
 * Process an audio file containing a medical query
 */
router.post('/process-audio-query', upload.single('audio'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file uploaded' });
    }

    const languageCode = req.body.languageCode || 'en-US';
    
    // Process the audio query
    const response = await voiceAssistant.processAudioQuery(req.file.path, languageCode);
    
    // Clean up the temporary file
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Error deleting temporary file:', err);
    });
    
    res.json(response);
  } catch (error) {
    console.error('Error processing audio query:', error);
    res.status(500).json({ error: 'Failed to process audio query' });
  }
});

export default router;