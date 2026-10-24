import express from 'express'
import { PublicController } from './public.controller'
import validateRequest from '../../middleware/validateRequest'
import {
  FaqValidations,
  PublicValidation,
  updatePublicZodSchema,
} from './public.validation'
import { USER_ROLES } from '../../../enum/user'
import auth from '../../middleware/auth'

const router = express.Router()

router.post(
  '/',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  validateRequest(PublicValidation.create),
  PublicController.createPublic,
)

router.post(
  '/contact',
  validateRequest(PublicValidation.contactZodSchema),
  PublicController.createContact,
)

router.post(
  '/faq',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  validateRequest(FaqValidations.create),
  PublicController.createFaq,
)
router.patch(
  '/faq/:id',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  validateRequest(FaqValidations.update),
  PublicController.updateFaq,
)
router.get('/faq/single/:id', PublicController.getSingleFaq)
router.get('/faq/all', PublicController.getAllFaqs)
router.delete(
  '/faq/:id',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  PublicController.deleteFaq,
)

router.get('/:type', PublicController.getAllPublics)

router.delete(
  '/:id',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  PublicController.deletePublic,
)

router.patch(
  '/update/:id',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  validateRequest(updatePublicZodSchema),
  PublicController.updatePublic,
)

export const PublicRoutes = router
