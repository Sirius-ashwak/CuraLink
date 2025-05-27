/**
 * Directly Add Secrets to Google Cloud Secret Manager
 * This script adds your secrets directly to Google Cloud Secret Manager
 */

import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

// Get project ID from environment variables
const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;

if (!projectId) {
  console.error('ERROR: GOOGLE_CLOUD_PROJECT_ID not found in environment variables');
  process.exit(1);
}

// List of secret names to retrieve from environment variables
const secretNames = [
  'GEMINI_API_KEY',
  'GOOGLE_CLOUD_CLIENT_ID',
  'GOOGLE_CLOUD_CLIENT_SECRET',
  'GOOGLE_CLOUD_API_KEY',
  'GOOGLE_MAPS_API_KEY',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN'
];

async function addSecretsDirectly() {
  console.log('🔐 Adding secrets directly to Google Cloud Secret Manager...\n');
  console.log(`Project ID: ${projectId}\n`);

  try {
    // Create Secret Manager client
    const secretManager = new SecretManagerServiceClient();
    console.log('✓ Connected to Google Cloud Secret Manager');

    let successCount = 0;
    const parent = `projects/${projectId}`;

    // Add each secret from environment variables
    for (const secretName of secretNames) {
      const secretValue = process.env[secretName];
      
      if (!secretValue) {
        console.log(`⚠️ Skipping ${secretName}: Not found in environment variables`);
        continue;
      }
      
      try {
        console.log(`Processing: ${secretName}`);
        
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

    console.log(`\n✅ Successfully added ${successCount} out of ${secretNames.length} secrets to Google Cloud Secret Manager`);
    
    if (successCount > 0) {
      console.log('\nYou can view your secrets in the Google Cloud Console:');
      console.log(`https://console.cloud.google.com/security/secret-manager?project=${projectId}`);
    }
  } catch (error) {
    console.error('\n❌ Failed to connect to Google Cloud Secret Manager:', error.message);
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
addSecretsDirectly().catch(error => {
  console.error('❌ Script failed:', error);
});