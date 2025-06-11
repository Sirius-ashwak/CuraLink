/**
 * Google Cloud Vision API Service
 * Provides advanced medical image analysis capabilities
 */

import { ImageAnnotatorClient } from '@google-cloud/vision';

class VisionService {
  private client: ImageAnnotatorClient;
  private isConfigured: boolean;

  constructor() {
    try {
      // Initialize the Vision client with Google Cloud credentials
      this.client = new ImageAnnotatorClient({
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
        keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE || undefined,
      });
      
      this.isConfigured = true;
      console.log('Google Cloud Vision API initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Google Cloud Vision API:', error);
      this.isConfigured = false;
    }
  }

  /**
   * Check if the Vision API is properly configured
   */
  getStatus(): { isConfigured: boolean } {
    return { isConfigured: this.isConfigured };
  }

  /**
   * Analyze a medical image for various features
   * @param imageBuffer - Buffer containing the image data
   * @param features - Array of detection features to enable
   */
  async analyzeImage(
    imageBuffer: Buffer,
    features = ['LABEL_DETECTION', 'FACE_DETECTION', 'OBJECT_LOCALIZATION']
  ) {
    if (!this.isConfigured) {
      throw new Error('Google Cloud Vision API is not properly configured');
    }

    try {
      // Convert features to the format expected by the API
      const requestFeatures = features.map(feature => ({
        type: feature
      }));

      // Make API request to analyze the image
      const [result] = await this.client.annotateImage({
        image: { content: imageBuffer.toString('base64') },
        features: requestFeatures,
      });

      return result;
    } catch (error) {
      console.error('Error analyzing image with Vision API:', error);
      throw error;
    }
  }

  /**
   * Detect text in a medical image (e.g., prescription, medical report)
   * @param imageBuffer - Buffer containing the image data
   */
  async detectText(imageBuffer: Buffer) {
    if (!this.isConfigured) {
      throw new Error('Google Cloud Vision API is not properly configured');
    }

    try {
      // Make API request to detect text
      const [result] = await this.client.textDetection({
        image: { content: imageBuffer.toString('base64') },
      });

      return {
        text: result.fullTextAnnotation?.text || '',
        confidence: result.fullTextAnnotation?.pages?.[0]?.confidence || 0,
        blocks: result.textAnnotations?.map(annotation => ({
          text: annotation.description,
          confidence: annotation.confidence,
          boundingBox: annotation.boundingPoly?.vertices || [],
        })) || [],
      };
    } catch (error) {
      console.error('Error detecting text with Vision API:', error);
      throw error;
    }
  }

  /**
   * Detect faces in a medical image (for patient identity verification)
   * @param imageBuffer - Buffer containing the image data
   */
  async detectFaces(imageBuffer: Buffer) {
    if (!this.isConfigured) {
      throw new Error('Google Cloud Vision API is not properly configured');
    }

    try {
      // Make API request to detect faces
      const [result] = await this.client.faceDetection({
        image: { content: imageBuffer.toString('base64') },
      });

      return result.faceAnnotations?.map(face => ({
        joy: this.getEmotionLikelihood(face.joyLikelihood),
        sorrow: this.getEmotionLikelihood(face.sorrowLikelihood),
        anger: this.getEmotionLikelihood(face.angerLikelihood),
        surprise: this.getEmotionLikelihood(face.surpriseLikelihood),
        boundingPoly: face.boundingPoly?.vertices || [],
        landmarks: face.landmarks?.map(landmark => ({
          type: landmark.type,
          position: landmark.position,
        })) || [],
      })) || [];
    } catch (error) {
      console.error('Error detecting faces with Vision API:', error);
      throw error;
    }
  }

  /**
   * Analyze medical images for medical conditions
   * Uses label detection and custom medical model to identify potential conditions
   * @param imageBuffer - Buffer containing the image data
   */
  async analyzeMedicalImage(imageBuffer: Buffer) {
    if (!this.isConfigured) {
      throw new Error('Google Cloud Vision API is not properly configured');
    }

    try {
      // First use standard label detection
      const [labelResult] = await this.client.labelDetection({
        image: { content: imageBuffer.toString('base64') },
      });

      // Extract basic labels
      const labels = labelResult.labelAnnotations?.map(label => ({
        description: label.description,
        score: label.score,
      })) || [];

      // Then use object localization
      const [objectResult] = await this.client.objectLocalization({
        image: { content: imageBuffer.toString('base64') },
      });

      // Extract objects
      const objects = objectResult.localizedObjectAnnotations?.map(object => ({
        name: object.name,
        score: object.score,
        boundingPoly: object.boundingPoly?.normalizedVertices || [],
      })) || [];

      // Combine results with medical context
      // Note: In a real application, this would use a specialized medical AI model
      return {
        detectedLabels: labels,
        detectedObjects: objects,
        medicalAnalysis: this.provideMedicalContext(labels, objects),
      };
    } catch (error) {
      console.error('Error analyzing medical image with Vision API:', error);
      throw error;
    }
  }

  /**
   * Convert the likelihood string to a probability value
   * @param likelihood - The likelihood string from the Vision API
   */
  private getEmotionLikelihood(likelihood: string | undefined | null): number {
    if (!likelihood) return 0;
    
    const map: Record<string, number> = {
      'VERY_UNLIKELY': 0.1,
      'UNLIKELY': 0.3,
      'POSSIBLE': 0.5,
      'LIKELY': 0.7,
      'VERY_LIKELY': 0.9,
    };
    
    return map[likelihood] || 0;
  }

  /**
   * Provide medical context for the detected labels and objects
   * @param labels - Labels detected in the image
   * @param objects - Objects detected in the image
   */
  private provideMedicalContext(
    labels: Array<{ description?: string | null; score?: number | null }>,
    objects: Array<{ name?: string | null; score?: number | null }>
  ) {
    // This is a simplified example. In a real application, this would use a specialized medical model
    
    // Extract all labels and objects by name
    const allTerms = [
      ...labels.map(l => l.description?.toLowerCase() || ''),
      ...objects.map(o => o.name?.toLowerCase() || ''),
    ].filter(Boolean);
    
    // Check for skin-related terms
    const skinConditionTerms = ['rash', 'dermatitis', 'acne', 'eczema', 'psoriasis', 'skin', 'melanoma', 'mole'];
    const hasSkinConditions = skinConditionTerms.some(term => allTerms.some(t => t.includes(term)));
    
    // Check for eye-related terms
    const eyeConditionTerms = ['eye', 'vision', 'retina', 'pupil', 'iris', 'cornea', 'cataract', 'glaucoma'];
    const hasEyeConditions = eyeConditionTerms.some(term => allTerms.some(t => t.includes(term)));
    
    // Check for injury-related terms
    const injuryTerms = ['wound', 'cut', 'fracture', 'break', 'bruise', 'injury', 'trauma', 'swelling'];
    const hasInjury = injuryTerms.some(term => allTerms.some(t => t.includes(term)));
    
    // Check for medical equipment
    const medicalEquipmentTerms = ['x-ray', 'mri', 'ct scan', 'ultrasound', 'ecg', 'ekg', 'scan', 'medical'];
    const hasMedicalEquipment = medicalEquipmentTerms.some(term => allTerms.some(t => t.includes(term)));
    
    return {
      potentialConditions: {
        hasSkinConditions,
        hasEyeConditions,
        hasInjury,
        hasMedicalEquipment,
      },
      disclaimer: 'This analysis is not a medical diagnosis. Please consult with a healthcare professional for proper diagnosis and treatment.',
      recommendedActions: this.getRecommendedActions({
        hasSkinConditions,
        hasEyeConditions,
        hasInjury,
        hasMedicalEquipment,
      }),
    };
  }

  /**
   * Generate recommended actions based on detected conditions
   */
  private getRecommendedActions({
    hasSkinConditions,
    hasEyeConditions,
    hasInjury,
    hasMedicalEquipment,
  }: {
    hasSkinConditions: boolean;
    hasEyeConditions: boolean;
    hasInjury: boolean;
    hasMedicalEquipment: boolean;
  }) {
    const actions = [];
    
    if (hasSkinConditions) {
      actions.push(
        'Consider consulting with a dermatologist for proper diagnosis and treatment.',
        'Avoid scratching or touching the affected area.',
        'Keep the area clean and moisturized.'
      );
    }
    
    if (hasEyeConditions) {
      actions.push(
        'Schedule an appointment with an ophthalmologist.',
        'Avoid rubbing your eyes.',
        'Use prescribed eye drops if available.'
      );
    }
    
    if (hasInjury) {
      actions.push(
        'Clean the wound with mild soap and water if applicable.',
        'Apply appropriate first aid.',
        'Consult with a doctor if the injury is severe or shows signs of infection.'
      );
    }
    
    if (hasMedicalEquipment) {
      actions.push(
        'This appears to be a medical scan or image.',
        'Consult with your healthcare provider for proper interpretation.',
        'Bring this image to your next medical appointment.'
      );
    }
    
    // Default recommendations
    if (actions.length === 0) {
      actions.push(
        'Consult with a healthcare professional for proper diagnosis.',
        'Monitor your symptoms and note any changes.',
        'Follow up with your primary care physician.'
      );
    }
    
    return actions;
  }
}

export const visionService = new VisionService();