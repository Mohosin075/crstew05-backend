import { parsePhoneNumberFromString } from 'libphonenumber-js'
import { USER_ROLES } from '../../../enum/user'
import { z } from 'zod'

const verifyEmailOrPhoneOtpZodSchema = z.object({
  body: z.object({
    email: z
      .string()
      .optional()
      .refine(value => !value || /^\S+@\S+\.\S+$/.test(value), {
        message: 'Invalid email format',
      }),
    phone: z
      .string()
      .optional()
      .refine(value => !value || /^\+?[1-9]\d{1,14}$/.test(value), {
        message: 'Invalid phone number format',
      }),
    oneTimeCode: z.string().min(1, { message: 'OTP is required' }),
  }),
})

const forgetPasswordZodSchema = z.object({
  body: z.object({
    email: z
      .string()
      .optional()

      .refine(value => !value || /^\S+@\S+\.\S+$/.test(value), {
        message: 'Invalid email format',
      }),
    phone: z
      .string()
      .optional()
      .refine(value => !value || /^\+?[1-9]\d{1,14}$/.test(value), {
        message: 'Invalid phone number format',
      }),
  }),
})

const resetPasswordZodSchema = z.object({
  body: z.object({
    newPassword: z.string().min(8, { message: 'Password is required' }),
    confirmPassword: z
      .string()
      .min(8, { message: 'Confirm Password is required' }),
  }),
})

const loginZodSchema = z.object({
  body: z.object({
    email: z
      .string()
      .optional()
      .refine(value => !value || /^\S+@\S+\.\S+$/.test(value), {
        message: 'Invalid email format',
      }),
    phone: z
      .string()
      .optional()
      .refine(value => !value || /^\+?[1-9]\d{1,14}$/.test(value), {
        message: 'Invalid phone number format',
      }),
    deviceToken: z.string().min(1).optional(),
    rememberMe: z.boolean().optional(),
    password: z.string().min(6, { message: 'Password is required' }),
  }),
})

const verifyAccountZodSchema = z.object({
  body: z.object({
    email: z
      .string()
      .optional()
      .refine(value => !value || /^\S+@\S+\.\S+$/.test(value), {
        message: 'Invalid email format',
      }),
    phone: z
      .string()
      .optional()
      .refine(value => !value || /^\+?[1-9]\d{1,14}$/.test(value), {
        message: 'Invalid phone number format',
      }),
    oneTimeCode: z.string().min(1, { message: 'OTP is required' }),
  }),
})

const resendOtpZodSchema = z.object({
  body: z.object({
    email: z
      .string()
      .optional()
      .refine(value => !value || /^\S+@\S+\.\S+$/.test(value), {
        message: 'Invalid email format',
      }),
    phone: z
      .string()
      .optional()
      .refine(value => !value || /^\+?[1-9]\d{1,14}$/.test(value), {
        message: 'Invalid phone number format',
      }),
    authType: z.enum(['resetPassword', 'createAccount']).optional(),
  }),
})

const changePasswordZodSchema = z.object({
  body: z
    .object({
      currentPassword: z.string().min(1, 'Current password is required'),
      newPassword: z.string().min(8, 'Password must be at least 8 characters'),
      confirmPassword: z.string().min(1, 'Confirm password is required'),
    })
    .refine(data => data.newPassword === data.confirmPassword, {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    }),
})

const deleteAccount = z.object({
  body: z.object({
    password: z.string().min(1, 'Password is required'),
  }),
})

const addressSchema = z.object({
  city: z.string().optional(),
  permanentAddress: z.string().optional(),
  presentAddress: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
})

const createUserZodSchema = z.object({
  body: z.object({
    email: z.string().email().optional(),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    name: z.string().optional(),
    phone: z
      .string()
      .refine(
        val => {
          const p = parsePhoneNumberFromString(val)
          return p?.isValid() ?? false
        },
        { message: 'Invalid phone number' },
      )
      .optional(),
    address: addressSchema.optional(),
    role: z.nativeEnum(USER_ROLES).optional(),
  }),
})

const socialLoginZodSchema = z.object({
  body: z
    .object({
      provider: z.string().min(1, 'Provider is required'),
      idToken: z.string().optional(),
      accessToken: z.string().optional(),
      deviceToken: z.string().optional(),
      // Common Flutter / SDK aliases
      id_token: z.string().optional(),
      access_token: z.string().optional(),
      token: z.string().optional(),
      fcmToken: z.string().optional(),
      fcm_token: z.string().optional(),
    })
    .transform(data => {
      const providerRaw = data.provider?.toLowerCase().trim()
      const provider =
        providerRaw === 'google' || providerRaw === 'facebook'
          ? providerRaw
          : undefined

      const idToken =
        data.idToken ||
        data.id_token ||
        (provider === 'google' ? data.token : undefined)

      const accessToken =
        data.accessToken ||
        data.access_token ||
        (provider === 'facebook' ? data.token : undefined)

      return {
        provider,
        idToken,
        accessToken,
        deviceToken: data.deviceToken || data.fcmToken || data.fcm_token || '',
      }
    })
    .superRefine((data, ctx) => {
      if (data.provider !== 'google' && data.provider !== 'facebook') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['provider'],
          message: 'Provider must be google or facebook',
        })
        return
      }

      if (data.provider === 'google' && !data.idToken) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['idToken'],
          message: 'Google idToken is required',
        })
      }

      if (data.provider === 'facebook' && !data.accessToken) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['accessToken'],
          message: 'Facebook accessToken is required',
        })
      }
    }),
})

export const AuthValidations = {
  verifyEmailOrPhoneOtpZodSchema,
  forgetPasswordZodSchema,
  resetPasswordZodSchema,
  loginZodSchema,
  verifyAccountZodSchema,
  resendOtpZodSchema,
  changePasswordZodSchema,
  createUserZodSchema,
  deleteAccount,
  socialLoginZodSchema,
}
