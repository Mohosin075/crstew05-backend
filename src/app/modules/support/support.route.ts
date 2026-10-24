import express from 'express'
import { SupportController } from './support.controller'
import validateRequest from '../../middleware/validateRequest'
import auth from '../../middleware/auth'
import { USER_ROLES } from '../../../enum/user'
import { createSupportSchema, updateSupportSchema } from './support.validation'

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
  '/',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  SupportController.getAllSupports,
)

router.get(
  '/:id',
  auth(...ALL_ROLES),
  SupportController.getSingleSupport,
)

router.post(
  '/',
  auth(...ALL_ROLES),
  validateRequest(createSupportSchema),
  SupportController.createSupport,
)

router.patch(
  '/:id',
  auth(...ALL_ROLES),
  validateRequest(updateSupportSchema),
  SupportController.updateSupport,
)

router.delete(
  '/:id',
  auth(...ALL_ROLES),
  SupportController.deleteSupport,
)

export const SupportRoutes = router
