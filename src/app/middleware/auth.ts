import { NextFunction, Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { Secret } from 'jsonwebtoken'
import config from '../../config'
import { jwtHelper } from '../../helpers/jwtHelper'
import ApiError from '../../errors/ApiError'
import { User } from '../modules/user/user.model'
import { USER_ROLES, USER_STATUS } from '../../enum/user'

const auth =
  (...roles: string[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tokenWithBearer = req.headers.authorization

      if (!tokenWithBearer) {
        return next(new ApiError(StatusCodes.UNAUTHORIZED, 'Token not found!'))
      }

      if (!tokenWithBearer.startsWith('Bearer')) {
        return next(
          new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid token format'),
        )
      }

      const token = tokenWithBearer.split(' ')[1]

      if (!token) {
        return next(
          new ApiError(StatusCodes.UNAUTHORIZED, 'Token missing after Bearer'),
        )
      }

      let verifyUser

      // FIRST: decode token
      try {
        verifyUser = jwtHelper.verifyToken(
          token,
          config.jwt.jwt_secret as Secret,
        )
        // Ensure userId is present even for older tokens
        if (!verifyUser.userId && verifyUser.authId) {
          verifyUser.userId = verifyUser.authId
        }
      } catch (error: any) {
        if (error.name === 'TokenExpiredError') {
          return next(
            new ApiError(StatusCodes.UNAUTHORIZED, 'Access Token has expired'),
          )
        }

        return next(new ApiError(StatusCodes.FORBIDDEN, 'Invalid Access Token'))
      }

      // VERIFY USER STATUS IN DB
      const userStatusCheck = await User.findById(verifyUser.userId)
        .select('status role')
        .lean()
      if (!userStatusCheck) {
        return next(
          new ApiError(StatusCodes.UNAUTHORIZED, 'User does not exist'),
        )
      }
      if (userStatusCheck.status === USER_STATUS.INACTIVE) {
        return next(
          new ApiError(
            StatusCodes.FORBIDDEN,
            'Your account is inactive. Please log in again to reactivate it.',
          ),
        )
      }
      if (userStatusCheck.status === USER_STATUS.DELETED) {
        return next(
          new ApiError(StatusCodes.FORBIDDEN, 'Your account is deleted.'),
        )
      }

      let currentRole = (userStatusCheck.role || verifyUser.role) as string
      if (currentRole === 'teams') currentRole = USER_ROLES.TEAM
      if (currentRole === 'organizations') currentRole = USER_ROLES.ORGANIZATION

      if (!currentRole) {
        return next(
          new ApiError(
            StatusCodes.FORBIDDEN,
            "You don't have permission to access this API",
          ),
        )
      }

      verifyUser.role = currentRole
      req.user = verifyUser

      // Authorize on role (supports both singular and plural role aliases)
      if (roles.length > 0) {
        const normalizedAllowedRoles = roles.map(r => {
          if (r === 'teams') return USER_ROLES.TEAM
          if (r === 'organizations') return USER_ROLES.ORGANIZATION
          return r
        })
        if (!normalizedAllowedRoles.includes(currentRole)) {
          return next(
            new ApiError(
              StatusCodes.FORBIDDEN,
              "You don't have permission to access this API",
            ),
          )
        }
      }

      return next()
    } catch (error) {
      return next(error)
    }
  }

export default auth

/**
 * Optional JWT: if a valid Bearer token is present, set req.user.
 * Missing/invalid tokens do not fail the request (public routes).
 */
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const tokenWithBearer = req.headers.authorization
    if (!tokenWithBearer || !tokenWithBearer.startsWith('Bearer ')) {
      return next()
    }
    const token = tokenWithBearer.split(' ')[1]
    if (!token) return next()

    let verifyUser: any
    try {
      verifyUser = jwtHelper.verifyToken(token, config.jwt.jwt_secret as Secret)
    } catch {
      return next()
    }

    if (!verifyUser.userId && verifyUser.authId) {
      verifyUser.userId = verifyUser.authId
    }

    const userStatusCheck = await User.findById(verifyUser.userId)
      .select('status role')
      .lean()
    if (
      !userStatusCheck ||
      userStatusCheck.status === USER_STATUS.INACTIVE ||
      userStatusCheck.status === USER_STATUS.DELETED
    ) {
      return next()
    }

    let currentRole = (userStatusCheck.role || verifyUser.role) as string
    if (currentRole === 'teams') currentRole = USER_ROLES.TEAM
    if (currentRole === 'organizations') currentRole = USER_ROLES.ORGANIZATION
    verifyUser.role = currentRole
    req.user = verifyUser
    return next()
  } catch {
    return next()
  }
}

//this temp auth middleware is created for temporary user verification before creating a new user
//in the future, we will use the auth middleware above

export const tempAuth =
  (...roles: string[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tokenWithBearer = req.headers.authorization

      if (!tokenWithBearer) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Token not found!')
      }

      if (tokenWithBearer && tokenWithBearer.startsWith('Bearer')) {
        const token = tokenWithBearer.split(' ')[1]

        try {
          // Verify token
          const verifyUser = jwtHelper.verifyToken(
            token,
            config.jwt.temp_jwt_secret as Secret,
          )

          // Set user to header
          req.user = verifyUser

          // Guard user
          if (roles.length && !roles.includes(verifyUser.role)) {
            throw new ApiError(
              StatusCodes.FORBIDDEN,
              "You don't have permission to access this API",
            )
          }

          next()
        } catch (error) {
          if (error instanceof Error && error.name === 'TokenExpiredError') {
            throw new ApiError(
              StatusCodes.UNAUTHORIZED,
              'Access Token has expired',
            )
          }
          next(error)
          throw new ApiError(StatusCodes.FORBIDDEN, 'Invalid Access Token')
        }
      }
    } catch (error) {
      next(error)
    }
  }
