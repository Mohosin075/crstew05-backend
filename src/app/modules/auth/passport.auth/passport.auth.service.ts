import { USER_ROLES, USER_STATUS } from '../../../../enum/user'
import { StatusCodes } from 'http-status-codes'
import ApiError from '../../../../errors/ApiError'
import { User } from '../../user/user.model'

import { IUser } from '../../user/user.interface'
import { AuthHelper } from '../auth.helper'
import { IAuthResponse } from '../auth.interface'
import { authResponse } from '../common'

const handleGoogleLogin = async (
  payload: IUser & { profile: any },
): Promise<IAuthResponse> => {
  const { emails, photos, displayName, id } = payload.profile
  const email = emails?.[0]?.value?.toLowerCase().trim()
  if (!email) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Google account email is required.',
    )
  }

  let user = await User.findOne({
    $or: [{ email }, { appId: id }],
    status: { $in: [USER_STATUS.ACTIVE, USER_STATUS.INACTIVE] },
  })

  if (user) {
    user = await User.findByIdAndUpdate(
      user._id,
      {
        $set: {
          appId: id,
          provider: 'google',
          verified: true,
          status: USER_STATUS.ACTIVE,
          ...(displayName && !user.name ? { name: displayName } : {}),
          ...(photos?.[0]?.value &&
          (!user.profile || user.profile.includes('/images/'))
            ? { profile: photos[0].value }
            : {}),
          'authentication.restrictionLeftAt': null,
          'authentication.wrongLoginAttempts': 0,
        },
      },
      { new: true },
    )

    if (!user) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to update user')
    }

    const tokens = AuthHelper.createToken(
      user._id,
      user.role,
      user.name!,
      user.email!,
    )
    return authResponse(
      StatusCodes.OK,
      `Welcome ${user.name || ''} to our platform.`,
      user.role,
      tokens.accessToken,
      tokens.refreshToken,
    )
  }

  const session = await User.startSession()
  session.startTransaction()

  try {
    // No password — aligns with customLogin social-account detection
    const created = await User.create(
      [
        {
          email,
          profile: photos?.[0]?.value,
          name: displayName || 'User',
          verified: true,
          status: USER_STATUS.ACTIVE,
          appId: id,
          provider: 'google',
          role: USER_ROLES.USER,
        },
      ],
      { session },
    )

    if (!created?.[0]) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create user')
    }

    const tokens = AuthHelper.createToken(
      created[0]._id,
      created[0].role,
      created[0].name!,
      created[0].email!,
    )

    await session.commitTransaction()

    return authResponse(
      StatusCodes.OK,
      `Welcome ${created[0].name} to our platform.`,
      created[0].role,
      tokens.accessToken,
      tokens.refreshToken,
    )
  } catch (error) {
    await session.abortTransaction()
    throw error
  } finally {
    session.endSession()
  }
}

export const PassportAuthServices = {
  handleGoogleLogin,
}
