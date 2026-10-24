import { StatusCodes } from 'http-status-codes'
import ApiError from '../../../errors/ApiError'
import { Candidate } from './candidate.model'
import { PipelineStage } from './candidate.interface'
import { Opportunity } from '../opportunity/opportunity.model'
import { Organization } from '../organization/organization.model'
import { User } from '../user/user.model'
import { Types } from 'mongoose'
import { USER_ROLES, VERIFICATION_STATUS } from '../../../enum/user'
import { Shortlist } from './shortlist.model'
import { QueryBuilder } from '../../../builder/QueryBuilder'
import {
  requireUserOrganization,
  resolveUserOrganization,
} from '../../../helpers/organizationHelper'

const getAll = async (
  userId: string,
  query: Record<string, unknown>,
) => {
  const { org } = await requireUserOrganization(userId)

  const baseFilter: Record<string, unknown> = {
    organizationId: org._id,
  }

  if (query.opportunityId) {
    baseFilter.opportunityId = query.opportunityId
  }

  if (query.stages) {
    const stages = Array.isArray(query.stages) ? query.stages : [query.stages]
    baseFilter.pipelineStage = { $in: stages }
  }

  if (query.assignedRecruiter) {
    baseFilter.assignedRecruiter = query.assignedRecruiter
  }

  const candidateQuery = new QueryBuilder(Candidate.find(baseFilter), query)
    .search([
      'coachSnapshot.name',
      'coachSnapshot.position',
      'coachSnapshot.university',
      'internalNotes',
    ])
    .filter([
      'opportunityId',
      'stages',
      'assignedRecruiter',
      'searchTerm',
      'sort',
      'sortBy',
      'sortOrder',
      'limit',
      'page',
    ])
    .sort()
    .paginate()

  const [candidates, meta] = await Promise.all([
    candidateQuery.modelQuery.lean(),
    candidateQuery.countTotal(),
  ])

  const formatted = candidates.map((c: any) => ({
    ...c,
    id: c._id.toString(),
  }))

  return {
    meta,
    data: formatted,
  }
}

const getPipelineBoard = async (userId: string, opportunityId?: string) => {
  const { org } = await requireUserOrganization(userId)

  const filter: Record<string, unknown> = { organizationId: org._id }
  if (opportunityId) {
    filter.opportunityId = opportunityId
  }

  const candidates = await Candidate.find(filter).sort({ lastUpdatedAt: -1 }).lean()

  const stages: { stage: PipelineStage; label: string }[] = [
    { stage: 'discovered', label: 'Discovered' },
    { stage: 'contacted', label: 'Contacted' },
    { stage: 'interested', label: 'Interested' },
    { stage: 'interview', label: 'Interview' },
    { stage: 'offer', label: 'Offer' },
    { stage: 'hired', label: 'Hired' },
  ]

  const board = stages.map(col => {
    const matched = candidates
      .filter(c => c.pipelineStage === col.stage)
      .map(c => ({
        ...c,
        id: c._id.toString(),
      }))

    return {
      stage: col.stage,
      label: col.label,
      count: matched.length,
      candidates: matched,
    }
  })

  return board
}

const verifyCandidateAccess = async (
  candidateOrgId: Types.ObjectId,
  userId: string,
) => {
  const user = await User.findById(userId).lean()
  if (user?.role === USER_ROLES.ADMIN || user?.role === USER_ROLES.SUPER_ADMIN) {
    return
  }
  const { org } = await resolveUserOrganization(userId)
  if (!org || org._id.toString() !== candidateOrgId.toString()) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      'You do not have permission to access or modify candidates for this organization',
    )
  }
}

const getById = async (id: string, userId: string) => {
  const candidate = await Candidate.findById(id).lean()
  if (!candidate) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Candidate record not found')
  }

  await verifyCandidateAccess(candidate.organizationId, userId)

  return {
    ...candidate,
    id: candidate._id.toString(),
  }
}

const updateStage = async (
  candidateId: string,
  stage: PipelineStage,
  userId: string,
) => {
  const candidate = await Candidate.findById(candidateId)
  if (!candidate) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Candidate not found')
  }

  await verifyCandidateAccess(candidate.organizationId, userId)

  const prevStage = candidate.pipelineStage
  candidate.pipelineStage = stage
  candidate.lastUpdatedAt = new Date()
  await candidate.save()

  // Track hires on organization if transitioned to 'hired'
  if (stage === 'hired' && prevStage !== 'hired') {
    await Organization.findByIdAndUpdate(candidate.organizationId, {
      $inc: { totalHiresCount: 1 },
    })
  }

  return { message: 'Candidate pipeline stage updated successfully' }
}

const addNote = async (
  candidateId: string,
  userId: string,
  content: string,
) => {
  const [candidate, author] = await Promise.all([
    Candidate.findById(candidateId),
    User.findById(userId).lean(),
  ])

  if (!candidate) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Candidate record not found')
  }

  await verifyCandidateAccess(candidate.organizationId, userId)

  const note = {
    _id: new Types.ObjectId(),
    candidateId: candidate._id,
    authorId: new Types.ObjectId(userId),
    authorName: author?.name || author?.fullName || 'Recruiter',
    content,
    createdAt: new Date(),
  }

  candidate.notesList.push(note as any)
  candidate.internalNotes = content
  candidate.lastUpdatedAt = new Date()
  await candidate.save()

  return {
    id: note._id.toString(),
    candidateId: candidateId,
    authorId: userId,
    authorName: note.authorName,
    content: note.content,
    createdAt: note.createdAt,
  }
}

const getNotes = async (candidateId: string, userId: string) => {
  const candidate = await Candidate.findById(candidateId).lean()
  if (!candidate) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Candidate not found')
  }

  await verifyCandidateAccess(candidate.organizationId, userId)

  return (candidate.notesList || []).map((n: any) => ({
    id: n._id?.toString(),
    candidateId: candidateId,
    authorId: n.authorId?.toString(),
    authorName: n.authorName,
    content: n.content,
    createdAt: n.createdAt,
  }))
}

const updateRating = async (
  candidateId: string,
  rating: number,
  userId: string,
) => {
  const candidate = await Candidate.findById(candidateId)
  if (!candidate) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Candidate not found')
  }

  await verifyCandidateAccess(candidate.organizationId, userId)

  candidate.internalRating = rating
  candidate.lastUpdatedAt = new Date()
  await candidate.save()

  return { message: 'Rating updated successfully' }
}

const expressInterest = async (
  coachUserId: string,
  opportunityId: string,
  payload: {
    sharedFields?: {
      shareContactInfo: boolean
      shareCareerHistory: boolean
      shareCredentials: boolean
      shareRecruitingFootprint: boolean
    }
    message?: string
  },
) => {
  const [coach, opportunity] = await Promise.all([
    User.findById(coachUserId).lean(),
    Opportunity.findById(opportunityId).lean(),
  ])

  if (!coach) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Coach profile not found')
  }
  if (!opportunity) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Opportunity not found')
  }

  // Check if coach already expressed interest
  const existingRecord = await Candidate.findOne({
    coachId: coachUserId,
    opportunityId: opportunityId,
  })

  if (existingRecord) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'You have already expressed interest in this opportunity',
    )
  }

  const coachSnapshot = {
    id: coach._id.toString(),
    name: coach.name || coach.fullName || 'Coach',
    avatarUrl: coach.profile || '',
    isVerified: !!(coach.verified || coach.identityVerification === VERIFICATION_STATUS.VERIFIED),
    position: coach.currentRole || 'Coach',
    university: coach.currentOrganization || '',
    level: coach.highestLevel || 'FBS',
    experienceYears: coach.yearsExperience || 0,
    location: coach.address?.city || '',
  }

  const candidateRecord = await Candidate.create({
    coachId: coachUserId,
    opportunityId: opportunity._id,
    organizationId: opportunity.organizationId,
    pipelineStage: 'interested',
    matchScore: 92,
    discoveredAt: new Date(),
    lastUpdatedAt: new Date(),
    expressInterestAt: new Date(),
    expressInterestMessage: payload.message || '',
    sharedFields: payload.sharedFields || {
      shareContactInfo: true,
      shareCareerHistory: true,
      shareCredentials: true,
      shareRecruitingFootprint: true,
    },
    coachSnapshot,
  })

  // Atomically increment interest counter on opportunity
  await Opportunity.findByIdAndUpdate(opportunityId, {
    $inc: { expressInterestCount: 1, applicationCount: 1 },
  })

  return {
    message: 'Expressed interest submitted successfully',
    candidateId: candidateRecord._id.toString(),
  }
}

const getExpressInterests = async (userId: string, opportunityId?: string) => {
  const { org } = await resolveUserOrganization(userId)

  const filter: Record<string, unknown> = {
    expressInterestAt: { $exists: true, $ne: null },
  }

  if (org) {
    filter.organizationId = org._id
  }
  if (opportunityId) {
    filter.opportunityId = opportunityId
  }

  const candidates = await Candidate.find(filter)
    .sort({ expressInterestAt: -1 })
    .lean()

  return candidates.map(c => {
    const snap = c.coachSnapshot
    const diffMs = Date.now() - new Date(c.expressInterestAt || c.createdAt).getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const submittedTimeAgo =
      diffHours < 1
        ? 'Just now'
        : diffHours < 24
        ? `${diffHours} hours ago`
        : `${Math.floor(diffHours / 24)} days ago`

    return {
      id: snap.id,
      name: snap.name,
      avatarUrl: snap.avatarUrl || '',
      isVerified: snap.isVerified,
      position: snap.position,
      currentOrganization: snap.university || '',
      matchScore: c.matchScore || 90,
      experienceYears: snap.experienceYears || 0,
      submittedTimeAgo,
    }
  })
}

// ─── SHORTLISTS (Delegated to dedicated ShortlistService) ───────────────────
import { ShortlistService } from '../shortlist/shortlist.service'

const getShortlists = (userId: string) => ShortlistService.getAllShortlists(userId)
const createShortlist = (userId: string, name: string) =>
  ShortlistService.createShortlist(userId, { name })
const addToShortlist = (userId: string, shortlistId: string, coachId: string) =>
  ShortlistService.addCoachToShortlist(userId, shortlistId, coachId)
const removeFromShortlist = (
  userId: string,
  shortlistId: string,
  coachId: string,
) => ShortlistService.removeCoachFromShortlist(userId, shortlistId, coachId)


export const CandidateService = {
  getAll,
  getPipelineBoard,
  getById,
  updateStage,
  addNote,
  getNotes,
  updateRating,
  expressInterest,
  getExpressInterests,
  getShortlists,
  createShortlist,
  addToShortlist,
  removeFromShortlist,
}

