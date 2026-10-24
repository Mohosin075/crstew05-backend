import { StatusCodes } from 'http-status-codes'
import ApiError from '../../../errors/ApiError'
import { IUser, IUserFilterables } from './user.interface'
import { Secret } from 'jsonwebtoken'
import { User } from './user.model'
import { Types } from 'mongoose'

import { USER_ROLES, USER_STATUS } from '../../../enum/user'
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
}
