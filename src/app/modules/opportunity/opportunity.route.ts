import express from 'express'
import { OpportunityController } from './opportunity.controller'
import validateRequest from '../../middleware/validateRequest'
import auth, { optionalAuth } from '../../middleware/auth'
import { USER_ROLES } from '../../../enum/user'
import { OpportunityValidation } from './opportunity.validation'
import { CandidateController } from '../candidate/candidate.controller'


const router = express.Router()

const POSTER_ROLES = [
  USER_ROLES.SUPER_ADMIN,
  USER_ROLES.ADMIN,
  USER_ROLES.COLLEGIATE,
  USER_ROLES.TEAM,
  USER_ROLES.AGENCY,
  USER_ROLES.ORGANIZATION,
]

router.get('/', optionalAuth, OpportunityController.getAllOpportunities)
router.get('/:id', optionalAuth, OpportunityController.getOpportunityById)

router.post(
  '/',
  auth(...POSTER_ROLES),
  validateRequest(OpportunityValidation.createOpportunityZodSchema),
  OpportunityController.createOpportunity,
)

router.patch(
  '/:id',
  auth(...POSTER_ROLES),
  validateRequest(OpportunityValidation.updateOpportunityZodSchema),
  OpportunityController.updateOpportunity,
)

router.delete(
  '/:id',
  auth(...POSTER_ROLES),
  OpportunityController.closeOpportunity,
)

// Direct opportunity express interest (supports IOpportunityService.expressInterest)
router.post(
  '/:id/express-interest',
  auth(USER_ROLES.COACH, USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  (req, res, next) => {
    req.body.opportunityId = req.params.id
    next()
  },
  validateRequest(OpportunityValidation.expressInterestZodSchema),
  CandidateController.expressInterest,
)

export const OpportunityRoutes = router

