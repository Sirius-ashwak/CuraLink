import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

console.log('=== SERVER STARTUP ===');
console.log('Node environment:', process.env.NODE_ENV);
console.log('Current directory:', process.cwd());
console.log('=== ENVIRONMENT VARIABLES ===');
console.log('GEMINI_API_KEY set:', Boolean(process.env.GEMINI_API_KEY));
console.log('TWILIO credentials configured:', 
  Boolean(process.env.TWILIO_ACCOUNT_SID) && 
  Boolean(process.env.TWILIO_API_KEY) && 
  Boolean(process.env.TWILIO_API_SECRET)
);
console.log('=== SERVER INITIALIZATION ===');

const app = express();
app.use(express.json({ limit: '50mb' })); // Increased limit for image uploads
app.use(express.urlencoded({ extended: false }));

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
    console.error('Stack trace:', err.stack);
    res.status(status).json({ 
      message,
      stack: process.env.NODE_ENV === 'production' ? 'Error details hidden in production' : err.stack
    });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    console.log("Running in development mode, setting up Vite middleware");
    await setupVite(app, server);
  } else {
    console.log("Running in production mode, serving static files");
    console.log("NODE_ENV:", process.env.NODE_ENV);
    console.log("Current directory:", __dirname);
    
    // Log out file system info for debugging production deployment
    const fs = require('fs');
    const path = require('path');
    
    try {
      // Check if the dist/public directory exists
      const distPublicPath = path.resolve(__dirname, "public");
      const rootDistPath = path.resolve(process.cwd(), "dist", "public");
      
      console.log("Checking static file paths:");
      console.log("- Relative to __dirname:", distPublicPath);
      console.log("- Exists:", fs.existsSync(distPublicPath));
      
      console.log("- Relative to cwd:", rootDistPath);
      console.log("- Exists:", fs.existsSync(rootDistPath));
      
      // List available directories
      console.log("\nAvailable directories at cwd:");
      try {
        console.log(fs.readdirSync(process.cwd()));
      } catch (error) {
        console.error("Error listing cwd:", error);
      }
      
      console.log("\nAvailable directories at __dirname:");
      try { 
        console.log(fs.readdirSync(__dirname));
      } catch (error) {
        console.error("Error listing __dirname:", error);
      }
      
      serveStatic(app);
      console.log("Static files configured successfully");
    } catch (error) {
      console.error("Error setting up static file serving:", error);
    }
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
    console.log(`WebSocket server enabled and listening for connections`);
  });
})();