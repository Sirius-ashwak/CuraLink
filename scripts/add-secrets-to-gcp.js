/**
 * Add Secrets to Google Cloud Secret Manager
 * This script transfers secrets from your .env file directly to Google Cloud Secret Manager
 */

import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
dotenv.config();

// Print loaded environment variables for debugging
console.log("Environment variables loaded from .env file:");
console.log(`GOOGLE_CLOUD_PROJECT_ID: ${process.env.GOOGLE_CLOUD_PROJECT_ID || 'not found'}`);
console.log(`GOOGLE_APPLICATION_CREDENTIALS: ${process.env.GOOGLE_APPLICATION_CREDENTIALS || 'not found'}`);
console.log('');

async function addSecretsToGCP() {
  console.log('🔐 Adding secrets from .env to Google Cloud Secret Manager...\n');

  // Verify project ID
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  if (!projectId) {
    console.error('❌ GOOGLE_CLOUD_PROJECT_ID not found in .env file');
    return;
  }
  console.log(`✓ Project ID: ${projectId}`);

  // Create Secret Manager client
  try {
    const secretManager = new SecretManagerServiceClient();
    console.log('✓ Connected to Google Cloud Secret Manager');

    // List of secrets to add
    const secrets = [
      'GEMINI_API_KEY',
      'GOOGLE_CLOUD_CLIENT_ID', 
      'GOOGLE_CLOUD_CLIENT_SECRET',
      'GOOGLE_CLOUD_API_KEY',
      'TWILIO_ACCOUNT_SID',
      'TWILIO_AUTH_TOKEN',
      'GOOGLE_MAPS_API_KEY'
    ];

    let successCount = 0;

    // Process each secret
    for (const secretName of secrets) {
      const secretValue = process.env[secretName];
      
      if (!secretValue) {
        console.log(`⚠️ Skipping ${secretName}: Not found in .env file`);
        continue;
      }

      try {
        // Parent resource path
        const parent = `projects/${projectId}`;
        
        // Step 1: Try to create the secret (if it doesn't exist)
        try {
          await secretManager.createSecret({
            parent,
            secretId: secretName,
            secret: {
              replication: {
                automatic: {}
              }
            }
          });
          console.log(`✓ Created new secret: ${secretName}`);
        } catch (error) {
          // Ignore error if secret already exists (error code 6)
          if (error.code !== 6) {
            throw error;
          }
          console.log(`✓ Secret ${secretName} already exists, adding new version`);
        }
        
        // Step 2: Add a new version with the secret value
        const secretPath = `${parent}/secrets/${secretName}`;
        const [version] = await secretManager.addSecretVersion({
          parent: secretPath,
          payload: {
            data: Buffer.from(secretValue, 'utf8')
          }
        });
        
        console.log(`✓ Added version ${version.name} to secret ${secretName}`);
        successCount++;
      } catch (error) {
        console.error(`❌ Error processing ${secretName}:`, error.message);
      }
    }

    console.log(`\n✅ Successfully added ${successCount} out of ${secrets.length} secrets to Google Cloud Secret Manager`);
    
    if (successCount > 0) {
      console.log('\nYou can view your secrets in the Google Cloud Console:');
      console.log(`https://console.cloud.google.com/security/secret-manager?project=${projectId}`);
    }
    
    if (successCount < secrets.length) {
      console.log('\n⚠️ Some secrets were not added. Check the error messages above.');
    }
  } catch (error) {
    console.error('❌ Failed to connect to Google Cloud Secret Manager:', error.message);
    console.log('\nPossible reasons:');
    console.log('1. Your Google Cloud credentials file might be invalid or incomplete');
    console.log('2. The service account may not have Secret Manager Admin permissions');
    console.log('3. Your project might not have the Secret Manager API enabled');
    
    console.log('\nFix steps:');
    console.log('1. Make sure GOOGLE_APPLICATION_CREDENTIALS in your .env points to a valid credentials file');
    console.log('2. Go to IAM in Google Cloud Console and ensure your service account has "Secret Manager Admin" role');
    console.log('3. Enable the Secret Manager API at: https://console.cloud.google.com/apis/library/secretmanager.googleapis.com');
  }
}

// Run the script
addSecretsToGCP().catch(error => {
  console.error('❌ Script failed:', error);
});