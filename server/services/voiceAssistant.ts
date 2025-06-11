import { speechClient } from './googleCloudConfig';
import { initializeGemini, geminiModel } from './googleCloudConfig';
import * as fs from 'fs';
import { Readable } from 'stream';

interface SpeechToTextResult {
  text: string;
  confidence: number;
  languageCode: string;
}

interface MedicalVoiceResponse {
  query: string;
  response: string;
  intent: string;
  confidenceScore: number;
}

/**
 * Medical Voice Assistant Service
 * Uses Google Cloud Speech-to-Text and Gemini to create a voice-based healthcare assistant
 */
export class VoiceAssistantService {
  private gemini: any;

  constructor() {
    this.gemini = initializeGemini();
  }

  /**
   * Convert speech audio to text
   */
  async speechToText(audioBuffer: Buffer, languageCode: string = 'en-US'): Promise<SpeechToTextResult> {
    try {
      if (!speechClient) {
        throw new Error('Speech client is not initialized');
      }

      // Configure the request
      const request = {
        audio: {
          content: audioBuffer.toString('base64'),
        },
        config: {
          encoding: 'LINEAR16',
          sampleRateHertz: 16000,
          languageCode,
          model: 'medical_conversation',
          useEnhanced: true,
          enableAutomaticPunctuation: true,
          enableSpokenPunctuation: true,
          enableSpokenEmojis: false,
        },
      };

      // Perform the speech recognition
      const [response] = await speechClient.recognize(request);
      
      if (!response.results || response.results.length === 0) {
        throw new Error('No speech recognition results returned');
      }

      // Get the transcript from the response
      const transcription = response.results
        .map(result => result.alternatives && result.alternatives[0].transcript)
        .filter(Boolean)
        .join(' ');

      // Get the confidence score
      const confidence = response.results[0].alternatives && 
                         response.results[0].alternatives[0].confidence || 0;

      return {
        text: transcription,
        confidence,
        languageCode,
      };
    } catch (error: any) {
      console.error('Error in speech recognition:', error);
      throw new Error(`Failed to recognize speech: ${error.message}`);
    }
  }

  /**
   * Process medical voice query and generate a response
   */
  async processMedicalVoiceQuery(query: string): Promise<MedicalVoiceResponse> {
    try {
      if (!this.gemini) {
        throw new Error('Gemini AI is not initialized');
      }

      // First, determine the intent of the medical query
      const intentPrompt = `
        Determine the healthcare intent of this query and respond with a single word or short phrase:
        Query: "${query}"
        Common intents: symptom_check, medication_info, appointment_booking, emergency_guidance, general_health_question, test_results, dietary_advice, lifestyle_recommendation
      `;

      const intentResult = await this.gemini.generateContent(intentPrompt);
      const intentResponse = await intentResult.response;
      const intent = intentResponse.text().trim();

      // Now create a tailored prompt based on the detected intent
      let medicalPrompt = `You are a helpful medical voice assistant. Answer the following healthcare question accurately, concisely, and in a supportive manner:
      
      Question: "${query}"
      
      Based on my analysis, this appears to be a query about ${intent}.
      
      Guidelines:
      - Be accurate and factual, but note that this is not professional medical advice
      - Keep your answer focused and under 150 words
      - Include a brief recommendation for next steps if appropriate
      - Do not diagnose specific conditions
      - Be conversational but professional
      - If this is a potential medical emergency, advise seeking immediate medical attention
      `;

      // Generate the medical response
      const result = await this.gemini.generateContent(medicalPrompt);
      const response = await result.response;
      const medicalResponse = response.text();

      return {
        query,
        response: medicalResponse,
        intent,
        confidenceScore: 0.85, // Placeholder for a confidence metric
      };
    } catch (error: any) {
      console.error('Error processing medical voice query:', error);
      throw new Error(`Failed to process medical voice query: ${error.message}`);
    }
  }

  /**
   * Process audio file containing medical query
   */
  async processAudioQuery(audioFilePath: string, languageCode: string = 'en-US'): Promise<MedicalVoiceResponse> {
    try {
      // Read the audio file
      const audioBuffer = fs.readFileSync(audioFilePath);
      
      // Convert speech to text
      const speechResult = await this.speechToText(audioBuffer, languageCode);
      
      // Process the text query
      const response = await this.processMedicalVoiceQuery(speechResult.text);
      
      return response;
    } catch (error: any) {
      console.error('Error processing audio query:', error);
      throw new Error(`Failed to process audio query: ${error.message}`);
    }
  }

  /**
   * Process streaming audio (for real-time interaction)
   */
  async processStreamingAudio(audioStream: Readable, languageCode: string = 'en-US'): Promise<SpeechToTextResult> {
    try {
      if (!speechClient) {
        throw new Error('Speech client is not initialized');
      }

      // Convert stream to buffer for processing
      const chunks: Buffer[] = [];
      
      for await (const chunk of audioStream) {
        chunks.push(Buffer.from(chunk));
      }
      
      const audioBuffer = Buffer.concat(chunks);
      
      // Use the regular speech-to-text method
      return await this.speechToText(audioBuffer, languageCode);
    } catch (error: any) {
      console.error('Error processing streaming audio:', error);
      throw new Error(`Failed to process streaming audio: ${error.message}`);
    }
  }
}

// Export a singleton instance
export const voiceAssistant = new VoiceAssistantService();