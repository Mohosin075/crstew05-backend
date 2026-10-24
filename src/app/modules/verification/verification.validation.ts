import { z } from 'zod'

const submitVerificationZodSchema = z.object({
  body: z.object({
    entityId: z.string().min(1, 'Entity ID is required'),
    entityType: z.enum([
      'coach_identity',
      'coach_experience',
      'coach_credential',
      'organization',
      'collegiate_program',
      'professional_team',
      'recruiting_agency',
    ]),
    entityName: z.string().min(1, 'Entity Name is required'),
    documents: z
      .array(
        z.object({
          name: z.string().min(1),
          url: z.string().min(1),
          mimeType: z.string().default('application/pdf'),
        }),
      )
      .default([]),
  }),
})

const approveVerificationZodSchema = z.object({
  body: z.object({
    note: z.string().optional(),
  }),
})

const rejectVerificationZodSchema = z.object({
  body: z.object({
    reason: z.string().min(1, 'Rejection reason is required'),
  }),
})

const requestInfoZodSchema = z.object({
  body: z.object({
    note: z.string().min(1, 'Information note is required'),
  }),
})

export const VerificationValidation = {
  submitVerificationZodSchema,
  approveVerificationZodSchema,
  rejectVerificationZodSchema,
  requestInfoZodSchema,
}
