import { Schema, model } from 'mongoose'
import { ICandidateRecord, CandidateModel } from './candidate.interface'
import { PIPELINE_STAGE } from '../../../enum/candidate'

const CandidateNoteSchema = new Schema(
  {
    candidateId: {
      type: Schema.Types.ObjectId,
      ref: 'Candidate',
      required: true,
    },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    authorName: { type: String, required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true },
)

const CandidateSnapshotSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    avatarUrl: { type: String, default: '' },
    isVerified: { type: Boolean, default: false },
    position: { type: String, required: true },
    university: { type: String, default: '' },
    level: { type: String, default: 'FBS' },
    experienceYears: { type: Number, default: 0 },
    location: { type: String, default: '' },
  },
  { _id: false },
)

const CandidateSchema = new Schema<ICandidateRecord, CandidateModel>(
  {
    coachId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    opportunityId: { type: Schema.Types.ObjectId, ref: 'Opportunity' },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },

    pipelineStage: {
      type: String,
      enum: Object.values(PIPELINE_STAGE),
      default: PIPELINE_STAGE.DISCOVERED,
    },


    internalRating: { type: Number, min: 1, max: 5 },
    internalNotes: { type: String },
    notesList: [CandidateNoteSchema],
    assignedRecruiter: { type: String },
    lastContacted: { type: String },

    matchScore: { type: Number, default: 85 },
    matchBreakdown: [
      {
        category: { type: String },
        strength: { type: String },
        percentage: { type: Number },
      },
    ],

    discoveredAt: { type: Date, default: Date.now },
    lastUpdatedAt: { type: Date, default: Date.now },

    expressInterestAt: { type: Date },
    expressInterestMessage: { type: String },
    sharedFields: {
      shareContactInfo: { type: Boolean, default: true },
      shareCareerHistory: { type: Boolean, default: true },
      shareCredentials: { type: Boolean, default: true },
      shareRecruitingFootprint: { type: Boolean, default: true },
    },

    coachSnapshot: { type: CandidateSnapshotSchema, required: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

// ------------------ INDEXES (Production Grade) ------------------
CandidateSchema.index({ organizationId: 1, pipelineStage: 1 })
CandidateSchema.index({ coachId: 1, organizationId: 1, opportunityId: 1 }, { unique: true })
CandidateSchema.index({ opportunityId: 1, pipelineStage: 1 })
CandidateSchema.index({ organizationId: 1, internalRating: -1 })
CandidateSchema.index({ organizationId: 1, expressInterestAt: -1 })

export const Candidate = model<ICandidateRecord, CandidateModel>(
  'Candidate',
  CandidateSchema,
)
