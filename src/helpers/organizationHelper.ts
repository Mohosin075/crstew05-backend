import { StatusCodes } from 'http-status-codes'
import ApiError from '../errors/ApiError'
import { User } from '../app/modules/user/user.model'
import { Organization } from '../app/modules/organization/organization.model'
import { Types } from 'mongoose'
import { IUser } from '../app/modules/user/user.interface'
import { IOrganization } from '../app/modules/organization/organization.interface'

/**
 * Reusable helper to resolve the calling user and their associated organization.
 * Checks user.organizationId, owner status, and team membership.
 */
export const resolveUserOrganization = async (
  userId: string,
): Promise<{ user: IUser; org: (IOrganization & { _id: Types.ObjectId }) | null }> => {
  const user = await User.findById(userId).lean()
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
  }

  const org = await Organization.findOne({
    $or: [
      { _id: user.organizationId },
      { owner: new Types.ObjectId(userId) },
      { 'members.user': new Types.ObjectId(userId) },
    ],
  }).lean()

  return {
    user: user as unknown as IUser,
    org: org as unknown as (IOrganization & { _id: Types.ObjectId }) | null,
  }
}

/**
 * Reusable helper that requires the user to belong to an organization,
 * throwing 403 FORBIDDEN if no organization is associated.
 */
export const requireUserOrganization = async (
  userId: string,
): Promise<{ user: IUser; org: IOrganization & { _id: Types.ObjectId } }> => {
  const { user, org } = await resolveUserOrganization(userId)
  if (!org) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      'No organization associated with this account',
    )
  }
  return { user, org }
}

