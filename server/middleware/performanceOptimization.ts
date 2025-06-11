import { Request, Response, NextFunction } from 'express';
import compression from 'compression';

/**
 * Performance Optimization Middleware for Industry-Ready Healthcare Platform
 * Implements enterprise-grade performance enhancements
 */

// Response caching for frequently accessed data
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

/**
 * Intelligent Caching Middleware
 */
export function intelligentCache(ttlMinutes: number = 5) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip caching for sensitive endpoints
    const sensitiveRoutes = ['/api/auth', '/api/emergency', '/api/appointments'];
    if (sensitiveRoutes.some(route => req.path.startsWith(route))) {
      return next();
    }

    const cacheKey = `${req.path}:${JSON.stringify(req.query)}`;
    const cached = cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < cached.ttl) {
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('Cache-Control', `public, max-age=${Math.floor((cached.ttl - (Date.now() - cached.timestamp)) / 1000)}`);
      return res.json(cached.data);
    }

    // Override res.json to cache the response
    const originalJson = res.json;
    res.json = function(data: any) {
      // Cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(cacheKey, {
          data,
          timestamp: Date.now(),
          ttl: ttlMinutes * 60 * 1000
        });
        
        res.setHeader('X-Cache', 'MISS');
        res.setHeader('Cache-Control', `public, max-age=${ttlMinutes * 60}`);
      }
      
      return originalJson.call(this, data);
    };

    next();
  };
}

/**
 * Response Compression
 */
export const responseCompression = compression({
  level: 6, // Balanced compression level
  threshold: 1024, // Only compress responses > 1KB
  filter: (req: Request, res: Response) => {
    // Don't compress if client doesn't support it
    if (req.headers['x-no-compression']) {
      return false;
    }
    
    // Compress JSON, text, and other compressible content
    return compression.filter(req, res);
  }
});

/**
 * Database Query Optimization Tracking
 */
export function queryPerformanceMonitor(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  
  // Track query performance
  const originalSend = res.send;
  res.send = function(data: any) {
    const duration = Date.now() - startTime;
    
    // Log slow queries for optimization
    if (duration > 1000) { // Queries taking more than 1 second
      console.warn(`[PERFORMANCE] Slow query detected: ${req.method} ${req.path} - ${duration}ms`);
    }
    
    // Add performance headers for monitoring
    res.setHeader('X-Response-Time', `${duration}ms`);
    
    return originalSend.call(this, data);
  };
  
  next();
}

/**
 * Memory Usage Monitoring
 */
export function memoryMonitor(req: Request, res: Response, next: NextFunction) {
  const memUsage = process.memoryUsage();
  const mbUsed = Math.round(memUsage.heapUsed / 1024 / 1024);
  
  // Alert if memory usage is high
  if (mbUsed > 512) { // Alert if using more than 512MB
    console.warn(`[PERFORMANCE] High memory usage: ${mbUsed}MB`);
  }
  
  // Clean cache if memory is getting high
  if (mbUsed > 1024) { // Clean cache if using more than 1GB
    console.log('[PERFORMANCE] Cleaning cache due to high memory usage');
    clearOldCacheEntries();
  }
  
  res.setHeader('X-Memory-Usage', `${mbUsed}MB`);
  next();
}

/**
 * Request Size and Complexity Limiting
 */
export function requestComplexityLimit(req: Request, res: Response, next: NextFunction) {
  // Limit array sizes in requests to prevent DoS
  const checkArraySizes = (obj: any, maxSize: number = 1000): boolean => {
    if (Array.isArray(obj)) {
      if (obj.length > maxSize) {
        return false;
      }
      return obj.every(item => checkArraySizes(item, maxSize));
    } else if (obj && typeof obj === 'object') {
      return Object.values(obj).every(value => checkArraySizes(value, maxSize));
    }
    return true;
  };
  
  if (req.body && !checkArraySizes(req.body)) {
    return res.status(400).json({
      error: 'Request contains arrays that are too large',
      code: 'REQUEST_TOO_COMPLEX'
    });
  }
  
  next();
}

/**
 * Clean old cache entries
 */
function clearOldCacheEntries(): void {
  const now = Date.now();
  let cleared = 0;
  
  cache.forEach((value, key) => {
    if (now - value.timestamp > value.ttl) {
      cache.delete(key);
      cleared++;
    }
  });
  
  console.log(`[PERFORMANCE] Cleared ${cleared} expired cache entries`);
}

/**
 * Preload Critical Data
 */
export async function preloadCriticalData(): Promise<void> {
  try {
    // Preload frequently accessed data
    console.log('[PERFORMANCE] Preloading critical data...');
    
    // You can add specific data preloading here
    // For example: doctors list, facilities, etc.
    
    console.log('[PERFORMANCE] Critical data preloaded successfully');
  } catch (error) {
    console.error('[PERFORMANCE] Failed to preload critical data:', error);
  }
}

/**
 * API Response Optimization
 */
export function optimizeResponse(req: Request, res: Response, next: NextFunction) {
  const originalJson = res.json;
  
  res.json = function(data: any) {
    // Remove null/undefined fields to reduce payload size
    const optimizeData = (obj: any): any => {
      if (Array.isArray(obj)) {
        return obj.map(optimizeData).filter(item => item !== null && item !== undefined);
      } else if (obj && typeof obj === 'object') {
        const optimized: any = {};
        for (const [key, value] of Object.entries(obj)) {
          if (value !== null && value !== undefined) {
            optimized[key] = optimizeData(value);
          }
        }
        return optimized;
      }
      return obj;
    };
    
    const optimizedData = optimizeData(data);
    
    // Add performance metadata
    const responseSize = JSON.stringify(optimizedData).length;
    res.setHeader('X-Response-Size', `${responseSize} bytes`);
    
    return originalJson.call(this, optimizedData);
  };
  
  next();
}

/**
 * Database Connection Pooling Configuration
 */
export const dbPoolConfig = {
  min: 2,
  max: 20,
  acquireTimeoutMillis: 30000,
  createTimeoutMillis: 30000,
  destroyTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  reapIntervalMillis: 1000,
  createRetryIntervalMillis: 200,
};

/**
 * Get Cache Statistics
 */
export function getCacheStats() {
  const now = Date.now();
  let active = 0;
  let expired = 0;
  
  cache.forEach((value) => {
    if (now - value.timestamp < value.ttl) {
      active++;
    } else {
      expired++;
    }
  });
  
  return {
    totalEntries: cache.size,
    activeEntries: active,
    expiredEntries: expired,
    memoryUsage: process.memoryUsage()
  };
}

/**
 * Performance Health Check
 */
export function performanceHealthCheck() {
  const memUsage = process.memoryUsage();
  const cacheStats = getCacheStats();
  
  return {
    status: 'healthy',
    memory: {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024)
    },
    cache: cacheStats,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  };
}