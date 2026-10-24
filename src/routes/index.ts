import express, { Router } from 'express'
import { AuthRoutes } from '../app/modules/auth/auth.route'
import { UserRoutes } from '../app/modules/user/user.route'
import { MessageRoutes } from '../app/modules/message/message.routes'
import { ChatRoutes } from '../app/modules/chat/chat.routes'
import { SupportRoutes } from '../app/modules/support/support.route'
import { LocationRoutes } from '../app/modules/location/location.route'
import { PublicRoutes } from '../app/modules/public/public.route'

const router = express.Router()

const apiRoutes: { path: string; route: Router }[] = [
  { path: '/auth', route: AuthRoutes },
  { path: '/users', route: UserRoutes },
  { path: '/message', route: MessageRoutes },
  { path: '/chat', route: ChatRoutes },
  { path: '/support', route: SupportRoutes },
  { path: '/location', route: LocationRoutes },
  { path: '/public', route: PublicRoutes },
]

apiRoutes.forEach(route => {
  router.use(route.path, route.route)
})

export default router
