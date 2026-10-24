import { z } from 'zod'

const createOpportunityZodSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    position: z.string().min(1, 'Position is required'),
    level: z.string().min(1, 'Level is required'),
    type: z
      .enum([
        'full_time',
        'part_time',
        'contract',
        'volunteer',
        'clinic',
        'camp',
        'event',
      ])
      .default('full_time'),
    location: z.string().min(1, 'Location is required'),
    isRemote: z.boolean().default(false),
    description: z.string().min(1, 'Description is required'),
    requirements: z.array(z.string()).default([]),
    preferredQualifications: z.array(z.string()).optional(),
    status: z
      .enum(['draft', 'active', 'paused', 'closed', 'filled'])
      .default('active'),
    isFeatured: z.boolean().optional(),
    isSponsored: z.boolean().optional(),
    isUrgent: z.boolean().optional(),
    closingAt: z.string().optional(),
  }),
})

const updateOpportunityZodSchema = z.object({
  body: z.object({
    title: z.string().optional(),
    position: z.string().optional(),
    level: z.string().optional(),
    type: z
      .enum([
        'full_time',
        'part_time',
        'contract',
        'volunteer',
        'clinic',
        'camp',
        'event',
      ])
      .optional(),
    location: z.string().optional(),
    isRemote: z.boolean().optional(),
    description: z.string().optional(),
    requirements: z.array(z.string()).optional(),
    preferredQualifications: z.array(z.string()).optional(),
    status: z
      .enum(['draft', 'active', 'paused', 'closed', 'filled'])
      .optional(),
    isFeatured: z.boolean().optional(),
    isSponsored: z.boolean().optional(),
    isUrgent: z.boolean().optional(),
    closingAt: z.string().optional(),
  }),
})

const expressInterestZodSchema = z.object({
  body: z.object({
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

export const OpportunityValidation = {
  createOpportunityZodSchema,
  updateOpportunityZodSchema,
  expressInterestZodSchema,
}
