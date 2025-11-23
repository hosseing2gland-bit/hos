import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import config from '../config/config.js';

/**
 * Security headers middleware using Helmet
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
});

/**
 * Prevent NoSQL injection
 */
export const preventNoSQLInjection = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`NoSQL injection attempt detected: ${key} in ${req.path}`);
  },
});

/**
 * Prevent parameter pollution
 */
export const preventParameterPollution = (req, res, next) => {
  // Whitelist of parameters that can be arrays
  const whitelist = ['tags', 'sharedWith', 'roles'];

  for (const key in req.query) {
    if (Array.isArray(req.query[key]) && !whitelist.includes(key)) {
      req.query[key] = req.query[key][0];
    }
  }

  next();
};

/**
 * Add security headers manually
 */
export const customSecurityHeaders = (req, res, next) => {
  // Remove X-Powered-By header
  res.removeHeader('X-Powered-By');

  // Add custom headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  // Add Permissions-Policy
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=()'
  );

  next();
};

/**
 * IP whitelist middleware (for admin endpoints)
 */
export const ipWhitelist = (allowedIPs = []) => {
  return (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;

    if (allowedIPs.length === 0 || allowedIPs.includes(clientIP)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: 'Access denied from your IP address',
    });
  };
};

/**
 * Trusted proxy configuration
 */
export const configureTrustedProxy = (app) => {
  if (config.isProduction()) {
    app.set('trust proxy', 1); // Trust first proxy
  }
};

export default {
  securityHeaders,
  preventNoSQLInjection,
  preventParameterPollution,
  customSecurityHeaders,
  ipWhitelist,
  configureTrustedProxy,
};
