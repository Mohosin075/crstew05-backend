import { StatusCodes } from 'http-status-codes'
import ApiError from '../../../errors/ApiError'
import { IUser, IUserFilterables } from './user.interface'
import { Secret } from 'jsonwebtoken'
import { User } from './user.model'
import { Types } from 'mongoose'

import { USER_ROLES, USER_STATUS, VERIFICATION_STATUS } from '../../../enum/user'
import { userSearchableFields } from './user.constants'

import { JwtPayload } from 'jsonwebtoken'
import { paginationHelper } from '../../../helpers/paginationHelper'
import { IPaginationOptions } from '../../../interfaces/pagination'
import { S3Helper } from '../../../helpers/image/s3helper'
import config from '../../../config'
import { jwtHelper } from '../../../helpers/jwtHelper'
import { Chat } from '../chat/chat.model'
import { Message } from '../message/message.model'
import { Support } from '../support/support.model'
import { QueryBuilder } from '../../../builder/QueryBuilder'

const updateProfile = async (user: JwtPayload, payload: Partial<IUser>) => {
  const isUserExist = await User.findOne({
    _id: user.userId,
    status: { $nin: [USER_STATUS.DELETED] },
  })

  if (!isUserExist) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found.')
  }

  // Email (and other account identity fields) must not change via profile update
  const {
    email,
    password,
    role,
    status,
    authentication,
    verified,
    ...safePayload
  } = payload as Partial<IUser> & Record<string, unknown>

  if (email !== undefined) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Email cannot be updated')
  }

  // if (isUserExist.profile) {
  //   const url = new URL(isUserExist.profile)
  //   const key = url.pathname.substring(1)
  //   await S3Helper.deleteFromS3(key)
  // }

  if (safePayload.deviceToken) {
    await User.updateMany(
      { deviceToken: safePayload.deviceToken, _id: { $ne: user.userId } },
      { $unset: { deviceToken: '' } },
    )
  }

  const updatedProfile = await User.findOneAndUpdate(
    { _id: user.userId, status: { $nin: [USER_STATUS.DELETED] } },
    {
      $set: safePayload,
    },
    { new: true },
  )

  if (!updatedProfile) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to update profile.')
  }

  return 'Profile updated successfully.'
}

const createAdmin = async (): Promise<Partial<IUser> | null> => {
  const email = config.super_admin.email?.toLowerCase().trim()
  const name = config.super_admin.name?.trim()
  const password = config.super_admin.password

  if (!email || !password) {
    console.warn(
      '⚠️ SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD not set. Skipping admin creation.',
    )
    return null
  }

  const isAdminExist = await User.findOne({
    email,
    status: { $nin: [USER_STATUS.DELETED] },
  })

  if (isAdminExist) {
    console.log('Admin account already exist, skipping creation.🦥')
    return isAdminExist
  }

  const admin: Partial<IUser> = {
    email,
    name: name || 'Super Admin',
    password,
    role: USER_ROLES.SUPER_ADMIN,
    status: USER_STATUS.ACTIVE,
    verified: true,
    authentication: {
      oneTimeCode: '',
      restrictionLeftAt: null,
      expiresAt: null,
      latestRequestAt: new Date(),
      authType: 'createAccount',
      resetPassword: false,
      wrongLoginAttempts: 0,
    } as any,
  }

  // Use single-document create to trigger pre-save hooks (for password hashing)
  const result = await User.create(admin as any)
  if (!result) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create admin')
  }
  return result.toObject()
}

const getAllUsers = async (
  paginationOptions: IPaginationOptions,
  filterables: IUserFilterables = {},
) => {
  const { searchTerm, role, ...restFilters } =
    filterables as IUserFilterables & {
      role?: string
      status?: string
    }
  const { page, skip, limit, sortBy, sortOrder } =
    paginationHelper.calculatePagination(paginationOptions)

  let whereConditions: any = {}

  const searchConditions: any[] = []
  const filterConditions: any[] = []

  // Search functionality (name/email/phone only)
  if (searchTerm && searchTerm.trim() !== '') {
    searchConditions.push({
      $or: userSearchableFields.map(field => ({
        [field]: {
          $regex: searchTerm.trim(),
          $options: 'i',
        },
      })),
    })
  }

  // Role filter
  if (role) {
    const roleValue = String(role)
    if (roleValue !== 'all') {
      filterConditions.push({ role: roleValue })
    }
  }

  // Status + other filters
  Object.entries(restFilters).forEach(([key, value]) => {
    if (value === undefined || value === '' || value === 'all') return

    if (key === 'status') {
      const mappedStatus = value === 'suspended' ? USER_STATUS.INACTIVE : value
      filterConditions.push({ status: mappedStatus })
      return
    }

    filterConditions.push({ [key]: value })
  })

  // Always exclude deleted users unless explicitly filtering by deleted
  const statusFilter = (restFilters as any).status
  if (statusFilter !== USER_STATUS.DELETED && statusFilter !== 'deleted') {
    filterConditions.push({
      status: { $nin: [USER_STATUS.DELETED, null] },
    })
  }

  // Combine conditions
  if (searchConditions.length > 0 && filterConditions.length > 0) {
    whereConditions = {
      $and: [...searchConditions, ...filterConditions],
    }
  } else if (searchConditions.length > 0) {
    whereConditions = { $and: searchConditions }
  } else if (filterConditions.length > 0) {
    whereConditions = { $and: filterConditions }
  }

  const [users, total] = await Promise.all([
    User.find(whereConditions)
      .skip(skip)
      .limit(limit)
      .sort(sortBy ? { [sortBy]: sortOrder } : { createdAt: -1 })
      .select('-password -authentication -__v')
      .lean(),
    User.countDocuments(whereConditions),
  ])

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data: users,
  }
}

/**
 * Soft-delete + anonymize PII so the real email/phone/appId are freed
 * for re-registration (unique email index).
 */
const buildAnonymizeUpdate = (userId: string) => {
  const id = String(userId)
  return {
    $set: {
      status: USER_STATUS.DELETED,
      email: `deleted+${id}@deleted.local`,
      verified: false,
      authentication: {
        restrictionLeftAt: null,
        resetPassword: false,
        wrongLoginAttempts: 0,
        oneTimeCode: null,
        latestRequestAt: null,
        expiresAt: null,
        requestCount: 0,
      },
    },
    $unset: {
      phone: 1,
      appId: 1,
      provider: 1,
      deviceToken: 1,
      password: 1,
    },
  }
}

const softDeleteAndAnonymizeUser = async (userId: string) => {
  const id = String(userId)
  return User.findOneAndUpdate(
    { _id: id, status: { $nin: [USER_STATUS.DELETED] } },
    buildAnonymizeUpdate(id),
    { new: true },
  )
}

/** Free email on an already-deleted row (legacy soft-deletes that kept the real email). */
const anonymizeDeletedUserById = async (userId: string) => {
  const id = String(userId)
  return User.findByIdAndUpdate(id, buildAnonymizeUpdate(id), { new: true })
}

const deleteUser = async (userId: string): Promise<string> => {
  const isUserExist = await User.findOne({
    _id: userId,
    status: { $nin: [USER_STATUS.DELETED] },
  })
  if (!isUserExist) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found.')
  }

  const deletedUser = await softDeleteAndAnonymizeUser(userId)

  if (!deletedUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to delete user.')
  }

  return 'User deleted successfully.'
}

const deleteProfile = async (
  userId: string,
  password: string,
): Promise<string> => {
  const isUserExist = await User.findOne({
    _id: userId,
    status: { $nin: [USER_STATUS.DELETED] },
  }).select('+password')
  if (!isUserExist) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found.')
  }
  const isPasswordMatched = await User.isPasswordMatched(
    password,
    isUserExist.password,
  )

  if (!isPasswordMatched) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Password is incorrect.')
  }

  const deletedUser = await softDeleteAndAnonymizeUser(userId)

  if (!deletedUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to delete user.')
  }

  return 'User deleted successfully.'
}

const deactivateProfile = async (
  userId: string,
  password: string,
): Promise<string> => {
  const isUserExist = await User.findOne({
    _id: userId,
    status: { $nin: [USER_STATUS.DELETED] },
  }).select('+password')

  if (!isUserExist) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found.')
  }

  const isPasswordMatched = await User.isPasswordMatched(
    password,
    isUserExist.password,
  )

  if (!isPasswordMatched) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Password is incorrect.')
  }

  const deactivatedUser = await User.findOneAndUpdate(
    { _id: userId, status: { $nin: [USER_STATUS.DELETED] } },
    { $set: { status: USER_STATUS.INACTIVE } },
    { new: true },
  )

  if (!deactivatedUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to deactivate user.')
  }

  return 'User deactivated successfully.'
}

const getUserById = async (userId: string): Promise<any> => {
  const isUserExist = await User.findOne({
    _id: userId,
    status: { $nin: [USER_STATUS.DELETED] },
  })
    .select('name fullName profile description isOnline role status createdAt')
    .lean()
  if (!isUserExist) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found.')
  }

  return isUserExist
}

const updateUserStatus = async (userId: string, status: USER_STATUS) => {
  const isUserExist = await User.findOne({
    _id: userId,
    status: { $nin: [USER_STATUS.DELETED] },
  })
  if (!isUserExist) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found.')
  }

  const updatedUser = await User.findOneAndUpdate(
    { _id: userId, status: { $nin: [USER_STATUS.DELETED] } },
    { $set: { status } },
    { new: true },
  )

  if (!updatedUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to update user status.')
  }

  return 'User status updated successfully.'
}

export const getProfile = async (user: JwtPayload) => {
  // --- Fetch user ---
  const isUserExist = await User.findOne({
    _id: user.userId,
    status: { $nin: [USER_STATUS.DELETED] },
  }).select('-authentication -password -__v')

  if (!isUserExist) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found.')
  }

  return isUserExist
}

const downloadAccountData = async (userId: string) => {
  const userObjectId = new Types.ObjectId(userId)

  const profile = await User.findOne({
    _id: userObjectId,
    status: { $nin: [USER_STATUS.DELETED] },
  })
    .select('-password -authentication -__v')
    .lean()

  if (!profile) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found.')
  }

  const [chats, supportTickets] = await Promise.all([
    Chat.find({ participants: userObjectId }).lean(),
    Support.find({
      $or: [{ userId: userObjectId }, { reportedUser: userObjectId }],
    }).lean(),
  ])

  const chatIds = chats.map((chat: any) => chat._id)
  const messages = chatIds.length
    ? await Message.find({ chatId: { $in: chatIds } })
        .sort({ createdAt: 1 })
        .lean()
    : []

  const messagesByChatId = messages.reduce<Record<string, typeof messages>>(
    (acc, message) => {
      const key = String(message.chatId)
      if (!acc[key]) acc[key] = []
      acc[key].push(message)
      return acc
    },
    {},
  )

  return {
    exportedAt: new Date().toISOString(),
    exportVersion: '1.0',
    accountId: userId,
    role: profile.role ?? USER_ROLES.USER,
    profile,
    chats: chats.map((chat: any) => ({
      ...chat,
      messages: messagesByChatId[String(chat._id)] ?? [],
    })),
    supportTickets,
  }
}

const searchCoaches = async (query: Record<string, unknown>) => {
  const baseFilter: Record<string, unknown> = {
    role: USER_ROLES.COACH,
    status: { $nin: [USER_STATUS.DELETED] },
  }

  if (query.verifiedOnly === 'true' || query.verifiedOnly === true) {
    baseFilter.$or = [
      { verified: true },
      { identityVerification: VERIFICATION_STATUS.VERIFIED },
    ]
  }

  if (query.positions) {
    const positions = Array.isArray(query.positions)
      ? query.positions
      : [query.positions]
    baseFilter.$or = [
      { currentRole: { $in: positions } },
      { 'careerPreferences.desiredPositions': { $in: positions } },
    ]
  }

  if (query.levels) {
    const levels = Array.isArray(query.levels) ? query.levels : [query.levels]
    baseFilter.$or = [
      { highestLevel: { $in: levels } },
      { 'experienceList.level': { $in: levels } },
    ]
  }

  if (query.states) {
    const states = Array.isArray(query.states) ? query.states : [query.states]
    baseFilter.$or = [
      { 'address.city': { $in: states } },
      { 'recruitingFootprint.mapStates': { $in: states } },
    ]
  }

  if (query.careerStatuses) {
    const statuses = Array.isArray(query.careerStatuses)
      ? query.careerStatuses
      : [query.careerStatuses]
    baseFilter.careerStatus = { $in: statuses }
  }

  // Experience ranges (e.g., '0-2', '3-5', '6-10', '10+')
  if (query.experienceRanges) {
    const ranges = Array.isArray(query.experienceRanges)
      ? query.experienceRanges
      : [query.experienceRanges]

    const rangeConditions = ranges.map(range => {
      if (range === '0-2') return { yearsExperience: { $gte: 0, $lte: 2 } }
      if (range === '3-5') return { yearsExperience: { $gte: 3, $lte: 5 } }
      if (range === '6-10') return { yearsExperience: { $gte: 6, $lte: 10 } }
      if (range === '10+' || range === '10-99') return { yearsExperience: { $gte: 10 } }
      return {}
    }).filter(c => Object.keys(c).length > 0)

    if (rangeConditions.length > 0) {
      if (baseFilter.$or) {
        baseFilter.$and = [{ $or: baseFilter.$or }, { $or: rangeConditions }]
        delete baseFilter.$or
      } else {
        baseFilter.$or = rangeConditions
      }
    }
  }

  // Coaching schemes (Offensive / Defensive systems: Spread, Air Raid, 4-2-5, etc.)
  if (query.coachingSchemes) {
    const schemes = Array.isArray(query.coachingSchemes)
      ? query.coachingSchemes
      : [query.coachingSchemes]
    baseFilter['expertise.schemes'] = { $in: schemes }
  }

  // Certifications
  if (query.certifications) {
    const certs = Array.isArray(query.certifications)
      ? query.certifications
      : [query.certifications]
    baseFilter['credentialsList.name'] = { $in: certs }
  }

  // Dashboard sortBy mapping: 'match_score' | 'experience' | 'name' | 'recent'
  const customQuery = { ...query }
  if (query.sortBy === 'match_score') {
    customQuery.sortBy = 'profileCompletionPercent'
    customQuery.sortOrder = 'desc'
  } else if (query.sortBy === 'experience') {
    customQuery.sortBy = 'yearsExperience'
    customQuery.sortOrder = 'desc'
  } else if (query.sortBy === 'name') {
    customQuery.sortBy = 'name'
    customQuery.sortOrder = 'asc'
  } else if (query.sortBy === 'recent') {
    customQuery.sortBy = 'createdAt'
    customQuery.sortOrder = 'desc'
  }

  const coachQuery = new QueryBuilder(User.find(baseFilter), customQuery)
    .search([
      'name',
      'fullName',
      'headline',
      'currentRole',
      'currentOrganization',
      'expertise.primary',
    ])
    .filter([
      'positions',
      'levels',
      'states',
      'careerStatuses',
      'experienceRanges',
      'coachingSchemes',
      'certifications',
      'verifiedOnly',
      'searchTerm',
      'sort',
      'sortBy',
      'sortOrder',
      'limit',
      'page',
    ])
    .sort()
    .paginate()

  const [data, meta] = await Promise.all([
    coachQuery.modelQuery.select('-password -authentication -__v').lean(),
    coachQuery.countTotal(),
  ])

  const formattedCoaches = data.map((user: any) => {
    let matchScore = 75
    if (
      user.verified ||
      user.identityVerification === VERIFICATION_STATUS.VERIFIED
    ) {
      matchScore += 10
    }
    if (user.isPro) matchScore += 5
    if (user.experienceList?.length > 2) matchScore += 5
    if (user.profileCompletionPercent > 70) matchScore += 5
    matchScore = Math.min(matchScore, 98)

    return {
      id: user._id.toString(),
      name: user.name || user.fullName || 'Unnamed Coach',
      avatarUrl: user.profile || '',
      isVerified: !!(
        user.verified ||
        user.identityVerification === VERIFICATION_STATUS.VERIFIED
      ),
      position: user.currentRole || 'Coach',
      university: user.currentOrganization || '',
      level: user.highestLevel || 'FBS',
      experienceYears:
        user.yearsExperience ||
        (user.experienceList?.length ? user.experienceList.length * 2 : 0),
      location: user.address?.city
        ? `${user.address.city}, ${user.address.country || 'USA'}`
        : user.address?.country || 'USA',
      footprint: user.recruitingFootprint?.mapStates || [],
      careerStatus: user.careerStatus || 'actively_looking',
      matchScore,
    }
  })

  return {
    meta,
    data: formattedCoaches,
  }
}

const getCoachById = async (coachId: string) => {
  const user = await User.findOne({
    _id: coachId,
    role: USER_ROLES.COACH,
    status: { $nin: [USER_STATUS.DELETED] },
  })
    .select('-password -authentication -__v')
    .lean()

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Coach profile not found.')
  }

  const expList = user.experienceList || []
  const primaryExpertise = user.expertise?.primary || []

  return {
    id: user._id.toString(),
    name: user.name || user.fullName || '',
    avatarUrl: user.profile || '',
    identityVerification:
      user.identityVerification || VERIFICATION_STATUS.UNVERIFIED,
    experienceVerification:
      user.experienceVerification || VERIFICATION_STATUS.UNVERIFIED,
    isProCertified: !!user.isPro,
    currentRole: user.currentRole || 'Coach',
    currentOrganization: user.currentOrganization || '',
    location: user.address?.city
      ? `${user.address.city}, ${user.address.country || 'USA'}`
      : '',
    careerStatus: user.careerStatus || 'actively_looking',
    headline: user.headline || '',
    bio: user.bio || '',
    coachingPhilosophy: user.coachingPhilosophy || '',
    statSummary: {
      yearsExperience: user.yearsExperience || expList.length * 2,
      positionGroupsCount: primaryExpertise.length || 1,
      positionGroupsLabel: primaryExpertise.join(', ') || 'General',
      highestLevel: user.highestLevel || 'FBS',
      highestLevelSub: user.currentOrganization || '',
      placementsCount: expList.length,
      placementsLabel: 'Verified Stops',
    },
    experienceList: expList,
    careerHistoryList: expList,
    educationList: user.educationList || [],
    credentials: (user.credentialsList || []).map((c: any) => ({
      id: c._id?.toString(),
      name: c.name,
      issuingBody: c.issuingBody,
      verificationStatus: c.verificationStatus,
      documentUrl: c.documentUrl,
    })),
    expertise: user.expertise || { primary: [], secondary: [], schemes: [] },
    recruitingFootprint: user.recruitingFootprint || {
      description: '',
      mapStates: [],
      topStates: [],
    },
    careerPreferences: user.careerPreferences || {
      desiredPositions: [],
      desiredLevels: [],
      preferredRegions: [],
      isOpenToRelocation: true,
    },
    connectionsCount: 0,
    profileCompletionPercent: user.profileCompletionPercent || 60,
    profileVisibility: user.profileVisibility || 'public',
    allowsRecruiterContact: user.allowsRecruiterContact ?? true,
  }
}

const getRecommendedCoaches = async (limit: number = 5) => {
  const coaches = await User.find({
    role: USER_ROLES.COACH,
    status: USER_STATUS.ACTIVE,
  })
    .sort({
      verified: -1,
      isPro: -1,
      profileCompletionPercent: -1,
      createdAt: -1,
    })
    .limit(limit)
    .select('-password -authentication -__v')
    .lean()

  return coaches.map((c: any) => ({
    id: c._id.toString(),
    name: c.name || c.fullName || '',
    avatarUrl: c.profile || '',
    isVerified: !!(
      c.verified || c.identityVerification === VERIFICATION_STATUS.VERIFIED
    ),
    position: c.currentRole || 'Coach',
    currentOrganization: c.currentOrganization || '',
    experienceYears: c.yearsExperience || 0,
    matchScore: 90,
  }))
}

const toggleSaveCoach = async (
  userId: string,
  coachId: string,
  action: 'save' | 'unsave',
) => {
  const coachObjectId = new Types.ObjectId(coachId)
  const updateOperation =
    action === 'save'
      ? { $addToSet: { savedCoaches: coachObjectId } }
      : { $pull: { savedCoaches: coachObjectId } }

  await User.findByIdAndUpdate(userId, updateOperation)
  return {
    message:
      action === 'save'
        ? 'Coach saved successfully'
        : 'Coach unsaved successfully',
  }
}

const getSavedCoaches = async (userId: string) => {
  const user = await User.findById(userId)
    .populate({
      path: 'savedCoaches',
      select: '-password -authentication -__v',
    })
    .lean()

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
  }

  const savedList = (user.savedCoaches || []) as any[]
  return savedList.map(c => ({
    id: c._id.toString(),
    name: c.name || c.fullName || '',
    avatarUrl: c.profile || '',
    isVerified: !!(
      c.verified || c.identityVerification === VERIFICATION_STATUS.VERIFIED
    ),
    currentRole: c.currentRole || 'Coach',
    organization: c.currentOrganization || '',
    level: c.highestLevel || 'FBS',
    location: c.address?.city || '',
    matchScore: 92,
  }))
}

export const UserServices = {
  updateProfile,
  createAdmin,
  getAllUsers,
  deleteUser,
  getUserById,
  updateUserStatus,
  getProfile,
  deleteProfile,
  deactivateProfile,
  downloadAccountData,
  softDeleteAndAnonymizeUser,
  anonymizeDeletedUserById,
  searchCoaches,
  getCoachById,
  getRecommendedCoaches,
  toggleSaveCoach,
  getSavedCoaches,
}

