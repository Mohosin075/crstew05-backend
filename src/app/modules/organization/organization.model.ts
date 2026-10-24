import { Schema, model } from 'mongoose'
import { IOrganization, OrganizationModel } from './organization.interface'
import { USER_ROLES, VERIFICATION_STATUS } from '../../../enum/user'

const OrganizationMemberSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: {
      type: String,
      enum: ['admin', 'recruiter', 'staff', 'read_only'],
      default: 'recruiter',
    },
    joinedAt: { type: Date, default: Date.now },
    lastActive: { type: Date, default: Date.now },
  },
  { _id: true },
)

const OrgInviteSchema = new Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    role: {
      type: String,
      enum: ['admin', 'recruiter', 'staff', 'read_only'],
      default: 'recruiter',
    },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sentAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'expired'],
      default: 'pending',
    },
    token: { type: String, required: true },
  },
  { _id: true },
)

const OrganizationSchema = new Schema<IOrganization, OrganizationModel>(
  {
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: [
        'collegiate_program',
        'professional_team',
        'recruiting_agency',
        'organization',
        'high_school',
      ],
      required: true,
    },
    role: {
      type: String,
      enum: [
        USER_ROLES.COLLEGIATE,
        USER_ROLES.TEAM,
        USER_ROLES.AGENCY,
        USER_ROLES.ORGANIZATION,
      ],
      default: USER_ROLES.COLLEGIATE,
    },
    logoUrl: { type: String, default: '' },
    website: { type: String, trim: true },
    location: { type: String, required: true },
    state: { type: String, required: true },
    description: { type: String },

    verificationStatus: {
      type: String,
      enum: Object.values(VERIFICATION_STATUS),
      default: VERIFICATION_STATUS.UNVERIFIED,
    },
    isVerified: { type: Boolean, default: false },
    isFounding: { type: Boolean, default: false },

    subscription: {
      plan: {
        type: String,
        enum: ['coach_free', 'coach_pro', 'org_basic', 'org_pro', 'enterprise'],
        default: 'org_basic',
      },
      status: {
        type: String,
        enum: ['active', 'trialing', 'past_due', 'canceled', 'founding'],
        default: 'active',
      },
      currentPeriodEnd: { type: Date },
    },

    school: { type: String },
    conference: { type: String },
    division: {
      type: String,
      enum: ['FBS', 'FCS', 'D2', 'D3', 'NAIA', 'JUCO'],
    },
    sports: { type: [String], default: ['Football'] },
    league: { type: String },
    city: { type: String },
    specializations: { type: [String], default: [] },
    activeSearchCount: { type: Number, default: 0 },

    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    members: [OrganizationMemberSchema],
    invites: [OrgInviteSchema],

    activeOpportunitiesCount: { type: Number, default: 0 },
    totalHiresCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

// ------------------ INDEXES ------------------
OrganizationSchema.index({ name: 'text', description: 'text' })
OrganizationSchema.index({ type: 1, state: 1 })
OrganizationSchema.index({ role: 1, verificationStatus: 1 })
OrganizationSchema.index({ owner: 1 })
OrganizationSchema.index({ 'members.user': 1 })

export const Organization = model<IOrganization, OrganizationModel>(
  'Organization',
  OrganizationSchema,
)
