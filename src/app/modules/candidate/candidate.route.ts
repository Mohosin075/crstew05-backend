import express from 'express'
import { CandidateController } from './candidate.controller'
import validateRequest from '../../middleware/validateRequest'
import auth from '../../middleware/auth'
import { USER_ROLES } from '../../../enum/user'
import { CandidateValidation } from './candidate.validation'

const router = express.Router()

const RECRUITER_ROLES = [
  USER_ROLES.SUPER_ADMIN,
  USER_ROLES.ADMIN,
  USER_ROLES.COLLEGIATE,
  USER_ROLES.TEAM,
  USER_ROLES.AGENCY,
  USER_ROLES.ORGANIZATION,
]

// Coach submits Express Interest
router.post(
  '/express-interest',
  auth(USER_ROLES.COACH, USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  validateRequest(CandidateValidation.expressInterestZodSchema),
  CandidateController.expressInterest,
)

// Express Interests List (Recruiter view)
router.get(
  '/express-interests',
  auth(...RECRUITER_ROLES),
  CandidateController.getExpressInterests,
)

// Shortlists Management
router.get(
  '/shortlists',
  auth(...RECRUITER_ROLES),
  CandidateController.getShortlists,
)

router.post(
  '/shortlists',
  auth(...RECRUITER_ROLES),
  CandidateController.createShortlist,
)

router.post(
  '/shortlists/:shortlistId/coaches/:coachId',
  auth(...RECRUITER_ROLES),
  CandidateController.addToShortlist,
)

router.delete(
  '/shortlists/:shortlistId/coaches/:coachId',
  auth(...RECRUITER_ROLES),
  CandidateController.removeFromShortlist,
)

// Pipeline Board (Kanban view)
router.get(
  '/pipeline',
  auth(...RECRUITER_ROLES),
  CandidateController.getPipelineBoard,
)


// Candidate Notes
router.post(
  '/:id/notes',
  auth(...RECRUITER_ROLES),
  validateRequest(CandidateValidation.addNoteZodSchema),
  CandidateController.addNote,
)

router.get(
  '/:id/notes',
  auth(...RECRUITER_ROLES),
  CandidateController.getNotes,
)

// Candidate Rating
router.patch(
  '/:id/rating',
  auth(...RECRUITER_ROLES),
  validateRequest(CandidateValidation.updateRatingZodSchema),
  CandidateController.updateRating,
)

// Candidate Stage Movement
router.patch(
  '/:id/stage',
  auth(...RECRUITER_ROLES),
  validateRequest(CandidateValidation.updateStageZodSchema),
  CandidateController.updateStage,
)

// Candidate Details & List
router.get(
  '/:id',
  auth(...RECRUITER_ROLES),
  CandidateController.getById,
)

router.get(
  '/',
  auth(...RECRUITER_ROLES),
  CandidateController.getAll,
)

export const CandidateRoutes = router
