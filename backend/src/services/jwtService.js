import jwt from 'jsonwebtoken';
import config from '../config/config.js';
import logger from '../utils/logger.js';

class JWTService {
  /**
   * Generate access token
   * @param {Object} payload - Token payload (userId, email, role)
   * @returns {string} - JWT access token
   */
  generateAccessToken(payload) {
    try {
      const token = jwt.sign(payload, config.jwt.secret, {
        expiresIn: config.jwt.accessExpiresIn,
        issuer: config.appName,
        audience: config.clientUrl,
      });

      return token;
    } catch (error) {
      logger.error('Error generating access token:', error);
      throw new Error('Failed to generate access token');
    }
  }

  /**
   * Generate refresh token
   * @param {Object} payload - Token payload (userId)
   * @returns {string} - JWT refresh token
   */
  generateRefreshToken(payload) {
    try {
      const token = jwt.sign(payload, config.jwt.secret, {
        expiresIn: config.jwt.refreshExpiresIn,
        issuer: config.appName,
        audience: config.clientUrl,
      });

      return token;
    } catch (error) {
      logger.error('Error generating refresh token:', error);
      throw new Error('Failed to generate refresh token');
    }
  }

  /**
   * Generate password reset token
   * @param {Object} payload - Token payload (userId, email)
   * @returns {string} - JWT reset token
   */
  generateResetToken(payload) {
    try {
      const token = jwt.sign(payload, config.jwt.secret, {
        expiresIn: config.jwt.resetPasswordExpiresIn,
        issuer: config.appName,
      });

      return token;
    } catch (error) {
      logger.error('Error generating reset token:', error);
      throw new Error('Failed to generate reset token');
    }
  }

  /**
   * Verify token
   * @param {string} token - JWT token to verify
   * @returns {Object} - Decoded token payload
   */
  verifyToken(token) {
    try {
      const decoded = jwt.verify(token, config.jwt.secret, {
        issuer: config.appName,
      });

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token has expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid token');
      } else {
        logger.error('Error verifying token:', error);
        throw new Error('Token verification failed');
      }
    }
  }

  /**
   * Decode token without verification (for debugging)
   * @param {string} token - JWT token to decode
   * @returns {Object} - Decoded token payload
   */
  decodeToken(token) {
    try {
      return jwt.decode(token);
    } catch (error) {
      logger.error('Error decoding token:', error);
      return null;
    }
  }

  /**
   * Get token expiration time
   * @param {string} token - JWT token
   * @returns {Date} - Expiration date
   */
  getTokenExpiration(token) {
    const decoded = this.decodeToken(token);
    if (decoded && decoded.exp) {
      return new Date(decoded.exp * 1000);
    }
    return null;
  }

  /**
   * Check if token is expired
   * @param {string} token - JWT token
   * @returns {boolean} - True if expired
   */
  isTokenExpired(token) {
    const expiration = this.getTokenExpiration(token);
    if (!expiration) return true;
    return expiration < new Date();
  }

  /**
   * Generate token pair (access + refresh)
   * @param {Object} user - User object
   * @returns {Object} - { accessToken, refreshToken }
   */
  generateTokenPair(user) {
    const payload = {
      userId: user._id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken({ userId: user._id });

    return {
      accessToken,
      refreshToken,
      expiresIn: config.jwt.accessExpiresIn,
    };
  }

  /**
   * Extract token from Authorization header
   * @param {string} authHeader - Authorization header value
   * @returns {string|null} - Token or null
   */
  extractTokenFromHeader(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }
}

export default new JWTService();
