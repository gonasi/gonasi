import { z } from 'zod';

// Enums
const SubscriptionTierEnum = z.enum(['launch', 'scale', 'impact', 'enterprise']);
const AnalyticsLevelEnum = z.enum(['basic', 'intermediate', 'advanced', 'enterprise']);
const SupportLevelEnum = z.enum(['community', 'email', 'priority', 'dedicated']);

export const OrganizationRolesEnum = z.enum(['owner', 'admin', 'editor']);

export type OrganizationRolesEnumTypes = z.infer<typeof OrganizationRolesEnum>;

// Remove 'owner' from the list
export const OrganizationRolesArrayWithoutOwner = OrganizationRolesEnum.options.filter(
  (role) => role !== 'owner',
);

// Convert to SelectOption[]: { label, value }
export const OrganizationRoleOptions: { label: string; value: string }[] =
  OrganizationRolesArrayWithoutOwner.map((role) => ({
    label: role.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()), // optional formatting
    value: role,
  }));

// Core Organization
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
  email_verified: z.boolean(),
  phone_number: z.string().nullable(),
  phone_number_verified: z.boolean(),
  whatsapp_number: z.string().nullable(),
  location: z.string().nullable(),
  tier: SubscriptionTierEnum,
  created_at: z.string(),
  updated_at: z.string(),
  created_by: z.string().uuid().nullable(),
  owned_by: z.string().uuid().nullable(),
  updated_by: z.string().uuid().nullable(),
  deleted_by: z.string().uuid().nullable(),
});

// Organization Member
export const OrganizationMemberSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  user_id: z.string().uuid(),
  role: OrganizationRolesEnum,
  invited_by: z.string().uuid().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

// Tier Limits
export const TierLimitsSchema = z.object({
  tier: SubscriptionTierEnum,
  max_departments_per_org: z.number(),
  storage_limit_mb_per_org: z.number(),
  max_members_per_org: z.number(),
  max_collaborators_per_course: z.number(),
  max_free_courses_per_org: z.number(),
  max_students_per_course: z.number(),
  ai_tools_enabled: z.boolean(),
  ai_usage_limit_monthly: z.number().nullable(),
  custom_domains_enabled: z.boolean(),
  max_custom_domains: z.number().nullable(),
  analytics_level: AnalyticsLevelEnum,
  support_level: SupportLevelEnum,
  platform_fee_percentage: z.number(),
  white_label_enabled: z.boolean(),
});

// Final Response
export const VerifyAndSetActiveOrgResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().nullable(),
  data: z
    .object({
      organization: OrganizationSchema,
      member: OrganizationMemberSchema,
      permissions: z.object({
        can_add_org_member: z.boolean(),
      }),
      tier_limits: TierLimitsSchema,
    })
    .nullable(),
});

// Types
export type Organization = z.infer<typeof OrganizationSchema>;
export type OrganizationMember = z.infer<typeof OrganizationMemberSchema>;
export type TierLimits = z.infer<typeof TierLimitsSchema>;
export type VerifyAndSetActiveOrgResponse = z.infer<typeof VerifyAndSetActiveOrgResponseSchema>;
