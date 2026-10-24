import { z } from 'zod'

const contactZodSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().min(1, 'Email is required').email('Invalid email format'),
    phone: z.string().min(1, 'Phone number is required'),
    country: z.string().min(1, 'Country is required'),
    message: z.string().min(1, 'Message is required'),
  }),
})

export const PublicValidation = {
  create: z.object({
    body: z.object({
      content: z.string(),
      type: z.enum([
        'privacy-policy',
        'terms-and-condition',
        'contact',
        'about',
      ]),
    }),
  }),

  update: z.object({
    body: z.object({
      content: z.string(),
      type: z.enum([
        'privacy-policy',
        'terms-and-condition',
        'contact',
        'about',
      ]),
    }),
  }),
  contactZodSchema,
}

export const FaqValidations = {
  create: z.object({
    body: z.object({
      question: z.string(),
      answer: z.string(),
    }),
  }),

  update: z.object({
    body: z.object({
      question: z.string().optional(),
      answer: z.string().optional(),
    }),
  }),
}

export const updatePublicZodSchema = z.object({
  body: z.object({
    content: z.string(),
  }),
})
