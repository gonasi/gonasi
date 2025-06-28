import { z } from 'zod';

import { FullNameSchema, NewImageSchema, UsernameSchema } from '../../userValidation';

export const UpdatePersonalInformationSchema = z.object({
  updateType: z.literal('personal-information'),
  username: UsernameSchema,
  fullName: FullNameSchema,
});

export type UpdatePersonalInformationSchemaTypes = z.infer<typeof UpdatePersonalInformationSchema>;

// UpdateProfilePictureSchema definition
export const UpdateProfilePictureSchema = z.object({
  updateType: z.literal('profile-picture'),
  image: NewImageSchema,
});
export type UpdateProfilePictureSchemaTypes = z.infer<typeof UpdateProfilePictureSchema>;

export const ToggleProfileVisibilitySchema = z.object({
  updateType: z.literal('profile-visibility'),
  isPublic: z.boolean(),
});
export type ToggleProfileVisibilitySchemaTypes = z.infer<typeof ToggleProfileVisibilitySchema>;

export const AccountSettingsUpdateSchema = z.discriminatedUnion('updateType', [
  UpdatePersonalInformationSchema,
  UpdateProfilePictureSchema,
  ToggleProfileVisibilitySchema,
]);
