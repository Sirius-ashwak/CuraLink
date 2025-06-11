import { firestore } from './firebaseConfig';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { initializeGemini, geminiModel } from './googleCloudConfig';

interface VitalSign {
  type: string;
  value: number;
  unit: string;
  timestamp: Date;
}

interface PredictionResult {
  userId: string;
  predictions: {
    condition: string;
    probability: number;
    severity: 'low' | 'moderate' | 'high';
    recommendation: string;
  }[];
  timestamp: Date;
  isNotified: boolean;
}

/**
 * Predictive Healthcare Monitoring Service
 * Uses Google Cloud AI to analyze patient vitals and predict potential health issues
 */
export class PredictiveMonitoringService {
  private gemini: any;

  constructor() {
    this.gemini = initializeGemini();
  }

  /**
   * Get patient vital signs from Firestore
   */
  async getPatientVitals(userId: string, days: number = 30): Promise<VitalSign[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const vitalsRef = collection(firestore, 'patients', userId, 'vitals');
      const q = query(
        vitalsRef,
        where('timestamp', '>=', startDate)
      );

      const snapshot = await getDocs(q);
      const vitals: VitalSign[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data() as VitalSign;
        vitals.push({
          ...data,
          timestamp: data.timestamp as unknown as Date
        });
      });

      return vitals;
    } catch (error) {
      console.error('Error fetching patient vitals:', error);
      throw new Error('Failed to fetch patient vitals');
    }
  }

  /**
   * Analyze vital signs using Google Gemini AI to identify potential health risks
   */
  async analyzeVitals(userId: string, vitals: VitalSign[]): Promise<PredictionResult> {
    try {
      if (!this.gemini) {
        throw new Error('Gemini AI is not initialized');
      }

      // Group vitals by type
      const vitalsByType: Record<string, VitalSign[]> = {};
      vitals.forEach(vital => {
        if (!vitalsByType[vital.type]) {
          vitalsByType[vital.type] = [];
        }
        vitalsByType[vital.type].push(vital);
      });

      // Prepare data for AI analysis
      let prompt = `Analyze these patient vital signs and identify potential health risks: \n\n`;
      
      for (const [type, readings] of Object.entries(vitalsByType)) {
        if (readings.length > 0) {
          const recentValue = readings[readings.length - 1].value;
          const unit = readings[readings.length - 1].unit;
          const average = readings.reduce((sum, v) => sum + v.value, 0) / readings.length;
          const min = Math.min(...readings.map(r => r.value));
          const max = Math.max(...readings.map(r => r.value));
          
          prompt += `${type}: Current ${recentValue}${unit}, Avg ${average.toFixed(1)}${unit}, Range ${min}-${max}${unit}\n`;
        }
      }
      
      prompt += `\nIdentify health risks and provide recommendations in this format:
      1. [Condition] - [Probability %] - [Severity: low|moderate|high]
      2. [Specific recommendation]
      
      Only include actual health risks based on the data, be specific but concise.`;

      // Get prediction from Gemini
      const result = await this.gemini.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse the AI response to extract predictions
      const predictions = this.parsePredictions(text);

      // Store the prediction in Firestore
      const predictionResult: PredictionResult = {
        userId,
        predictions,
        timestamp: new Date(),
        isNotified: false
      };

      await this.storePrediction(userId, predictionResult);

      return predictionResult;
    } catch (error) {
      console.error('Error analyzing vitals:', error);
      throw new Error('Failed to analyze vital signs');
    }
  }

  /**
   * Parse the AI response text to extract predictions
   */
  private parsePredictions(text: string): PredictionResult['predictions'] {
    const predictions: PredictionResult['predictions'] = [];
    const lines = text.split('\n');
    let currentCondition = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Pattern for condition lines: 1. [Condition] - [Probability %] - [Severity]
      const conditionMatch = line.match(/^\d+\.\s+(.+?)\s+-\s+(\d+(?:\.\d+)?)%\s+-\s+(low|moderate|high)/i);
      
      if (conditionMatch) {
        currentCondition = conditionMatch[1];
        const probability = parseFloat(conditionMatch[2]) / 100;
        const severity = conditionMatch[3].toLowerCase() as 'low' | 'moderate' | 'high';
        
        // Look for the next line with recommendation
        const nextLine = (i + 1 < lines.length) ? lines[i + 1].trim() : '';
        const recommendation = nextLine.match(/^\d+\.\s+(.+)/) ? nextLine.replace(/^\d+\.\s+/, '') : '';
        
        predictions.push({
          condition: currentCondition,
          probability,
          severity,
          recommendation
        });
      }
    }
    
    return predictions;
  }

  /**
   * Store prediction in Firestore
   */
  private async storePrediction(userId: string, prediction: PredictionResult): Promise<void> {
    try {
      const predictionRef = doc(collection(firestore, 'patients', userId, 'predictions'));
      await setDoc(predictionRef, {
        ...prediction,
        timestamp: prediction.timestamp
      });
    } catch (error) {
      console.error('Error storing prediction:', error);
      throw new Error('Failed to store prediction');
    }
  }

  /**
   * Get notifications for high-risk predictions
   */
  async getHighRiskNotifications(userId: string): Promise<PredictionResult[]> {
    try {
      const predictionsRef = collection(firestore, 'patients', userId, 'predictions');
      const q = query(
        predictionsRef,
        where('isNotified', '==', false)
      );

      const snapshot = await getDocs(q);
      const predictions: PredictionResult[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data() as PredictionResult;
        // Only include predictions with at least one high severity issue
        if (data.predictions.some(p => p.severity === 'high')) {
          predictions.push({
            ...data,
            timestamp: data.timestamp as unknown as Date
          });
        }
      });

      return predictions;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw new Error('Failed to fetch notifications');
    }
  }
}

// Export a singleton instance
export const predictiveMonitoring = new PredictiveMonitoringService();