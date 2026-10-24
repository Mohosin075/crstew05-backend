import { StatusCodes } from 'http-status-codes'
import ApiError from '../../../errors/ApiError'
import { Organization } from './organization.model'
import {
  IOrganization,
  OrgMemberRole,
} from './organization.interface'
import { User } from '../user/user.model'
import { QueryBuilder } from '../../../builder/QueryBuilder'
import crypto from 'crypto'
import { Types } from 'mongoose'

const createOrganization = async (
  userId: string,
  payload: Partial<IOrganization>,
) => {
  const existingOrg = await Organization.findOne({ owner: userId })
  if (existingOrg) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'User already owns an organization',
    )
  }

  const newOrg = await Organization.create({
    ...payload,
    owner: userId,
    members: [
      {
        user: userId,
        role: 'admin',
        joinedAt: new Date(),
        lastActive: new Date(),
      },
    ],
  })

  // Link user to organization
  await User.findByIdAndUpdate(userId, { organizationId: newOrg._id })

  return newOrg
}

const getCurrentOrganization = async (userId: string) => {
  const user = await User.findById(userId).lean()
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
  }

  const query: Record<string, unknown> = user.organizationId
    ? { _id: user.organizationId }
    : {
        $or: [
          { owner: userId },
          { 'members.user': new Types.ObjectId(userId) },
        ],
      }

  const org = await Organization.findOne(query)
    .populate('members.user', 'name fullName email profile')
    .lean()

  if (!org) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'No organization associated with this account',
    )
  }

  return {
    ...org,
    id: org._id.toString(),
  }
}

const updateOrganization = async (
  userId: string,
  payload: Partial<IOrganization>,
) => {
  const org = await Organization.findOne({
    $or: [
      { owner: userId },
      { 'members.user': new Types.ObjectId(userId), 'members.role': 'admin' },
    ],
  })

  if (!org) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      'Only organization admins can update organization settings',
    )
  }

  const updatedOrg = await Organization.findByIdAndUpdate(
    org._id,
    { $set: payload },
    { new: true },
  )

  return updatedOrg
}

const getMembers = async (userId: string) => {
  const org = await Organization.findOne({
    $or: [
      { owner: userId },
      { 'members.user': new Types.ObjectId(userId) },
    ],
  })
    .populate('members.user', 'name fullName email profile lastActive')
    .lean()

  if (!org) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Organization not found')
  }

  return org.members.map((m: any) => {
    const u = m.user || {}
    const fullName = u.name || u.fullName || 'Member'
    const nameParts = fullName.trim().split(' ')
    const initials =
      nameParts.length > 1
        ? `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
        : fullName.substring(0, 2).toUpperCase()

    return {
      id: m._id?.toString(),
      userId: u._id?.toString(),
      organizationId: org._id.toString(),
      name: fullName,
      email: u.email || '',
      role: m.role,
      initials,
      avatarUrl: u.profile || '',
      joinedAt: m.joinedAt,
      lastActive: m.lastActive || u.lastActive,
      isCurrentUser: u._id?.toString() === userId,
    }
  })
}

const inviteMember = async (
  userId: string,
  email: string,
  role: OrgMemberRole,
) => {
  const org = await Organization.findOne({
    $or: [
      { owner: userId },
      { 'members.user': new Types.ObjectId(userId), 'members.role': 'admin' },
    ],
  })

  if (!org) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      'Only organization admins can invite members',
    )
  }

  // Check if already a member
  const existingUser = await User.findOne({ email: email.toLowerCase() })
  if (
    existingUser &&
    org.members.some(
      m => m.user.toString() === existingUser._id.toString(),
    )
  ) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'This user is already a member of your organization',
    )
  }

  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  const inviteItem = {
    email: email.toLowerCase(),
    role,
    invitedBy: new Types.ObjectId(userId),
    sentAt: new Date(),
    expiresAt,
    status: 'pending' as const,
    token,
  }

  org.invites.push(inviteItem as any)
  await org.save()

  const savedInvite = org.invites[org.invites.length - 1]

  return {
    id: savedInvite._id?.toString() || '',
    organizationId: org._id.toString(),
    email: savedInvite.email,
    role: savedInvite.role,
    invitedBy: userId,
    sentAt: savedInvite.sentAt,
    expiresAt: savedInvite.expiresAt,
    status: savedInvite.status,
  }
}

const removeMember = async (userId: string, memberId: string) => {
  const org = await Organization.findOne({
    $or: [
      { owner: userId },
      { 'members.user': new Types.ObjectId(userId), 'members.role': 'admin' },
    ],
  })

  if (!org) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      'Only organization admins can remove members',
    )
  }

  // Prevent removing organization owner
  const targetMember = org.members.find(
    m => m._id?.toString() === memberId || m.user.toString() === memberId,
  )

  if (!targetMember) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Member not found in organization')
  }

  if (targetMember.user.toString() === org.owner.toString()) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Cannot remove the organization owner',
    )
  }

  await Organization.findByIdAndUpdate(org._id, {
    $pull: {
      members: {
        _id: targetMember._id,
      },
    },
  })

  // Clear user's organizationId
  await User.findByIdAndUpdate(targetMember.user, {
    $unset: { organizationId: '' },
  })

  return { message: 'Member removed successfully' }
}

const updateMemberRole = async (
  userId: string,
  memberId: string,
  newRole: OrgMemberRole,
) => {
  const org = await Organization.findOne({
    $or: [
      { owner: userId },
      { 'members.user': new Types.ObjectId(userId), 'members.role': 'admin' },
    ],
  })

  if (!org) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      'Only organization admins can modify member roles',
    )
  }

  const member = org.members.find(
    m => m._id?.toString() === memberId || m.user.toString() === memberId,
  )

  if (!member) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Member not found')
  }

  member.role = newRole
  await org.save()

  return { message: 'Member role updated successfully' }
}

const getAllOrganizations = async (query: Record<string, unknown>) => {
  const orgQuery = new QueryBuilder(Organization.find(), query)
    .search(['name', 'location', 'state', 'school', 'conference', 'description'])
    .filter(['searchTerm', 'sort', 'sortBy', 'sortOrder', 'limit', 'page'])
    .sort()
    .paginate()

  const [data, meta] = await Promise.all([
    orgQuery.modelQuery.populate('owner', 'name email').lean(),
    orgQuery.countTotal(),
  ])

  return {
    meta,
    data,
  }
}

export const OrganizationService = {
  createOrganization,
  getCurrentOrganization,
  updateOrganization,
  getMembers,
  inviteMember,
  removeMember,
  updateMemberRole,
  getAllOrganizations,
}
