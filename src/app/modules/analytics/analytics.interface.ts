import { Model, Types } from 'mongoose'

export type AnalyticsEventType =
  | 'account_created'
  | 'profile_started'
  | 'profile_completed'
  | 'email_verified'
  | 'identity_verified'
  | 'first_connection'
  | 'first_opportunity_view'
  | 'first_express_interest'
  | 'first_message'
  | 'subscription_started'
  | 'coach_profile_viewed'
  | 'opportunity_viewed'
  | 'coach_saved'
  | 'coach_searched'
  | 'pipeline_stage_changed'
  | 'opportunity_posted'
  | 'message_sent'
  | 'referral_sent'
  | 'referral_converted'

export interface IAnalyticsEvent {
  _id: Types.ObjectId
  userId: Types.ObjectId
  organizationId?: Types.ObjectId
  eventType: AnalyticsEventType
  entityId?: string
  entityType?: string
  metadata?: Record<string, unknown>
  timestamp: Date
}

export interface IOrgAnalyticsSummary {
  openRoles: number
  totalCandidates: number
  activeInPipeline: number
  hiresThisYear: number
  profileViewsThisMonth: number
  messagesThisMonth: number
  expressInterestsThisMonth: number
  searchesThisMonth: number
}

export type AnalyticsEventModel = Model<IAnalyticsEvent>
