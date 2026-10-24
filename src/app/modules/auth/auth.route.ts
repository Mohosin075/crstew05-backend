import express from 'express'
import passport from 'passport'
import { PassportAuthController } from './passport.auth/passport.auth.controller'
import { CustomAuthController } from './custom.auth/custom.auth.controller'
import validateRequest from '../../middleware/validateRequest'
import { AuthValidations } from './auth.validation'
import { USER_ROLES } from '../../../enum/user'
import auth from '../../middleware/auth'
import { authRateLimiter } from '../../middleware/authRateLimiter'

const router = express.Router()

router.post(
  '/signup',
  authRateLimiter,
  validateRequest(AuthValidations.createUserZodSchema),
  CustomAuthController.createUser,
)
router.post(
  '/admin-login',
  authRateLimiter,
  validateRequest(AuthValidations.loginZodSchema),
  CustomAuthController.adminLogin,
)

// i disabled the local login route because it is not used in the app
// router.post(
//   '/login',
//   validateRequest(AuthValidations.loginZodSchema),
//   passport.authenticate('local', { session: false }),
//   PassportAuthController.login,
// )

// Web-only Passport Google OAuth (browser redirect). Flutter mobile apps
// must use POST /social-login with a verified Google idToken instead.
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] }),
)

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false }),
  PassportAuthController.googleAuthCallback,
)

router.post(
  '/verify-account',
  authRateLimiter,
  validateRequest(AuthValidations.verifyAccountZodSchema),
  CustomAuthController.verifyAccount,
)

// custom login route
router.post(
  '/login',
  authRateLimiter,
  validateRequest(AuthValidations.loginZodSchema),
  CustomAuthController.customLogin,
)

router.post(
  '/forget-password',
  authRateLimiter,
  validateRequest(AuthValidations.forgetPasswordZodSchema),
  CustomAuthController.forgetPassword,
)
router.post(
  '/reset-password',
  authRateLimiter,
  validateRequest(AuthValidations.resetPasswordZodSchema),
  CustomAuthController.resetPassword,
)

router.post(
  '/resend-otp',
  authRateLimiter,
  // tempAuth(USER_ROLES.ADMIN, USER_ROLES.USER),
  validateRequest(AuthValidations.resendOtpZodSchema),
  CustomAuthController.resendOtp,
)

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

router.post(
  '/change-password',
  auth(...ALL_AUTHENTICATED_ROLES),
  validateRequest(AuthValidations.changePasswordZodSchema),
  CustomAuthController.changePassword,
)

router.delete(
  '/delete-account',
  auth(...ALL_AUTHENTICATED_ROLES),
  validateRequest(AuthValidations.deleteAccount),
  CustomAuthController.deleteAccount,
)
router.post('/refresh-token', CustomAuthController.getRefreshToken)

// Flutter mobile social login (Google idToken / Facebook accessToken).
router.post(
  '/social-login',
  authRateLimiter,
  validateRequest(AuthValidations.socialLoginZodSchema),
  CustomAuthController.socialLogin,
)

router.post(
  '/logout',
  auth(...ALL_AUTHENTICATED_ROLES),
  CustomAuthController.logout,
)

export const AuthRoutes = router
