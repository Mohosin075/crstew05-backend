import { Model, Types } from 'mongoose'

export type VerificationStatus =
  | 'unverified'
  | 'pending'
  | 'verified'
  | 'rejected'
  | 'needs_info'

export type VerifiableEntityType =
  | 'coach_identity'
  | 'coach_experience'
  | 'coach_credential'
  | 'organization'
  | 'collegiate_program'
  | 'professional_team'
  | 'recruiting_agency'

export interface IVerificationDocument {
  name: string
  url: string
  uploadedAt: Date
  mimeType: string
}

export interface IVerificationRecord {
  _id: Types.ObjectId
  entityId: Types.ObjectId
  entityType: VerifiableEntityType
  entityName: string

  submittedBy: Types.ObjectId
  status: VerificationStatus
  priority: 'high' | 'normal' | 'low'
  submittedAt: Date
  reviewedAt?: Date
  verifiedAt?: Date
  verificationSource: string

  reviewerId?: Types.ObjectId
  reviewerNote?: string
  rejectionReason?: string

  documents: IVerificationDocument[]

  createdAt: Date
  updatedAt: Date
}

export type VerificationModel = Model<IVerificationRecord>
