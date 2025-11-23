const License = require('../models/License');
const Profile = require('../models/Profile');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../../utils/logger');

/**
 * License Controller
 * مدیریت License‌ها برای Admin
 */

/**
 * @route   GET /api/admin/licenses
 * @desc    دریافت لیست تمام License‌ها
 * @access  Private/Admin
 */
exports.getLicenses = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const userId = req.user.id;

    const query = { createdBy: userId };

    // فیلتر بر اساس وضعیت
    if (status === 'active') {
      query.isActive = true;
      query.expiresAt = { $gt: new Date() };
    } else if (status === 'expired') {
      query.expiresAt = { $lt: new Date() };
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    const licenses = await License.find(query)
      .populate('assignedProfile', 'name tags')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await License.countDocuments(query);

    res.status(200).json({
      success: true,
      data: licenses,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/licenses/:id
 * @desc    دریافت جزئیات یک License
 * @access  Private/Admin
 */
exports.getLicense = async (req, res, next) => {
  try {
    const license = await License.findById(req.params.id)
      .populate('assignedProfile')
      .populate('createdBy', 'name email');

    if (!license) {
      throw new AppError('License not found', 404);
    }

    // چک کردن مالکیت
    if (license.createdBy._id.toString() !== req.user.id) {
      throw new AppError('Unauthorized access to license', 403);
    }

    res.status(200).json({
      success: true,
      data: license
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/admin/licenses
 * @desc    ساخت License جدید
 * @access  Private/Admin
 */
exports.createLicense = async (req, res, next) => {
  try {
    const {
      clientName,
      type,
      assignedProfile,
      maxDevices,
      expiresInDays,
      notes
    } = req.body;

    // ساخت License Key منحصر به فرد
    let licenseKey;
    let isUnique = false;
    
    while (!isUnique) {
      licenseKey = License.generateLicenseKey();
      const existing = await License.findOne({ licenseKey });
      if (!existing) isUnique = true;
    }

    // محاسبه تاریخ انقضا
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (expiresInDays || 30));

    // ساخت License
    const license = await License.create({
      licenseKey,
      clientName,
      type: type || 'monthly',
      assignedProfile: assignedProfile || null,
      maxDevices: maxDevices || 1,
      expiresAt,
      notes,
      createdBy: req.user.id
    });

    // اگر پروفایل تخصیص داده شده، به لیست پروفایل اضافه می‌کنیم
    if (assignedProfile) {
      await Profile.findByIdAndUpdate(
        assignedProfile,
        { 
          $addToSet: { assignedLicenses: licenseKey },
          forClientUse: true
        }
      );
    }

    logger.info(`License created: ${licenseKey} by user ${req.user.email}`);

    res.status(201).json({
      success: true,
      data: license,
      message: 'License created successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/admin/licenses/:id
 * @desc    به‌روزرسانی License
 * @access  Private/Admin
 */
exports.updateLicense = async (req, res, next) => {
  try {
    const license = await License.findById(req.params.id);

    if (!license) {
      throw new AppError('License not found', 404);
    }

    // چک کردن مالکیت
    if (license.createdBy.toString() !== req.user.id) {
      throw new AppError('Unauthorized access to license', 403);
    }

    const {
      clientName,
      isActive,
      maxDevices,
      assignedProfile,
      notes,
      expiresAt
    } = req.body;

    // به‌روزرسانی فیلدها
    if (clientName !== undefined) license.clientName = clientName;
    if (isActive !== undefined) license.isActive = isActive;
    if (maxDevices !== undefined) license.maxDevices = maxDevices;
    if (notes !== undefined) license.notes = notes;
    if (expiresAt !== undefined) license.expiresAt = new Date(expiresAt);

    // اگر پروفایل تغییر کرد
    if (assignedProfile !== undefined && assignedProfile !== license.assignedProfile?.toString()) {
      // حذف از پروفایل قبلی
      if (license.assignedProfile) {
        await Profile.findByIdAndUpdate(
          license.assignedProfile,
          { $pull: { assignedLicenses: license.licenseKey } }
        );
      }

      // اضافه به پروفایل جدید
      if (assignedProfile) {
        await Profile.findByIdAndUpdate(
          assignedProfile,
          { 
            $addToSet: { assignedLicenses: license.licenseKey },
            forClientUse: true
          }
        );
      }

      license.assignedProfile = assignedProfile;
    }

    await license.save();

    logger.info(`License updated: ${license.licenseKey} by user ${req.user.email}`);

    res.status(200).json({
      success: true,
      data: license,
      message: 'License updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/admin/licenses/:id
 * @desc    حذف/غیرفعال کردن License
 * @access  Private/Admin
 */
exports.deleteLicense = async (req, res, next) => {
  try {
    const license = await License.findById(req.params.id);

    if (!license) {
      throw new AppError('License not found', 404);
    }

    // چک کردن مالکیت
    if (license.createdBy.toString() !== req.user.id) {
      throw new AppError('Unauthorized access to license', 403);
    }

    // به جای حذف، غیرفعال می‌کنیم
    license.isActive = false;
    await license.save();

    // حذف از پروفایل
    if (license.assignedProfile) {
      await Profile.findByIdAndUpdate(
        license.assignedProfile,
        { $pull: { assignedLicenses: license.licenseKey } }
      );
    }

    logger.info(`License deactivated: ${license.licenseKey} by user ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'License deactivated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/admin/licenses/:id/assign
 * @desc    تخصیص پروفایل به License
 * @access  Private/Admin
 */
exports.assignProfile = async (req, res, next) => {
  try {
    const { profileId } = req.body;
    const license = await License.findById(req.params.id);

    if (!license) {
      throw new AppError('License not found', 404);
    }

    // چک کردن مالکیت
    if (license.createdBy.toString() !== req.user.id) {
      throw new AppError('Unauthorized access to license', 403);
    }

    // چک کردن وجود پروفایل
    const profile = await Profile.findById(profileId);
    if (!profile) {
      throw new AppError('Profile not found', 404);
    }

    // چک کردن مالکیت پروفایل
    if (profile.owner.toString() !== req.user.id) {
      throw new AppError('Unauthorized access to profile', 403);
    }

    // حذف از پروفایل قبلی
    if (license.assignedProfile) {
      await Profile.findByIdAndUpdate(
        license.assignedProfile,
        { $pull: { assignedLicenses: license.licenseKey } }
      );
    }

    // تخصیص پروفایل جدید
    license.assignedProfile = profileId;
    await license.save();

    // اضافه کردن License به پروفایل
    await Profile.findByIdAndUpdate(
      profileId,
      { 
        $addToSet: { assignedLicenses: license.licenseKey },
        forClientUse: true
      }
    );

    logger.info(`Profile ${profileId} assigned to license ${license.licenseKey}`);

    res.status(200).json({
      success: true,
      data: license,
      message: 'Profile assigned successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/licenses/stats
 * @desc    دریافت آمار کلی License‌ها
 * @access  Private/Admin
 */
exports.getLicenseStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    const [
      totalLicenses,
      activeLicenses,
      expiredLicenses,
      totalDevices,
      recentActivity
    ] = await Promise.all([
      License.countDocuments({ createdBy: userId }),
      License.countDocuments({ 
        createdBy: userId,
        isActive: true,
        expiresAt: { $gt: now }
      }),
      License.countDocuments({ 
        createdBy: userId,
        expiresAt: { $lt: now }
      }),
      License.aggregate([
        { $match: { createdBy: mongoose.Types.ObjectId(userId) } },
        { $unwind: '$activeDevices' },
        { $count: 'total' }
      ]),
      License.find({ createdBy: userId })
        .sort({ lastUsedAt: -1 })
        .limit(5)
        .populate('assignedProfile', 'name')
    ]);

    res.status(200).json({
      success: true,
      data: {
        total: totalLicenses,
        active: activeLicenses,
        expired: expiredLicenses,
        devices: totalDevices[0]?.total || 0,
        recentActivity
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = exports;
