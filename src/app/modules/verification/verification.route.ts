import express from 'express'
import { VerificationController } from './verification.controller'
import validateRequest from '../../middleware/validateRequest'
import auth from '../../middleware/auth'
import { USER_ROLES } from '../../../enum/user'
import { VerificationValidation } from './verification.validation'

const router = express.Router()

const ADMIN_ROLES = [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN]

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

// Queue (Admin review)
router.get(
  '/queue',
  auth(...ADMIN_ROLES),
  VerificationController.getQueue,
)

// Actions on a verification request (Admin only)
router.patch(
  '/:id/approve',
  auth(...ADMIN_ROLES),
  validateRequest(VerificationValidation.approveVerificationZodSchema),
  VerificationController.approve,
)

router.patch(
  '/:id/reject',
  auth(...ADMIN_ROLES),
  validateRequest(VerificationValidation.rejectVerificationZodSchema),
  VerificationController.reject,
)

router.patch(
  '/:id/request-info',
  auth(...ADMIN_ROLES),
  validateRequest(VerificationValidation.requestInfoZodSchema),
  VerificationController.requestInfo,
)

// Status check (Public/Authenticated)
router.get(
  '/status/:entityId',
  auth(...ALL_ROLES),
  VerificationController.getStatus,
)

// Submit verification request (Coach or Org)
router.post(
  '/submit',
  auth(...ALL_ROLES),
  validateRequest(VerificationValidation.submitVerificationZodSchema),
  VerificationController.submitVerification,
)

export const VerificationRoutes = router
