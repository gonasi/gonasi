import { z } from 'zod';

import { EmailSchema } from '../userValidation';
import { OrganizationRolesEnum } from './organizations-profile-schema';

export * from './organizations-profile-schema';

const OrganizationNameSchema = z
  .string({
    required_error: `Missing <span class="go-title">organization name</span>, this field is required <lucide name="AlertCircle" size="12" />`,
  })
  .min(3, {
    message: `<span class="go-title">Organization name</span> must be at least 3 characters long.`,
  })
  .max(100, {
    message: `Keep your <span class="go-title">organization name</span> under 100 characters to avoid display issues.`,
  })
  .trim();

const OrganizationHandleSchema = z
  .string({
    required_error: `Please provide a <span class="go-title">handle</span> for your organization`,
  })
  .min(3, {
    message: `<span class="go-title">Handle</span> must be at least 3 characters. <lucide name="TextCursorInput" size="12" />`,
  })
  .max(100, {
    message: `Your <span class="go-title">handle</span> is too long, max 100 characters allowed.`,
  })
  .regex(/^[a-zA-Z0-9_-]+$/, {
    message: `Use only letters, numbers, dashes, or underscores in your <span class="go-title">handle</span> <lucide name="Code2" size="12" />`,
  })
  .trim();

const RoleSchema = z
  .string({
    required_error: `<lucide name="AlertCircle" size="12" /> <span class="go-title">Role</span> is required.`,
    invalid_type_error: `<lucide name="Type" size="12" /> <span class="go-title">Role</span> must be a string.`,
  })
  .refine((val) => (OrganizationRolesEnum.options as readonly string[]).includes(val), {
    message: `Invalid value for <span class="go-title">role</span>. <lucide name="ShieldAlert" size="12" /> Please select a valid role from the allowed list.`,
  })
  .refine((val) => val !== 'owner', {
    message: `<lucide name="UserMinus" size="12" /> You cannot invite someone as the <span class="go-title">owner</span>.`,
  });

export const NewOrganizationSchema = z.object({
  name: OrganizationNameSchema,
  handle: OrganizationHandleSchema,
});

export type NewOrganizationSchemaTypes = z.infer<typeof NewOrganizationSchema>;

export const SetActiveOrganizationSchema = z.object({
  organizationId: z
    .string({
      required_error: 'Organization ID is required.',
      invalid_type_error: 'Organization ID must be a string.',
    })
    .uuid({ message: 'Invalid organization ID.' }),
});

export type SetActiveOrganizationSchemaTypes = z.infer<typeof SetActiveOrganizationSchema>;

export const InviteMemberToOrganizationSchema = z.object({
  organizationId: z
    .string({
      required_error: 'Organization ID is required.',
      invalid_type_error: 'Organization ID must be a string.',
    })
    .uuid({ message: 'Invalid organization ID.' }),
  email: EmailSchema,
  role: RoleSchema,
});

export type InviteMemberToOrganizationSchemaTypes = z.infer<
  typeof InviteMemberToOrganizationSchema
>;

export const ResendInviteToOrganizationEmailSchema = z.object({
  organizationId: z.string(),
  token: z.string(),
});

export type ResendInviteToOrganizationEmailSchemaTypes = z.infer<
  typeof ResendInviteToOrganizationEmailSchema
>;

export const RevokeInviteToOrganizationSchema = z.object({
  organizationId: z.string(),
  token: z.string(),
});

export type RevokeInviteToOrganizationSchemaTypes = z.infer<
  typeof RevokeInviteToOrganizationSchema
>;

export const ExitOrganizationSchema = z.object({
  organizationId: z.string(),
});

export type ExitOrganizationSchemaTypes = z.infer<typeof ExitOrganizationSchema>;

export const UpdateMemberRoleSchema = z.object({
  organizationId: z.string(),
  memberId: z.string(),
  role: OrganizationRolesEnum,
});

export type UpdateMemberRoleSchemaTypes = z.infer<typeof UpdateMemberRoleSchema>;

export const DeleteMemberFromOrganizationSchema = z.object({
  organizationId: z.string(),
  memberId: z.string(),
});

export type DeleteMemberFromOrganizationSchemaTypes = z.infer<
  typeof DeleteMemberFromOrganizationSchema
>;
