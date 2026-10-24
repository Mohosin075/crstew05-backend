import express from 'express'
import { ShortlistController } from './shortlist.controller'
import validateRequest from '../../middleware/validateRequest'
import auth from '../../middleware/auth'
import { USER_ROLES } from '../../../enum/user'
import { ShortlistValidation } from './shortlist.validation'

const router = express.Router()

const RECRUITER_ROLES = [
  USER_ROLES.SUPER_ADMIN,
  USER_ROLES.ADMIN,
  USER_ROLES.COLLEGIATE,
  USER_ROLES.TEAM,
  USER_ROLES.AGENCY,
  USER_ROLES.ORGANIZATION,
]

router.get(
  '/',
  auth(...RECRUITER_ROLES),
  ShortlistController.getAllShortlists,
)

router.post(
  '/',
  auth(...RECRUITER_ROLES),
  validateRequest(ShortlistValidation.createShortlistZodSchema),
  ShortlistController.createShortlist,
)

router.get(
  '/:id',
  auth(...RECRUITER_ROLES),
  ShortlistController.getShortlistById,
)

router.patch(
  '/:id',
  auth(...RECRUITER_ROLES),
  validateRequest(ShortlistValidation.updateShortlistZodSchema),
  ShortlistController.updateShortlist,
)

router.delete(
  '/:id',
  auth(...RECRUITER_ROLES),
  ShortlistController.deleteShortlist,
)

router.post(
  '/:shortlistId/coaches/:coachId',
  auth(...RECRUITER_ROLES),
  validateRequest(ShortlistValidation.addCoachToShortlistZodSchema),
  ShortlistController.addCoachToShortlist,
)

router.delete(
  '/:shortlistId/coaches/:coachId',
  auth(...RECRUITER_ROLES),
  ShortlistController.removeCoachFromShortlist,
)

export const ShortlistRoutes = router
