/**
 * Secret Manager Initialization Script
 * 
 * This script securely transfers API keys from your .env file to Google Cloud Secret Manager
 * for better security and compliance with healthcare regulations.
 */

import * as dotenv from 'dotenv';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

// Initialize dotenv with explicit path
dotenv.config({ path: './.env' });

// Debug environment variables
console.log('Environment variables loaded:');
console.log(`- GOOGLE_CLOUD_PROJECT_ID: ${process.env.GOOGLE_CLOUD_PROJECT_ID || 'not found'}`);
console.log(`- GEMINI_API_KEY length: ${process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 'not found'}`);

// Create Secret Manager client
const client = new SecretManagerServiceClient();

// List of API keys to transfer to Secret Manager
const API_KEYS_TO_STORE = [
  'GEMINI_API_KEY',
  'GOOGLE_CLOUD_API_KEY',
  'GOOGLE_CLOUD_CLIENT_ID',
  'GOOGLE_CLOUD_CLIENT_SECRET',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_API_KEY',
  'TWILIO_API_SECRET',
  'GOOGLE_MAPS_API_KEY'
];

// Get project ID from environment
const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
if (!projectId) {
  console.error('ERROR: GOOGLE_CLOUD_PROJECT_ID not defined in .env file');
  process.exit(1);
}

async function storeSecrets() {
  console.log('Starting to transfer API keys to Secret Manager...');
  console.log(`Project ID: ${projectId}`);
  console.log('---------------------------------------');

  const parent = `projects/${projectId}`;
  let successCount = 0;

  for (const keyName of API_KEYS_TO_STORE) {
    const keyValue = process.env[keyName];
    
    if (!keyValue) {
      console.log(`⚠️ Skipping ${keyName}: Not found in .env file`);
      continue;
    }

    try {
      console.log(`Processing ${keyName}...`);
      
      // First, create the secret if it doesn't exist
      try {
        await client.createSecret({
          parent,
          secretId: keyName,
          secret: {
            replication: {
              automatic: {}
            }
          }
        });
        console.log(`  ✓ Created secret: ${keyName}`);
      } catch (error) {
        if (error.code === 6) { // ALREADY_EXISTS
          console.log(`  ✓ Secret ${keyName} already exists`);
        } else {
          throw error;
        }
      }
      
      // Add a new secret version with the value
      const [version] = await client.addSecretVersion({
        parent: `${parent}/secrets/${keyName}`,
        payload: {
          data: Buffer.from(keyValue, 'utf8')
        }
      });
      
      console.log(`  ✓ Added new version to secret ${keyName}: ${version.name}`);
      successCount++;
    } catch (error) {
      console.error(`  ❌ Error storing ${keyName}:`, error.message);
    }
  }

  console.log('---------------------------------------');
  console.log(`Successfully stored ${successCount} of ${API_KEYS_TO_STORE.length} API keys`);
  console.log('Your API keys are now securely stored in Google Cloud Secret Manager!');
  console.log('');
  console.log('To access them from your application:');
  console.log('1. The secretManagerService.getSecret("KEY_NAME") method will retrieve them');
  console.log('2. If a key is not in Secret Manager, it will fall back to your .env file');
}

// Run the script
storeSecrets().catch(err => {
  console.error('Error initializing Secret Manager:', err);
  process.exit(1);
});