import express from 'express'
import { MessageController } from './message.controller'
import { USER_ROLES } from '../../../enum/user'
import auth from '../../middleware/auth'
import { fileAndBodyProcessorUsingDiskStorage } from '../../middleware/processReqBody'

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

router.post(
  '/',
  fileAndBodyProcessorUsingDiskStorage(),
  auth(...ALL_ROLES),
  MessageController.sendMessage,
)

router.get(
  '/:id',
  auth(...ALL_ROLES),
  MessageController.getMessage,
)

export const MessageRoutes = router
