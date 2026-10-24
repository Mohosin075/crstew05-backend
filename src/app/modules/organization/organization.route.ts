import express from 'express'
import { OrganizationController } from './organization.controller'
import validateRequest from '../../middleware/validateRequest'
import auth, { optionalAuth } from '../../middleware/auth'
import { USER_ROLES } from '../../../enum/user'
import { OrganizationValidation } from './organization.validation'

const router = express.Router()

const ORG_AND_ADMIN_ROLES = [
  USER_ROLES.SUPER_ADMIN,
  USER_ROLES.ADMIN,
  USER_ROLES.COLLEGIATE,
  USER_ROLES.TEAM,
  USER_ROLES.AGENCY,
  USER_ROLES.ORGANIZATION,
]

// Current user's organization workspace
router.get(
  '/current',
  auth(...ORG_AND_ADMIN_ROLES),
  OrganizationController.getCurrentOrganization,
)

router.patch(
  '/current',
  auth(...ORG_AND_ADMIN_ROLES),
  validateRequest(OrganizationValidation.updateOrganizationZodSchema),
  OrganizationController.updateOrganization,
)

// Team members & invitations
router.get(
  '/members',
  auth(...ORG_AND_ADMIN_ROLES),
  OrganizationController.getMembers,
)

router.post(
  '/members/invite',
  auth(...ORG_AND_ADMIN_ROLES),
  validateRequest(OrganizationValidation.inviteMemberZodSchema),
  OrganizationController.inviteMember,
)

router.delete(
  '/members/:memberId',
  auth(...ORG_AND_ADMIN_ROLES),
  OrganizationController.removeMember,
)

router.patch(
  '/members/:memberId/role',
  auth(...ORG_AND_ADMIN_ROLES),
  validateRequest(OrganizationValidation.updateMemberRoleZodSchema),
  OrganizationController.updateMemberRole,
)

// Organization registration & global directory
router.post(
  '/',
  auth(...ORG_AND_ADMIN_ROLES),
  validateRequest(OrganizationValidation.createOrganizationZodSchema),
  OrganizationController.createOrganization,
)

router.get('/', optionalAuth, OrganizationController.getAllOrganizations)

export const OrganizationRoutes = router
