import { Model, Types } from 'mongoose'
import { CAREER_STATUS, USER_ROLES, USER_STATUS, VERIFICATION_STATUS } from '../../../enum/user'

export interface IUserFilterables {
  searchTerm?: string
  date?: Date
  role?: USER_ROLES
  name?: string
  email?: string
  position?: string
  level?: string
  state?: string
  careerStatus?: CAREER_STATUS
  verifiedOnly?: boolean
  isPro?: boolean
}

// ------------------ SUB-TYPES ------------------
export type IAuthentication = {
  restrictionLeftAt: Date | null
  resetPassword: boolean
  wrongLoginAttempts: number
  passwordChangedAt?: Date
  oneTimeCode: string
  latestRequestAt: Date
  expiresAt?: Date
  requestCount?: number
  authType?: 'createAccount' | 'resetPassword'
}

export type IAddress = {
  city?: string
  postalCode?: string
  country?: string
  permanentAddress?: string
  presentAddress?: string
}

export type Point = {
  type: 'Point'
  coordinates: [number, number] // [longitude, latitude]
  address?: string[]
}

export interface ICoachExperience {
  role: string
  organization: string
  level: string
  startYear: number
  endYear?: number
  isCurrentRole: boolean
  highlights?: string[]
  divisionBadge?: string
}

export interface ICoachEducation {
  degree: string
  institution: string
  year: string
}

export interface ICoachCredential {
  name: string
  issuingBody?: string
  verificationStatus: VERIFICATION_STATUS
  documentUrl?: string
}

export interface ICoachExpertise {
  primary: string[]
  secondary: string[]
  schemes: string[]
}

export interface IRecruitingFootprintState {
  state: string
  level: 'High' | 'Med' | 'Low'
  percentage: number
}

export interface IRecruitingFootprint {
  description?: string
  mapStates: string[]
  topStates: IRecruitingFootprintState[]
}

export interface ICareerPreferences {
  desiredPositions: string[]
  desiredLevels: string[]
  preferredRegions: string[]
  isOpenToRelocation: boolean
  notes?: string
}

// ------------------ USER TYPE ------------------
export interface IUser {
  _id: Types.ObjectId
  name?: string
  fullName?: string
  email?: string
  profile?: string
  phone?: string
  description?: string

  status: USER_STATUS // standardize statuses
  verified: boolean
  address?: IAddress
  location: Point
  password: string
  role: USER_ROLES
  appId?: string
  provider?: string
  deviceToken?: string
  timezone: string
  subscribe: boolean
  isOnboardingComplete: boolean
  stripeCustomerId?: string
  stripeConnectedAccountId?: string
  isStripeConnected?: boolean
  subscriptionStatus?: string
  subscriptionTier?: string
  trialUsed?: boolean
  subscriptionExpiresAt?: Date
  isOnline: boolean
  lastActive: Date

  // --- COACH SPECIFIC FIELDS (Production Grade) ---
  headline?: string
  bio?: string
  coachingPhilosophy?: string
  currentRole?: string
  currentOrganization?: string
  highestLevel?: string
  yearsExperience?: number
  careerStatus?: CAREER_STATUS
  isPro?: boolean
  isProCertified?: boolean
  identityVerification?: VERIFICATION_STATUS
  experienceVerification?: VERIFICATION_STATUS
  credentialsVerification?: VERIFICATION_STATUS
  profileCompletionPercent?: number
  profileProgress?: number

  expertise?: ICoachExpertise
  careerPreferences?: ICareerPreferences
  recruitingFootprint?: IRecruitingFootprint
  experienceList?: ICoachExperience[]
  educationList?: ICoachEducation[]
  credentialsList?: ICoachCredential[]

  // Privacy & Contact controls
  allowsRecruiterContact?: boolean
  profileVisibility?: 'public' | 'network_only' | 'private'
  resumeUrl?: string

  // Organization linkage & recruitment bookmarks
  organizationId?: Types.ObjectId
  savedCoaches?: Types.ObjectId[]

  settings?: {
    pushNotification?: boolean
    emailNotification?: boolean
    smsNotification?: boolean
    locationService?: boolean
    profileStatus: 'public' | 'private'
    dndMode?: boolean
    quietHoursEnabled?: boolean
    quietHoursStart?: string
    quietHoursEnd?: string
    disabledCategories?: string[]
  }

  authentication: IAuthentication
  createdAt: Date
  updatedAt: Date
}

// ------------------ MODEL ------------------
export type UserModel = Model<IUser> & {
  isPasswordMatched(
    givenPassword: string,
    savedPassword: string,
  ): Promise<boolean>
}

