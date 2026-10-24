import express from 'express'
import { SubscriptionController } from './subscription.controller'
import auth from '../../middleware/auth'
import { USER_ROLES } from '../../../enum/user'

const router = express.Router()

const ALL_ROLES = [
  USER_ROLES.SUPER_ADMIN,
  USER_ROLES.ADMIN,
  USER_ROLES.COACH,
  USER_ROLES.COLLEGIATE,
  USER_ROLES.TEAM,
  USER_ROLES.AGENCY,
  USER_ROLES.ORGANIZATION,
  USER_ROLES.USER,
]

router.get(
  '/current',
  auth(...ALL_ROLES),
  SubscriptionController.getCurrentSubscription,
)

router.post(
  '/change-plan',
  auth(...ALL_ROLES),
  SubscriptionController.changePlan,
)

router.post(
  '/cancel',
  auth(...ALL_ROLES),
  SubscriptionController.cancelSubscription,
)

router.post(
  '/checkout-session',
  auth(...ALL_ROLES),
  SubscriptionController.createCheckoutSession,
)

router.get(
  '/billing-portal',
  auth(...ALL_ROLES),
  SubscriptionController.getBillingPortalUrl,
)

export const SubscriptionRoutes = router

