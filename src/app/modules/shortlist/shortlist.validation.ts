import { z } from 'zod'

const createShortlistZodSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Shortlist name is required'),
    description: z.string().optional(),
    coaches: z.array(z.string()).optional(),
  }),
})

const updateShortlistZodSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    description: z.string().optional(),
  }),
})

const addCoachToShortlistZodSchema = z.object({
  params: z.object({
    shortlistId: z.string().min(1, 'Shortlist ID is required'),
    coachId: z.string().min(1, 'Coach ID is required'),
  }),
})

export const ShortlistValidation = {
  createShortlistZodSchema,
  updateShortlistZodSchema,
  addCoachToShortlistZodSchema,
}
