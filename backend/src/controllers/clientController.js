const License = require('../models/License');
const Profile = require('../models/Profile');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../../utils/logger');
const crypto = require('crypto');
const os = require('os');

/**
 * Client Controller
 * API‌های ساده برای Client App
 */

/**
 * ساخت Device ID منحصر به فرد
 */
function generateDeviceId() {
  const hostname = os.hostname();
  const platform = os.platform();
  const arch = os.arch();
  const cpus = os.cpus()[0]?.model || 'unknown';
  
  const fingerprint = `${hostname}-${platform}-${arch}-${cpus}`;
  return crypto.createHash('sha256').update(fingerprint).digest('hex').substring(0, 32);
}

/**
 * @route   POST /api/client/auth
 * @desc    احراز هویت Client با License Key
 * @access  Public
 */
exports.authenticate = async (req, res, next) => {
  try {
    const { licenseKey, deviceInfo } = req.body;

    if (!licenseKey) {
      throw new AppError('License key is required', 400);
    }

    // یافتن License
    const license = await License.findByKey(licenseKey);

    if (!license) {
      logger.warn(`Invalid license key attempt: ${licenseKey}`);
      throw new AppError('Invalid license key', 401);
    }

    // چک کردن معتبر بودن
    const validation = license.isValid();
    if (!validation.valid) {
      logger.warn(`License validation failed for ${licenseKey}: ${validation.reason}`);
      throw new AppError(validation.reason, 403);
    }

    // ساخت یا به‌روزرسانی Device ID
    const deviceId = deviceInfo?.deviceId || generateDeviceId();
    const deviceName = deviceInfo?.deviceName || os.hostname();
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    try {
      await license.addDevice({
        deviceId,
        deviceName,
        ipAddress,
        userAgent
      });
    } catch (error) {
      if (error.message === 'Maximum device limit reached') {
        throw new AppError('Maximum device limit reached. Please contact administrator.', 403);
      }
      throw error;
    }

    // ساخت Session Token برای Client
    const sessionToken = crypto.randomBytes(32).toString('hex');
    
    logger.info(`Client authenticated: ${licenseKey} - Device: ${deviceId}`);

    res.status(200).json({
      success: true,
      data: {
        sessionToken,
        deviceId,
        license: {
          key: license.licenseKey,
          clientName: license.clientName,
          expiresAt: license.expiresAt,
          type: license.type
        }
      },
      message: 'Authentication successful'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/client/profile
 * @desc    دریافت پروفایل تخصیص داده شده
 * @access  Public (با License Key)
 */
exports.getProfile = async (req, res, next) => {
  try {
    const { licenseKey } = req.query;

    if (!licenseKey) {
      throw new AppError('License key is required', 400);
    }

    // یافتن License
    const license = await License.findByKey(licenseKey);

    if (!license) {
      throw new AppError('Invalid license key', 401);
    }

    // چک کردن معتبر بودن
    const validation = license.isValid();
    if (!validation.valid) {
      throw new AppError(validation.reason, 403);
    }

    // دریافت پروفایل
    const profile = await Profile.findById(license.assignedProfile);

    if (!profile) {
      throw new AppError('No profile assigned to this license', 404);
    }

    // فقط اطلاعات لازم برای Client را برمی‌گردانیم
    const clientProfile = {
      id: profile._id,
      name: profile.name,
      defaultUrl: profile.defaultUrl || profile.browser?.startUrl || 'https://google.com',
      fingerprint: profile.fingerprint,
      proxy: profile.proxy,
      browser: {
        startUrl: profile.defaultUrl || profile.browser?.startUrl,
        args: profile.browser?.args || []
      },
      cookies: profile.cookies,
      localStorage: profile.localStorage
    };

    logger.info(`Profile retrieved for license: ${licenseKey}`);

    res.status(200).json({
      success: true,
      data: clientProfile
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/client/heartbeat
 * @desc    ارسال heartbeat از Client (نشان دادن آنلاین بودن)
 * @access  Public (با License Key)
 */
exports.heartbeat = async (req, res, next) => {
  try {
    const { licenseKey, deviceId, sessionDuration } = req.body;

    if (!licenseKey || !deviceId) {
      throw new AppError('License key and device ID are required', 400);
    }

    // یافتن License
    const license = await License.findByKey(licenseKey);

    if (!license) {
      throw new AppError('Invalid license key', 401);
    }

    // به‌روزرسانی lastSeen برای دستگاه
    const device = license.activeDevices.find(d => d.deviceId === deviceId);
    if (device) {
      device.lastSeen = new Date();
      device.ipAddress = req.ip || req.connection.remoteAddress;
      
      // اگر session تمام شده، آمار را به‌روز می‌کنیم
      if (sessionDuration) {
        await license.recordUsage(sessionDuration);
      } else {
        await license.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Heartbeat received'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/client/session-start
 * @desc    ثبت شروع Session (وقتی Client browser را باز می‌کند)
 * @access  Public (با License Key)
 */
exports.startSession = async (req, res, next) => {
  try {
    const { licenseKey, deviceId } = req.body;

    if (!licenseKey || !deviceId) {
      throw new AppError('License key and device ID are required', 400);
    }

    const license = await License.findByKey(licenseKey);

    if (!license) {
      throw new AppError('Invalid license key', 401);
    }

    const validation = license.isValid();
    if (!validation.valid) {
      throw new AppError(validation.reason, 403);
    }

    logger.info(`Session started: ${licenseKey} - Device: ${deviceId}`);

    res.status(200).json({
      success: true,
      message: 'Session started',
      data: {
        sessionId: crypto.randomBytes(16).toString('hex'),
        startedAt: new Date()
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/client/session-end
 * @desc    ثبت پایان Session
 * @access  Public (با License Key)
 */
exports.endSession = async (req, res, next) => {
  try {
    const { licenseKey, deviceId, sessionId, duration } = req.body;

    if (!licenseKey) {
      throw new AppError('License key is required', 400);
    }

    const license = await License.findByKey(licenseKey);

    if (license && duration) {
      await license.recordUsage(duration);
      logger.info(`Session ended: ${licenseKey} - Duration: ${duration}s`);
    }

    res.status(200).json({
      success: true,
      message: 'Session ended'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/client/check-update
 * @desc    چک کردن به‌روزرسانی Client App
 * @access  Public
 */
exports.checkUpdate = async (req, res, next) => {
  try {
    const { version } = req.query;

    // فعلاً هیچ به‌روزرسانی نیست
    res.status(200).json({
      success: true,
      data: {
        updateAvailable: false,
        latestVersion: version || '1.0.0',
        downloadUrl: null
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = exports;
