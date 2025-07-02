import { z } from 'zod';

export const OrganizationSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  handle: z.string(),
  description: z.string().nullable(),
  website_url: z.string().url().nullable(),
  avatar_url: z.string().url().nullable(),
  blur_hash: z.string().nullable(),
  banner_url: z.string().url().nullable(),
  banner_blur_hash: z.string().nullable(),
  is_public: z.boolean(),
  is_verified: z.boolean(),
  email: z.string().email().nullable(),
  phone_number: z.string().nullable(),
  phone_number_verified: z.boolean(),
  email_verified: z.boolean(),
  whatsapp_number: z.string().nullable(),
  location: z.string().nullable(),
  tier: z.string(), // Optionally: z.enum(['launch', 'pro', ...])
  created_at: z.string(),
  updated_at: z.string(),
  created_by: z.string().uuid(),
  owned_by: z.string().uuid(),
  updated_by: z.string().uuid(),
  deleted_by: z.string().uuid().nullable(),
});

export const OrganizationMemberSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  user_id: z.string().uuid(),
  role: z.string(), // Optionally: z.enum(['owner', 'admin', 'staff'])
  invited_by: z.string().uuid(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const VerifyAndSetActiveOrgResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().nullable(),
  data: z
    .object({
      organization: OrganizationSchema,
      member: OrganizationMemberSchema,
    })
    .nullable(),
});

export type Organization = z.infer<typeof OrganizationSchema>;
export type OrganizationMember = z.infer<typeof OrganizationMemberSchema>;
export type VerifyAndSetActiveOrgResponse = z.infer<typeof VerifyAndSetActiveOrgResponseSchema>;
