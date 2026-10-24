import {
  BILLING_CYCLE,
  SUBSCRIPTION_PLAN,
  SUBSCRIPTION_STATUS,
} from '../../../enum/subscription'

export { SUBSCRIPTION_PLAN as SubscriptionPlan, SUBSCRIPTION_STATUS as SubscriptionStatus }

export interface ISubscription {
  id: string
  plan: SUBSCRIPTION_PLAN
  status: SUBSCRIPTION_STATUS
  price: number
  billingCycle: BILLING_CYCLE
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
  isFounding?: boolean
  entitlements: IEntitlements
}

export interface IEntitlements {
  canSearchCoaches: boolean
  canViewFullProfiles: boolean
  coachAccessLevel: 'none' | 'limited' | 'full'
  canMessageCoaches: boolean
  canSaveCoaches: boolean
  maxShortlists: number
  canViewPipeline: boolean
  canManagePipeline: boolean
  canPostOpportunities: boolean
  maxActiveOpportunities: number
  featuredJobsAllowed: boolean
  canViewAnalytics: boolean
  canAddTeamMembers: boolean
  maxTeamMembers: number
  canViewMatchScores: boolean
  canUseAdvancedSearch: boolean
}
