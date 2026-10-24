import { StatusCodes } from 'http-status-codes'
import ApiError from '../../../errors/ApiError'
import { Shortlist } from './shortlist.model'
import { IShortlistItem } from './shortlist.interface'
import { User } from '../user/user.model'
import { Organization } from '../organization/organization.model'
import { Types } from 'mongoose'
import { VERIFICATION_STATUS } from '../../../enum/user'

const resolveOrganizationId = async (userId: string): Promise<Types.ObjectId> => {
  const user = await User.findById(userId).lean()
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
  }

  const org = await Organization.findOne({
    $or: [
      { _id: user.organizationId },
      { owner: userId },
      { 'members.user': new Types.ObjectId(userId) },
    ],
  }).lean()

  return org ? (org._id as Types.ObjectId) : user._id
}

const getAllShortlists = async (userId: string): Promise<IShortlistItem[]> => {
  const organizationId = await resolveOrganizationId(userId)
  const shortlists = await Shortlist.find({ organizationId })
    .sort({ createdAt: -1 })
    .lean()

  return shortlists.map(list => ({
    id: list._id.toString(),
    name: list.name,
    description: list.description,
    count: list.coaches ? list.coaches.length : 0,
    createdAt: list.createdAt,
  }))
}

const getShortlistById = async (userId: string, shortlistId: string) => {
  const organizationId = await resolveOrganizationId(userId)
  const list = await Shortlist.findOne({
    _id: shortlistId,
    organizationId,
  })
    .populate({
      path: 'coaches',
      select:
        'name fullName profile currentRole currentOrganization highestLevel yearsExperience address verified identityVerification',
    })
    .lean()

  if (!list) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Shortlist not found')
  }

  const coaches = ((list.coaches || []) as any[]).map(coach => ({
    id: coach._id.toString(),
    name: coach.name || coach.fullName || 'Coach',
    avatarUrl: coach.profile || '',
    isVerified: !!(
      coach.verified ||
      coach.identityVerification === VERIFICATION_STATUS.VERIFIED
    ),
    currentRole: coach.currentRole || 'Coach',
    organization: coach.currentOrganization || '',
    level: coach.highestLevel || 'FBS',
    location: coach.address?.city || '',
    experienceYears: coach.yearsExperience || 0,
    matchScore: 92,
  }))

  return {
    id: list._id.toString(),
    name: list.name,
    description: list.description,
    count: coaches.length,
    coaches,
    createdAt: list.createdAt,
    updatedAt: list.updatedAt,
  }
}

const createShortlist = async (
  userId: string,
  payload: { name: string; description?: string; coaches?: string[] },
) => {
  const organizationId = await resolveOrganizationId(userId)

  const coachObjectIds = (payload.coaches || []).map(
    id => new Types.ObjectId(id),
  )

  const shortlist = await Shortlist.create({
    organizationId,
    name: payload.name.trim(),
    description: payload.description?.trim(),
    coaches: coachObjectIds,
    createdBy: userId,
  })

  return {
    id: shortlist._id.toString(),
    name: shortlist.name,
    description: shortlist.description,
    count: shortlist.coaches.length,
    createdAt: shortlist.createdAt,
  }
}

const updateShortlist = async (
  userId: string,
  shortlistId: string,
  payload: { name?: string; description?: string },
) => {
  const organizationId = await resolveOrganizationId(userId)

  const updated = await Shortlist.findOneAndUpdate(
    { _id: shortlistId, organizationId },
    { $set: payload },
    { new: true },
  )

  if (!updated) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Shortlist not found')
  }

  return {
    id: updated._id.toString(),
    name: updated.name,
    description: updated.description,
    count: updated.coaches.length,
    updatedAt: updated.updatedAt,
  }
}

const deleteShortlist = async (userId: string, shortlistId: string) => {
  const organizationId = await resolveOrganizationId(userId)

  const deleted = await Shortlist.findOneAndDelete({
    _id: shortlistId,
    organizationId,
  })

  if (!deleted) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Shortlist not found')
  }

  return { message: 'Shortlist deleted successfully' }
}

const addCoachToShortlist = async (
  userId: string,
  shortlistId: string,
  coachId: string,
) => {
  const organizationId = await resolveOrganizationId(userId)

  const coach = await User.findById(coachId).lean()
  if (!coach) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Coach not found')
  }

  const updated = await Shortlist.findOneAndUpdate(
    { _id: shortlistId, organizationId },
    { $addToSet: { coaches: new Types.ObjectId(coachId) } },
    { new: true },
  )

  if (!updated) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Shortlist not found')
  }

  return { message: 'Coach added to shortlist successfully' }
}

const removeCoachFromShortlist = async (
  userId: string,
  shortlistId: string,
  coachId: string,
) => {
  const organizationId = await resolveOrganizationId(userId)

  const updated = await Shortlist.findOneAndUpdate(
    { _id: shortlistId, organizationId },
    { $pull: { coaches: new Types.ObjectId(coachId) } },
    { new: true },
  )

  if (!updated) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Shortlist not found')
  }

  return { message: 'Coach removed from shortlist successfully' }
}

export const ShortlistService = {
  getAllShortlists,
  getShortlistById,
  createShortlist,
  updateShortlist,
  deleteShortlist,
  addCoachToShortlist,
  removeCoachFromShortlist,
}
