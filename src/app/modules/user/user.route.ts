import express from 'express'
import { UserController } from './user.controller'
import validateRequest from '../../middleware/validateRequest'
import auth, { optionalAuth } from '../../middleware/auth'
import { USER_ROLES } from '../../../enum/user'
import { updateUserSchema, updateUserStatusSchema } from './user.validation'
import { fileAndBodyProcessorUsingDiskStorage } from '../../middleware/processReqBody'

const router = express.Router()

// All platform roles for personal profile access
const ALL_AUTHENTICATED_ROLES = [
  USER_ROLES.SUPER_ADMIN,
  USER_ROLES.ADMIN,
  USER_ROLES.COACH,
  USER_ROLES.COLLEGIATE,
  USER_ROLES.TEAM,
  USER_ROLES.AGENCY,
  USER_ROLES.ORGANIZATION,
  USER_ROLES.USER,
]

// Recruiter / Org roles for recruiting workflows
const RECRUITER_AND_ADMIN_ROLES = [
  USER_ROLES.SUPER_ADMIN,
  USER_ROLES.ADMIN,
  USER_ROLES.COLLEGIATE,
  USER_ROLES.TEAM,
  USER_ROLES.AGENCY,
  USER_ROLES.ORGANIZATION,
]

// ─── COACH SEARCH & DIRECTORY (Production-Grade) ─────────────────────────────
router.get('/coaches/recommended', optionalAuth, UserController.getRecommendedCoaches)

router.get(
  '/coaches/saved',
  auth(...RECRUITER_AND_ADMIN_ROLES),
  UserController.getSavedCoaches,
)

router.post(
  '/coaches/:coachId/save',
  auth(...RECRUITER_AND_ADMIN_ROLES),
  UserController.saveCoach,
)

router.delete(
  '/coaches/:coachId/save',
  auth(...RECRUITER_AND_ADMIN_ROLES),
  UserController.unsaveCoach,
)

router.get('/coaches/:id', optionalAuth, UserController.getCoachById)

router.get('/coaches', optionalAuth, UserController.searchCoaches)

// ─── USER PROFILE MANAGEMENT ────────────────────────────────────────────────
router.get(
  '/profile',
  auth(...ALL_AUTHENTICATED_ROLES),
  UserController.getProfile,
)

router.patch(
  '/profile',
  auth(...ALL_AUTHENTICATED_ROLES),
  fileAndBodyProcessorUsingDiskStorage(),
  validateRequest(updateUserSchema),
  UserController.updateProfile,
)

router.delete(
  '/profile',
  auth(...ALL_AUTHENTICATED_ROLES),
  UserController.deleteProfile,
)

router.patch(
  '/deactivate-profile',
  auth(...ALL_AUTHENTICATED_ROLES),
  UserController.deactivateProfile,
)

router.get(
  '/download-account-data',
  auth(...ALL_AUTHENTICATED_ROLES),
  UserController.downloadAccountData,
)

// ─── ADMIN USER MANAGEMENT ──────────────────────────────────────────────────
router
  .route('/')
  .get(
    auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    UserController.getAllUsers,
  )

router
  .route('/:userId')
  .get(optionalAuth, UserController.getUserById)
  .delete(
    auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    UserController.deleteUser,
  )
  .patch(
    auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    validateRequest(updateUserStatusSchema),
    UserController.updateUserStatus,
  )

export const UserRoutes = router

