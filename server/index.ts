import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

// Import industry-ready security and performance middleware
import { 
  hipaaAccessControl, 
  hipaaSecurityHeaders, 
  sessionTimeout, 
  dataMinimization,
  logHIPAAEvent 
} from "./middleware/hipaaCompliance";
import { 
  authRateLimit, 
  apiRateLimit, 
  validateAndSanitize, 
  securityLogger, 
  configureCORS, 
  healthcareCSP, 
  detectSuspiciousActivity, 
  requestSizeLimit 
} from "./middleware/securityEnhanced";
import { 
  intelligentCache, 
  responseCompression, 
  queryPerformanceMonitor, 
  memoryMonitor, 
  optimizeResponse, 
  preloadCriticalData 
} from "./middleware/performanceOptimization";

// Load environment variables from .env file
import dotenv from "dotenv";
dotenv.config();

// Log important environment variables
console.log('Firebase Storage bucket:', process.env.VITE_FIREBASE_STORAGE_BUCKET);

// Import and use Secret Manager for credential checks
import { secretManagerService } from './services/secretManagerService';

// Check Gemini API Key through Secret Manager
secretManagerService.getSecret('GEMINI_API_KEY').then(geminiKey => {
  if (geminiKey) {
    console.log('Gemini API Key is configured. AI features will work properly.');
    console.log(`Gemini API Key length: ${geminiKey.length}`);
  } else {
    console.log('GEMINI_API_KEY is not defined. AI features will not work.');
  }
});

// Check Google Cloud credentials through Secret Manager
Promise.all([
  secretManagerService.getSecret('GOOGLE_CLOUD_PROJECT_ID'),
  secretManagerService.getSecret('GOOGLE_CLOUD_API_KEY'),
  secretManagerService.getSecret('GOOGLE_CLOUD_CLIENT_ID'),
  secretManagerService.getSecret('GOOGLE_CLOUD_CLIENT_SECRET')
]).then(([projectId, apiKey, clientId, clientSecret]) => {
  if (projectId && apiKey && clientId && clientSecret) {
    console.log('Google Cloud credentials are fully configured. Cloud features are available.');
    console.log(`Google Cloud Client ID length: ${clientId.length}`);
    console.log(`Google Cloud Client Secret length: ${clientSecret.length}`);
  } else {
    console.log('Google Cloud credentials are not fully configured. Some features will not work.');
  }
});

const app = express();

// Configure Express to trust proxy for rate limiting
app.set('trust proxy', 1);

// Apply industry-ready security and performance middleware
app.use(hipaaSecurityHeaders);
app.use(healthcareCSP());
app.use(configureCORS());
app.use(responseCompression);
app.use(securityLogger);
app.use(requestSizeLimit(50)); // 50MB limit for medical files
app.use(detectSuspiciousActivity);
app.use(validateAndSanitize);
app.use(memoryMonitor);
app.use(queryPerformanceMonitor);
app.use(optimizeResponse);

// Apply rate limiting to auth endpoints
app.use('/api/auth', authRateLimit);
app.use('/api/emergency', authRateLimit); // Strict rate limiting for emergency
app.use('/api', apiRateLimit);

// Apply session timeout and data minimization
app.use(sessionTimeout(30)); // 30-minute session timeout for security
app.use(dataMinimization);

// Apply intelligent caching for performance
app.use(intelligentCache(10)); // 10-minute cache for public data

app.use(express.json({ limit: '50mb' })); // Increased limit for medical files
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error('Error:', err);
    res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    console.log(`HTTP server running on port ${port}`);
  });
})();