/**
 * Google Cloud Secret Manager Service
 * Securely stores and retrieves API keys and sensitive configuration
 */

import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import * as dotenv from 'dotenv';
import { localSecretManager, checkRequiredEnvironmentVariables } from './secretManagerUtils';

// Load environment variables
dotenv.config();

export class SecretManagerService {
  private projectId: string;
  private isConfigured: boolean;
  private client: SecretManagerServiceClient | null = null;
  private isDevelopment: boolean;

  constructor() {
    // Check environment variables are available
    const envCheck = checkRequiredEnvironmentVariables();
    
    // Use the project ID from environment variables only
    this.projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || '';
    this.isDevelopment = process.env.NODE_ENV !== 'production';
    this.isConfigured = false;
    
    console.log(`Using project ID: ${this.projectId} for Secret Manager`);
    
    // Always try to connect to Google Cloud Secret Manager first
    try {
      this.client = new SecretManagerServiceClient();
      this.isConfigured = true;
      console.log('✅ Google Cloud Secret Manager initialized successfully');
      console.log(`✅ Project ID: ${this.projectId}`);
      console.log('✅ Will prioritize Secret Manager over environment variables');
    } catch (error: any) {
      console.warn('⚠️ Failed to initialize Secret Manager client');
      console.warn('⚠️ Secret Manager error:', error.message || 'Unknown error');
      console.warn('⚠️ Will still attempt to use Secret Manager on demand');
      this.isConfigured = false;
    }
  }

  /**
   * Get a secret value from Secret Manager or local cache
   */
  async getSecret(secretName: string, envVarFallback?: string): Promise<string> {
    // Always try Secret Manager first, regardless of initialization status
    try {
      // Make sure we have a project ID
      if (!this.projectId) {
        throw new Error("Missing project ID");
      }
      
      // Create a client on-demand if needed
      const client = this.client || new SecretManagerServiceClient();
      
      const name = `projects/${this.projectId}/secrets/${secretName}/versions/latest`;
      console.log(`Attempting to access secret: ${secretName} from Google Cloud Secret Manager`);
      
      const [version] = await client.accessSecretVersion({ name });
      const payload = version.payload?.data?.toString() || '';
      
      if (payload) {
        console.log(`✅ Successfully retrieved ${secretName} from Google Cloud Secret Manager`);
        return payload;
      } else {
        console.warn(`⚠️ Secret ${secretName} exists in Secret Manager but has empty payload`);
        // Fall through to fallback
      }
    } catch (err: any) {
      // Only fall back if access is specifically denied or not found
      if (err.code === 7 || err.code === 5 || err.code === 16) { // PERMISSION_DENIED, NOT_FOUND, UNAUTHENTICATED
        console.warn(`⚠️ Access denied or secret not found for ${secretName}: ${err.message}`);
        console.log(`Falling back to environment variables for ${secretName}`);
      } else {
        console.warn(`⚠️ Error accessing ${secretName} from Secret Manager: ${err.message || 'Unknown error'}`);
        console.log(`Falling back to environment variables due to error for ${secretName}`);
      }
    }

    // Fallback to environment variables only if Secret Manager access failed
    const actualSecretName = envVarFallback || secretName;
    const envValue = process.env[actualSecretName];
    
    if (envValue) {
      console.log(`Using ${secretName} from environment variables (fallback)`);
      return envValue;
    }
    
    console.warn(`⚠️ Secret ${secretName} not found in Secret Manager or environment variables`);
    return '';
  }

  /**
   * Create or update a secret in Secret Manager
   */
  async setSecret(secretName: string, secretValue: string): Promise<boolean> {
    // Always try to use Secret Manager, even if not initially configured
    try {
      // Make sure we have a project ID
      if (!this.projectId) {
        throw new Error("Missing project ID");
      }

      // Create a client on-demand if needed
      const client = this.client || new SecretManagerServiceClient();
      
      // Format the parent in the required format
      const parent = `projects/${this.projectId}`;
      
      // First, try to create the secret
      try {
        await client.createSecret({
          parent,
          secretId: secretName,
          secret: {
            replication: {
              automatic: {}
            }
          }
        });
        console.log(`🟢 Created new secret in Secret Manager: ${secretName}`);
      } catch (error: any) {
        // If secret already exists, that's fine
        if (error.code !== 6) { // 6 = ALREADY_EXISTS
          throw error;
        }
        console.log(`🟢 Secret ${secretName} already exists in Secret Manager, adding new version`);
      }
      
      // Add a new secret version
      const [version] = await client.addSecretVersion({
        parent: `${parent}/secrets/${secretName}`,
        payload: {
          data: Buffer.from(secretValue, 'utf8')
        }
      });
      
      console.log(`🟢 Added new version to secret ${secretName} in Secret Manager: ${version.name}`);
      
      // Only update environment variables if specifically requested or in development
      if (this.isDevelopment) {
        // Set the environment variable for development convenience
        process.env[secretName] = secretValue;
        console.log(`🔶 Also updated environment variable ${secretName} for development convenience`);
      }
      
      return true;
    } catch (err: any) {
      // Only use environment variables if access is denied or other specific errors
      console.warn(`🔴 Failed to store ${secretName} in Secret Manager: ${err.message || 'Unknown error'}`);
      
      // Update environment variable as fallback
      process.env[secretName] = secretValue;
      console.log(`🔶 Stored ${secretName} in environment variables as fallback`);
      return false;
    }
  }

  /**
   * Check if Secret Manager is properly configured
   */
  getStatus(): { 
    isConfigured: boolean, 
    projectId: string, 
    prioritizeSecretManager: boolean,
    environment: string
  } {
    return { 
      isConfigured: this.isConfigured,
      projectId: this.projectId,
      prioritizeSecretManager: true, // Always prioritize Secret Manager now
      environment: this.isDevelopment ? 'development' : 'production'
    };
  }
}

// Export a singleton instance
export const secretManagerService = new SecretManagerService();