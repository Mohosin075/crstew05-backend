import express from 'express'
import { ChatController } from './chat.controller'
import auth from '../../middleware/auth'
import { USER_ROLES } from '../../../enum/user'

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

router.post(
  '/contact-admin',
  auth(...ALL_ROLES),
  ChatController.createAdminChat,
)

router.post(
  '/:id',
  auth(...ALL_ROLES),
  ChatController.createChat,
)

router.get(
  '/',
  auth(...ALL_ROLES),
  ChatController.getChat,
)

export const ChatRoutes = router
