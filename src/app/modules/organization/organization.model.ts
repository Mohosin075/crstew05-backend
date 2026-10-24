import { Schema, model } from 'mongoose'
import { IOrganization, OrganizationModel } from './organization.interface'
import { USER_ROLES, VERIFICATION_STATUS } from '../../../enum/user'
import {
  COLLEGIATE_DIVISION,
  ORGANIZATION_TYPE,
  ORG_MEMBER_ROLE,
} from '../../../enum/organization'
import {
  SUBSCRIPTION_PLAN,
  SUBSCRIPTION_STATUS,
} from '../../../enum/subscription'

const OrganizationMemberSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: {
      type: String,
      enum: Object.values(ORG_MEMBER_ROLE),
      default: ORG_MEMBER_ROLE.RECRUITER,
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
      enum: Object.values(ORG_MEMBER_ROLE),
      default: ORG_MEMBER_ROLE.RECRUITER,
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
      enum: Object.values(ORGANIZATION_TYPE),
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
        enum: Object.values(SUBSCRIPTION_PLAN),
        default: SUBSCRIPTION_PLAN.ORG_BASIC,
      },
      status: {
        type: String,
        enum: Object.values(SUBSCRIPTION_STATUS),
        default: SUBSCRIPTION_STATUS.ACTIVE,
      },
      currentPeriodEnd: { type: Date },
    },

    school: { type: String },
    conference: { type: String },
    division: {
      type: String,
      enum: Object.values(COLLEGIATE_DIVISION),
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
