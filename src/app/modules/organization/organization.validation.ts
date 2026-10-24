import { z } from 'zod'

const createOrganizationZodSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    type: z.enum([
      'collegiate_program',
      'professional_team',
      'recruiting_agency',
      'organization',
      'high_school',
    ]),
    role: z
      .enum(['collegiate', 'team', 'agency', 'organization'])
      .optional(),
    logoUrl: z.string().optional(),
    website: z.string().optional(),
    location: z.string().min(1, 'Location is required'),
    state: z.string().min(1, 'State is required'),
    description: z.string().optional(),
    school: z.string().optional(),
    conference: z.string().optional(),
    division: z.enum(['FBS', 'FCS', 'D2', 'D3', 'NAIA', 'JUCO']).optional(),
    sports: z.array(z.string()).optional(),
    league: z.string().optional(),
    city: z.string().optional(),
    specializations: z.array(z.string()).optional(),
  }),
})

const updateOrganizationZodSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    logoUrl: z.string().optional(),
    website: z.string().optional(),
    location: z.string().optional(),
    state: z.string().optional(),
    description: z.string().optional(),
    school: z.string().optional(),
    conference: z.string().optional(),
    division: z.enum(['FBS', 'FCS', 'D2', 'D3', 'NAIA', 'JUCO']).optional(),
    sports: z.array(z.string()).optional(),
    league: z.string().optional(),
    city: z.string().optional(),
    specializations: z.array(z.string()).optional(),
  }),
})

const inviteMemberZodSchema = z.object({
  body: z.object({
    email: z.string().email('Valid email is required'),
    role: z.enum(['admin', 'recruiter', 'staff', 'read_only']),
  }),
})

const updateMemberRoleZodSchema = z.object({
  body: z.object({
    role: z.enum(['admin', 'recruiter', 'staff', 'read_only']),
  }),
})

export const OrganizationValidation = {
  createOrganizationZodSchema,
  updateOrganizationZodSchema,
  inviteMemberZodSchema,
  updateMemberRoleZodSchema,
}
