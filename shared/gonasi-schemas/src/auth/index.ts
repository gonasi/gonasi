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
    .string({
      required_error:
        '<lucide name="User" size="12" /> Please enter your <span class="go-title">full name</span> or <span class="go-title">company name</span>',
    })
    .trim()
    .min(5, {
      message:
        '<span class="warning">That name’s a bit short</span> minimum 5 characters <lucide name="ArrowRight" size="12" />',
    })
    .max(100, {
      message:
        '<span class="warning">That’s a long one</span> — keep it under 100 characters <lucide name="ScanLine" size="12" />',
    }),
  email: EmailSchema,
  password: PasswordSchema,
  redirectTo: z.string().optional().nullable(),
});

export type SignupFormSchemaTypes = z.infer<typeof SignupFormSchema>;

export const SignOutFormSchema = z.object({
  intent: z.literal('signout'),
});

export type SignOutFormSchemaTypes = z.infer<typeof SignOutFormSchema>;
