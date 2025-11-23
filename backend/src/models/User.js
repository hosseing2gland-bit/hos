import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import config from '../config/config.js';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [50, 'Username cannot exceed 50 characters'],
      match: [/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens, and underscores'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Don't include password in query results by default
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'team_owner', 'team_member'],
      default: 'user',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    refreshTokens: [
      {
        token: String,
        createdAt: { type: Date, default: Date.now },
        expiresAt: Date,
        userAgent: String,
        ipAddress: String,
      },
    ],
    lastLogin: Date,
    lastLoginIp: String,
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: Date,
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorSecret: String,
    backupCodes: [String],
    settings: {
      language: {
        type: String,
        default: 'en',
        enum: ['en', 'fa', 'ar', 'es', 'fr', 'de'],
      },
      theme: {
        type: String,
        default: 'light',
        enum: ['light', 'dark', 'auto'],
      },
      notifications: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
      },
    },
    subscription: {
      plan: {
        type: String,
        enum: ['free', 'basic', 'pro', 'enterprise'],
        default: 'free',
      },
      startDate: Date,
      endDate: Date,
      isActive: { type: Boolean, default: true },
      maxProfiles: { type: Number, default: 5 },
      maxTeamMembers: { type: Number, default: 0 },
      features: {
        cloudSync: { type: Boolean, default: false },
        api: { type: Boolean, default: false },
        teamCollaboration: { type: Boolean, default: false },
      },
    },
    auditLog: [
      {
        action: String,
        timestamp: { type: Date, default: Date.now },
        ipAddress: String,
        userAgent: String,
        details: mongoose.Schema.Types.Mixed,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ 'subscription.plan': 1 });
userSchema.index({ createdAt: -1 });

// Virtual for account lock status
userSchema.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  // Only hash if password is modified
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Generate salt and hash password
    const salt = await bcrypt.genSalt(config.bcrypt.saltRounds);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Method to increment login attempts
userSchema.methods.incLoginAttempts = async function () {
  // Reset attempts if lock has expired
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 },
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };

  // Lock account after 5 failed attempts
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }

  return this.updateOne(updates);
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = async function () {
  return this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 },
  });
};

// Method to add refresh token
userSchema.methods.addRefreshToken = async function (token, expiresAt, userAgent, ipAddress) {
  this.refreshTokens.push({
    token,
    expiresAt,
    userAgent,
    ipAddress,
  });

  // Keep only last 5 refresh tokens
  if (this.refreshTokens.length > 5) {
    this.refreshTokens = this.refreshTokens.slice(-5);
  }

  await this.save();
};

// Method to remove refresh token
userSchema.methods.removeRefreshToken = async function (token) {
  this.refreshTokens = this.refreshTokens.filter((rt) => rt.token !== token);
  await this.save();
};

// Method to add audit log entry
userSchema.methods.addAuditLog = async function (action, ipAddress, userAgent, details) {
  this.auditLog.push({
    action,
    ipAddress,
    userAgent,
    details,
  });

  // Keep only last 100 audit log entries
  if (this.auditLog.length > 100) {
    this.auditLog = this.auditLog.slice(-100);
  }

  await this.save();
};

// Method to check subscription features
userSchema.methods.hasFeature = function (feature) {
  return this.subscription.features[feature] === true;
};

// Method to check profile limit
userSchema.methods.canCreateProfile = async function () {
  const Profile = mongoose.model('Profile');
  const count = await Profile.countDocuments({ owner: this._id });
  return count < this.subscription.maxProfiles;
};

// Static method to find by credentials
userSchema.statics.findByCredentials = async function (emailOrUsername, password) {
  const user = await this.findOne({
    $or: [{ email: emailOrUsername }, { username: emailOrUsername }],
  }).select('+password');

  if (!user) {
    throw new Error('Invalid credentials');
  }

  if (user.isLocked) {
    throw new Error('Account is locked. Please try again later.');
  }

  if (!user.isActive) {
    throw new Error('Account is deactivated');
  }

  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    await user.incLoginAttempts();
    throw new Error('Invalid credentials');
  }

  await user.resetLoginAttempts();
  return user;
};

const User = mongoose.model('User', userSchema);

export default User;
