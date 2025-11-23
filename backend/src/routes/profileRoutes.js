import express from 'express';
import { body, param, query } from 'express-validator';
import profileController from '../controllers/profileController.js';
import { validate } from '../middleware/validation.js';
import { authenticate, requireFeature } from '../middleware/auth.js';
import { profileLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/profiles
 * @desc    Get all profiles for current user
 * @access  Private
 */
router.get(
  '/',
  [
    query('status').optional().isIn(['active', 'inactive', 'archived']),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('skip').optional().isInt({ min: 0 }),
    query('search').optional().trim(),
  ],
  validate,
  profileController.getProfiles
);

/**
 * @route   GET /api/profiles/:id
 * @desc    Get single profile
 * @access  Private
 */
router.get(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid profile ID')],
  validate,
  profileController.getProfile
);

/**
 * @route   POST /api/profiles
 * @desc    Create new profile
 * @access  Private
 */
router.post(
  '/',
  profileLimiter,
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Profile name is required')
      .isLength({ max: 100 })
      .withMessage('Profile name cannot exceed 100 characters'),
    body('fingerprint').optional().isObject(),
    body('proxy').optional().isObject(),
    body('browser').optional().isObject(),
    body('tags').optional().isArray(),
    body('notes').optional().isLength({ max: 5000 }),
  ],
  validate,
  profileController.createProfile
);

/**
 * @route   PUT /api/profiles/:id
 * @desc    Update profile
 * @access  Private
 */
router.put(
  '/:id',
  profileLimiter,
  [
    param('id').isMongoId().withMessage('Invalid profile ID'),
    body('name')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Profile name cannot exceed 100 characters'),
    body('fingerprint').optional().isObject(),
    body('proxy').optional().isObject(),
    body('browser').optional().isObject(),
    body('tags').optional().isArray(),
    body('notes').optional().isLength({ max: 5000 }),
    body('status').optional().isIn(['active', 'inactive', 'archived']),
  ],
  validate,
  profileController.updateProfile
);

/**
 * @route   DELETE /api/profiles/:id
 * @desc    Delete profile
 * @access  Private
 */
router.delete(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid profile ID')],
  validate,
  profileController.deleteProfile
);

/**
 * @route   POST /api/profiles/:id/clone
 * @desc    Clone profile
 * @access  Private
 */
router.post(
  '/:id/clone',
  profileLimiter,
  [
    param('id').isMongoId().withMessage('Invalid profile ID'),
    body('name').optional().trim().isLength({ max: 100 }),
  ],
  validate,
  profileController.cloneProfile
);

/**
 * @route   POST /api/profiles/:id/share
 * @desc    Share profile with user
 * @access  Private
 */
router.post(
  '/:id/share',
  requireFeature('teamCollaboration'),
  [
    param('id').isMongoId().withMessage('Invalid profile ID'),
    body('userId').isMongoId().withMessage('Invalid user ID'),
    body('permissions').optional().isIn(['read', 'write', 'admin']),
  ],
  validate,
  profileController.shareProfile
);

/**
 * @route   GET /api/profiles/:id/export
 * @desc    Export profile
 * @access  Private
 */
router.get(
  '/:id/export',
  [param('id').isMongoId().withMessage('Invalid profile ID')],
  validate,
  profileController.exportProfile
);

/**
 * @route   POST /api/profiles/import
 * @desc    Import profile
 * @access  Private
 */
router.post(
  '/import',
  profileLimiter,
  [
    body('name').trim().notEmpty().withMessage('Profile name is required'),
    body('fingerprint').optional().isObject(),
  ],
  validate,
  profileController.importProfile
);

/**
 * @route   POST /api/profiles/:id/launch
 * @desc    Record profile launch
 * @access  Private
 */
router.post(
  '/:id/launch',
  [param('id').isMongoId().withMessage('Invalid profile ID')],
  validate,
  profileController.recordLaunch
);

export default router;
