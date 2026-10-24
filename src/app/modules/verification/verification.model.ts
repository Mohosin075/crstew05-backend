import { Schema, model } from 'mongoose'
import {
  IVerificationRecord,
  VerificationModel,
} from './verification.interface'

const VerificationDocumentSchema = new Schema(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
    mimeType: { type: String, default: 'application/pdf' },
  },
  { _id: true },
)

const VerificationSchema = new Schema<
  IVerificationRecord,
  VerificationModel
>(
  {
    entityId: { type: Schema.Types.ObjectId, required: true },
    entityType: {
      type: String,
      enum: [
        'coach_identity',
        'coach_experience',
        'coach_credential',
        'organization',
        'collegiate_program',
        'professional_team',
        'recruiting_agency',
      ],
      required: true,
    },
    entityName: { type: String, required: true, trim: true },

    submittedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['unverified', 'pending', 'verified', 'rejected', 'needs_info'],
      default: 'pending',
    },
    priority: {
      type: String,
      enum: ['high', 'normal', 'low'],
      default: 'normal',
    },
    submittedAt: { type: Date, default: Date.now },
    reviewedAt: { type: Date },
    verifiedAt: { type: Date },
    verificationSource: { type: String, default: 'document_upload' },

    reviewerId: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewerNote: { type: String },
    rejectionReason: { type: String },

    documents: [VerificationDocumentSchema],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

// ------------------ INDEXES ------------------
VerificationSchema.index({ status: 1, submittedAt: -1 })
VerificationSchema.index({ entityId: 1, entityType: 1 })
VerificationSchema.index({ submittedBy: 1 })

export const Verification = model<IVerificationRecord, VerificationModel>(
  'Verification',
  VerificationSchema,
)
