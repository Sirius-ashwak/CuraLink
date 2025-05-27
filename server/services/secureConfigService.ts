/**
 * Secure Configuration Service
 * Provides a unified interface for accessing sensitive configuration
 * Automatically uses Secret Manager in production and env vars in development
 */

import * as dotenv from 'dotenv';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

// Load environment variables
dotenv.config();

export class SecureConfigService {
  private projectId: string;
  private isProduction: boolean;
  private client: SecretManagerServiceClient | null = null;

  constructor() {
    this.projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || '';
    this.isProduction = process.env.NODE_ENV === 'production';
    
    // Only initialize Secret Manager in production with proper credentials
    if (this.isProduction && this.projectId) {
      try {
        this.client = new SecretManagerServiceClient();
        console.log('✓ Secret Manager initialized for production environment');
      } catch (error) {
        console.warn('⚠️ Secret Manager initialization failed, falling back to environment variables');
        this.client = null;
      }
    } else {
      console.log('✓ Using environment variables for development');
    }
  }

  /**
   * Get a configuration value securely
   * Uses Secret Manager in production, env vars in development
   */
  async getConfig(key: string): Promise<string> {
    // In development or if Secret Manager is not available, use env vars
    if (!this.client || !this.isProduction) {
      const value = process.env[key] || '';
      if (value) {
        console.log(`✓ Retrieved ${key} from environment variables`);
      } else {
        console.warn(`⚠️ ${key} not found in environment variables`);
      }
      return value;
    }

    // In production, try Secret Manager first, fallback to env vars
    try {
      const secretName = `projects/${this.projectId}/secrets/${key}/versions/latest`;
      const [version] = await this.client.accessSecretVersion({ name: secretName });
      const payload = version.payload?.data?.toString() || '';
      
      if (payload) {
        console.log(`✓ Retrieved ${key} from Secret Manager`);
        return payload;
      }
    } catch (error) {
      console.warn(`⚠️ Failed to retrieve ${key} from Secret Manager, falling back to env vars`);
    }

    // Fallback to environment variables
    const value = process.env[key] || '';
    if (value) {
      console.log(`✓ Retrieved ${key} from environment variables (fallback)`);
    } else {
      console.warn(`⚠️ ${key} not found in Secret Manager or environment variables`);
    }
    return value;
  }

  /**
   * Store a secret in Secret Manager (production only)
   */
  async storeSecret(key: string, value: string): Promise<boolean> {
    if (!this.client || !this.isProduction || !this.projectId) {
      console.log(`Development mode: ${key} should be set in .env file`);
      return false;
    }

    try {
      const parent = `projects/${this.projectId}`;
      
      // Create secret if it doesn't exist
      try {
        await this.client.createSecret({
          parent,
          secretId: key,
          secret: {
            replication: { automatic: {} }
          }
        });
        console.log(`✓ Created secret: ${key}`);
      } catch (error: any) {
        if (error.code !== 6) { // 6 = ALREADY_EXISTS
          throw error;
        }
        console.log(`✓ Secret ${key} already exists`);
      }

      // Add secret version
      await this.client.addSecretVersion({
        parent: `${parent}/secrets/${key}`,
        payload: { data: Buffer.from(value) }
      });

      console.log(`✓ Stored ${key} in Secret Manager`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to store ${key} in Secret Manager:`, error);
      return false;
    }
  }

  /**
   * Get all required configuration for the application
   */
  async getAllConfig() {
    const config = {
      geminiApiKey: await this.getConfig('GEMINI_API_KEY'),
      googleCloudProjectId: await this.getConfig('GOOGLE_CLOUD_PROJECT_ID'),
      googleCloudClientId: await this.getConfig('GOOGLE_CLOUD_CLIENT_ID'),
      googleCloudClientSecret: await this.getConfig('GOOGLE_CLOUD_CLIENT_SECRET'),
      googleCloudApiKey: await this.getConfig('GOOGLE_CLOUD_API_KEY'),
      twilioAccountSid: await this.getConfig('TWILIO_ACCOUNT_SID'),
      twilioApiKey: await this.getConfig('TWILIO_API_KEY'),
      twilioApiSecret: await this.getConfig('TWILIO_API_SECRET'),
      googleMapsApiKey: await this.getConfig('GOOGLE_MAPS_API_KEY'),
    };

    // Log configuration status
    console.log('\n🔐 Configuration Status:');
    Object.entries(config).forEach(([key, value]) => {
      console.log(`  ${key}: ${value ? '✓ Configured' : '❌ Missing'}`);
    });

    return config;
  }

  /**
   * Check if the service is properly configured
   */
  getStatus() {
    return {
      projectId: this.projectId,
      isProduction: this.isProduction,
      secretManagerAvailable: Boolean(this.client),
      configurationMode: this.client && this.isProduction ? 'Secret Manager' : 'Environment Variables'
    };
  }
}

// Export singleton instance
export const secureConfig = new SecureConfigService();