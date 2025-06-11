import { Router } from 'express';
import { SpeechClient } from '@google-cloud/speech';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Initialize Google Cloud Speech client
const speechClient = new SpeechClient({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

// Speech-to-text endpoint
router.post('/speech-to-text', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const audioBytes = req.file.buffer.toString('base64');

    const request = {
      audio: {
        content: audioBytes,
      },
      config: {
        encoding: 'WEBM_OPUS' as const,
        sampleRateHertz: 48000,
        languageCode: 'en-US',
        alternativeLanguageCodes: ['es-US', 'fr-FR', 'de-DE'],
        enableAutomaticPunctuation: true,
        model: 'medical_conversation',
      },
    };

    const [response] = await speechClient.recognize(request);
    const transcription = response.results
      ?.map(result => result.alternatives?.[0]?.transcript)
      .join('\n') || '';

    res.json({ 
      text: transcription,
      confidence: response.results?.[0]?.alternatives?.[0]?.confidence || 0,
      language: response.results?.[0]?.languageCode || 'en-US'
    });

  } catch (error) {
    console.error('Speech recognition error:', error);
    res.status(500).json({ error: 'Speech recognition failed' });
  }
});

export default router;