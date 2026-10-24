import { Model, Types } from 'mongoose'
import { USER_ROLES } from '../../../enum/user'

export type OpportunityStatus =
  | 'draft'
  | 'active'
  | 'paused'
  | 'closed'
  | 'filled'

export type OpportunityType =
  | 'full_time'
  | 'part_time'
  | 'contract'
  | 'volunteer'
  | 'clinic'
  | 'camp'
  | 'event'

export interface IOpportunity {
  _id: Types.ObjectId
  title: string
  organizationId: Types.ObjectId
  organizationName: string
  organizationLogoUrl?: string

  position: string
  level: string
  type: OpportunityType
  location: string
  isRemote: boolean

  description: string
  requirements: string[]
  preferredQualifications?: string[]

  status: OpportunityStatus
  isFeatured: boolean
  isSponsored: boolean
  isUrgent: boolean

  postedAt: Date
  closingAt?: Date
  filledAt?: Date

  postedByRole: USER_ROLES
  postedBy: Types.ObjectId

  viewCount: number
  expressInterestCount: number
  applicationCount: number

  createdAt: Date
  updatedAt: Date
}

export type OpportunityModel = Model<IOpportunity>
