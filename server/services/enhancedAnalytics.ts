import { firestore } from './firebaseConfig';
import { collection, doc, setDoc, getDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { initializeGemini, geminiModel } from './googleCloudConfig';

interface UserActivity {
  userId: string;
  action: string;
  timestamp: Date;
  resourceId?: string;
  resourceType?: string;
  duration?: number;
  metadata?: Record<string, any>;
}

interface AnalyticsPeriod {
  startDate: Date;
  endDate: Date;
}

interface UsageMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  totalAppointments: number;
  averageAppointmentDuration: number;
  featureUsage: Record<string, number>;
  deviceBreakdown: Record<string, number>;
  userRetention: number;
  mostActiveHours: {hour: number, count: number}[];
}

interface HealthcareInsights {
  topSymptoms: {symptom: string, count: number}[];
  mostRequestedSpecialties: {specialty: string, count: number}[];
  averageSatisfactionScore: number;
  commonHealthQueries: {query: string, count: number}[];
  averageResponseTime: number;
  patientEngagement: number;
  treatmentAdherence: number;
}

/**
 * Enhanced Analytics and Insights Service
 * Uses Google Cloud tools to analyze usage patterns and generate healthcare insights
 */
export class EnhancedAnalyticsService {
  private gemini: any;

  constructor() {
    this.gemini = initializeGemini();
  }

  /**
   * Log user activity for analytics
   */
  async logUserActivity(activity: Omit<UserActivity, 'timestamp'>): Promise<void> {
    try {
      const activityData: UserActivity = {
        ...activity,
        timestamp: new Date()
      };

      // Create a unique ID for the activity log
      const activityId = `${activity.userId}_${Date.now()}`;
      const activityRef = doc(firestore, 'analytics', 'userActivity', 'logs', activityId);

      // Store the activity log
      await setDoc(activityRef, activityData);

      // Update user's last activity timestamp
      const userRef = doc(firestore, 'users', activity.userId);
      await setDoc(userRef, { lastActivity: activityData.timestamp }, { merge: true });
    } catch (error: any) {
      console.error('Error logging user activity:', error);
      // Don't throw error for analytics to prevent disrupting the user experience
      console.warn(`Failed to log analytics: ${error.message}`);
    }
  }

  /**
   * Generate usage metrics for a specified time period
   */
  async getUsageMetrics(period: AnalyticsPeriod): Promise<UsageMetrics> {
    try {
      // Query activity logs for the period
      const logsQuery = query(
        collection(firestore, 'analytics', 'userActivity', 'logs'),
        where('timestamp', '>=', period.startDate),
        where('timestamp', '<=', period.endDate)
      );

      const snapshot = await getDocs(logsQuery);

      if (snapshot.empty) {
        return this.getEmptyUsageMetrics();
      }

      // Process activity logs
      const activities: UserActivity[] = [];
      const uniqueUsers = new Set<string>();
      const featureUsage: Record<string, number> = {};
      const devices: Record<string, number> = {};
      const hourlyActivity: Record<number, number> = {};

      snapshot.forEach(doc => {
        const data = doc.data() as UserActivity;
        activities.push({
          ...data,
          timestamp: data.timestamp.toDate()
        });

        // Count unique users
        uniqueUsers.add(data.userId);

        // Count feature usage
        const action = data.action || 'unknown';
        featureUsage[action] = (featureUsage[action] || 0) + 1;

        // Count device usage if available
        if (data.metadata?.device) {
          const device = data.metadata.device;
          devices[device] = (devices[device] || 0) + 1;
        }

        // Track hourly activity
        const hour = data.timestamp.getHours();
        hourlyActivity[hour] = (hourlyActivity[hour] || 0) + 1;
      });

      // Calculate appointment metrics
      const appointmentActivities = activities.filter(a => 
        a.action === 'appointment_joined' || a.action === 'appointment_completed'
      );
      
      const totalAppointments = appointmentActivities.length;
      const appointmentDurations = appointmentActivities
        .filter(a => a.duration !== undefined)
        .map(a => a.duration || 0);
      
      const averageAppointmentDuration = appointmentDurations.length > 0
        ? appointmentDurations.reduce((sum, duration) => sum + duration, 0) / appointmentDurations.length
        : 0;

      // Get active and new users
      const activeUsersCount = uniqueUsers.size;
      
      // Calculate new users (would need user registration date, simplified here)
      const allUsersQuery = query(
        collection(firestore, 'users'),
        where('createdAt', '>=', period.startDate),
        where('createdAt', '<=', period.endDate)
      );
      
      const usersSnapshot = await getDocs(allUsersQuery);
      const newUsersCount = usersSnapshot.size;
      
      // Calculate total users
      const totalUsersQuery = collection(firestore, 'users');
      const totalUsersSnapshot = await getDocs(totalUsersQuery);
      const totalUsersCount = totalUsersSnapshot.size;
      
      // Calculate user retention (simplified)
      const retentionRate = totalUsersCount > 0 ? activeUsersCount / totalUsersCount : 0;
      
      // Format hourly activity
      const mostActiveHours = Object.entries(hourlyActivity)
        .map(([hour, count]) => ({ hour: parseInt(hour), count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        totalUsers: totalUsersCount,
        activeUsers: activeUsersCount,
        newUsers: newUsersCount,
        totalAppointments,
        averageAppointmentDuration,
        featureUsage,
        deviceBreakdown: devices,
        userRetention: retentionRate,
        mostActiveHours
      };
    } catch (error: any) {
      console.error('Error generating usage metrics:', error);
      throw new Error(`Failed to generate usage metrics: ${error.message}`);
    }
  }

  /**
   * Generate healthcare insights from usage data
   */
  async getHealthcareInsights(period: AnalyticsPeriod): Promise<HealthcareInsights> {
    try {
      // Get symptom data
      const symptomsQuery = query(
        collection(firestore, 'symptoms'),
        where('timestamp', '>=', period.startDate),
        where('timestamp', '<=', period.endDate)
      );
      
      const symptomsSnapshot = await getDocs(symptomsQuery);
      
      // Process symptoms
      const symptomsMap: Record<string, number> = {};
      symptomsSnapshot.forEach(doc => {
        const data = doc.data();
        const symptoms = data.symptoms || [];
        symptoms.forEach((symptom: string) => {
          symptomsMap[symptom] = (symptomsMap[symptom] || 0) + 1;
        });
      });
      
      // Get specialty data from appointments
      const appointmentsQuery = query(
        collection(firestore, 'appointments'),
        where('timestamp', '>=', period.startDate),
        where('timestamp', '<=', period.endDate)
      );
      
      const appointmentsSnapshot = await getDocs(appointmentsQuery);
      
      // Process specialties
      const specialtiesMap: Record<string, number> = {};
      appointmentsSnapshot.forEach(doc => {
        const data = doc.data();
        const specialty = data.doctorSpecialty;
        if (specialty) {
          specialtiesMap[specialty] = (specialtiesMap[specialty] || 0) + 1;
        }
      });
      
      // Get satisfaction scores
      const reviewsQuery = query(
        collection(firestore, 'reviews'),
        where('timestamp', '>=', period.startDate),
        where('timestamp', '<=', period.endDate)
      );
      
      const reviewsSnapshot = await getDocs(reviewsQuery);
      
      // Calculate average satisfaction
      let totalScore = 0;
      let reviewCount = 0;
      
      reviewsSnapshot.forEach(doc => {
        const data = doc.data();
        const score = data.rating || 0;
        totalScore += score;
        reviewCount++;
      });
      
      const averageSatisfaction = reviewCount > 0 ? totalScore / reviewCount : 0;
      
      // Get common health queries
      const queriesQuery = query(
        collection(firestore, 'healthQueries'),
        where('timestamp', '>=', period.startDate),
        where('timestamp', '<=', period.endDate)
      );
      
      const queriesSnapshot = await getDocs(queriesQuery);
      
      // Process queries
      const queriesMap: Record<string, number> = {};
      queriesSnapshot.forEach(doc => {
        const data = doc.data();
        const query = data.query;
        if (query) {
          queriesMap[query] = (queriesMap[query] || 0) + 1;
        }
      });

      // Format insights data
      const topSymptoms = Object.entries(symptomsMap)
        .map(([symptom, count]) => ({ symptom, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
        
      const mostRequestedSpecialties = Object.entries(specialtiesMap)
        .map(([specialty, count]) => ({ specialty, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
        
      const commonHealthQueries = Object.entries(queriesMap)
        .map(([query, count]) => ({ query, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Placeholder values for metrics that would require more complex calculations
      const averageResponseTime = 120; // 2 minutes
      const patientEngagement = 0.72; // 72%
      const treatmentAdherence = 0.65; // 65%

      return {
        topSymptoms,
        mostRequestedSpecialties,
        averageSatisfactionScore: averageSatisfaction,
        commonHealthQueries,
        averageResponseTime,
        patientEngagement,
        treatmentAdherence
      };
    } catch (error: any) {
      console.error('Error generating healthcare insights:', error);
      throw new Error(`Failed to generate healthcare insights: ${error.message}`);
    }
  }

  /**
   * Generate AI-powered improvement recommendations based on analytics
   */
  async generateImprovementRecommendations(
    usageMetrics: UsageMetrics,
    healthcareInsights: HealthcareInsights
  ): Promise<string[]> {
    try {
      if (!this.gemini) {
        return [
          "Improve response times for emergency consultations",
          "Add more specialists in the most requested fields",
          "Create educational content for common health queries",
          "Optimize the platform for the most common devices used"
        ];
      }

      // Create a prompt for Gemini
      const prompt = `
        Based on the following telehealth platform analytics, provide 5 specific, actionable recommendations for improving the platform:
        
        Usage Metrics:
        - Total Users: ${usageMetrics.totalUsers}
        - Active Users: ${usageMetrics.activeUsers}
        - User Retention Rate: ${(usageMetrics.userRetention * 100).toFixed(1)}%
        - Most Used Features: ${Object.entries(usageMetrics.featureUsage)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([feature, count]) => feature)
          .join(', ')}
        - Most Active Hours: ${usageMetrics.mostActiveHours
          .map(h => `${h.hour}:00 (${h.count} activities)`)
          .join(', ')}
        - Device Breakdown: ${Object.entries(usageMetrics.deviceBreakdown)
          .map(([device, count]) => `${device}: ${count}`)
          .join(', ')}
        
        Healthcare Insights:
        - Top Symptoms: ${healthcareInsights.topSymptoms
          .slice(0, 5)
          .map(s => s.symptom)
          .join(', ')}
        - Most Requested Specialties: ${healthcareInsights.mostRequestedSpecialties
          .map(s => s.specialty)
          .join(', ')}
        - Average Satisfaction Score: ${healthcareInsights.averageSatisfactionScore.toFixed(1)}/5
        - Common Health Queries: ${healthcareInsights.commonHealthQueries
          .slice(0, 5)
          .map(q => q.query)
          .join(', ')}
        - Average Response Time: ${healthcareInsights.averageResponseTime} seconds
        - Patient Engagement: ${(healthcareInsights.patientEngagement * 100).toFixed(1)}%
        - Treatment Adherence: ${(healthcareInsights.treatmentAdherence * 100).toFixed(1)}%
        
        Provide 5 specific, actionable recommendations for improving the telehealth platform. Each recommendation should:
        1. Focus on addressing a clear issue evident in the data
        2. Be specific and implementable
        3. Include rationale based on the metrics provided
        4. Be prioritized by potential impact
        
        Format your response as a numbered list with each recommendation in 1-2 sentences.
      `;

      // Generate recommendations using Gemini
      const result = await this.gemini.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text();

      // Extract recommendations from response
      const recommendations: string[] = [];
      const lines = responseText.split('\n');
      
      for (const line of lines) {
        // Look for numbered lines (1. 2. etc.)
        const match = line.match(/^\s*\d+\.\s*(.+)$/);
        if (match && match[1]) {
          recommendations.push(match[1].trim());
        }
      }

      return recommendations.length > 0 ? recommendations : [
        "Improve response times for emergency consultations",
        "Add more specialists in the most requested fields",
        "Create educational content for common health queries",
        "Optimize the platform for the most common devices used",
        "Implement medication reminders to increase treatment adherence"
      ];
    } catch (error: any) {
      console.error('Error generating improvement recommendations:', error);
      return [
        "Improve response times for emergency consultations",
        "Add more specialists in the most requested fields",
        "Create educational content for common health queries",
        "Optimize the platform for the most common devices used",
        "Implement medication reminders to increase treatment adherence"
      ];
    }
  }

  /**
   * Get empty usage metrics structure for when no data is available
   */
  private getEmptyUsageMetrics(): UsageMetrics {
    return {
      totalUsers: 0,
      activeUsers: 0,
      newUsers: 0,
      totalAppointments: 0,
      averageAppointmentDuration: 0,
      featureUsage: {},
      deviceBreakdown: {},
      userRetention: 0,
      mostActiveHours: []
    };
  }
}

// Export a singleton instance
export const enhancedAnalytics = new EnhancedAnalyticsService();