import express, { Router } from 'express'
import { AuthRoutes } from '../app/modules/auth/auth.route'
import { UserRoutes } from '../app/modules/user/user.route'
import { MessageRoutes } from '../app/modules/message/message.routes'
import { ChatRoutes } from '../app/modules/chat/chat.routes'
import { SupportRoutes } from '../app/modules/support/support.route'
import { LocationRoutes } from '../app/modules/location/location.route'
import { PublicRoutes } from '../app/modules/public/public.route'
import { OrganizationRoutes } from '../app/modules/organization/organization.route'
import { OpportunityRoutes } from '../app/modules/opportunity/opportunity.route'
import { CandidateRoutes } from '../app/modules/candidate/candidate.route'
import { VerificationRoutes } from '../app/modules/verification/verification.route'
import { AnalyticsRoutes } from '../app/modules/analytics/analytics.route'
import { SubscriptionRoutes } from '../app/modules/subscription/subscription.route'
import { ShortlistRoutes } from '../app/modules/shortlist/shortlist.route'

const router = express.Router()

const apiRoutes: { path: string; route: Router }[] = [
  { path: '/auth', route: AuthRoutes },
  { path: '/users', route: UserRoutes },
  { path: '/organizations', route: OrganizationRoutes },
  { path: '/opportunities', route: OpportunityRoutes },
  { path: '/candidates', route: CandidateRoutes },
  { path: '/shortlists', route: ShortlistRoutes },
  { path: '/verifications', route: VerificationRoutes },
  { path: '/analytics', route: AnalyticsRoutes },
  { path: '/subscriptions', route: SubscriptionRoutes },
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

