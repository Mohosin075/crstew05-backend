import { z } from 'zod'
import { USER_ROLES, USER_STATUS } from '../../../enum/user'

// ------------------ SUB-SCHEMAS ------------------
const addressSchema = z.object({
  city: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  permanentAddress: z.string().optional(),
  presentAddress: z.string().optional(),
})

const authenticationSchema = z.object({
  restrictionLeftAt: z.date().nullable().optional(),
  resetPassword: z.boolean().optional(),
  wrongLoginAttempts: z.number().optional(),
  passwordChangedAt: z.date().optional(),
  oneTimeCode: z.string().optional(),
  latestRequestAt: z.date().optional(),
  expiresAt: z.date().optional(),
  requestCount: z.number().optional(),
  authType: z.enum(['createAccount', 'resetPassword']).optional(),
})

const pointSchema = z.object({
  type: z.literal('Point').default('Point'),
  coordinates: z.tuple([z.number(), z.number()]).optional(), // [longitude, latitude]
})

const settingsSchema = z.object({
  pushNotification: z.boolean().optional(),
  emailNotification: z.boolean().optional(),
  smsNotification: z.boolean().optional(),
  locationService: z.boolean().optional(),
  profileStatus: z.enum(['public', 'private']).optional(),
  dndMode: z.boolean().optional(),
  quietHoursEnabled: z.boolean().optional(),
  quietHoursStart: z.string().optional(),
  quietHoursEnd: z.string().optional(),
  disabledCategories: z.array(z.string()).optional(),
})

// ------------------ UPDATE USER VALIDATION ------------------
export const updateUserSchema = z.object({
  body: z
    .object({
      name: z.string().optional(),
      profile: z.string().optional(),
      phone: z.string().optional(),
      description: z.string().optional(),
      specialty: z.string().optional(),

      address: addressSchema.optional(),
      location: pointSchema.optional(),

      appId: z.string().optional(),
      deviceToken: z.string().optional(),

      settings: settingsSchema.optional(),

      // File processor may attach this; keep it so validateRequest write-back
      // does not drop profile image uploads.
      images: z.union([z.string(), z.array(z.string())]).optional(),

      // Explicitly rejected — email is immutable after signup
      email: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      if (data.email !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Email cannot be updated',
          path: ['email'],
        })
      }
    })
    .transform(({ email: _email, ...rest }) => rest),
})

export const updateUserStatusSchema = z.object({
  body: z.object({
    status: z.nativeEnum(USER_STATUS),
  }),
})
