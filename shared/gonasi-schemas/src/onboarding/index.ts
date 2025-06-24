import { z } from 'zod';

import { FullNameSchema, UsernameSchema } from '../userValidation';

export const OnboardingSchema = z.object({
  fullName: FullNameSchema,
  username: UsernameSchema,
});

export type OnboardingSchemaTypes = z.infer<typeof OnboardingSchema>;
