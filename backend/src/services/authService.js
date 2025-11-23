import { User } from '../models/index.js';
import jwtService from './jwtService.js';
import encryptionService from '../utils/encryption.js';
import logger from '../utils/logger.js';

class AuthService {
  /**
   * Register new user
   * @param {Object} userData - User registration data
   * @returns {Object} - Created user and tokens
   */
  async register(userData) {
    try {
      const { username, email, password } = userData;

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ email }, { username }],
      });

      if (existingUser) {
        if (existingUser.email === email) {
          throw new Error('Email already registered');
        }
        if (existingUser.username === username) {
          throw new Error('Username already taken');
        }
      }

      // Create user
      const user = new User({
        username,
        email,
        password,
        role: 'user',
      });

      await user.save();

      // Generate tokens
      const tokens = jwtService.generateTokenPair(user);

      // Store refresh token
      const expiresAt = jwtService.getTokenExpiration(tokens.refreshToken);
      await user.addRefreshToken(tokens.refreshToken, expiresAt, null, null);

      // Remove password from response
      const userObj = user.toObject();
      delete userObj.password;

      logger.info(`New user registered: ${user.email}`);

      return {
        user: userObj,
        ...tokens,
      };
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Login user
   * @param {string} emailOrUsername - Email or username
   * @param {string} password - Password
   * @param {string} ipAddress - IP address
   * @param {string} userAgent - User agent
   * @returns {Object} - User and tokens
   */
  async login(emailOrUsername, password, ipAddress = null, userAgent = null) {
    try {
      // Find and verify user
      const user = await User.findByCredentials(emailOrUsername, password);

      // Update last login
      user.lastLogin = new Date();
      user.lastLoginIp = ipAddress;
      await user.save();

      // Generate tokens
      const tokens = jwtService.generateTokenPair(user);

      // Store refresh token
      const expiresAt = jwtService.getTokenExpiration(tokens.refreshToken);
      await user.addRefreshToken(tokens.refreshToken, expiresAt, userAgent, ipAddress);

      // Add audit log
      await user.addAuditLog('login', ipAddress, userAgent, { success: true });

      // Remove sensitive data
      const userObj = user.toObject();
      delete userObj.password;
      delete userObj.refreshTokens;

      logger.info(`User logged in: ${user.email} from ${ipAddress}`);

      return {
        user: userObj,
        ...tokens,
      };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Refresh access token
   * @param {string} refreshToken - Refresh token
   * @returns {Object} - New access token
   */
  async refreshToken(refreshToken) {
    try {
      // Verify refresh token
      const decoded = jwtService.verifyToken(refreshToken);

      // Find user
      const user = await User.findById(decoded.userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (!user.isActive) {
        throw new Error('Account is deactivated');
      }

      // Verify refresh token exists in database
      const tokenExists = user.refreshTokens.some(
        (rt) => rt.token === refreshToken && rt.expiresAt > new Date()
      );

      if (!tokenExists) {
        throw new Error('Invalid refresh token');
      }

      // Generate new tokens
      const tokens = jwtService.generateTokenPair(user);

      // Replace old refresh token with new one
      await user.removeRefreshToken(refreshToken);
      const expiresAt = jwtService.getTokenExpiration(tokens.refreshToken);
      await user.addRefreshToken(tokens.refreshToken, expiresAt, null, null);

      return tokens;
    } catch (error) {
      logger.error('Refresh token error:', error);
      throw error;
    }
  }

  /**
   * Logout user
   * @param {string} userId - User ID
   * @param {string} refreshToken - Refresh token to invalidate
   */
  async logout(userId, refreshToken) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Remove refresh token
      if (refreshToken) {
        await user.removeRefreshToken(refreshToken);
      }

      logger.info(`User logged out: ${user.email}`);
    } catch (error) {
      logger.error('Logout error:', error);
      throw error;
    }
  }

  /**
   * Logout from all devices
   * @param {string} userId - User ID
   */
  async logoutAll(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Remove all refresh tokens
      user.refreshTokens = [];
      await user.save();

      logger.info(`User logged out from all devices: ${user.email}`);
    } catch (error) {
      logger.error('Logout all error:', error);
      throw error;
    }
  }

  /**
   * Change password
   * @param {string} userId - User ID
   * @param {string} oldPassword - Current password
   * @param {string} newPassword - New password
   */
  async changePassword(userId, oldPassword, newPassword) {
    try {
      const user = await User.findById(userId).select('+password');
      if (!user) {
        throw new Error('User not found');
      }

      // Verify old password
      const isMatch = await user.comparePassword(oldPassword);
      if (!isMatch) {
        throw new Error('Current password is incorrect');
      }

      // Update password
      user.password = newPassword;
      await user.save();

      // Invalidate all refresh tokens (force re-login)
      user.refreshTokens = [];
      await user.save();

      logger.info(`Password changed for user: ${user.email}`);
    } catch (error) {
      logger.error('Change password error:', error);
      throw error;
    }
  }

  /**
   * Request password reset
   * @param {string} email - User email
   * @returns {string} - Reset token
   */
  async requestPasswordReset(email) {
    try {
      const user = await User.findOne({ email });
      if (!user) {
        // Don't reveal if email exists
        logger.warn(`Password reset requested for non-existent email: ${email}`);
        return null;
      }

      // Generate reset token
      const resetToken = jwtService.generateResetToken({
        userId: user._id,
        email: user.email,
      });

      // Store hashed token
      user.passwordResetToken = encryptionService.hash(resetToken);
      user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      await user.save();

      logger.info(`Password reset requested for: ${user.email}`);

      return resetToken;
    } catch (error) {
      logger.error('Request password reset error:', error);
      throw error;
    }
  }

  /**
   * Reset password with token
   * @param {string} resetToken - Reset token
   * @param {string} newPassword - New password
   */
  async resetPassword(resetToken, newPassword) {
    try {
      // Verify token
      const decoded = jwtService.verifyToken(resetToken);

      // Hash token to compare with stored hash
      const hashedToken = encryptionService.hash(resetToken);

      // Find user with valid reset token
      const user = await User.findOne({
        _id: decoded.userId,
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: new Date() },
      }).select('+password');

      if (!user) {
        throw new Error('Invalid or expired reset token');
      }

      // Update password
      user.password = newPassword;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      user.refreshTokens = []; // Invalidate all sessions
      await user.save();

      logger.info(`Password reset successful for: ${user.email}`);
    } catch (error) {
      logger.error('Reset password error:', error);
      throw error;
    }
  }

  /**
   * Verify user account
   * @param {string} userId - User ID
   */
  async verifyEmail(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      user.isEmailVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      await user.save();

      logger.info(`Email verified for: ${user.email}`);
    } catch (error) {
      logger.error('Verify email error:', error);
      throw error;
    }
  }

  /**
   * Get user profile
   * @param {string} userId - User ID
   * @returns {Object} - User profile
   */
  async getProfile(userId) {
    try {
      const user = await User.findById(userId).select('-password -refreshTokens');
      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error) {
      logger.error('Get profile error:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} updates - Profile updates
   * @returns {Object} - Updated user
   */
  async updateProfile(userId, updates) {
    try {
      // Prevent updating sensitive fields
      const allowedUpdates = ['username', 'settings'];
      const filteredUpdates = {};

      for (const key of allowedUpdates) {
        if (updates[key] !== undefined) {
          filteredUpdates[key] = updates[key];
        }
      }

      const user = await User.findByIdAndUpdate(
        userId,
        { $set: filteredUpdates },
        { new: true, runValidators: true }
      ).select('-password -refreshTokens');

      if (!user) {
        throw new Error('User not found');
      }

      logger.info(`Profile updated for: ${user.email}`);

      return user;
    } catch (error) {
      logger.error('Update profile error:', error);
      throw error;
    }
  }
}

export default new AuthService();
