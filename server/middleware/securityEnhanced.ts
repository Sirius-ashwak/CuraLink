import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { createHash, randomBytes } from 'crypto';

/**
 * Enhanced Security Middleware for Industry-Ready Healthcare Platform
 * Implements enterprise-grade security measures
 */

// Rate limiting for different endpoints
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs for auth endpoints
  message: {
    error: 'Too many authentication attempts, please try again later',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs for API endpoints
  message: {
    error: 'Too many API requests, please try again later',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const emergencyRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // Limit emergency requests to prevent abuse
  message: {
    error: 'Emergency request limit reached, please contact emergency services directly',
    retryAfter: '5 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Input Validation and Sanitization
 */
export function validateAndSanitize(req: Request, res: Response, next: NextFunction) {
  try {
    // Sanitize all string inputs
    const sanitizeString = (str: string): string => {
      return str
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
        .replace(/javascript:/gi, '') // Remove javascript: protocols
        .replace(/on\w+\s*=/gi, '') // Remove event handlers
        .trim();
    };

    // Recursively sanitize object
    const sanitizeObject = (obj: any): any => {
      if (typeof obj === 'string') {
        return sanitizeString(obj);
      } else if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
      } else if (obj && typeof obj === 'object') {
        const sanitized: any = {};
        for (const [key, value] of Object.entries(obj)) {
          sanitized[key] = sanitizeObject(value);
        }
        return sanitized;
      }
      return obj;
    };

    // Sanitize request body
    if (req.body) {
      req.body = sanitizeObject(req.body);
    }

    // Validate required fields for sensitive operations
    if (req.path.includes('/api/appointments') && req.method === 'POST') {
      const required = ['doctorId', 'patientId', 'date', 'time'];
      const missing = required.filter(field => !req.body[field]);
      
      if (missing.length > 0) {
        return res.status(400).json({
          error: 'Missing required fields',
          missing,
          code: 'VALIDATION_ERROR'
        });
      }
    }

    // Validate email format
    if (req.body && req.body.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(req.body.email)) {
        return res.status(400).json({
          error: 'Invalid email format',
          code: 'INVALID_EMAIL'
        });
      }
    }

    // Validate phone numbers
    if (req.body && req.body.phone) {
      const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
      if (!phoneRegex.test(req.body.phone)) {
        return res.status(400).json({
          error: 'Invalid phone number format',
          code: 'INVALID_PHONE'
        });
      }
    }

    next();
  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({
      error: 'Input validation failed',
      code: 'VALIDATION_SYSTEM_ERROR'
    });
  }
}

/**
 * Request Logging for Security Monitoring
 */
export function securityLogger(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  const requestId = randomBytes(16).toString('hex');
  
  // Add request ID to request object
  (req as any).requestId = requestId;
  
  // Log request
  console.log(`[SECURITY] ${requestId} ${req.method} ${req.path} - IP: ${req.ip} - User-Agent: ${req.get('User-Agent')}`);
  
  // Monitor sensitive endpoints
  const sensitiveEndpoints = [
    '/api/users',
    '/api/appointments',
    '/api/doctors',
    '/api/auth',
    '/api/emergency'
  ];
  
  const isSensitive = sensitiveEndpoints.some(endpoint => req.path.startsWith(endpoint));
  
  if (isSensitive) {
    console.log(`[SECURITY-SENSITIVE] ${requestId} Accessing sensitive endpoint: ${req.path}`);
  }
  
  // Override res.json to log response
  const originalJson = res.json;
  res.json = function(data: any) {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    
    console.log(`[SECURITY] ${requestId} Response: ${statusCode} - Duration: ${duration}ms`);
    
    // Log failed requests for security monitoring
    if (statusCode >= 400) {
      console.warn(`[SECURITY-ALERT] ${requestId} Failed request: ${statusCode} - ${req.method} ${req.path}`);
    }
    
    return originalJson.call(this, data);
  };
  
  next();
}

/**
 * Advanced CORS Configuration for Healthcare
 */
export function configureCORS() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Allowed origins for healthcare platform
    const allowedOrigins = [
      'https://your-healthcare-app.com',
      'https://staging-healthcare-app.com',
      process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : null,
      process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : null,
    ].filter(Boolean);
    
    const origin = req.headers.origin;
    
    if (!origin || allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin || '*');
    }
    
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
    
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    next();
  };
}

/**
 * Content Security Policy for Healthcare
 */
export function healthcareCSP() {
  return helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Required for React development
        "https://apis.google.com",
        "https://www.gstatic.com",
        "https://maps.googleapis.com"
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com"
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com"
      ],
      imgSrc: [
        "'self'",
        "data:",
        "https:",
        "blob:"
      ],
      connectSrc: [
        "'self'",
        "https://api.openai.com",
        "https://generativelanguage.googleapis.com",
        "https://maps.googleapis.com",
        "https://firebaseapp.com",
        "https://*.firebaseio.com",
        "wss://*.firebaseio.com"
      ],
      mediaSrc: ["'self'", "blob:", "data:"],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"]
    },
  });
}

/**
 * API Key Validation
 */
export function validateApiKey(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'] as string;
  
  // Skip API key validation for browser requests and development
  if (!apiKey && req.headers['user-agent']?.includes('Mozilla')) {
    return next();
  }
  
  // For API-to-API communication, require API key
  if (req.path.startsWith('/api/') && req.headers['content-type']?.includes('application/json') && !req.headers['cookie']) {
    if (!apiKey) {
      return res.status(401).json({
        error: 'API key required for programmatic access',
        code: 'MISSING_API_KEY'
      });
    }
    
    // Validate API key format (should be provided by user)
    const expectedApiKey = process.env.API_KEY;
    if (expectedApiKey && apiKey !== expectedApiKey) {
      console.warn(`[SECURITY-ALERT] Invalid API key attempt: ${apiKey.substring(0, 8)}...`);
      return res.status(401).json({
        error: 'Invalid API key',
        code: 'INVALID_API_KEY'
      });
    }
  }
  
  next();
}

/**
 * Request Size Limiting for DoS Protection
 */
export function requestSizeLimit(maxSizeMB: number = 10) {
  return (req: Request, res: Response, next: NextFunction) => {
    const maxSize = maxSizeMB * 1024 * 1024; // Convert to bytes
    
    if (req.headers['content-length']) {
      const contentLength = parseInt(req.headers['content-length']);
      
      if (contentLength > maxSize) {
        return res.status(413).json({
          error: `Request too large. Maximum size is ${maxSizeMB}MB`,
          code: 'REQUEST_TOO_LARGE'
        });
      }
    }
    
    next();
  };
}

/**
 * Suspicious Activity Detection
 */
export function detectSuspiciousActivity(req: Request, res: Response, next: NextFunction) {
  const suspiciousPatterns = [
    /union\s+select/i, // SQL injection
    /<script/i, // XSS
    /javascript:/i, // XSS
    /\.\.\//g, // Path traversal
    /etc\/passwd/i, // File access
    /cmd\.exe/i, // Command injection
  ];
  
  const requestData = JSON.stringify(req.body) + req.url + JSON.stringify(req.query);
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(requestData)) {
      console.error(`[SECURITY-ALERT] Suspicious activity detected from IP ${req.ip}: ${pattern}`);
      
      return res.status(400).json({
        error: 'Suspicious request detected',
        code: 'SUSPICIOUS_ACTIVITY',
        requestId: (req as any).requestId
      });
    }
  }
  
  next();
}

/**
 * Generate secure session tokens
 */
export function generateSecureToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Hash passwords securely
 */
export function hashPassword(password: string, salt?: string): string {
  const actualSalt = salt || randomBytes(16).toString('hex');
  const hash = createHash('sha256');
  hash.update(password + actualSalt);
  return actualSalt + ':' + hash.digest('hex');
}

/**
 * Verify password hash
 */
export function verifyPassword(password: string, hashedPassword: string): boolean {
  const [salt, hash] = hashedPassword.split(':');
  const testHash = createHash('sha256');
  testHash.update(password + salt);
  return testHash.digest('hex') === hash;
}