import { z } from 'zod';

import { EmailSchema, PasswordSchema } from '../userValidation';

export const LoginFormSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
  redirectTo: z.string().optional().nullable(),
});

export type LoginFormSchemaTypes = z.infer<typeof LoginFormSchema>;

export const SignupFormSchema = z.object({
  fullName: z
    .string({ required_error: 'Please enter your full name or company name.' })
    .trim()
    .min(5, 'Name must be at least 5 characters long.')
    .max(100, 'Name can’t be longer than 100 characters.'),

  email: EmailSchema,
  password: PasswordSchema,
  redirectTo: z.string().optional().nullable(),
});

export type SignupFormSchemaTypes = z.infer<typeof SignupFormSchema>;
