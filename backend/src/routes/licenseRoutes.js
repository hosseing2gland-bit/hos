import express from 'express';
import * as licenseController from '../controllers/licenseController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateLicense } from '../middleware/validation.js';

const router = express.Router();

/**
 * License Routes
 * همه route‌ها نیاز به احراز هویت Admin دارند
 */

// آمار کلی (باید قبل از :id باشد)
router.get(
  '/stats',
  authenticate,
  licenseController.getLicenseStats
);

// CRUD اصلی
router.get(
  '/',
  authenticate,
  licenseController.getLicenses
);

router.get(
  '/:id',
  authenticate,
  licenseController.getLicense
);

router.post(
  '/',
  authenticate,
  validateLicense,
  licenseController.createLicense
);

router.put(
  '/:id',
  authenticate,
  licenseController.updateLicense
);

router.delete(
  '/:id',
  authenticate,
  licenseController.deleteLicense
);

// تخصیص پروفایل
router.post(
  '/:id/assign',
  authenticate,
  licenseController.assignProfile
);

export default router;
