#!/usr/bin/env node

/**
 * Static site generation script
 * This script creates a completely static version of the website
 * by pre-rendering pages and transforming API data into static JSON files
 */

import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import axios from 'axios';

// Config
const config = {
  // Output directory for the static site
  outputDir: 'static-site',
  
  // Base URL for API requests during build
  apiBaseUrl: 'http://localhost:5000',
  
  // Routes to be pre-rendered
  routes: [
    '/',
    '/login',
    '/register',
    '/dashboard',
    '/profile',
    '/settings',
    '/notifications',
  ],
  
  // API endpoints to be transformed into static data files
  apis: [
    { endpoint: '/api/doctors', output: 'data/doctors.json' },
    { 
      endpoint: '/api/maps/nearby-hospitals', 
      output: 'data/hospitals-sf.json', 
      params: { lat: '37.7749', lng: '-122.4194' } 
    },
    {
      endpoint: '/api/emergency-transport',
      output: 'data/emergency-transport.json'
    }
  ]
};

async function buildStaticSite() {
  const outputDir = path.resolve(config.outputDir);
  const dataDir = path.resolve(config.outputDir, 'data');

  console.log('🏗️ Building static site...');
  
  // Clean output directory
  console.log('Cleaning output directory...');
  fs.removeSync(outputDir);
  fs.ensureDirSync(outputDir);
  fs.ensureDirSync(dataDir);
  
  // Build the React app for production
  console.log('Building React application...');
  execSync('vite build', { stdio: 'inherit' });
  
  // Copy build files to output directory
  console.log('Copying build files...');
  fs.copySync('dist/public', outputDir);
  
  // Create static data files from API endpoints
  console.log('Generating static API data...');
  try {
    // Start the dev server if it's not already running
    let serverProcess;
    let isServerRunning = false;
    
    try {
      // Check if server is running
      await axios.get(`${config.apiBaseUrl}/api/doctors`);
      isServerRunning = true;
    } catch (error) {
      console.log('Starting development server for API data generation...');
      serverProcess = execSync('npm run dev', { stdio: 'ignore', detached: true });
      
      // Wait for server to start
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    // Generate API data files
    for (const api of config.apis) {
      try {
        console.log(`Fetching data from ${api.endpoint}...`);
        const params = api.params || {};
        const response = await axios.get(`${config.apiBaseUrl}${api.endpoint}`, { params });
        
        // Write data to file
        const outputPath = path.resolve(outputDir, api.output);
        fs.ensureDirSync(path.dirname(outputPath));
        fs.writeFileSync(outputPath, JSON.stringify(response.data, null, 2));
        console.log(`✅ Generated ${api.output}`);
      } catch (error) {
        console.error(`❌ Failed to fetch data from ${api.endpoint}: ${error.message}`);
      }
    }
    
    // Kill server process if we started it
    if (!isServerRunning && serverProcess) {
      process.kill(-serverProcess.pid);
    }
    
  } catch (error) {
    console.error('Error generating API data:', error);
  }
  
  // Create .htaccess for Apache servers
  const htaccess = `
# Handle Single Page Application routing
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
  `;
  fs.writeFileSync(path.resolve(outputDir, '.htaccess'), htaccess);
  
  // Create a simple web.config for IIS servers
  const webConfig = `<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="SPA Routes" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="/" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>`;
  fs.writeFileSync(path.resolve(outputDir, 'web.config'), webConfig);
  
  // Create nginx config example
  const nginxConfig = `# Example Nginx configuration for static site
server {
  listen 80;
  listen [::]:80;
  server_name your-domain.com;
  root /path/to/${config.outputDir};
  index index.html;

  # SPA routing
  location / {
    try_files $uri $uri/ /index.html;
  }

  # Cache static assets
  location ~* \\.(?:jpg|jpeg|gif|png|ico|svg|js|css)$ {
    expires 30d;
    add_header Cache-Control "public, no-transform";
  }
}`;
  fs.writeFileSync(path.resolve(outputDir, 'nginx.conf.example'), nginxConfig);
  
  console.log(`✨ Static site generated successfully in ${outputDir}`);
}

buildStaticSite().catch(console.error);