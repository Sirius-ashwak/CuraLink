/**
 * This script copies environment variables from the root .env file to the client directory
 * to make them available to the client-side code.
 */

const fs = require('fs');
const path = require('path');

// Paths
const rootEnvPath = path.join(__dirname, '..', '.env');
const clientEnvPath = path.join(__dirname, '..', 'client', '.env');

// Read the root .env file
try {
  const rootEnvContent = fs.readFileSync(rootEnvPath, 'utf8');
  
  // Extract lines that contain Google Maps or Firebase configuration
  const relevantLines = rootEnvContent
    .split('\n')
    .filter(line => 
      line.includes('GOOGLE_MAPS') || 
      line.includes('FIREBASE') || 
      line.includes('GOOGLE_CLOUD')
    );
  
  // Add VITE_ prefix to variables that don't have it
  const processedLines = relevantLines.map(line => {
    const [key, value] = line.split('=');
    if (key && value && !key.trim().startsWith('VITE_')) {
      return `VITE_${key.trim()}=${value}`;
    }
    return line;
  });
  
  // Create or update the client .env file
  fs.writeFileSync(clientEnvPath, processedLines.join('\n'), 'utf8');
  
  console.log('Environment variables copied successfully to client/.env');
} catch (error) {
  console.error('Error copying environment variables:', error);
}