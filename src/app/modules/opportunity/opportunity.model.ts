import { Schema, model } from 'mongoose'
import { IOpportunity, OpportunityModel } from './opportunity.interface'
import { USER_ROLES } from '../../../enum/user'
import {
  OPPORTUNITY_STATUS,
  OPPORTUNITY_TYPE,
} from '../../../enum/opportunity'

const OpportunitySchema = new Schema<IOpportunity, OpportunityModel>(
  {
    title: { type: String, required: true, trim: true },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    organizationName: { type: String, required: true, trim: true },
    organizationLogoUrl: { type: String, default: '' },

    position: { type: String, required: true, trim: true },
    level: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: Object.values(OPPORTUNITY_TYPE),
      default: OPPORTUNITY_TYPE.FULL_TIME,
    },
    location: { type: String, required: true },
    isRemote: { type: Boolean, default: false },

    description: { type: String, required: true },
    requirements: { type: [String], default: [] },
    preferredQualifications: { type: [String], default: [] },

    status: {
      type: String,
      enum: Object.values(OPPORTUNITY_STATUS),
      default: OPPORTUNITY_STATUS.ACTIVE,
    },

    isFeatured: { type: Boolean, default: false },
    isSponsored: { type: Boolean, default: false },
    isUrgent: { type: Boolean, default: false },

    postedAt: { type: Date, default: Date.now },
    closingAt: { type: Date },
    filledAt: { type: Date },

    postedByRole: {
      type: String,
      enum: [
        USER_ROLES.COLLEGIATE,
        USER_ROLES.TEAM,
        USER_ROLES.AGENCY,
        USER_ROLES.ORGANIZATION,
        USER_ROLES.ADMIN,
        USER_ROLES.SUPER_ADMIN,
      ],
      default: USER_ROLES.COLLEGIATE,
    },
    postedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    viewCount: { type: Number, default: 0 },
    expressInterestCount: { type: Number, default: 0 },
    applicationCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

// ------------------ INDEXES (Production Grade) ------------------
OpportunitySchema.index({ title: 'text', description: 'text', position: 'text' })
OpportunitySchema.index({ status: 1, postedAt: -1 })
OpportunitySchema.index({ organizationId: 1, status: 1 })
OpportunitySchema.index({ level: 1, position: 1, status: 1 })
OpportunitySchema.index({ isFeatured: -1, isSponsored: -1, postedAt: -1 })

export const Opportunity = model<IOpportunity, OpportunityModel>(
  'Opportunity',
  OpportunitySchema,
)
