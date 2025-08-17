/**
 * Production build script for CuraLink
 * This script builds the client and server for production deployment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Set environment to production for the build process
process.env.NODE_ENV = 'production';

console.log('🚀 Starting production build process...');

// Ensure we're in the project root
const projectRoot = path.join(__dirname, '..');
process.chdir(projectRoot);

// Verify environment variables
console.log('\n🔍 Checking environment variables...');
const requiredVars = [
  'VITE_GOOGLE_MAPS_API_KEY',
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_PROJECT_ID'
];

const missingVars = requiredVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.warn('\n⚠️ Warning: The following required environment variables are missing:');
  missingVars.forEach(varName => console.warn(`  - ${varName}`));
  console.warn('\nThe application may not function correctly without these variables.');
  
  // Ask for confirmation to continue
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  readline.question('\nDo you want to continue with the build? (y/N): ', answer => {
    readline.close();
    if (answer.toLowerCase() !== 'y') {
      console.log('\n🛑 Build process aborted.');
      process.exit(0);
    } else {
      continueBuild();
    }
  });
} else {
  console.log('✅ All required environment variables are present.');
  continueBuild();
}

function continueBuild() {
  try {
    // 1. Install dependencies
    console.log('\n📦 Installing dependencies...');
    execSync('npm install', { stdio: 'inherit' });
    
    // 2. Create a temporary .env file for the client build
    console.log('\n🔧 Preparing environment variables for client...');
    const clientEnvPath = path.join(projectRoot, 'client', '.env.production');
    
    // Extract relevant variables from process.env
    const clientEnvVars = Object.entries(process.env)
      .filter(([key]) => key.startsWith('VITE_') || key.includes('FIREBASE') || key.includes('GOOGLE'))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    
    fs.writeFileSync(clientEnvPath, clientEnvVars);
    console.log(`✅ Created ${clientEnvPath} with ${clientEnvVars.split('\n').length} variables`);
    
    // 3. Build client
    console.log('\n🔨 Building client...');
    process.chdir(path.join(projectRoot, 'client'));
    execSync('npm run build', { stdio: 'inherit' });
    
    // 4. Build server
    console.log('\n🔨 Building server...');
    process.chdir(projectRoot);
    execSync('npm run build', { stdio: 'inherit' });
    
    // 5. Create production-ready package
    console.log('\n📦 Creating production package...');
    
    // Create dist directory if it doesn't exist
    const distDir = path.join(projectRoot, 'dist');
    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir);
    }
    
    // Copy necessary files to dist
    execSync('cp -r server/dist/* dist/', { stdio: 'inherit' });
    execSync('cp -r client/dist dist/public', { stdio: 'inherit' });
    execSync('cp package.json dist/', { stdio: 'inherit' });
    execSync('cp .env dist/', { stdio: 'inherit' });
    
    // Clean up temporary files
    fs.unlinkSync(clientEnvPath);
    
    console.log('\n✅ Production build completed successfully!');
    console.log('\nTo start the production server:');
    console.log('  cd dist');
    console.log('  npm install --production');
    console.log('  npm start');
    
  } catch (error) {
    console.error('\n❌ Build failed:', error);
    process.exit(1);
  }
}