import { Profile } from '../models/index.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import encryptionService from '../utils/encryption.js';
import logger from '../utils/logger.js';

/**
 * Get all profiles for current user
 * GET /api/profiles
 */
export const getProfiles = asyncHandler(async (req, res) => {
  const { status, limit = 100, skip = 0, search } = req.query;

  const query = {
    $or: [
      { owner: req.userId },
      { 'sharedWith.user': req.userId },
    ],
  };

  if (status) {
    query.status = status;
  }

  if (search) {
    query.$and = [
      {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } },
          { notes: { $regex: search, $options: 'i' } },
        ],
      },
    ];
  }

  const profiles = await Profile.find(query)
    .sort({ lastLaunched: -1, createdAt: -1 })
    .limit(parseInt(limit))
    .skip(parseInt(skip))
    .populate('owner', 'username email')
    .populate('team', 'name');

  const total = await Profile.countDocuments(query);

  res.json({
    success: true,
    data: {
      profiles,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: total > parseInt(skip) + profiles.length,
      },
    },
  });
});

/**
 * Get single profile
 * GET /api/profiles/:id
 */
export const getProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const profile = await Profile.findById(id)
    .populate('owner', 'username email')
    .populate('team', 'name');

  if (!profile) {
    throw new AppError('Profile not found', 404);
  }

  // Check access
  if (!profile.hasAccess(req.userId, 'read')) {
    throw new AppError('Access denied', 403);
  }

  res.json({
    success: true,
    data: profile,
  });
});

/**
 * Create new profile
 * POST /api/profiles
 */
export const createProfile = asyncHandler(async (req, res) => {
  const user = req.user;

  // Check profile limit
  const canCreate = await user.canCreateProfile();
  if (!canCreate) {
    throw new AppError(
      `Profile limit reached. Your plan allows ${user.subscription.maxProfiles} profiles.`,
      403
    );
  }

  const profileData = {
    ...req.body,
    owner: req.userId,
    metadata: {
      createdBy: user.username,
      createdIp: req.ip,
    },
  };

  const profile = new Profile(profileData);
  await profile.save();

  logger.audit('profile_created', req.userId, { profileId: profile._id });

  res.status(201).json({
    success: true,
    message: 'Profile created successfully',
    data: profile,
  });
});

/**
 * Update profile
 * PUT /api/profiles/:id
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const profile = await Profile.findById(id);

  if (!profile) {
    throw new AppError('Profile not found', 404);
  }

  // Check access
  if (!profile.hasAccess(req.userId, 'write')) {
    throw new AppError('Access denied', 403);
  }

  // Update fields
  const allowedUpdates = [
    'name',
    'fingerprint',
    'proxy',
    'browser',
    'tags',
    'notes',
    'status',
  ];

  allowedUpdates.forEach((field) => {
    if (req.body[field] !== undefined) {
      profile[field] = req.body[field];
    }
  });

  profile.metadata.lastModifiedBy = req.user.username;
  profile.metadata.lastModifiedIp = req.ip;

  await profile.save();

  logger.audit('profile_updated', req.userId, { profileId: profile._id });

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: profile,
  });
});

/**
 * Delete profile
 * DELETE /api/profiles/:id
 */
export const deleteProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const profile = await Profile.findById(id);

  if (!profile) {
    throw new AppError('Profile not found', 404);
  }

  // Only owner can delete
  if (profile.owner.toString() !== req.userId.toString()) {
    throw new AppError('Only the owner can delete this profile', 403);
  }

  await profile.deleteOne();

  logger.audit('profile_deleted', req.userId, { profileId: profile._id });

  res.json({
    success: true,
    message: 'Profile deleted successfully',
  });
});

/**
 * Clone profile
 * POST /api/profiles/:id/clone
 */
export const cloneProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  const sourceProfile = await Profile.findById(id);

  if (!sourceProfile) {
    throw new AppError('Profile not found', 404);
  }

  if (!sourceProfile.hasAccess(req.userId, 'read')) {
    throw new AppError('Access denied', 403);
  }

  // Check profile limit
  const canCreate = await req.user.canCreateProfile();
  if (!canCreate) {
    throw new AppError('Profile limit reached', 403);
  }

  // Clone profile
  const clonedData = sourceProfile.exportData();
  const newProfile = new Profile({
    ...clonedData,
    name: name || `${sourceProfile.name} (Copy)`,
    owner: req.userId,
    metadata: {
      createdBy: req.user.username,
      createdIp: req.ip,
    },
  });

  await newProfile.save();

  logger.audit('profile_cloned', req.userId, {
    sourceId: sourceProfile._id,
    newId: newProfile._id,
  });

  res.status(201).json({
    success: true,
    message: 'Profile cloned successfully',
    data: newProfile,
  });
});

/**
 * Share profile with user
 * POST /api/profiles/:id/share
 */
export const shareProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { userId, permissions = 'read' } = req.body;

  const profile = await Profile.findById(id);

  if (!profile) {
    throw new AppError('Profile not found', 404);
  }

  // Only owner can share
  if (profile.owner.toString() !== req.userId.toString()) {
    throw new AppError('Only the owner can share this profile', 403);
  }

  // Check if already shared
  const alreadyShared = profile.sharedWith.some(
    (entry) => entry.user.toString() === userId
  );

  if (alreadyShared) {
    throw new AppError('Profile already shared with this user', 400);
  }

  profile.sharedWith.push({
    user: userId,
    permissions,
  });

  profile.isShared = true;
  await profile.save();

  logger.audit('profile_shared', req.userId, {
    profileId: profile._id,
    sharedWith: userId,
  });

  res.json({
    success: true,
    message: 'Profile shared successfully',
    data: profile,
  });
});

/**
 * Export profile
 * GET /api/profiles/:id/export
 */
export const exportProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const profile = await Profile.findById(id);

  if (!profile) {
    throw new AppError('Profile not found', 404);
  }

  if (!profile.hasAccess(req.userId, 'read')) {
    throw new AppError('Access denied', 403);
  }

  const exportData = profile.exportData();

  res.json({
    success: true,
    data: exportData,
  });
});

/**
 * Import profile
 * POST /api/profiles/import
 */
export const importProfile = asyncHandler(async (req, res) => {
  const profileData = req.body;

  // Check profile limit
  const canCreate = await req.user.canCreateProfile();
  if (!canCreate) {
    throw new AppError('Profile limit reached', 403);
  }

  const profile = new Profile({
    ...profileData,
    owner: req.userId,
    metadata: {
      createdBy: req.user.username,
      createdIp: req.ip,
    },
  });

  await profile.save();

  logger.audit('profile_imported', req.userId, { profileId: profile._id });

  res.status(201).json({
    success: true,
    message: 'Profile imported successfully',
    data: profile,
  });
});

/**
 * Record profile launch
 * POST /api/profiles/:id/launch
 */
export const recordLaunch = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const profile = await Profile.findById(id);

  if (!profile) {
    throw new AppError('Profile not found', 404);
  }

  if (!profile.hasAccess(req.userId, 'read')) {
    throw new AppError('Access denied', 403);
  }

  await profile.recordLaunch();

  res.json({
    success: true,
    message: 'Launch recorded',
  });
});

export default {
  getProfiles,
  getProfile,
  createProfile,
  updateProfile,
  deleteProfile,
  cloneProfile,
  shareProfile,
  exportProfile,
  importProfile,
  recordLaunch,
};
