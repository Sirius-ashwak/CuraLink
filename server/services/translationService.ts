import { translationClient } from './googleCloudConfig';
import { v4 as uuidv4 } from 'uuid';

interface TranslationResult {
  originalText: string;
  translatedText: string;
  detectedLanguage?: string;
  sourceLanguage: string;
  targetLanguage: string;
  timestamp: Date;
}

/**
 * Real-time Language Translation Service
 * Uses Google Cloud Translation API to provide translation services during telehealth consultations
 */
export class TranslationService {
  /**
   * Translate text between languages
   */
  async translateText(
    text: string,
    targetLanguage: string,
    sourceLanguage: string = ''
  ): Promise<TranslationResult> {
    try {
      if (!translationClient) {
        throw new Error('Translation client is not initialized');
      }

      const projectId = 'festive-freedom-460702-k4';
      const location = 'global';

      // Build the request
      const request = {
        parent: `projects/${projectId}/locations/${location}`,
        contents: [text],
        mimeType: 'text/plain',
        targetLanguageCode: targetLanguage,
        ...(sourceLanguage ? { sourceLanguageCode: sourceLanguage } : {})
      };

      // Call the Translation API
      const [response] = await translationClient.translateText(request);

      if (!response.translations || response.translations.length === 0) {
        throw new Error('No translation result returned');
      }

      const translatedText = response.translations[0].translatedText;
      const detectedLanguage = response.translations[0].detectedLanguageCode;

      // Create translation result
      const result: TranslationResult = {
        originalText: text,
        translatedText,
        sourceLanguage: sourceLanguage || detectedLanguage || 'unknown',
        targetLanguage,
        timestamp: new Date()
      };

      if (!sourceLanguage && detectedLanguage) {
        result.detectedLanguage = detectedLanguage;
      }

      return result;
    } catch (error) {
      console.error('Error translating text:', error);
      throw new Error(`Failed to translate text: ${error.message}`);
    }
  }

  /**
   * Detect the language of a text
   */
  async detectLanguage(text: string): Promise<string> {
    try {
      if (!translationClient) {
        throw new Error('Translation client is not initialized');
      }

      const projectId = 'festive-freedom-460702-k4';
      const location = 'global';

      // Build the request
      const request = {
        parent: `projects/${projectId}/locations/${location}`,
        content: text,
        mimeType: 'text/plain'
      };

      // Call the Translation API to detect language
      const [response] = await translationClient.detectLanguage(request);

      if (!response.languages || response.languages.length === 0) {
        throw new Error('No language detection result returned');
      }

      // Get the language with highest confidence
      const detectedLanguages = response.languages;
      const topLanguage = detectedLanguages.reduce((prev, current) => 
        (current.confidence || 0) > (prev.confidence || 0) ? current : prev
      );

      return topLanguage.languageCode || 'unknown';
    } catch (error) {
      console.error('Error detecting language:', error);
      throw new Error(`Failed to detect language: ${error.message}`);
    }
  }

  /**
   * Get a list of supported languages
   */
  async getSupportedLanguages(): Promise<{ code: string, name: string }[]> {
    try {
      if (!translationClient) {
        throw new Error('Translation client is not initialized');
      }

      const projectId = 'festive-freedom-460702-k4';
      const location = 'global';

      // Build the request
      const request = {
        parent: `projects/${projectId}/locations/${location}`,
        displayLanguageCode: 'en' // Get language names in English
      };

      // Call the Translation API
      const [response] = await translationClient.getSupportedLanguages(request);

      if (!response.languages) {
        throw new Error('No languages returned');
      }

      // Format the response
      return response.languages.map(language => ({
        code: language.languageCode || '',
        name: language.displayName || ''
      }));
    } catch (error) {
      console.error('Error getting supported languages:', error);
      throw new Error(`Failed to get supported languages: ${error.message}`);
    }
  }

  /**
   * Translate conversational messages in real-time during a video call
   */
  async translateConversation(
    text: string,
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<TranslationResult> {
    // For conversational translation, we directly use the translate API
    // but this could be extended to use specialized conversational models
    return this.translateText(text, targetLanguage, sourceLanguage);
  }

  /**
   * Translate and format medical content with proper medical terminology
   */
  async translateMedicalContent(
    medicalText: string,
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<TranslationResult> {
    try {
      // First, translate the text regularly
      const basicTranslation = await this.translateText(
        medicalText,
        targetLanguage,
        sourceLanguage
      );

      // For medical content, we'd ideally want to use a medical-specific model
      // Since there isn't a direct API for this, we could:
      // 1. Use a specialized prompt for Gemini to fix medical terminology
      // 2. Maintain a glossary of medical terms (future enhancement)

      // This is a simplified approach for now
      const improvedTranslation = await this.refineMedicalTranslation(
        basicTranslation.translatedText,
        targetLanguage
      );

      return {
        ...basicTranslation,
        translatedText: improvedTranslation
      };
    } catch (error) {
      console.error('Error translating medical content:', error);
      throw new Error(`Failed to translate medical content: ${error.message}`);
    }
  }

  /**
   * Use AI to refine a medical translation with correct terminology
   * This is a placeholder for future implementation with Gemini or other model
   */
  private async refineMedicalTranslation(
    translatedText: string,
    language: string
  ): Promise<string> {
    // This would be implemented with a specialized AI model
    // For now, we'll return the original translation
    return translatedText;
  }
}

// Export a singleton instance
export const translationService = new TranslationService();