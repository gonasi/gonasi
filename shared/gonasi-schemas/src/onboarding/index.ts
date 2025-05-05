import { z } from 'zod';

import { FullNameSchema, PhoneNumberSchema, UsernameSchema } from '../userValidation';

export const BasicInformationSchema = z.object({
  fullName: FullNameSchema,
  username: UsernameSchema,
});

export const ContactInformationSchema = z.object({
  phoneNumber: PhoneNumberSchema,
});

export type BasicInformationType = z.infer<typeof BasicInformationSchema>;
export type ContactInformationType = z.infer<typeof ContactInformationSchema>;
