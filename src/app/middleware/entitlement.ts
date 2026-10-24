import { NextFunction, Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import ApiError from '../../errors/ApiError'
import { USER_ROLES } from '../../enum/user'
import { IEntitlements } from '../modules/subscription/subscription.interface'
import { SubscriptionService } from '../modules/subscription/subscription.service'
import { JwtPayload } from 'jsonwebtoken'

export const checkEntitlement = (entitlementKey: keyof IEntitlements) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as JwtPayload
      if (!user) {
        return next(new ApiError(StatusCodes.UNAUTHORIZED, 'Authentication required'))
      }

      // Super admins and platform admins bypass subscription gating
      if (
        user.role === USER_ROLES.SUPER_ADMIN ||
        user.role === USER_ROLES.ADMIN
      ) {
        return next()
      }

      const subscription = await SubscriptionService.getCurrentSubscription(
        user.userId,
      )

      if (!subscription.entitlements[entitlementKey]) {
        return next(
          new ApiError(
            StatusCodes.FORBIDDEN,
            `Your current subscription (${subscription.plan}) does not include access to '${String(
              entitlementKey,
            )}'. Please upgrade your plan.`,
          ),
        )
      }

      next()
    } catch (error) {
      next(error)
    }
  }
}
