import { z } from 'zod';

import { EmailSchema, PasswordSchema } from '../userValidation';

export const LoginFormSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
  redirectTo: z.string().optional(),
});

export type LoginTypes = z.infer<typeof LoginFormSchema>;
