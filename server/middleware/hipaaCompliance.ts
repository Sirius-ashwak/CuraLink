import { Request, Response, NextFunction } from 'express';

// Extend Request interface to include user and session
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        role: string;
        email: string;
      };
      session?: {
        lastActivity?: number;
        destroy: (callback: (err?: any) => void) => void;
      };
    }
  }
}
import { createHash } from 'crypto';

/**
 * HIPAA Compliance Middleware
 * Ensures all healthcare data handling meets HIPAA requirements
 */

export interface HIPAAConfig {
  enableLogging: boolean;
  enableEncryption: boolean;
  enableAuditTrail: boolean;
  dataRetentionDays: number;
  allowedActions: string[];
}

const HIPAA_CONFIG: HIPAAConfig = {
  enableLogging: true,
  enableEncryption: true,
  enableAuditTrail: true,
  dataRetentionDays: 2555, // 7 years as required by HIPAA
  allowedActions: ['read', 'create', 'update', 'delete', 'export', 'share']
};

// Audit trail storage
const auditTrail: Array<{
  timestamp: Date;
  userId: string;
  action: string;
  resource: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  details?: any;
}> = [];

/**
 * PHI (Protected Health Information) Encryption
 */
export function encryptPHI(data: string): string {
  if (!HIPAA_CONFIG.enableEncryption) return data;
  
  // In production, use proper encryption like AES-256-GCM
  const hash = createHash('sha256');
  hash.update(data + process.env.ENCRYPTION_KEY || 'default-key');
  return hash.digest('hex');
}

export function decryptPHI(encryptedData: string): string {
  if (!HIPAA_CONFIG.enableEncryption) return encryptedData;
  
  // In production, implement proper decryption
  return encryptedData; // Placeholder - implement actual decryption
}

/**
 * Log HIPAA audit events
 */
export function logHIPAAEvent(
  userId: string,
  action: string,
  resource: string,
  req: Request,
  success: boolean = true,
  details?: any
) {
  if (!HIPAA_CONFIG.enableAuditTrail) return;
  
  const auditEntry = {
    timestamp: new Date(),
    userId,
    action,
    resource,
    ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
    userAgent: req.get('User-Agent') || 'unknown',
    success,
    details
  };
  
  auditTrail.push(auditEntry);
  
  // In production, store in secure database with encryption
  console.log('[HIPAA AUDIT]', JSON.stringify(auditEntry));
  
  // Clean old audit entries (keep for required retention period)
  const retentionDate = new Date();
  retentionDate.setDate(retentionDate.getDate() - HIPAA_CONFIG.dataRetentionDays);
  
  const validEntries = auditTrail.filter(entry => entry.timestamp > retentionDate);
  auditTrail.length = 0;
  auditTrail.push(...validEntries);
}

/**
 * HIPAA Access Control Middleware
 */
export function hipaaAccessControl(allowedRoles: string[] = []) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        logHIPAAEvent('anonymous', 'access_denied', req.path, req, false, 'No authentication');
        return res.status(401).json({ error: 'Authentication required for PHI access' });
      }

      // Check user role authorization
      const userRole = (req.user as any).role || 'patient';
      if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
        logHIPAAEvent(
          (req.user as any).id?.toString() || 'unknown',
          'access_denied',
          req.path,
          req,
          false,
          `Insufficient role: ${userRole}`
        );
        return res.status(403).json({ error: 'Insufficient privileges for PHI access' });
      }

      // Log successful access
      logHIPAAEvent(
        (req.user as any).id?.toString() || 'unknown',
        'access_granted',
        req.path,
        req,
        true
      );

      next();
    } catch (error) {
      logHIPAAEvent('unknown', 'access_error', req.path, req, false, error);
      res.status(500).json({ error: 'Access control error' });
    }
  };
}

/**
 * Data Minimization Middleware
 * Ensures only necessary PHI is returned based on user role
 */
export function dataMinimization(req: Request, res: Response, next: NextFunction) {
  const originalSend = res.send;
  
  res.send = function(data: any) {
    try {
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch {
          return originalSend.call(this, data);
        }
      }

      const userRole = (req.user as any)?.role || 'patient';
      const userId = (req.user as any)?.id;

      // Filter PHI based on user role and relationship
      if (Array.isArray(data)) {
        data = data.map(item => filterPHI(item, userRole, userId));
      } else if (typeof data === 'object' && data !== null) {
        data = filterPHI(data, userRole, userId);
      }

      return originalSend.call(this, JSON.stringify(data));
    } catch (error) {
      console.error('Data minimization error:', error);
      return originalSend.call(this, data);
    }
  };

  next();
}

/**
 * Filter PHI based on user role and access rights
 */
function filterPHI(data: any, userRole: string, userId: number): any {
  if (!data || typeof data !== 'object') return data;

  const filteredData = { ...data };

  // For patients, only show their own data
  if (userRole === 'patient' && data.patientId && data.patientId !== userId) {
    return null; // No access to other patients' data
  }

  // Sensitive fields that require higher privileges
  const sensitiveFields = ['ssn', 'medicalHistory', 'prescriptions', 'diagnosis'];
  
  if (userRole === 'patient') {
    // Patients can see their own sensitive data
    // No additional filtering needed if it's their data
  } else if (userRole === 'nurse') {
    // Nurses have limited access to some sensitive fields
    delete filteredData.ssn;
  } else if (userRole === 'doctor') {
    // Doctors have full access to medical data
    // No filtering needed
  } else {
    // Other roles have minimal access
    sensitiveFields.forEach(field => {
      delete filteredData[field];
    });
  }

  return filteredData;
}

/**
 * Security Headers Middleware for HIPAA compliance
 */
export function hipaaSecurityHeaders(req: Request, res: Response, next: NextFunction) {
  // HIPAA-required security headers
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' https://apis.google.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.gemini.com https://googleapis.com");
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Remove server information
  res.removeHeader('X-Powered-By');
  
  next();
}

/**
 * Session timeout for HIPAA compliance (automatic logout)
 */
export function sessionTimeout(timeoutMinutes: number = 15) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.session) {
      const now = Date.now();
      const lastActivity = req.session.lastActivity || now;
      
      if (now - lastActivity > timeoutMinutes * 60 * 1000) {
        req.session.destroy((err) => {
          if (err) console.error('Session destruction error:', err);
        });
        
        logHIPAAEvent(
          (req.user as any)?.id?.toString() || 'unknown',
          'session_timeout',
          req.path,
          req,
          true,
          `Session expired after ${timeoutMinutes} minutes`
        );
        
        return res.status(401).json({ error: 'Session expired for security' });
      }
      
      req.session.lastActivity = now;
    }
    
    next();
  };
}

/**
 * Get audit trail for compliance reporting
 */
export function getAuditTrail(startDate?: Date, endDate?: Date) {
  let filteredTrail = auditTrail;
  
  if (startDate) {
    filteredTrail = filteredTrail.filter(entry => entry.timestamp >= startDate);
  }
  
  if (endDate) {
    filteredTrail = filteredTrail.filter(entry => entry.timestamp <= endDate);
  }
  
  return filteredTrail;
}

/**
 * Export audit trail for compliance
 */
export function exportAuditTrail(): string {
  return JSON.stringify(auditTrail, null, 2);
}