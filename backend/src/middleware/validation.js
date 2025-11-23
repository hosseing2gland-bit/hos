import { validationResult } from 'express-validator';
import logger from '../utils/logger.js';

/**
 * Validation middleware
 * Checks for validation errors from express-validator
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((error) => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value,
    }));

    logger.warn('Validation error:', { errors: formattedErrors, path: req.path });

    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      errors: formattedErrors,
    });
  }

  next();
};

/**
 * Sanitize input to prevent injection attacks
 */
export const sanitizeInput = (req, res, next) => {
  // Remove null bytes
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      return obj.replace(/\0/g, '');
    }
    if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        obj[key] = sanitize(obj[key]);
      }
    }
    return obj;
  };

  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);

  next();
};

/**
 * Custom validation helpers
 */
export const customValidators = {
  isStrongPassword: (value) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumbers = /\d/.test(value);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);

    if (value.length < minLength) {
      throw new Error('Password must be at least 8 characters long');
    }
    if (!hasUpperCase) {
      throw new Error('Password must contain at least one uppercase letter');
    }
    if (!hasLowerCase) {
      throw new Error('Password must contain at least one lowercase letter');
    }
    if (!hasNumbers) {
      throw new Error('Password must contain at least one number');
    }
    if (!hasSpecialChar) {
      throw new Error('Password must contain at least one special character');
    }

    return true;
  },

  isValidUsername: (value) => {
    const regex = /^[a-zA-Z0-9_-]+$/;
    if (!regex.test(value)) {
      throw new Error('Username can only contain letters, numbers, hyphens, and underscores');
    }
    if (value.length < 3 || value.length > 50) {
      throw new Error('Username must be between 3 and 50 characters');
    }
    return true;
  },

  isValidProxy: (value) => {
    if (!value || !value.enabled) return true;

    const { type, host, port } = value;

    if (!['http', 'https', 'socks4', 'socks5'].includes(type)) {
      throw new Error('Invalid proxy type');
    }

    if (!host || host.trim() === '') {
      throw new Error('Proxy host is required');
    }

    if (!port || port < 1 || port > 65535) {
      throw new Error('Invalid proxy port');
    }

    return true;
  },

  isValidUrl: (value) => {
    if (!value) return true;
    
    try {
      new URL(value);
      return true;
    } catch (error) {
      throw new Error('Invalid URL format');
    }
  },

  /**
   * Validation برای License
   */
  isValidLicenseType: (value) => {
    const validTypes = ['trial', 'monthly', 'yearly', 'lifetime'];
    if (!validTypes.includes(value)) {
      throw new Error(`License type must be one of: ${validTypes.join(', ')}`);
    }
    return true;
  },
};

/**
 * Middleware برای validation License
 */
export const validateLicense = (req, res, next) => {
  const { type, maxDevices, expiresInDays } = req.body;

  const errors = [];

  if (type && !['trial', 'monthly', 'yearly', 'lifetime'].includes(type)) {
    errors.push({ field: 'type', message: 'Invalid license type' });
  }

  if (maxDevices && (maxDevices < 1 || maxDevices > 10)) {
    errors.push({ field: 'maxDevices', message: 'maxDevices must be between 1 and 10' });
  }

  if (expiresInDays && (expiresInDays < 1 || expiresInDays > 3650)) {
    errors.push({ field: 'expiresInDays', message: 'expiresInDays must be between 1 and 3650' });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      errors
    });
  }

  next();
};

export default {
  validate,
  sanitizeInput,
  customValidators,
  validateLicense,
};
