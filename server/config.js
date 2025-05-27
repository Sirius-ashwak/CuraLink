// Load environment variables from .env file
require('dotenv').config();

// Export environment variables for easy access
module.exports = {
  geminiApiKey: process.env.GEMINI_API_KEY,
  googleCloudProjectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  googleCloudApiKey: process.env.GOOGLE_CLOUD_API_KEY,
  googleCloudClientId: process.env.GOOGLE_CLOUD_CLIENT_ID,
  googleCloudClientSecret: process.env.GOOGLE_CLOUD_CLIENT_SECRET,
};

// Log the configuration status
console.log('Environment configuration:');
console.log(`- Gemini API Key: ${process.env.GEMINI_API_KEY ? 'Available ✓' : 'Missing ✗'}`);
console.log(`- Google Cloud Project ID: ${process.env.GOOGLE_CLOUD_PROJECT_ID ? 'Available ✓' : 'Missing ✗'}`);
console.log(`- Google Cloud API Key: ${process.env.GOOGLE_CLOUD_API_KEY ? 'Available ✓' : 'Missing ✗'}`);