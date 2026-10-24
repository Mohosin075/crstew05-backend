import { z } from 'zod'

const searchSuggestionsSchema = z.object({
  query: z.object({
    q: z.string().min(1, 'Search query (q) is required'),
  }),
})

const geocodeAddressSchema = z.object({
  query: z.object({
    address: z.string().min(1, 'Address is required'),
  }),
})

export const LocationValidation = {
  searchSuggestionsSchema,
  geocodeAddressSchema,
}
