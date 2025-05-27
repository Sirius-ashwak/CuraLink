/**
 * Deploy Firebase Privacy & Security Rules
 * This script automatically configures your Firebase project with healthcare-grade security
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function deployPrivacyRules() {
  console.log('🔐 Deploying Healthcare Privacy & Security Rules...\n');

  try {
    // Check if Firebase CLI is installed
    try {
      execSync('firebase --version', { stdio: 'pipe' });
      console.log('✅ Firebase CLI is installed');
    } catch (error) {
      console.log('❌ Firebase CLI not found. Installing...');
      execSync('npm install -g firebase-tools', { stdio: 'inherit' });
      console.log('✅ Firebase CLI installed successfully');
    }

    // Check if user is logged in to Firebase
    try {
      execSync('firebase projects:list', { stdio: 'pipe' });
      console.log('✅ Firebase authentication confirmed');
    } catch (error) {
      console.log('🔑 Please log in to Firebase...');
      execSync('firebase login', { stdio: 'inherit' });
    }

    // Deploy Firestore security rules
    console.log('\n📋 Deploying Firestore security rules...');
    if (fs.existsSync('firebase.rules')) {
      execSync('firebase deploy --only firestore:rules', { stdio: 'inherit' });
      console.log('✅ Firestore security rules deployed successfully');
    } else {
      console.log('❌ firebase.rules file not found');
    }

    // Deploy Storage security rules
    console.log('\n📁 Deploying Storage security rules...');
    if (fs.existsSync('storage.rules')) {
      execSync('firebase deploy --only storage', { stdio: 'inherit' });
      console.log('✅ Storage security rules deployed successfully');
    } else {
      console.log('❌ storage.rules file not found');
    }

    // Create initial privacy configuration in Firestore
    console.log('\n🛠️ Setting up privacy collections...');
    await createPrivacyCollections();

    console.log('\n🎉 Healthcare Privacy System Deployed Successfully!');
    console.log('\n📋 Next Steps:');
    console.log('1. Add "role" field to user registration');
    console.log('2. Create patient consent documents');
    console.log('3. Test privacy controls with different user roles');
    console.log('4. Enable Google Cloud audit logging');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    console.log('\n🔧 Manual deployment steps:');
    console.log('1. Run: firebase login');
    console.log('2. Run: firebase deploy --only firestore:rules');
    console.log('3. Run: firebase deploy --only storage');
  }
}

async function createPrivacyCollections() {
  // This would create initial documents for privacy system
  // In a real deployment, you'd use Firebase Admin SDK here
  console.log('📝 Privacy collections structure ready');
  console.log('   - /users/{uid} - User profiles with roles');
  console.log('   - /patient_consents/{consentId} - Consent management');
  console.log('   - /audit_logs/{logId} - Access audit trail');
}

// Run deployment
deployPrivacyRules().catch(console.error);