import { z } from 'zod';

import { FullNameSchema, UsernameSchema } from '../../userValidation';

export const UpdatePersonalInformationSchema = z.object({
  updateType: z.literal('personal-information'),
  username: UsernameSchema,
  fullName: FullNameSchema,
});

export type UpdatePersonalInformationSchemaTypes = z.infer<typeof UpdatePersonalInformationSchema>;

export const AccountSettingsUpdateSchema = z.discriminatedUnion('updateType', [
  UpdatePersonalInformationSchema,
]);
