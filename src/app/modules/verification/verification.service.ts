import { StatusCodes } from 'http-status-codes'
import ApiError from '../../../errors/ApiError'
import { Verification } from './verification.model'
import {
  IVerificationRecord,
  VerifiableEntityType,
} from './verification.interface'
import { User } from '../user/user.model'
import { Organization } from '../organization/organization.model'
import { VERIFICATION_STATUS } from '../../../enum/user'
import { Types } from 'mongoose'

const submitVerification = async (
  userId: string,
  payload: {
    entityId: string
    entityType: VerifiableEntityType
    entityName: string
    documents: { name: string; url: string; mimeType: string }[]
  },
) => {
  const existing = await Verification.findOne({
    entityId: payload.entityId,
    entityType: payload.entityType,
    status: { $in: ['pending', 'needs_info'] },
  })

  if (existing) {
    existing.documents = payload.documents.map(d => ({
      ...d,
      uploadedAt: new Date(),
    }))
    existing.status = 'pending'
    existing.submittedAt = new Date()
    await existing.save()
    return existing
  }

  const record = await Verification.create({
    entityId: payload.entityId,
    entityType: payload.entityType,
    entityName: payload.entityName,
    submittedBy: userId,
    documents: payload.documents.map(d => ({
      ...d,
      uploadedAt: new Date(),
    })),
    status: 'pending',
    priority: 'normal',
    submittedAt: new Date(),
  })

  return record
}

const getQueue = async () => {
  const queue = await Verification.find({
    status: { $in: ['pending', 'needs_info'] },
  })
    .populate('submittedBy', 'name fullName email')
    .sort({ priority: 1, submittedAt: -1 })
    .lean()

  return queue.map((item: any) => ({
    id: item._id.toString(),
    entityId: item.entityId.toString(),
    entityType: item.entityType,
    entityName: item.entityName,
    submittedBy:
      item.submittedBy?.name || item.submittedBy?.fullName || 'User',
    submittedAt: item.submittedAt,
    status: item.status,
    priority: item.priority || 'normal',
    documents: (item.documents || []).map((doc: any) => ({
      id: doc._id?.toString(),
      name: doc.name,
      url: doc.url,
      uploadedAt: doc.uploadedAt,
      mimeType: doc.mimeType,
    })),
  }))
}

const approve = async (
  verificationId: string,
  reviewerId: string,
  note?: string,
) => {
  const record = await Verification.findById(verificationId)
  if (!record) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Verification record not found')
  }

  record.status = 'verified'
  record.reviewedAt = new Date()
  record.verifiedAt = new Date()
  record.reviewerId = new Types.ObjectId(reviewerId)
  if (note) record.reviewerNote = note
  await record.save()

  // Apply verified badge to actual entity
  if (
    record.entityType === 'coach_identity' ||
    record.entityType === 'coach_experience'
  ) {
    const update: Record<string, unknown> = {
      verified: true,
    }
    if (record.entityType === 'coach_identity') {
      update.identityVerification = VERIFICATION_STATUS.VERIFIED
    } else {
      update.experienceVerification = VERIFICATION_STATUS.VERIFIED
    }
    await User.findByIdAndUpdate(record.entityId, update)
  } else if (
    record.entityType === 'organization' ||
    record.entityType === 'collegiate_program' ||
    record.entityType === 'professional_team' ||
    record.entityType === 'recruiting_agency'
  ) {
    await Organization.findByIdAndUpdate(record.entityId, {
      isVerified: true,
      verificationStatus: VERIFICATION_STATUS.VERIFIED,
    })
  }

  return { message: 'Verification approved successfully' }
}

const reject = async (
  verificationId: string,
  reviewerId: string,
  reason: string,
) => {
  const record = await Verification.findById(verificationId)
  if (!record) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Verification record not found')
  }

  record.status = 'rejected'
  record.reviewedAt = new Date()
  record.reviewerId = new Types.ObjectId(reviewerId)
  record.rejectionReason = reason
  await record.save()

  return { message: 'Verification rejected successfully' }
}

const requestInfo = async (
  verificationId: string,
  reviewerId: string,
  note: string,
) => {
  const record = await Verification.findById(verificationId)
  if (!record) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Verification record not found')
  }

  record.status = 'needs_info'
  record.reviewedAt = new Date()
  record.reviewerId = new Types.ObjectId(reviewerId)
  record.reviewerNote = note
  await record.save()

  return { message: 'Information requested from applicant' }
}

const getStatus = async (entityId: string) => {
  const record = await Verification.findOne({ entityId })
    .sort({ submittedAt: -1 })
    .lean()

  return {
    entityId,
    status: record ? record.status : 'unverified',
    submittedAt: record ? record.submittedAt : null,
    verifiedAt: record ? record.verifiedAt : null,
  }
}

export const VerificationService = {
  submitVerification,
  getQueue,
  approve,
  reject,
  requestInfo,
  getStatus,
}
