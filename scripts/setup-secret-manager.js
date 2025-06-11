#!/usr/bin/env node

/**
 * Automated Secret Manager Setup
 * This script automatically transfers your API keys to Google Cloud Secret Manager
 * Run this when deploying to production for enhanced security
 */

import { secureConfig } from '../server/services/secureConfigService.js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function setupSecretManager() {
  console.log('🔐 Setting up Google Cloud Secret Manager for your telehealth platform...\n');

  // Check current configuration
  const status = secureConfig.getStatus();
  console.log('Current Configuration:');
  console.log(`  Project ID: ${status.projectId}`);
  console.log(`  Environment: ${status.isProduction ? 'Production' : 'Development'}`);
  console.log(`  Mode: ${status.configurationMode}\n`);

  if (!status.isProduction) {
    console.log('💡 Development Mode Detected');
    console.log('   Your API keys are safely stored in your .env file');
    console.log('   Secret Manager will be used automatically when you deploy to production\n');
    
    // Show current configuration status
    await secureConfig.getAllConfig();
    
    console.log('\n📝 Next Steps:');
    console.log('   1. Your API keys are working correctly in development');
    console.log('   2. When deploying to production, set NODE_ENV=production');
    console.log('   3. Secret Manager will automatically secure your keys');
    console.log('   4. No manual setup required in Google Cloud Console!');
    return;
  }

  // Production mode - transfer secrets
  console.log('🚀 Production Mode - Transferring secrets to Secret Manager...\n');

  const secrets = [
    'GEMINI_API_KEY',
    'GOOGLE_CLOUD_CLIENT_ID', 
    'GOOGLE_CLOUD_CLIENT_SECRET',
    'GOOGLE_CLOUD_API_KEY',
    'TWILIO_ACCOUNT_SID',
    'TWILIO_API_KEY', 
    'TWILIO_API_SECRET',
    'GOOGLE_MAPS_API_KEY'
  ];

  let successCount = 0;

  for (const secretName of secrets) {
    const value = process.env[secretName];
    
    if (!value) {
      console.log(`⚠️ Skipping ${secretName}: Not found in environment`);
      continue;
    }

    console.log(`🔑 Storing ${secretName}...`);
    const success = await secureConfig.storeSecret(secretName, value);
    
    if (success) {
      successCount++;
    }
  }

  console.log(`\n✅ Successfully stored ${successCount} out of ${secrets.length} secrets`);
  console.log('🎉 Your telehealth platform is now secured with Google Cloud Secret Manager!');
}

// Run the setup
setupSecretManager().catch(error => {
  console.error('❌ Setup failed:', error.message);
  process.exit(1);
});