import { OAuth2Client } from 'google-auth-library'
import axios from 'axios'
import { StatusCodes } from 'http-status-codes'
import ApiError from '../../../errors/ApiError'
import config from '../../../config'

export type SocialProvider = 'google' | 'facebook'

export interface VerifiedSocialProfile {
  appId: string
  email?: string
  name?: string
  profile?: string
  provider: SocialProvider
}

const getGoogleAudiences = (): string[] => {
  if (config.google.client_ids?.length) {
    return config.google.client_ids
  }
  return config.google.client_id ? [config.google.client_id] : []
}

const verifyGoogleIdToken = async (
  idToken: string,
): Promise<VerifiedSocialProfile> => {
  const audiences = getGoogleAudiences()
  if (!audiences.length) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Google client ID is not configured.',
    )
  }

  const client = new OAuth2Client()
  let ticket
  try {
    ticket = await client.verifyIdToken({
      idToken,
      audience: audiences.length === 1 ? audiences[0] : audiences,
    })
  } catch {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid Google ID token.')
  }

  const payload = ticket.getPayload()
  if (!payload?.sub) {
    throw new ApiError(
      StatusCodes.UNAUTHORIZED,
      'Invalid Google ID token payload.',
    )
  }

  return {
    appId: payload.sub,
    email: payload.email?.toLowerCase().trim(),
    name: payload.name,
    profile: payload.picture,
    provider: 'google',
  }
}

const verifyFacebookAccessToken = async (
  accessToken: string,
): Promise<VerifiedSocialProfile> => {
  const appId = config.facebook.app_id
  const appSecret = config.facebook.app_secret

  if (!appId || !appSecret) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Facebook login is not configured on the server. Set FACEBOOK_APP_ID and FACEBOOK_APP_SECRET in environment.',
    )
  }

  try {
    const debugRes = await axios.get('https://graph.facebook.com/debug_token', {
      params: {
        input_token: accessToken,
        access_token: `${appId}|${appSecret}`,
      },
    })

    const debugData = debugRes.data?.data
    if (!debugData?.is_valid || String(debugData.app_id) !== String(appId)) {
      throw new ApiError(
        StatusCodes.UNAUTHORIZED,
        'Invalid Facebook access token.',
      )
    }

    const meRes = await axios.get('https://graph.facebook.com/me', {
      params: {
        fields: 'id,name,email,picture.type(large)',
        access_token: accessToken,
      },
    })

    const { id, name, email, picture } = meRes.data
    if (!id) {
      throw new ApiError(
        StatusCodes.UNAUTHORIZED,
        'Failed to fetch Facebook user profile.',
      )
    }

    return {
      appId: String(id),
      email: email?.toLowerCase().trim(),
      name,
      profile: picture?.data?.url,
      provider: 'facebook',
    }
  } catch (error) {
    if (error instanceof ApiError) throw error
    throw new ApiError(
      StatusCodes.UNAUTHORIZED,
      'Invalid Facebook access token.',
    )
  }
}

export const verifySocialLogin = async (params: {
  provider: SocialProvider
  idToken?: string
  accessToken?: string
}): Promise<VerifiedSocialProfile> => {
  const { provider, idToken, accessToken } = params

  if (provider === 'google') {
    if (!idToken) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Google idToken is required.')
    }
    return verifyGoogleIdToken(idToken)
  }

  if (!accessToken) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Facebook accessToken is required.',
    )
  }
  return verifyFacebookAccessToken(accessToken)
}
