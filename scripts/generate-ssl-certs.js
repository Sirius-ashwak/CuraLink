/**
 * Script to generate self-signed SSL certificates for local development
 * 
 * This script uses the Node.js built-in crypto module to generate
 * self-signed SSL certificates for local HTTPS development.
 * 
 * Usage:
 *   node scripts/generate-ssl-certs.js
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const sslDir = path.join(rootDir, 'ssl');

// Create the SSL directory if it doesn't exist
if (!fs.existsSync(sslDir)) {
  console.log('Creating SSL directory...');
  fs.mkdirSync(sslDir, { recursive: true });
}

// Check if OpenSSL is installed
try {
  execSync('openssl version', { stdio: 'pipe' });
  console.log('OpenSSL is installed. Proceeding with certificate generation...');
} catch (error) {
  console.error('Error: OpenSSL is not installed or not in the PATH.');
  console.error('Please install OpenSSL to generate SSL certificates.');
  console.error('For Windows: https://slproweb.com/products/Win32OpenSSL.html');
  console.error('For macOS: brew install openssl');
  console.error('For Linux: apt-get install openssl or yum install openssl');
  process.exit(1);
}

// Generate SSL certificates
try {
  console.log('Generating SSL certificates...');
  
  // Generate private key
  execSync(
    'openssl genrsa -out key.pem 2048',
    { cwd: sslDir, stdio: 'inherit' }
  );
  
  // Generate CSR (Certificate Signing Request)
  execSync(
    'openssl req -new -key key.pem -out csr.pem -subj "/C=US/ST=State/L=City/O=CuraLink/OU=Development/CN=localhost"',
    { cwd: sslDir, stdio: 'inherit' }
  );
  
  // Generate self-signed certificate (valid for 365 days)
  execSync(
    'openssl x509 -req -days 365 -in csr.pem -signkey key.pem -out cert.pem',
    { cwd: sslDir, stdio: 'inherit' }
  );
  
  // Remove CSR file as it's no longer needed
  fs.unlinkSync(path.join(sslDir, 'csr.pem'));
  
  console.log('\nSSL certificates generated successfully!');
  console.log(`Certificates location: ${sslDir}`);
  console.log('- Private key: key.pem');
  console.log('- Certificate: cert.pem');
  console.log('\nNote: These are self-signed certificates for development only.');
  console.log('Browsers will show a security warning when accessing your site.');
  console.log('You can add an exception or install the certificate in your browser.');
  
} catch (error) {
  console.error('Error generating SSL certificates:', error.message);
  process.exit(1);
}