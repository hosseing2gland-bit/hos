import rateLimit from 'express-rate-limit';
import config from '../config/config.js';
import logger from '../utils/logger.js';

/**
 * General API rate limiter
 */
export const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    error: 'Too many requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: 'Too many requests, please try again later',
    });
  },
});

/**
 * Strict rate limiter for authentication endpoints
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  skipSuccessfulRequests: true,
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again after 15 minutes',
  },
  handler: (req, res) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: 'Too many authentication attempts, please try again after 15 minutes',
    });
  },
});

/**
 * Rate limiter for password reset
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per hour
  message: {
    success: false,
    error: 'Too many password reset attempts, please try again after 1 hour',
  },
  handler: (req, res) => {
    logger.warn(`Password reset rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: 'Too many password reset attempts, please try again after 1 hour',
    });
  },
});

/**
 * Rate limiter for profile operations
 */
export const profileLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: {
    success: false,
    error: 'Too many profile operations, please slow down',
  },
});

/**
 * Rate limiter for file uploads
 */
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 uploads per 15 minutes
  message: {
    success: false,
    error: 'Too many upload attempts, please try again later',
  },
});

/**
 * Dynamic rate limiter based on user subscription
 */
export const dynamicLimiter = (req, res, next) => {
  const user = req.user;

  if (!user) {
    return apiLimiter(req, res, next);
  }

  // Different limits based on subscription
  const limits = {
    free: { windowMs: 60 * 1000, max: 20 },
    basic: { windowMs: 60 * 1000, max: 50 },
    pro: { windowMs: 60 * 1000, max: 100 },
    enterprise: { windowMs: 60 * 1000, max: 500 },
  };

  const userLimit = limits[user.subscription.plan] || limits.free;

  const limiter = rateLimit({
    windowMs: userLimit.windowMs,
    max: userLimit.max,
    keyGenerator: (req) => req.user._id.toString(),
    message: {
      success: false,
      error: 'Rate limit exceeded for your subscription plan',
    },
  });

  return limiter(req, res, next);
};

export default {
  apiLimiter,
  authLimiter,
  passwordResetLimiter,
  profileLimiter,
  uploadLimiter,
  dynamicLimiter,
};
