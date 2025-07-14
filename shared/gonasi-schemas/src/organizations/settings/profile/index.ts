import { z } from 'zod';

import { FullNameSchema, NewImageSchema, UsernameSchema } from '../../../userValidation';

// UpdateOrganizationInformationSchema definition
export const UpdateOrganizationInformationSchema = z.object({
  updateType: z.literal('organization-information'),
  username: UsernameSchema,
  name: FullNameSchema,
  description: z.string(),
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
