import express from 'express'
import { LocationController } from './location.controller'
import auth from '../../middleware/auth'
import { USER_ROLES } from '../../../enum/user'
import validateRequest from '../../middleware/validateRequest'
import { LocationValidation } from './location.validation'

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

const router = express.Router()

router.get(
  '/search',
  auth(...ALL_ROLES),
  validateRequest(LocationValidation.searchSuggestionsSchema),
  LocationController.searchSuggestions,
)

router.get(
  '/geocode',
  auth(...ALL_ROLES),
  validateRequest(LocationValidation.geocodeAddressSchema),
  LocationController.geocodeAddress,
)

export const LocationRoutes = router
