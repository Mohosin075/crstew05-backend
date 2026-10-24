import express from 'express'
import { AnalyticsController } from './analytics.controller'
import auth from '../../middleware/auth'
import { USER_ROLES } from '../../../enum/user'

const router = express.Router()

const ORG_AND_ADMIN_ROLES = [
  USER_ROLES.SUPER_ADMIN,
  USER_ROLES.ADMIN,
  USER_ROLES.COLLEGIATE,
  USER_ROLES.TEAM,
  USER_ROLES.AGENCY,
  USER_ROLES.ORGANIZATION,
]

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
  '/org-summary',
  auth(...ORG_AND_ADMIN_ROLES),
  AnalyticsController.getOrgSummary,
)

router.get(
  '/platform-overview',
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  AnalyticsController.getPlatformOverview,
)

router.post(
  '/track',
  auth(...ALL_ROLES),
  AnalyticsController.trackEvent,
)

export const AnalyticsRoutes = router
