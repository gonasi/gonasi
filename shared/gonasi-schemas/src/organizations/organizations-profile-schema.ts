import { z } from 'zod';

// Enums
const SubscriptionTierEnum = z.enum(['temp', 'launch', 'scale', 'impact']);
const AnalyticsLevelEnum = z.enum(['none', 'basic', 'intermediate', 'advanced']);
const SupportLevelEnum = z.enum(['none', 'community', 'email', 'priority']);
const SubscriptionStatusEnum = z.enum([
  'active',
  'non-renewing',
  'attention',
  'completed',
  'cancelled',
]);

export const OrganizationRolesEnum = z.enum(['owner', 'admin', 'editor']);

export type OrganizationRolesEnumTypes = z.infer<typeof OrganizationRolesEnum>;

// Remove 'owner' from the list
export const OrganizationRolesArrayWithoutOwner = OrganizationRolesEnum.options.filter(
  (role) => role !== 'owner',
);

// Convert to SelectOption[]: { label, value }
export const OrganizationRoleOptions: { label: string; value: string }[] =
  OrganizationRolesArrayWithoutOwner.map((role) => ({
    label: role.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    value: role,
  }));

// Core Organization (tier field removed)
export const OrganizationSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  handle: z.string(),
  description: z.string().nullable(),
  website_url: z.string().url().nullable(),
  avatar_url: z.string().nullable(),
  blur_hash: z.string().nullable(),
  banner_url: z.string().nullable(),
  banner_blur_hash: z.string().nullable(),
  is_public: z.boolean(),
  is_verified: z.boolean(),
  email: z.string().email().nullable(),
  email_verified: z.boolean(),
  phone_number: z.string().nullable(),
  phone_number_verified: z.boolean(),
  whatsapp_number: z.string().nullable(),
  location: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  created_by: z.string().uuid().nullable(),
  owned_by: z.string().uuid().nullable(),
  updated_by: z.string().uuid().nullable(),
  deleted_by: z.string().uuid().nullable(),
});

// Organization Subscription
export const OrganizationSubscriptionSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  tier: SubscriptionTierEnum,
  next_tier: SubscriptionTierEnum.nullable(),
  next_plan_code: z.string().nullable(),
  downgrade_requested_at: z.string().nullable(),
  downgrade_effective_at: z.string().nullable(),
  downgrade_executed_at: z.string().nullable(),
  downgrade_requested_by: z.string().uuid().nullable(),
  paystack_customer_code: z.string().nullable(),
  paystack_subscription_code: z.string().nullable(),
  status: SubscriptionStatusEnum,
  start_date: z.string(),
  current_period_start: z.string(),
  current_period_end: z.string().nullable(),
  cancel_at_period_end: z.boolean(),
  next_payment_date: z.string().nullable(),
  initial_next_payment_date: z.string().nullable(),
  revert_tier: SubscriptionTierEnum.nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  created_by: z.string().uuid().nullable(),
  updated_by: z.string().uuid().nullable(),
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
  storage_limit_mb_per_org: z.number(),
  max_members_per_org: z.number(),
  max_free_courses_per_org: z.number(),
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
      subscription: OrganizationSubscriptionSchema,
      member: OrganizationMemberSchema,
      permissions: z.object({
        can_accept_new_member: z.boolean(),
      }),
      tier_limits: TierLimitsSchema,
    })
    .nullable(),
});

// Types
export type Organization = z.infer<typeof OrganizationSchema>;
export type OrganizationSubscription = z.infer<typeof OrganizationSubscriptionSchema>;
export type OrganizationMember = z.infer<typeof OrganizationMemberSchema>;
export type TierLimits = z.infer<typeof TierLimitsSchema>;
export type VerifyAndSetActiveOrgResponse = z.infer<typeof VerifyAndSetActiveOrgResponseSchema>;
