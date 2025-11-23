import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Team name is required'],
      trim: true,
      maxlength: [100, 'Team name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        role: {
          type: String,
          enum: ['owner', 'admin', 'member', 'viewer'],
          default: 'member',
        },
        permissions: {
          canCreateProfiles: { type: Boolean, default: true },
          canEditProfiles: { type: Boolean, default: true },
          canDeleteProfiles: { type: Boolean, default: false },
          canShareProfiles: { type: Boolean, default: false },
          canManageMembers: { type: Boolean, default: false },
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
        invitedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        status: {
          type: String,
          enum: ['active', 'inactive', 'pending'],
          default: 'active',
        },
      },
    ],
    invitations: [
      {
        email: {
          type: String,
          required: true,
        },
        role: {
          type: String,
          enum: ['admin', 'member', 'viewer'],
          default: 'member',
        },
        token: String,
        invitedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        expiresAt: Date,
        status: {
          type: String,
          enum: ['pending', 'accepted', 'rejected', 'expired'],
          default: 'pending',
        },
      },
    ],
    settings: {
      maxMembers: {
        type: Number,
        default: 10,
      },
      requireApproval: {
        type: Boolean,
        default: false,
      },
      allowProfileSharing: {
        type: Boolean,
        default: true,
      },
      defaultPermissions: {
        canCreateProfiles: { type: Boolean, default: true },
        canEditProfiles: { type: Boolean, default: true },
        canDeleteProfiles: { type: Boolean, default: false },
        canShareProfiles: { type: Boolean, default: false },
        canManageMembers: { type: Boolean, default: false },
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    subscription: {
      plan: {
        type: String,
        enum: ['free', 'team', 'enterprise'],
        default: 'free',
      },
      maxProfiles: {
        type: Number,
        default: 20,
      },
      features: {
        cloudSync: { type: Boolean, default: false },
        api: { type: Boolean, default: false },
        advancedAnalytics: { type: Boolean, default: false },
      },
    },
    statistics: {
      totalProfiles: { type: Number, default: 0 },
      totalLaunches: { type: Number, default: 0 },
      lastActivity: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
teamSchema.index({ owner: 1 });
teamSchema.index({ 'members.user': 1 });
teamSchema.index({ isActive: 1 });
teamSchema.index({ createdAt: -1 });

// Virtual for member count
teamSchema.virtual('memberCount').get(function () {
  return this.members.filter((m) => m.status === 'active').length;
});

// Method to check if user is member
teamSchema.methods.isMember = function (userId) {
  const userIdStr = userId.toString();
  return this.members.some(
    (member) => member.user.toString() === userIdStr && member.status === 'active'
  );
};

// Method to get member role
teamSchema.methods.getMemberRole = function (userId) {
  const userIdStr = userId.toString();
  const member = this.members.find(
    (m) => m.user.toString() === userIdStr && m.status === 'active'
  );
  return member ? member.role : null;
};

// Method to check if user has permission
teamSchema.methods.hasPermission = function (userId, permission) {
  const userIdStr = userId.toString();

  // Owner has all permissions
  if (this.owner.toString() === userIdStr) {
    return true;
  }

  const member = this.members.find(
    (m) => m.user.toString() === userIdStr && m.status === 'active'
  );

  if (!member) {
    return false;
  }

  // Admin has all permissions
  if (member.role === 'admin') {
    return true;
  }

  return member.permissions[permission] === true;
};

// Method to add member
teamSchema.methods.addMember = async function (userId, role = 'member', invitedBy = null) {
  // Check if already a member
  if (this.isMember(userId)) {
    throw new Error('User is already a member');
  }

  // Check member limit
  if (this.memberCount >= this.settings.maxMembers) {
    throw new Error('Team has reached maximum member limit');
  }

  this.members.push({
    user: userId,
    role,
    permissions: this.settings.defaultPermissions,
    invitedBy,
    status: this.settings.requireApproval ? 'pending' : 'active',
  });

  await this.save();
};

// Method to remove member
teamSchema.methods.removeMember = async function (userId) {
  this.members = this.members.filter(
    (member) => member.user.toString() !== userId.toString()
  );
  await this.save();
};

// Method to update member role
teamSchema.methods.updateMemberRole = async function (userId, newRole) {
  const member = this.members.find(
    (m) => m.user.toString() === userId.toString()
  );

  if (!member) {
    throw new Error('Member not found');
  }

  member.role = newRole;
  await this.save();
};

// Method to update member permissions
teamSchema.methods.updateMemberPermissions = async function (userId, permissions) {
  const member = this.members.find(
    (m) => m.user.toString() === userId.toString()
  );

  if (!member) {
    throw new Error('Member not found');
  }

  member.permissions = { ...member.permissions, ...permissions };
  await this.save();
};

// Static method to get user teams
teamSchema.statics.getUserTeams = async function (userId) {
  return this.find({
    $or: [
      { owner: userId },
      { 'members.user': userId, 'members.status': 'active' },
    ],
    isActive: true,
  })
    .populate('owner', 'username email')
    .populate('members.user', 'username email')
    .sort({ createdAt: -1 })
    .exec();
};

const Team = mongoose.model('Team', teamSchema);

export default Team;
