import { z } from 'zod';

import { NewImageSchema } from '../../../userValidation';

export const HandleSchema = z
  .string({
    required_error: `<lucide name="Building2" size="12" /> Please enter an <span class="go-title">organization handle</span>`,
  })
  .min(3, {
    message: `<span class="go-title">Handle</span> must be at least 3 characters long <lucide name="ArrowRight" size="12" />`,
  })
  .max(50, {
    message: `<span class="go-title">Handle</span> is too long — keep it under 50 characters <lucide name="ScanLine" size="12" />`,
  })
  .trim()
  .toLowerCase()
  .regex(/^(?!.*[-._]{2})(?![-._])[a-z0-9][-a-z0-9._]*[a-z0-9]$/, {
    message: `<span class="go-title">Handle</span> can include lowercase letters, numbers, dashes (-), dots (.), and underscores (_) — but no consecutive symbols or symbols at the start/end <lucide name="Code2" size="12" />`,
  })
  .transform((value) => value.toLowerCase());

export const OrganizationNameSchema = z
  .string({
    required_error: `<lucide name="User" size="12" /> We’ll need a <span class="go-title">name</span> for your organization`,
  })
  .min(3, {
    message: `That <span class="go-title">name</span> is a little short <lucide name="MoveVertical" size="12" />`,
  })
  .max(100, {
    message: `That <span class="go-title">name</span> is quite long — consider trimming it <lucide name="ScanLine" size="12" />`,
  })
  .trim()
  .refine((val) => /^[A-Za-z0-9&.,'’\-]+(?: [A-Za-z0-9&.,'’\-]+)*$/.test(val), {
    message: `<span class="go-title">Name</span> can include letters, numbers, and simple punctuation <lucide name="Type" size="12" />`,
  });

export const UpdateOrganizationInformationSchema = z.object({
  updateType: z.literal('organization-information'),
  organizationId: z.string(),
  name: OrganizationNameSchema,
  handle: HandleSchema,
  description: z
    .string({
      required_error: `<lucide name="AlignLeft" size="12" /> Add a short <span class="go-title">description</span> for your organization`,
    })
    .min(10, {
      message: `<span class="go-title">Description</span> is too short — use at least 10 characters <lucide name="ArrowDown" size="12" />`,
    })
    .max(500, {
      message: `<span class="go-title">Description</span> is too long — keep it under 500 characters <lucide name="AlignVerticalSpaceAround" size="12" />`,
    }),

  websiteUrl: z
    .string()
    .url({
      message: `Please enter a valid <span class="go-title">website URL</span> (include http:// or https://) <lucide name="Globe" size="12" />`,
    })
    .nullable(),
});

export type UpdateOrganizationInformationSchemaTypes = z.infer<
  typeof UpdateOrganizationInformationSchema
>;

// UpdateOrganizationProfilePictureSchema definition
export const UpdateOrganizationProfilePictureSchema = z.object({
  organizationId: z.string(),
  updateType: z.literal('organization-profile-picture'),
  image: NewImageSchema,
});
export type UpdateOrganizationProfilePictureSchemaTypes = z.infer<
  typeof UpdateOrganizationProfilePictureSchema
>;

export const UpdateOrganizationBannerSchema = z.object({
  organizationId: z.string(),
  updateType: z.literal('organization-banner'),
  image: NewImageSchema,
});
export type UpdateOrganizationBannerSchemaTypes = z.infer<typeof UpdateOrganizationBannerSchema>;

// Union schema for all organization settings updates
export const OrganizationSettingsUpdateSchema = z.discriminatedUnion('updateType', [
  UpdateOrganizationInformationSchema,
  UpdateOrganizationProfilePictureSchema,
  UpdateOrganizationBannerSchema,
]);
