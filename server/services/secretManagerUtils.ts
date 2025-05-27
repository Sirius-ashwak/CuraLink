/**
 * Secret Manager Utilities
 * Helper functions for working with secrets in development and production
 */

import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
dotenv.config();

// This helps us properly check for required environment variables
export function checkRequiredEnvironmentVariables() {
  // List of required environment variables that should be available
  const requiredEnvVars = [
    'GEMINI_API_KEY',
    'GOOGLE_CLOUD_CLIENT_ID',
    'GOOGLE_CLOUD_CLIENT_SECRET',
    'GOOGLE_CLOUD_API_KEY',
    'GOOGLE_CLOUD_PROJECT_ID',
    'GOOGLE_MAPS_API_KEY',
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN'
  ];
  
  const missingVars: string[] = [];
  const availableVars: string[] = [];
  
  // Check which variables are available
  requiredEnvVars.forEach(key => {
    if (process.env[key]) {
      availableVars.push(key);
    } else {
      missingVars.push(key);
    }
  });
  
  return {
    required: requiredEnvVars,
    available: availableVars,
    missing: missingVars,
    allPresent: missingVars.length === 0
  };
}

// Local secret cache for development
interface SecretCache {
  [key: string]: string;
}

// Create a local secret manager for development mode
class LocalSecretManager {
  private cache: SecretCache = {};
  
  constructor() {
    this.loadFromEnv();
    console.log('✓ Local Secret Manager initialized for development');
  }
  
  // Load secrets from environment variables
  private loadFromEnv(): void {
    // Manual entries for the credentials from environment variables
    this.cache['GOOGLE_CLOUD_CLIENT_ID'] = process.env.GOOGLE_CLOUD_CLIENT_ID || '';
    this.cache['GOOGLE_CLOUD_CLIENT_SECRET'] = process.env.GOOGLE_CLOUD_CLIENT_SECRET || '';
    this.cache['GOOGLE_CLOUD_PROJECT_ID'] = process.env.GOOGLE_CLOUD_PROJECT_ID || '';
    this.cache['GOOGLE_CLOUD_API_KEY'] = process.env.GOOGLE_CLOUD_API_KEY || '';
    this.cache['GEMINI_API_KEY'] = process.env.GEMINI_API_KEY || '';
    
    // Add other secrets from environment variables
    const secretNames = [
      'GEMINI_API_KEY',
      'TWILIO_ACCOUNT_SID',
      'TWILIO_AUTH_TOKEN',
      'GOOGLE_MAPS_API_KEY'
    ];
    
    // Load all available secrets from environment
    for (const name of secretNames) {
      const value = process.env[name];
      if (value && !this.cache[name]) {
        this.cache[name] = value;
        console.log(`✓ Loaded ${name} from environment`);
      }
    }
    
    console.log(`✓ Loaded ${Object.keys(this.cache).length} secrets for secure storage`);
  }
  
  // Get a secret from the cache
  getSecret(name: string): string {
    const value = this.cache[name] || process.env[name] || '';
    if (!value) {
      console.warn(`❌ Secret ${name} not found in local cache or environment`);
    }
    return value;
  }
  
  // Store a secret in the cache
  setSecret(name: string, value: string): boolean {
    this.cache[name] = value;
    console.log(`✓ Stored ${name} in local cache`);
    return true;
  }
  
  // Check if a secret exists
  hasSecret(name: string): boolean {
    return Boolean(this.cache[name] || process.env[name]);
  }
  
  // Get the status of the local manager
  getStatus(): { ready: boolean, secretCount: number } {
    return {
      ready: true,
      secretCount: Object.keys(this.cache).length
    };
  }
}

// Export a singleton instance of LocalSecretManager
export const localSecretManager = new LocalSecretManager();

// Helper function to check if we can connect to Google Cloud
export function canConnectToGoogleCloud(): boolean {
  // Check if we have the minimum required credentials
  const hasProjectId = Boolean(process.env.GOOGLE_CLOUD_PROJECT_ID);
  const hasCredentialsFile = Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS);
  
  // If we don't have the basic config, we can't connect
  if (!hasProjectId || !hasCredentialsFile) {
    return false;
  }
  
  // Check if the credentials file exists and has content
  try {
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || '';
    const fileExists = fs.existsSync(credentialsPath);
    
    if (!fileExists) {
      return false;
    }
    
    // Check if the file has valid content
    const content = fs.readFileSync(credentialsPath, 'utf-8');
    const credentials = JSON.parse(content);
    
    // Check for minimum required fields
    return Boolean(
      credentials.type === 'service_account' &&
      credentials.project_id &&
      credentials.private_key &&
      credentials.client_email
    );
  } catch (error) {
    // If there's any error checking the credentials, we can't connect
    return false;
  }
}