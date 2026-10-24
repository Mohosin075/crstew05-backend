import { Model, Types } from 'mongoose'
import { USER_ROLES, VERIFICATION_STATUS } from '../../../enum/user'

export type OrganizationType =
  | 'collegiate_program'
  | 'professional_team'
  | 'recruiting_agency'
  | 'organization'
  | 'high_school'

export type OrgMemberRole = 'admin' | 'recruiter' | 'staff' | 'read_only'

export interface IOrganizationMember {
  _id?: Types.ObjectId
  user: Types.ObjectId
  role: OrgMemberRole
  joinedAt: Date
  lastActive?: Date
}

export interface IOrgInvite {
  _id?: Types.ObjectId
  email: string
  role: OrgMemberRole
  invitedBy: Types.ObjectId
  sentAt: Date
  expiresAt: Date
  status: 'pending' | 'accepted' | 'expired'
  token: string
}


export interface IOrganization {
  _id: Types.ObjectId
  name: string
  type: OrganizationType
  role: USER_ROLES // The role this org maps to (COLLEGIATE, TEAM, AGENCY, ORGANIZATION)
  logoUrl?: string
  website?: string
  location: string
  state: string
  description?: string

  verificationStatus: VERIFICATION_STATUS
  isVerified: boolean
  isFounding: boolean // logic.txt §8: Founding Organization — FREE for 12 months

  subscription: {
    plan: 'coach_free' | 'coach_pro' | 'org_basic' | 'org_pro' | 'enterprise'
    status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'founding'
    currentPeriodEnd?: Date
  }

  // Role-specific extensions
  school?: string
  conference?: string
  division?: 'FBS' | 'FCS' | 'D2' | 'D3' | 'NAIA' | 'JUCO'
  sports?: string[]
  league?: string // NFL, CFL, etc.
  city?: string
  specializations?: string[]
  activeSearchCount?: number

  owner: Types.ObjectId
  members: IOrganizationMember[]
  invites: IOrgInvite[]

  activeOpportunitiesCount: number
  totalHiresCount: number

  createdAt: Date
  updatedAt: Date
}

export type OrganizationModel = Model<IOrganization>
