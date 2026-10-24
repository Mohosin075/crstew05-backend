import { StatusCodes } from 'http-status-codes'
import ApiError from '../../../errors/ApiError'
import {
  IEntitlements,
  ISubscription,
} from './subscription.interface'
import {
  BILLING_CYCLE,
  SUBSCRIPTION_PLAN,
  SUBSCRIPTION_STATUS,
} from '../../../enum/subscription'
import { SubscriptionModel } from './subscription.model'
import { User } from '../user/user.model'
import { Organization } from '../organization/organization.model'
import { USER_ROLES } from '../../../enum/user'
import config from '../../../config'
import Stripe from 'stripe'
import { Types } from 'mongoose'

const stripe = config.stripe.stripeSecretKey
  ? new Stripe(config.stripe.stripeSecretKey, {
      apiVersion: '2026-03-25.acacia' as any,
    })
  : null

const PLAN_PRICING: Record<SUBSCRIPTION_PLAN, number> = {
  [SUBSCRIPTION_PLAN.FREE]: 0,
  [SUBSCRIPTION_PLAN.COACH_PRO]: 19.88,
  [SUBSCRIPTION_PLAN.ORG_BASIC]: 249.0,
  [SUBSCRIPTION_PLAN.ORG_PRO]: 499.0,
  [SUBSCRIPTION_PLAN.ENTERPRISE]: 999.0,
}

const deriveEntitlements = (plan: SUBSCRIPTION_PLAN): IEntitlements => {
  switch (plan) {
    case SUBSCRIPTION_PLAN.ORG_PRO:
    case SUBSCRIPTION_PLAN.ENTERPRISE:
      return {
        canSearchCoaches: true,
        canViewFullProfiles: true,
        coachAccessLevel: 'full',
        canMessageCoaches: true,
        canSaveCoaches: true,
        maxShortlists: 50,
        canViewPipeline: true,
        canManagePipeline: true,
        canPostOpportunities: true,
        maxActiveOpportunities: 100,
        featuredJobsAllowed: true,
        canViewAnalytics: true,
        canAddTeamMembers: true,
        maxTeamMembers: 20,
        canViewMatchScores: true,
        canUseAdvancedSearch: true,
      }
    case SUBSCRIPTION_PLAN.ORG_BASIC:
      return {
        canSearchCoaches: true,
        canViewFullProfiles: true,
        coachAccessLevel: 'full',
        canMessageCoaches: true,
        canSaveCoaches: true,
        maxShortlists: 10,
        canViewPipeline: true,
        canManagePipeline: true,
        canPostOpportunities: true,
        maxActiveOpportunities: 5,
        featuredJobsAllowed: false,
        canViewAnalytics: false,
        canAddTeamMembers: true,
        maxTeamMembers: 3,
        canViewMatchScores: true,
        canUseAdvancedSearch: true,
      }
    case SUBSCRIPTION_PLAN.COACH_PRO:
      return {
        canSearchCoaches: true,
        canViewFullProfiles: true,
        coachAccessLevel: 'full',
        canMessageCoaches: true,
        canSaveCoaches: true,
        maxShortlists: 5,
        canViewPipeline: false,
        canManagePipeline: false,
        canPostOpportunities: false,
        maxActiveOpportunities: 0,
        featuredJobsAllowed: false,
        canViewAnalytics: false,
        canAddTeamMembers: false,
        maxTeamMembers: 1,
        canViewMatchScores: true,
        canUseAdvancedSearch: true,
      }
    default:
      return {
        canSearchCoaches: true,
        canViewFullProfiles: false,
        coachAccessLevel: 'limited',
        canMessageCoaches: false,
        canSaveCoaches: false,
        maxShortlists: 1,
        canViewPipeline: false,
        canManagePipeline: false,
        canPostOpportunities: true,
        maxActiveOpportunities: 1,
        featuredJobsAllowed: false,
        canViewAnalytics: false,
        canAddTeamMembers: false,
        maxTeamMembers: 1,
        canViewMatchScores: false,
        canUseAdvancedSearch: false,
      }
  }
}

const getCurrentSubscription = async (userId: string): Promise<ISubscription> => {
  const user = await User.findById(userId).lean()
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
  }

  const isOrgRole = [
    USER_ROLES.COLLEGIATE,
    USER_ROLES.TEAM,
    USER_ROLES.AGENCY,
    USER_ROLES.ORGANIZATION,
  ].includes(user.role)

  const subscriberType = isOrgRole && user.organizationId ? 'organization' : 'user'
  const subscriberId =
    subscriberType === 'organization' ? user.organizationId! : user._id

  let subDoc = await SubscriptionModel.findOne({
    subscriberId,
    subscriberType,
  })

  // If no subscription record exists yet, initialize a default record
  if (!subDoc) {
    const defaultPlan =
      subscriberType === 'organization'
        ? SUBSCRIPTION_PLAN.ORG_BASIC
        : user.isPro
        ? SUBSCRIPTION_PLAN.COACH_PRO
        : SUBSCRIPTION_PLAN.FREE

    subDoc = await SubscriptionModel.create({
      subscriberType,
      subscriberId,
      plan: defaultPlan,
      status: SUBSCRIPTION_STATUS.ACTIVE,
      price: PLAN_PRICING[defaultPlan],
      currency: 'usd',
      billingCycle: BILLING_CYCLE.MONTHLY,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: false,
      isFounding: subscriberType === 'organization',
      history: [
        {
          action: 'initialized',
          plan: defaultPlan,
          status: SUBSCRIPTION_STATUS.ACTIVE,
          timestamp: new Date(),
          note: 'Subscription record initialized',
        },
      ],
    })
  }

  return {
    id: subDoc._id.toString(),
    plan: subDoc.plan,
    status: subDoc.status,
    price: subDoc.price,
    billingCycle: subDoc.billingCycle,
    currentPeriodEnd: subDoc.currentPeriodEnd,
    cancelAtPeriodEnd: subDoc.cancelAtPeriodEnd,
    isFounding: subDoc.isFounding,
    entitlements: deriveEntitlements(subDoc.plan),
  }
}

const changePlan = async (
  userId: string,
  newPlan: SUBSCRIPTION_PLAN,
  billingCycle: BILLING_CYCLE = BILLING_CYCLE.MONTHLY,
): Promise<ISubscription> => {
  const user = await User.findById(userId)
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
  }

  const isOrgRole = [
    USER_ROLES.COLLEGIATE,
    USER_ROLES.TEAM,
    USER_ROLES.AGENCY,
    USER_ROLES.ORGANIZATION,
  ].includes(user.role)

  const subscriberType = isOrgRole && user.organizationId ? 'organization' : 'user'
  const subscriberId =
    subscriberType === 'organization' ? user.organizationId! : user._id

  const newPrice = PLAN_PRICING[newPlan] || 0
  const nextPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

  // Atomic upsert on dedicated SubscriptionModel
  const subDoc = await SubscriptionModel.findOneAndUpdate(
    { subscriberId, subscriberType },
    {
      $set: {
        plan: newPlan,
        status: SUBSCRIPTION_STATUS.ACTIVE,
        price: newPrice,
        billingCycle,
        currentPeriodStart: new Date(),
        currentPeriodEnd: nextPeriodEnd,
        cancelAtPeriodEnd: false,
      },
      $push: {
        history: {
          action: 'plan_changed',
          plan: newPlan,
          status: SUBSCRIPTION_STATUS.ACTIVE,
          timestamp: new Date(),
          note: `Plan changed to ${newPlan}`,
        },
      },
    },
    { new: true, upsert: true },
  )

  // Synchronize User or Organization model
  if (subscriberType === 'user') {
    user.isPro = newPlan === SUBSCRIPTION_PLAN.COACH_PRO
    user.subscriptionTier = newPlan
    user.subscriptionStatus = SUBSCRIPTION_STATUS.ACTIVE
    user.subscriptionExpiresAt = nextPeriodEnd
    await user.save()
  } else {
    await Organization.findByIdAndUpdate(subscriberId, {
      'subscription.plan': newPlan,
      'subscription.status': SUBSCRIPTION_STATUS.ACTIVE,
      'subscription.currentPeriodEnd': nextPeriodEnd,
    })
  }

  return {
    id: subDoc._id.toString(),
    plan: subDoc.plan,
    status: subDoc.status,
    price: subDoc.price,
    billingCycle: subDoc.billingCycle,
    currentPeriodEnd: subDoc.currentPeriodEnd,
    cancelAtPeriodEnd: subDoc.cancelAtPeriodEnd,
    isFounding: subDoc.isFounding,
    entitlements: deriveEntitlements(subDoc.plan),
  }
}

const cancelSubscription = async (userId: string) => {
  const user = await User.findById(userId)
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
  }

  const isOrgRole = [
    USER_ROLES.COLLEGIATE,
    USER_ROLES.TEAM,
    USER_ROLES.AGENCY,
    USER_ROLES.ORGANIZATION,
  ].includes(user.role)

  const subscriberType = isOrgRole && user.organizationId ? 'organization' : 'user'
  const subscriberId =
    subscriberType === 'organization' ? user.organizationId! : user._id

  await SubscriptionModel.findOneAndUpdate(
    { subscriberId, subscriberType },
    {
      $set: {
        status: SUBSCRIPTION_STATUS.CANCELED,
        cancelAtPeriodEnd: true,
      },
      $push: {
        history: {
          action: 'canceled',
          plan: SUBSCRIPTION_PLAN.FREE,
          status: SUBSCRIPTION_STATUS.CANCELED,
          timestamp: new Date(),
          note: 'Subscription canceled by user',
        },
      },
    },
  )

  if (subscriberType === 'user') {
    user.isPro = false
    user.subscriptionStatus = SUBSCRIPTION_STATUS.CANCELED
    await user.save()
  } else {
    await Organization.findByIdAndUpdate(subscriberId, {
      'subscription.status': SUBSCRIPTION_STATUS.CANCELED,
    })
  }

  return { message: 'Subscription canceled successfully' }
}

const createCheckoutSession = async (
  userId: string,
  plan: SUBSCRIPTION_PLAN,
  billingCycle: BILLING_CYCLE = BILLING_CYCLE.MONTHLY,
) => {
  const user = await User.findById(userId).lean()
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
  }

  const clientUrl = config.clientUrl || 'http://localhost:3000'
  const priceInCents = Math.round((PLAN_PRICING[plan] || 0) * 100)

  if (stripe && priceInCents > 0) {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `TCP - ${plan.replace('_', ' ').toUpperCase()}`,
              description: `Subscription to The Coach Profile ${plan}`,
            },
            unit_amount: priceInCents,
            recurring: {
              interval: billingCycle === BILLING_CYCLE.YEARLY ? 'year' : 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${clientUrl}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/dashboard?payment=canceled`,
      customer_email: user.email,
      metadata: {
        userId,
        plan,
        billingCycle,
      },
    })

    return { checkoutUrl: session.url }
  }

  // Graceful fallback when running in sandbox or without active Stripe keys
  return {
    checkoutUrl: `${clientUrl}/dashboard?mock_checkout=true&plan=${plan}`,
  }
}

const getBillingPortalUrl = async (userId: string) => {
  const user = await User.findById(userId).lean()
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
  }

  const clientUrl = config.clientUrl || 'http://localhost:3000'

  if (stripe && user.stripeCustomerId) {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${clientUrl}/dashboard`,
    })
    return portalSession.url
  }

  return `${clientUrl}/dashboard/billing`
}

export const SubscriptionService = {
  deriveEntitlements,
  getCurrentSubscription,
  changePlan,
  cancelSubscription,
  createCheckoutSession,
  getBillingPortalUrl,
}
