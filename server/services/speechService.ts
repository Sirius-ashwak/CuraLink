/**
 * Google Cloud Speech-to-Text Service
 * Provides advanced voice transcription capabilities for medical notes
 */

import speech from '@google-cloud/speech';

class SpeechService {
  private client: speech.SpeechClient;
  private isConfigured: boolean;

  constructor() {
    try {
      // Initialize the Speech client with Google Cloud credentials
      this.client = new speech.SpeechClient({
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
        keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE || undefined,
      });
      
      this.isConfigured = true;
      console.log('Google Cloud Speech-to-Text API initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Google Cloud Speech-to-Text API:', error);
      this.isConfigured = false;
    }
  }

  /**
   * Check if the Speech API is properly configured
   */
  getStatus(): { isConfigured: boolean } {
    return { isConfigured: this.isConfigured };
  }

  /**
   * Transcribe audio from a file
   * @param audioBuffer - Buffer containing the audio data
   * @param config - Configuration options for transcription
   */
  async transcribeAudio(
    audioBuffer: Buffer,
    config: {
      languageCode?: string;
      sampleRateHertz?: number;
      encoding?: string;
      enableAutomaticPunctuation?: boolean;
      enableMedicalTranscription?: boolean;
      alternativeLanguageCodes?: string[];
    } = {}
  ) {
    if (!this.isConfigured) {
      throw new Error('Google Cloud Speech-to-Text API is not properly configured');
    }

    try {
      // Set up request configuration with medical terms optimization
      const request = {
        audio: {
          content: audioBuffer.toString('base64'),
        },
        config: {
          languageCode: config.languageCode || 'en-US',
          sampleRateHertz: config.sampleRateHertz || 16000,
          encoding: config.encoding || 'LINEAR16',
          enableAutomaticPunctuation: config.enableAutomaticPunctuation !== false,
          model: config.enableMedicalTranscription ? 'medical_conversation' : 'default',
          useEnhanced: true, // Use enhanced models for better accuracy
          alternativeLanguageCodes: config.alternativeLanguageCodes || [],
          speechContexts: [{
            phrases: [
              // Medical terms to improve recognition accuracy
              "diagnosis", "prescription", "symptom", "treatment", "patient",
              "medication", "dosage", "allergy", "chronic", "acute",
              "hypertension", "diabetes", "cardiovascular", "respiratory",
              "gastrointestinal", "neurological", "musculoskeletal",
              "dermatological", "antibiotic", "anti-inflammatory",
              "analgesic", "anesthetic", "vaccine", "immunization",
              "cardiologist", "neurologist", "dermatologist", "pediatrician",
              "oncologist", "radiologist", "surgeon", "psychiatrist",
              "mri", "ct scan", "x-ray", "ultrasound", "ecg", "ekg",
            ]
          }],
        },
      };

      // Make API request to transcribe audio
      const [response] = await this.client.recognize(request);
      
      // Process and return results
      const transcription = response.results
        ?.map(result => result.alternatives?.[0]?.transcript || '')
        .join(' ') || '';
      
      const confidence = response.results?.[0]?.alternatives?.[0]?.confidence || 0;
      
      const alternatives = response.results?.flatMap(result => 
        result.alternatives?.map(alt => ({
          transcript: alt.transcript || '',
          confidence: alt.confidence || 0,
        })) || []
      ) || [];

      return {
        transcription,
        confidence,
        alternatives,
        languageCode: config.languageCode || 'en-US',
      };
    } catch (error) {
      console.error('Error transcribing audio with Speech API:', error);
      throw error;
    }
  }

  /**
   * Transcribe streaming audio (for real-time transcription)
   * Returns a function that accepts audio chunks and a callback for results
   * @param config - Configuration options for transcription
   */
  createStreamingRecognizeStream(
    config: {
      languageCode?: string;
      sampleRateHertz?: number;
      encoding?: string;
      enableAutomaticPunctuation?: boolean;
      enableMedicalTranscription?: boolean;
    } = {}
  ) {
    if (!this.isConfigured) {
      throw new Error('Google Cloud Speech-to-Text API is not properly configured');
    }

    // Create streaming recognize request with medical terms optimization
    const request = {
      config: {
        languageCode: config.languageCode || 'en-US',
        sampleRateHertz: config.sampleRateHertz || 16000,
        encoding: config.encoding || 'LINEAR16',
        enableAutomaticPunctuation: config.enableAutomaticPunctuation !== false,
        model: config.enableMedicalTranscription ? 'medical_conversation' : 'default',
        useEnhanced: true,
        speechContexts: [{
          phrases: [
            // Medical terms to improve recognition accuracy
            "diagnosis", "prescription", "symptom", "treatment", "patient",
            "medication", "dosage", "allergy", "chronic", "acute",
            "hypertension", "diabetes", "cardiovascular", "respiratory"
          ]
        }],
      },
      interimResults: true, // Get interim results
    };

    try {
      // Create a recognize stream
      const recognizeStream = this.client
        .streamingRecognize(request)
        .on('error', (error) => {
          console.error('Error in streaming recognize:', error);
        });

      return recognizeStream;
    } catch (error) {
      console.error('Error creating streaming recognize stream:', error);
      throw error;
    }
  }

  /**
   * Enhance medical transcription by handling specialized terms
   * @param transcript - The original transcript
   */
  enhanceMedicalTranscript(transcript: string): string {
    // This would be more sophisticated in a real application
    // For now, we'll correct some common medical term misrecognitions
    
    const corrections: Record<string, string> = {
      'hi attention': 'hypertension',
      'hi potential': 'hypertension',
      'die a beat ease': 'diabetes',
      'die a beat is': 'diabetes',
      'die of bees': 'diabetes',
      'car do vascular': 'cardiovascular',
      'cardio vascular': 'cardiovascular',
      'gastro intestinal': 'gastrointestinal',
      'nero logical': 'neurological',
      'new row logical': 'neurological',
      'dermis illogical': 'dermatological',
      'derma logical': 'dermatological',
      'anti bye attic': 'antibiotic',
      'anti biotic': 'antibiotic',
      'anti inflammatory': 'anti-inflammatory',
      'anna jesic': 'analgesic',
      'vax scene': 'vaccine',
      'vax een': 'vaccine',
      'immune is asian': 'immunization',
      'immune ization': 'immunization',
      'emma rai': 'MRI',
      'see tea scan': 'CT scan',
      'x raise': 'x-rays',
      'ultra sound': 'ultrasound',
      'e.c.g.': 'ECG',
      'e.k.g.': 'EKG',
    };

    let enhancedTranscript = transcript;
    
    // Apply corrections
    Object.entries(corrections).forEach(([incorrect, correct]) => {
      const regex = new RegExp(`\\b${incorrect}\\b`, 'gi');
      enhancedTranscript = enhancedTranscript.replace(regex, correct);
    });

    return enhancedTranscript;
  }
}

export const speechService = new SpeechService();