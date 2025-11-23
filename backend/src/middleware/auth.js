import jwtService from '../services/jwtService.js';
import { User } from '../models/index.js';
import logger from '../utils/logger.js';

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export const authenticate = async (req, res, next) => {
  try {
    // Extract token from header
    const authHeader = req.headers.authorization;
    const token = jwtService.extractTokenFromHeader(authHeader);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    // Verify token
    const decoded = jwtService.verifyToken(token);

    // Find user
    const user = await User.findById(decoded.userId).select('-password -refreshTokens');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found',
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Account is deactivated',
      });
    }

    // Attach user to request
    req.user = user;
    req.userId = user._id;
    req.token = token;

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    
    if (error.message === 'Token has expired') {
      return res.status(401).json({
        success: false,
        error: 'Token has expired',
        code: 'TOKEN_EXPIRED',
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Invalid token',
    });
  }
};

/**
 * Optional authentication middleware
 * Attaches user if token is valid, but doesn't fail if no token
 */
export const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = jwtService.extractTokenFromHeader(authHeader);

    if (token) {
      const decoded = jwtService.verifyToken(token);
      const user = await User.findById(decoded.userId).select('-password -refreshTokens');
      
      if (user && user.isActive) {
        req.user = user;
        req.userId = user._id;
        req.token = token;
      }
    }

    next();
  } catch (error) {
    // Silently fail for optional auth
    next();
  }
};

/**
 * Authorization middleware factory
 * Checks if user has required role(s)
 * @param {Array|string} roles - Required role(s)
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    const hasRole = roles.includes(req.user.role);

    if (!hasRole) {
      logger.warn(`Unauthorized access attempt by user ${req.user.email} to role-restricted resource`);
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
      });
    }

    next();
  };
};

/**
 * Check if user has specific feature access
 * @param {string} feature - Feature name
 */
export const requireFeature = (feature) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    if (!req.user.hasFeature(feature)) {
      return res.status(403).json({
        success: false,
        error: `This feature requires a subscription upgrade`,
        feature,
      });
    }

    next();
  };
};

/**
 * Verify account ownership or admin access
 */
export const requireOwnership = (userIdParam = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    const targetUserId = req.params[userIdParam] || req.body[userIdParam];

    // Admin can access anything
    if (req.user.role === 'admin') {
      return next();
    }

    // Check ownership
    if (req.user._id.toString() !== targetUserId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    next();
  };
};

/**
 * API key authentication (for automation)
 */
export const authenticateApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: 'API key required',
      });
    }

    // TODO: Implement API key validation
    // For now, this is a placeholder
    
    return res.status(501).json({
      success: false,
      error: 'API key authentication not implemented yet',
    });
  } catch (error) {
    logger.error('API key authentication error:', error);
    return res.status(401).json({
      success: false,
      error: 'Invalid API key',
    });
  }
};

export default {
  authenticate,
  optionalAuthenticate,
  authorize,
  requireFeature,
  requireOwnership,
  authenticateApiKey,
};
