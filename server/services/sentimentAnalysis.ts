import { languageClient } from './googleCloudConfig';
import { firestore } from './firebaseConfig';
import { collection, addDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

interface SentimentResult {
  id?: string;
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  feedbackText: string;
  score: number;
  magnitude: number;
  sentiment: 'very_negative' | 'negative' | 'neutral' | 'positive' | 'very_positive';
  entities: {
    name: string;
    type: string;
    salience: number;
    sentiment: number;
  }[];
  categories: string[];
  createdAt: Date;
}

/**
 * Sentiment Analysis Service for Patient Feedback
 * Uses Google Natural Language API to analyze patient feedback and emotional responses
 */
export class SentimentAnalysisService {
  /**
   * Analyze patient feedback to determine sentiment and key entities
   */
  async analyzeFeedback(
    patientId: string,
    doctorId: string,
    feedbackText: string,
    appointmentId?: string
  ): Promise<SentimentResult> {
    try {
      if (!languageClient) {
        throw new Error('Language client is not initialized');
      }

      // Analyze sentiment
      const [sentimentResult] = await languageClient.analyzeSentiment({
        document: {
          content: feedbackText,
          type: 'PLAIN_TEXT'
        }
      });

      // Check for valid sentiment result
      if (!sentimentResult.documentSentiment) {
        throw new Error('No sentiment analysis result returned');
      }

      const score = sentimentResult.documentSentiment.score || 0;
      const magnitude = sentimentResult.documentSentiment.magnitude || 0;

      // Analyze entities
      const [entityResult] = await languageClient.analyzeEntities({
        document: {
          content: feedbackText,
          type: 'PLAIN_TEXT'
        }
      });

      // Extract entities with their sentiment
      const entities = entityResult.entities?.map(entity => ({
        name: entity.name || '',
        type: entity.type || '',
        salience: entity.salience || 0,
        sentiment: entity.sentiment?.score || 0
      })) || [];

      // Classify content
      const [classificationResult] = await languageClient.classifyText({
        document: {
          content: feedbackText,
          type: 'PLAIN_TEXT'
        }
      });

      // Extract categories
      const categories = classificationResult.categories?.map(category => 
        category.name || ''
      ) || [];

      // Determine sentiment category
      let sentiment: SentimentResult['sentiment'] = 'neutral';
      if (score <= -0.7) {
        sentiment = 'very_negative';
      } else if (score <= -0.2) {
        sentiment = 'negative';
      } else if (score >= 0.7) {
        sentiment = 'very_positive';
      } else if (score >= 0.2) {
        sentiment = 'positive';
      }

      // Create sentiment result
      const result: SentimentResult = {
        patientId,
        doctorId,
        appointmentId,
        feedbackText,
        score,
        magnitude,
        sentiment,
        entities,
        categories,
        createdAt: new Date()
      };

      // Store the result in Firestore
      const storedResult = await this.storeFeedbackAnalysis(result);

      return storedResult;
    } catch (error: any) {
      console.error('Error analyzing feedback:', error);
      throw new Error(`Failed to analyze feedback: ${error.message}`);
    }
  }

  /**
   * Store feedback analysis in Firestore
   */
  private async storeFeedbackAnalysis(result: SentimentResult): Promise<SentimentResult> {
    try {
      // Add to sentiment analysis collection
      const docRef = await addDoc(collection(firestore, 'sentimentAnalysis'), result);
      
      return {
        ...result,
        id: docRef.id
      };
    } catch (error: any) {
      console.error('Error storing feedback analysis:', error);
      throw new Error(`Failed to store feedback analysis: ${error.message}`);
    }
  }

  /**
   * Get sentiment analysis results for a doctor
   */
  async getDoctorSentimentTrends(doctorId: string, days: number = 30): Promise<{
    average: number;
    trends: { date: string; score: number }[];
    topPositive: SentimentResult[];
    topNegative: SentimentResult[];
  }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Query feedback for this doctor within date range
      const q = query(
        collection(firestore, 'sentimentAnalysis'),
        where('doctorId', '==', doctorId),
        where('createdAt', '>=', startDate),
        orderBy('createdAt', 'asc')
      );

      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return {
          average: 0,
          trends: [],
          topPositive: [],
          topNegative: []
        };
      }

      // Extract results
      const results: SentimentResult[] = [];
      snapshot.forEach(doc => {
        const data = doc.data() as SentimentResult;
        results.push({
          ...data,
          id: doc.id,
          createdAt: (data.createdAt as any).toDate()
        });
      });

      // Calculate average sentiment
      const totalScore = results.reduce((sum, result) => sum + result.score, 0);
      const average = totalScore / results.length;

      // Group results by date for trend analysis
      const dateMap = new Map<string, number[]>();
      results.forEach(result => {
        const date = result.createdAt.toISOString().split('T')[0];
        if (!dateMap.has(date)) {
          dateMap.set(date, []);
        }
        dateMap.get(date)!.push(result.score);
      });

      // Convert to trend data
      const trends = Array.from(dateMap.entries()).map(([date, scores]) => ({
        date,
        score: scores.reduce((sum, score) => sum + score, 0) / scores.length
      }));

      // Get top positive and negative feedback
      const sortedByScore = [...results].sort((a, b) => b.score - a.score);
      const topPositive = sortedByScore.slice(0, 3);
      const topNegative = sortedByScore.reverse().slice(0, 3);

      return {
        average,
        trends,
        topPositive,
        topNegative
      };
    } catch (error: any) {
      console.error('Error getting doctor sentiment trends:', error);
      throw new Error(`Failed to get doctor sentiment trends: ${error.message}`);
    }
  }

  /**
   * Analyze and extract common themes from patient feedback
   */
  async analyzeFeedbackThemes(doctorId: string, days: number = 90): Promise<{
    positiveThemes: { theme: string; count: number }[];
    negativeThemes: { theme: string; count: number }[];
    neutralThemes: { theme: string; count: number }[];
  }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Query feedback for this doctor within date range
      const q = query(
        collection(firestore, 'sentimentAnalysis'),
        where('doctorId', '==', doctorId),
        where('createdAt', '>=', startDate)
      );

      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return {
          positiveThemes: [],
          negativeThemes: [],
          neutralThemes: []
        };
      }

      // Extract entities from all feedback
      const positiveEntities: Map<string, number> = new Map();
      const negativeEntities: Map<string, number> = new Map();
      const neutralEntities: Map<string, number> = new Map();

      snapshot.forEach(doc => {
        const data = doc.data() as SentimentResult;
        
        data.entities.forEach(entity => {
          // Skip low-salience entities
          if (entity.salience < 0.05) return;
          
          // Categorize by sentiment
          const entityKey = entity.name.toLowerCase();
          
          if (entity.sentiment >= 0.2) {
            positiveEntities.set(entityKey, (positiveEntities.get(entityKey) || 0) + 1);
          } else if (entity.sentiment <= -0.2) {
            negativeEntities.set(entityKey, (negativeEntities.get(entityKey) || 0) + 1);
          } else {
            neutralEntities.set(entityKey, (neutralEntities.get(entityKey) || 0) + 1);
          }
        });
      });

      // Convert maps to arrays and sort by count
      const positiveThemes = Array.from(positiveEntities.entries())
        .map(([theme, count]) => ({ theme, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const negativeThemes = Array.from(negativeEntities.entries())
        .map(([theme, count]) => ({ theme, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const neutralThemes = Array.from(neutralEntities.entries())
        .map(([theme, count]) => ({ theme, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        positiveThemes,
        negativeThemes,
        neutralThemes
      };
    } catch (error: any) {
      console.error('Error analyzing feedback themes:', error);
      throw new Error(`Failed to analyze feedback themes: ${error.message}`);
    }
  }
}

// Export a singleton instance
export const sentimentAnalysis = new SentimentAnalysisService();