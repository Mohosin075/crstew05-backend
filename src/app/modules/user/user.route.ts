import express from 'express'
import { UserController } from './user.controller'
import validateRequest from '../../middleware/validateRequest'
import auth, { optionalAuth } from '../../middleware/auth'
import { USER_ROLES } from '../../../enum/user'
import { updateUserSchema, updateUserStatusSchema } from './user.validation'
import { fileAndBodyProcessorUsingDiskStorage } from '../../middleware/processReqBody'

const router = express.Router()

router.get(
  '/profile',
  auth(USER_ROLES.ADMIN, USER_ROLES.USER, USER_ROLES.SUPER_ADMIN),
  UserController.getProfile,
)

router.patch(
  '/profile',
  auth(USER_ROLES.ADMIN, USER_ROLES.USER, USER_ROLES.SUPER_ADMIN),
  fileAndBodyProcessorUsingDiskStorage(),
  validateRequest(updateUserSchema),
  UserController.updateProfile,
)

router.delete(
  '/profile',
  auth(USER_ROLES.ADMIN, USER_ROLES.USER, USER_ROLES.SUPER_ADMIN),
  UserController.deleteProfile,
)

router.patch(
  '/deactivate-profile',
  auth(USER_ROLES.ADMIN, USER_ROLES.USER, USER_ROLES.SUPER_ADMIN),
  UserController.deactivateProfile,
)

router.get(
  '/download-account-data',
  auth(USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  UserController.downloadAccountData,
)

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
