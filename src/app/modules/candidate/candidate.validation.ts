import { z } from 'zod'

const updateStageZodSchema = z.object({
  body: z.object({
    stage: z.enum([
      'discovered',
      'saved',
      'contacted',
      'interested',
      'interview',
      'offer',
      'hired',
    ]),
  }),
})

const addNoteZodSchema = z.object({
  body: z.object({
    content: z.string().min(1, 'Note content cannot be empty'),
  }),
})

const updateRatingZodSchema = z.object({
  body: z.object({
    rating: z.number().min(1).max(5),
  }),
})

const expressInterestZodSchema = z.object({
  body: z.object({
    opportunityId: z.string().min(1, 'Opportunity ID is required'),
    sharedFields: z
      .object({
        shareContactInfo: z.boolean().default(true),
        shareCareerHistory: z.boolean().default(true),
        shareCredentials: z.boolean().default(true),
        shareRecruitingFootprint: z.boolean().default(true),
      })
      .default({
        shareContactInfo: true,
        shareCareerHistory: true,
        shareCredentials: true,
        shareRecruitingFootprint: true,
      }),
    message: z.string().optional(),
  }),
})

export const CandidateValidation = {
  updateStageZodSchema,
  addNoteZodSchema,
  updateRatingZodSchema,
  expressInterestZodSchema,
}
