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

      // Coach Profile fields (Production-grade)
      headline: z.string().optional(),
      bio: z.string().optional(),
      coachingPhilosophy: z.string().optional(),
      currentRole: z.string().optional(),
      currentOrganization: z.string().optional(),
      highestLevel: z.string().optional(),
      yearsExperience: z.number().optional(),
      careerStatus: z
        .enum([
          'actively_looking',
          'open_to_opportunities',
          'currently_coaching',
          'not_looking',
        ])
        .optional(),
      expertise: z
        .object({
          primary: z.array(z.string()).optional(),
          secondary: z.array(z.string()).optional(),
          schemes: z.array(z.string()).optional(),
        })
        .optional(),
      careerPreferences: z
        .object({
          desiredPositions: z.array(z.string()).optional(),
          desiredLevels: z.array(z.string()).optional(),
          preferredRegions: z.array(z.string()).optional(),
          isOpenToRelocation: z.boolean().optional(),
          notes: z.string().optional(),
        })
        .optional(),
      recruitingFootprint: z
        .object({
          description: z.string().optional(),
          mapStates: z.array(z.string()).optional(),
          topStates: z
            .array(
              z.object({
                state: z.string(),
                level: z.enum(['High', 'Med', 'Low']).optional(),
                percentage: z.number().optional(),
              }),
            )
            .optional(),
        })
        .optional(),
      experienceList: z
        .array(
          z.object({
            role: z.string(),
            organization: z.string(),
            level: z.string(),
            startYear: z.number(),
            endYear: z.number().optional(),
            isCurrentRole: z.boolean().optional(),
            highlights: z.array(z.string()).optional(),
            divisionBadge: z.string().optional(),
          }),
        )
        .optional(),
      educationList: z
        .array(
          z.object({
            degree: z.string(),
            institution: z.string(),
            year: z.string(),
          }),
        )
        .optional(),
      credentialsList: z
        .array(
          z.object({
            name: z.string(),
            issuingBody: z.string().optional(),
            verificationStatus: z
              .enum(['unverified', 'pending', 'verified', 'rejected', 'needs_info'])
              .optional(),
            documentUrl: z.string().optional(),
          }),
        )
        .optional(),
      profileVisibility: z.enum(['public', 'network_only', 'private']).optional(),
      allowsRecruiterContact: z.boolean().optional(),
      resumeUrl: z.string().optional(),

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
