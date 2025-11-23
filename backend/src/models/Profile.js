import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Profile name is required'],
      trim: true,
      maxlength: [100, 'Profile name cannot exceed 100 characters'],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
    },
    isShared: {
      type: Boolean,
      default: false,
    },
    sharedWith: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        permissions: {
          type: String,
          enum: ['read', 'write', 'admin'],
          default: 'read',
        },
        sharedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    fingerprint: {
      userAgent: {
        type: String,
        default: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      platform: {
        type: String,
        enum: ['Windows', 'MacOS', 'Linux'],
        default: 'Windows',
      },
      screen: {
        width: { type: Number, default: 1920 },
        height: { type: Number, default: 1080 },
        colorDepth: { type: Number, default: 24 },
        pixelRatio: { type: Number, default: 1 },
      },
      canvas: {
        noise: { type: Boolean, default: true },
        seed: String,
      },
      webgl: {
        vendor: { type: String, default: 'Google Inc.' },
        renderer: { type: String, default: 'ANGLE (Intel, Intel(R) HD Graphics 630 Direct3D11 vs_5_0 ps_5_0)' },
        noise: { type: Boolean, default: true },
      },
      audio: {
        noise: { type: Boolean, default: true },
        seed: String,
      },
      fonts: {
        type: [String],
        default: [],
      },
      timezone: {
        type: String,
        default: 'America/New_York',
      },
      locale: {
        type: String,
        default: 'en-US',
      },
      geolocation: {
        enabled: { type: Boolean, default: false },
        latitude: Number,
        longitude: Number,
        accuracy: Number,
      },
      webrtc: {
        mode: {
          type: String,
          enum: ['real', 'fake', 'disabled'],
          default: 'fake',
        },
        publicIp: String,
        localIps: [String],
      },
      mediaDevices: {
        audioInputs: { type: Number, default: 1 },
        audioOutputs: { type: Number, default: 1 },
        videoInputs: { type: Number, default: 1 },
      },
      doNotTrack: {
        type: Boolean,
        default: true,
      },
      hardwareConcurrency: {
        type: Number,
        default: 8,
      },
      deviceMemory: {
        type: Number,
        default: 8,
      },
    },
    proxy: {
      enabled: { type: Boolean, default: false },
      type: {
        type: String,
        enum: ['http', 'https', 'socks4', 'socks5'],
        default: 'http',
      },
      host: String,
      port: Number,
      username: String,
      password: String,
    },
    browser: {
      chromiumPath: String,
      userDataDir: String,
      extensions: [
        {
          name: String,
          path: String,
          enabled: { type: Boolean, default: true },
        },
      ],
      startUrl: {
        type: String,
        default: 'about:blank',
      },
      args: [String],
    },
    // ⭐ جدید: برای Client App
    defaultUrl: {
      type: String,
      default: '',
      trim: true,
      comment: 'URL پیش‌فرض که برای Client باز می‌شود'
    },
    forClientUse: {
      type: Boolean,
      default: false,
      comment: 'آیا این پروفایل برای Client است؟'
    },
    assignedLicenses: [{
      type: String,
      comment: 'لیست License Key‌هایی که این پروفایل به آنها اختصاص داده شده'
    }],
    cookies: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    localStorage: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    bookmarks: [
      {
        title: String,
        url: String,
        folder: String,
      },
    ],
    notes: {
      type: String,
      maxlength: [5000, 'Notes cannot exceed 5000 characters'],
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    status: {
      type: String,
      enum: ['active', 'inactive', 'archived'],
      default: 'active',
    },
    lastLaunched: Date,
    launchCount: {
      type: Number,
      default: 0,
    },
    cloudSync: {
      enabled: { type: Boolean, default: false },
      lastSync: Date,
      s3Key: String,
      version: { type: Number, default: 1 },
    },
    metadata: {
      createdBy: String,
      createdIp: String,
      lastModifiedBy: String,
      lastModifiedIp: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
profileSchema.index({ owner: 1, status: 1 });
profileSchema.index({ team: 1 });
profileSchema.index({ tags: 1 });
profileSchema.index({ 'cloudSync.s3Key': 1 });
profileSchema.index({ createdAt: -1 });

// Virtual for profile age
profileSchema.virtual('age').get(function () {
  if (!this.createdAt) return 0;
  return Math.floor((Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24));
});

// Method to check if user has access
profileSchema.methods.hasAccess = function (userId, requiredPermission = 'read') {
  const userIdStr = userId.toString();

  // Owner has full access
  if (this.owner.toString() === userIdStr) {
    return true;
  }

  // Check shared access
  const sharedEntry = this.sharedWith.find(
    (entry) => entry.user.toString() === userIdStr
  );

  if (!sharedEntry) {
    return false;
  }

  const permissionLevels = { read: 1, write: 2, admin: 3 };
  return permissionLevels[sharedEntry.permissions] >= permissionLevels[requiredPermission];
};

// Method to increment launch count
profileSchema.methods.recordLaunch = async function () {
  this.lastLaunched = new Date();
  this.launchCount += 1;
  await this.save();
};

// Method to export profile data
profileSchema.methods.exportData = function () {
  return {
    name: this.name,
    fingerprint: this.fingerprint,
    proxy: this.proxy,
    browser: this.browser,
    tags: this.tags,
    notes: this.notes,
    bookmarks: this.bookmarks,
  };
};

// Static method to get user profiles
profileSchema.statics.getUserProfiles = async function (userId, options = {}) {
  const { status = 'active', limit = 100, skip = 0 } = options;

  const query = {
    $or: [
      { owner: userId },
      { 'sharedWith.user': userId },
    ],
  };

  if (status) {
    query.status = status;
  }

  return this.find(query)
    .sort({ lastLaunched: -1, createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate('owner', 'username email')
    .populate('team', 'name')
    .exec();
};

const Profile = mongoose.model('Profile', profileSchema);

export default Profile;
