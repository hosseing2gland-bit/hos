const mongoose = require('mongoose');

/**
 * License Model
 * برای مدیریت License Key‌های کلاینت‌ها
 */
const licenseSchema = new mongoose.Schema({
  // License Key منحصر به فرد
  licenseKey: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  // نام کلاینت (اختیاری)
  clientName: {
    type: String,
    trim: true
  },

  // نوع License
  type: {
    type: String,
    enum: ['trial', 'monthly', 'yearly', 'lifetime'],
    default: 'monthly'
  },

  // پروفایل تخصیص داده شده
  assignedProfile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile',
    default: null
  },

  // تاریخ انقضا
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },

  // وضعیت فعال/غیرفعال
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },

  // تعداد دستگاه‌های مجاز
  maxDevices: {
    type: Number,
    default: 1,
    min: 1,
    max: 10
  },

  // دستگاه‌های فعال
  activeDevices: [{
    deviceId: {
      type: String,
      required: true
    },
    deviceName: String,
    firstSeen: {
      type: Date,
      default: Date.now
    },
    lastSeen: {
      type: Date,
      default: Date.now
    },
    ipAddress: String,
    userAgent: String
  }],

  // محدودیت‌های استفاده
  usage: {
    dailyLimit: {
      type: Number,
      default: 0 // 0 = unlimited
    },
    monthlyLimit: {
      type: Number,
      default: 0
    },
    totalUsed: {
      type: Number,
      default: 0
    }
  },

  // یادداشت‌ها (برای Admin)
  notes: {
    type: String,
    default: ''
  },

  // ساخته شده توسط
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // آخرین استفاده
  lastUsedAt: {
    type: Date,
    default: null
  },

  // آمار
  stats: {
    totalSessions: {
      type: Number,
      default: 0
    },
    totalDuration: {
      type: Number,
      default: 0 // به ثانیه
    }
  }
}, {
  timestamps: true
});

// Index‌ها برای جستجوی سریع
licenseSchema.index({ createdBy: 1, isActive: 1 });
licenseSchema.index({ expiresAt: 1, isActive: 1 });

// متدها
licenseSchema.methods = {
  /**
   * چک کردن معتبر بودن License
   */
  isValid() {
    if (!this.isActive) {
      return { valid: false, reason: 'License is deactivated' };
    }

    if (this.expiresAt < new Date()) {
      return { valid: false, reason: 'License has expired' };
    }

    if (!this.assignedProfile) {
      return { valid: false, reason: 'No profile assigned' };
    }

    return { valid: true };
  },

  /**
   * اضافه کردن دستگاه جدید
   */
  addDevice(deviceInfo) {
    const existingDevice = this.activeDevices.find(d => d.deviceId === deviceInfo.deviceId);
    
    if (existingDevice) {
      // به‌روزرسانی اطلاعات دستگاه موجود
      existingDevice.lastSeen = new Date();
      existingDevice.ipAddress = deviceInfo.ipAddress;
      existingDevice.userAgent = deviceInfo.userAgent;
    } else {
      // چک کردن محدودیت تعداد دستگاه
      if (this.activeDevices.length >= this.maxDevices) {
        throw new Error('Maximum device limit reached');
      }
      
      // اضافه کردن دستگاه جدید
      this.activeDevices.push({
        deviceId: deviceInfo.deviceId,
        deviceName: deviceInfo.deviceName || 'Unknown',
        ipAddress: deviceInfo.ipAddress,
        userAgent: deviceInfo.userAgent,
        firstSeen: new Date(),
        lastSeen: new Date()
      });
    }

    this.lastUsedAt = new Date();
    return this.save();
  },

  /**
   * حذف دستگاه
   */
  removeDevice(deviceId) {
    this.activeDevices = this.activeDevices.filter(d => d.deviceId !== deviceId);
    return this.save();
  },

  /**
   * ثبت استفاده (Session)
   */
  recordUsage(durationInSeconds = 0) {
    this.stats.totalSessions += 1;
    this.stats.totalDuration += durationInSeconds;
    this.usage.totalUsed += 1;
    this.lastUsedAt = new Date();
    return this.save();
  }
};

// Static methods
licenseSchema.statics = {
  /**
   * ساخت License Key تصادفی
   */
  generateLicenseKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const segments = 4;
    const segmentLength = 4;
    
    const key = Array(segments).fill(null).map(() => {
      return Array(segmentLength).fill(null).map(() => {
        return chars.charAt(Math.floor(Math.random() * chars.length));
      }).join('');
    }).join('-');
    
    return key;
  },

  /**
   * یافتن License با Key
   */
  async findByKey(licenseKey) {
    return this.findOne({ licenseKey })
      .populate('assignedProfile')
      .populate('createdBy', 'name email');
  },

  /**
   * یافتن License‌های فعال
   */
  async findActive(userId = null) {
    const query = {
      isActive: true,
      expiresAt: { $gt: new Date() }
    };
    
    if (userId) {
      query.createdBy = userId;
    }
    
    return this.find(query)
      .populate('assignedProfile')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
  },

  /**
   * یافتن License‌های منقضی شده
   */
  async findExpired(userId = null) {
    const query = {
      expiresAt: { $lt: new Date() }
    };
    
    if (userId) {
      query.createdBy = userId;
    }
    
    return this.find(query)
      .populate('assignedProfile')
      .populate('createdBy', 'name email')
      .sort({ expiresAt: -1 });
  }
};

// Middleware: قبل از ذخیره
licenseSchema.pre('save', function(next) {
  // پاک کردن دستگاه‌های غیرفعال (بیش از 30 روز)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  this.activeDevices = this.activeDevices.filter(d => d.lastSeen > thirtyDaysAgo);
  
  next();
});

const License = mongoose.model('License', licenseSchema);

module.exports = License;
