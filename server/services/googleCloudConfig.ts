import { Storage } from '@google-cloud/storage';
import { SpeechClient } from '@google-cloud/speech';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import { TranslationServiceClient } from '@google-cloud/translate';
import { DocumentProcessorServiceClient } from '@google-cloud/documentai';
import { LanguageServiceClient } from '@google-cloud/language';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
import * as path from 'path';

// Load the Google Cloud credentials
let credentials;
try {
  // Check if we have credentials in environment variable
  if (process.env.GOOGLE_CLOUD_CREDENTIALS) {
    credentials = JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS);
  } else {
    console.log('Using service account key file for Google Cloud authentication');
    const keyFilePath = path.join(__dirname, '../../google-cloud-credentials.json');
    
    // Check if the file exists
    if (fs.existsSync(keyFilePath)) {
      const keyFile = fs.readFileSync(keyFilePath, 'utf8');
      credentials = JSON.parse(keyFile);
    } else {
      console.warn('Google Cloud credentials file not found. Some features will not work.');
    }
  }
} catch (error) {
  console.error('Error loading Google Cloud credentials:', error);
}

// Initialize Google Cloud services
let storage: Storage | null = null;
let speechClient: SpeechClient | null = null;
let visionClient: ImageAnnotatorClient | null = null;
let translationClient: TranslationServiceClient | null = null;
let documentAIClient: DocumentProcessorServiceClient | null = null;
let languageClient: LanguageServiceClient | null = null;
let geminiModel: any = null;

if (credentials) {
  // Initialize Google Cloud Storage
  storage = new Storage({ credentials });
  
  // Initialize Speech to Text
  speechClient = new SpeechClient({ credentials });
  
  // Initialize Vision API
  visionClient = new ImageAnnotatorClient({ credentials });
  
  // Initialize Translation API
  translationClient = new TranslationServiceClient({ credentials });
  
  // Initialize Document AI
  documentAIClient = new DocumentProcessorServiceClient({ credentials });
  
  // Initialize Natural Language API
  languageClient = new LanguageServiceClient({ credentials });
}

// Initialize Google Generative AI with Gemini API
const initializeGemini = () => {
  try {
    if (process.env.GEMINI_API_KEY) {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      geminiModel = genAI.getGenerativeModel({ model: "gemini-pro" });
      return geminiModel;
    } else {
      console.warn('GEMINI_API_KEY is not defined. AI features will not work.');
      return null;
    }
  } catch (error) {
    console.error('Error initializing Gemini:', error);
    return null;
  }
};

export {
  storage,
  speechClient,
  visionClient,
  translationClient,
  documentAIClient,
  languageClient,
  geminiModel,
  initializeGemini
};