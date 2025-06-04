import { z } from 'zod';

import { FullNameSchema, PhoneNumberSchema, UsernameSchema } from '../userValidation';

export const BasicInformationSchema = z.object({
  fullName: FullNameSchema,
  username: UsernameSchema,
});

export const ContactInformationSchema = z.object({
  phoneNumber: PhoneNumberSchema,
});

// Merge schemas
export const CombinedInformationSchema = BasicInformationSchema.merge(ContactInformationSchema);

export type BasicInformationSchemaTypes = z.infer<typeof BasicInformationSchema>;
export type ContactInformationSchemaTypes = z.infer<typeof ContactInformationSchema>;
export type CombinedInformationSchemaTypes = z.infer<typeof CombinedInformationSchema>;
