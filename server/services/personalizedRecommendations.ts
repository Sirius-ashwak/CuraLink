import { initializeGemini, geminiModel } from './googleCloudConfig';
import { firestore } from './firebaseConfig';
import { collection, doc, setDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

interface HealthProfile {
  age?: number;
  gender?: string;
  conditions?: string[];
  medications?: string[];
  allergies?: string[];
  lifestyle?: {
    exercise?: string;
    diet?: string;
    smoking?: boolean;
    alcohol?: string;
  };
  familyHistory?: string[];
  recentVitals?: Record<string, any>;
}

interface Recommendation {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: 'diet' | 'exercise' | 'lifestyle' | 'medication' | 'preventive' | 'follow_up';
  priority: 'high' | 'medium' | 'low';
  actions: string[];
  relatedTo?: string[];
  createdAt: Date;
  expiresAt?: Date;
  viewed: boolean;
  completed: boolean;
}

/**
 * Personalized Healthcare Recommendations Service
 * Uses Google AI to provide tailored health recommendations based on patient data
 */
export class PersonalizedRecommendationsService {
  private gemini: any;

  constructor() {
    this.gemini = initializeGemini();
  }

  /**
   * Generate personalized recommendations based on patient health profile
   */
  async generateRecommendations(userId: string, healthProfile: HealthProfile): Promise<Recommendation[]> {
    try {
      if (!this.gemini) {
        throw new Error('Gemini AI is not initialized');
      }

      // Create a prompt for Gemini AI
      const prompt = `
        Generate personalized healthcare recommendations based on this patient profile:
        
        Age: ${healthProfile.age || 'Unknown'}
        Gender: ${healthProfile.gender || 'Unknown'}
        Medical Conditions: ${healthProfile.conditions?.join(', ') || 'None reported'}
        Current Medications: ${healthProfile.medications?.join(', ') || 'None reported'}
        Allergies: ${healthProfile.allergies?.join(', ') || 'None reported'}
        Lifestyle:
        - Exercise: ${healthProfile.lifestyle?.exercise || 'Unknown'}
        - Diet: ${healthProfile.lifestyle?.diet || 'Unknown'}
        - Smoking: ${healthProfile.lifestyle?.smoking ? 'Yes' : 'No'}
        - Alcohol Consumption: ${healthProfile.lifestyle?.alcohol || 'Unknown'}
        Family History: ${healthProfile.familyHistory?.join(', ') || 'None reported'}
        
        Recent Vitals:
        ${Object.entries(healthProfile.recentVitals || {}).map(([key, value]) => `- ${key}: ${value}`).join('\n')}
        
        Provide 3-5 specific, actionable healthcare recommendations in the following JSON format:
        [
          {
            "title": "Brief recommendation title",
            "description": "Detailed explanation (2-3 sentences)",
            "category": "One of: diet, exercise, lifestyle, medication, preventive, follow_up",
            "priority": "One of: high, medium, low",
            "actions": ["Specific action 1", "Specific action 2"],
            "relatedTo": ["relevant condition or factor"]
          }
        ]
        
        Make recommendations evidence-based, appropriate for the patient profile, and emphasize preventive care when possible.
      `;

      // Generate recommendations using Gemini
      const result = await this.gemini.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text();

      // Extract the JSON from the response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('Could not extract recommendations from AI response');
      }

      const recommendationsJson = jsonMatch[0];
      const recommendationsArray = JSON.parse(recommendationsJson);

      // Convert to Recommendation objects
      const now = new Date();
      const recommendations: Recommendation[] = recommendationsArray.map((rec: any, index: number) => {
        const id = `${userId}_${now.getTime()}_${index}`;
        
        // Set expiration date (30 days from now by default)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
        
        return {
          id,
          userId,
          title: rec.title,
          description: rec.description,
          category: rec.category,
          priority: rec.priority,
          actions: rec.actions || [],
          relatedTo: rec.relatedTo || [],
          createdAt: now,
          expiresAt,
          viewed: false,
          completed: false
        };
      });

      // Store recommendations in Firestore
      await this.storeRecommendations(recommendations);

      return recommendations;
    } catch (error: any) {
      console.error('Error generating recommendations:', error);
      throw new Error(`Failed to generate recommendations: ${error.message}`);
    }
  }

  /**
   * Store recommendations in Firestore
   */
  private async storeRecommendations(recommendations: Recommendation[]): Promise<void> {
    try {
      // Store each recommendation
      for (const recommendation of recommendations) {
        const recRef = doc(collection(firestore, 'recommendations'), recommendation.id);
        await setDoc(recRef, recommendation);
        
        // Also add to user's recommendations subcollection
        const userRecRef = doc(collection(firestore, 'users', recommendation.userId, 'recommendations'), recommendation.id);
        await setDoc(userRecRef, { recommendationId: recommendation.id });
      }
    } catch (error: any) {
      console.error('Error storing recommendations:', error);
      throw new Error(`Failed to store recommendations: ${error.message}`);
    }
  }

  /**
   * Get current active recommendations for a user
   */
  async getUserRecommendations(userId: string): Promise<Recommendation[]> {
    try {
      const now = new Date();
      
      // Query active recommendations (not expired)
      const q = query(
        collection(firestore, 'recommendations'),
        where('userId', '==', userId),
        where('expiresAt', '>', now),
        orderBy('expiresAt'),
        orderBy('priority')
      );
      
      const snapshot = await getDocs(q);
      
      const recommendations: Recommendation[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        recommendations.push({
          ...data,
          id: doc.id,
          createdAt: data.createdAt.toDate(),
          expiresAt: data.expiresAt?.toDate()
        } as Recommendation);
      });
      
      return recommendations;
    } catch (error: any) {
      console.error('Error getting user recommendations:', error);
      throw new Error(`Failed to get recommendations: ${error.message}`);
    }
  }

  /**
   * Mark a recommendation as viewed
   */
  async markRecommendationViewed(recommendationId: string): Promise<void> {
    try {
      const recRef = doc(firestore, 'recommendations', recommendationId);
      await setDoc(recRef, { viewed: true }, { merge: true });
    } catch (error: any) {
      console.error('Error marking recommendation as viewed:', error);
      throw new Error(`Failed to update recommendation: ${error.message}`);
    }
  }

  /**
   * Mark a recommendation as completed
   */
  async markRecommendationCompleted(recommendationId: string): Promise<void> {
    try {
      const recRef = doc(firestore, 'recommendations', recommendationId);
      await setDoc(recRef, { completed: true }, { merge: true });
    } catch (error: any) {
      console.error('Error marking recommendation as completed:', error);
      throw new Error(`Failed to update recommendation: ${error.message}`);
    }
  }

  /**
   * Get a health profile for a user from Firestore
   */
  async getUserHealthProfile(userId: string): Promise<HealthProfile> {
    try {
      // Get basic profile
      const profileRef = doc(firestore, 'users', userId, 'healthProfile', 'current');
      const profileSnap = await getDoc(profileRef);
      
      if (!profileSnap.exists()) {
        return {};
      }
      
      const profile = profileSnap.data() as HealthProfile;
      
      // Get recent vitals
      const vitalsRef = collection(firestore, 'users', userId, 'vitals');
      const vitalsQuery = query(vitalsRef, orderBy('timestamp', 'desc'), limit(10));
      const vitalsSnap = await getDocs(vitalsQuery);
      
      const recentVitals: Record<string, any> = {};
      
      vitalsSnap.forEach(doc => {
        const data = doc.data();
        const vitalType = data.type;
        
        // Only keep the most recent of each type
        if (!recentVitals[vitalType]) {
          recentVitals[vitalType] = {
            value: data.value,
            unit: data.unit,
            timestamp: data.timestamp.toDate()
          };
        }
      });
      
      return {
        ...profile,
        recentVitals
      };
    } catch (error: any) {
      console.error('Error getting user health profile:', error);
      throw new Error(`Failed to get health profile: ${error.message}`);
    }
  }
}

// Export a singleton instance
export const personalizedRecommendations = new PersonalizedRecommendationsService();