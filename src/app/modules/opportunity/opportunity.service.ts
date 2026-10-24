import { StatusCodes } from 'http-status-codes'
import ApiError from '../../../errors/ApiError'
import { Opportunity } from './opportunity.model'
import { IOpportunity } from './opportunity.interface'
import { Organization } from '../organization/organization.model'
import { User } from '../user/user.model'
import { QueryBuilder } from '../../../builder/QueryBuilder'
import { USER_ROLES } from '../../../enum/user'
import {
  requireUserOrganization,
  resolveUserOrganization,
} from '../../../helpers/organizationHelper'
import { Types } from 'mongoose'


const createOpportunity = async (
  userId: string,
  userRole: string,
  payload: Partial<IOpportunity>,
) => {
  const { org } = await requireUserOrganization(userId)

  const opportunity = await Opportunity.create({
    ...payload,
    organizationId: org._id,
    organizationName: org.name,
    organizationLogoUrl: org.logoUrl || '',
    postedBy: userId,
    postedByRole: (userRole as USER_ROLES) || org.role,
    postedAt: new Date(),
  })

  // Increment active opportunities on org
  await Organization.findByIdAndUpdate(org._id, {
    $inc: { activeOpportunitiesCount: 1 },
  })

  return {
    ...opportunity.toObject(),
    id: opportunity._id.toString(),
  }
}

const getAllOpportunities = async (query: Record<string, unknown>) => {
  const baseFilter: Record<string, unknown> = {}

  if (query.positions) {
    const positions = Array.isArray(query.positions)
      ? query.positions
      : [query.positions]
    baseFilter.position = { $in: positions }
  }

  if (query.levels) {
    const levels = Array.isArray(query.levels) ? query.levels : [query.levels]
    baseFilter.level = { $in: levels }
  }

  if (query.types) {
    const types = Array.isArray(query.types) ? query.types : [query.types]
    baseFilter.type = { $in: types }
  }

  if (query.locations) {
    const locations = Array.isArray(query.locations)
      ? query.locations
      : [query.locations]
    baseFilter.location = { $in: locations }
  }

  if (query.statuses) {
    const statuses = Array.isArray(query.statuses)
      ? query.statuses
      : [query.statuses]
    baseFilter.status = { $in: statuses }
  } else if (!query.status) {
    // By default, only active opportunities
    baseFilter.status = 'active'
  }

  if (query.featuredOnly === 'true' || query.featuredOnly === true) {
    baseFilter.isFeatured = true
  }

  if (query.organizationId) {
    baseFilter.organizationId = query.organizationId
  }

  const oppQuery = new QueryBuilder(Opportunity.find(baseFilter), query)
    .search(['title', 'description', 'position', 'organizationName', 'location'])
    .filter([
      'positions',
      'levels',
      'types',
      'locations',
      'statuses',
      'featuredOnly',
      'organizationId',
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
    oppQuery.modelQuery.lean(),
    oppQuery.countTotal(),
  ])

  const formattedData = data.map((opp: any) => ({
    ...opp,
    id: opp._id.toString(),
  }))

  return {
    meta,
    data: formattedData,
  }
}

const getOpportunityById = async (id: string) => {
  const opportunity = await Opportunity.findByIdAndUpdate(
    id,
    { $inc: { viewCount: 1 } },
    { new: true },
  ).lean()

  if (!opportunity) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Opportunity not found')
  }

  return {
    ...opportunity,
    id: opportunity._id.toString(),
  }
}

const verifyOpportunityAccess = async (
  opportunityOrgId: string | Types.ObjectId,
  userId: string,
) => {
  const user = await User.findById(userId).lean()
  if (user?.role === USER_ROLES.ADMIN || user?.role === USER_ROLES.SUPER_ADMIN) {
    return
  }
  const { org } = await resolveUserOrganization(userId)
  if (!org || org._id.toString() !== opportunityOrgId.toString()) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      'You do not have permission to manage this opportunity',
    )
  }
}

const updateOpportunity = async (
  id: string,
  userId: string,
  payload: Partial<IOpportunity>,
) => {
  const opportunity = await Opportunity.findById(id)
  if (!opportunity) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Opportunity not found')
  }

  await verifyOpportunityAccess(opportunity.organizationId, userId)

  const updatedOpp = await Opportunity.findByIdAndUpdate(
    id,
    { $set: payload },
    { new: true },
  ).lean()

  return {
    ...updatedOpp,
    id: updatedOpp?._id.toString(),
  }
}

const closeOpportunity = async (id: string, userId: string) => {
  const opportunity = await Opportunity.findById(id)
  if (!opportunity) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Opportunity not found')
  }

  await verifyOpportunityAccess(opportunity.organizationId, userId)

  opportunity.status = 'closed'
  opportunity.closingAt = new Date()
  await opportunity.save()

  // Decrement active opportunities on org
  await Organization.findByIdAndUpdate(opportunity.organizationId, {
    $inc: { activeOpportunitiesCount: -1 },
  })

  return { message: 'Opportunity closed successfully' }
}

export const OpportunityService = {
  createOpportunity,
  getAllOpportunities,
  getOpportunityById,
  updateOpportunity,
  closeOpportunity,
}
