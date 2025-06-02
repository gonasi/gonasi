import { z } from 'zod';

const MAX_SIZE = 1024 * 1024 * 5; // 5MB
const VALID_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];

export const EmailSchema = z
  .string({ required_error: 'Email is required' })
  .email({ message: 'Email is invalid' })
  .min(3, { message: 'Email is too short' })
  .max(100, { message: 'Email is too long' })
  // users can type the email in any case, but we store it in lowercase
  .transform((value) => value.toLowerCase());

export const PasswordSchema = z
  .string({ required_error: 'Password is required' })
  .min(6, { message: 'Password is too short' })
  // NOTE: bcrypt has a limit of 72 bytes (which should be plenty long)
  // https://github.com/epicweb-dev/epic-stack/issues/918
  .refine((val) => new TextEncoder().encode(val).length <= 72, {
    message: 'Password is too long',
  });

export const FullNameSchema = z
  .string({ required_error: 'Name is required' })
  .min(3, { message: 'Name is too short' })
  .max(100, { message: 'Name is too long' })
  .refine((val) => /^[A-Za-z]+(?: [A-Za-z]+)*$/.test(val), {
    message: 'Name must have only one space between words and no leading/trailing spaces',
  });

export const UsernameSchema = z
  .string({ required_error: 'Username is required' })
  .min(3, { message: 'Username is too short' })
  .max(50, { message: 'Username is too long' })
  .trim()
  .toLowerCase()
  .regex(/^(?!.*[_.]{2})[a-z0-9][a-z0-9._]*[a-z0-9]$/, {
    message:
      'Invalid username: use only letters, numbers, dots, and underscores (no consecutive dots/underscores, cannot start or end with them)',
  })
  .transform((value) => value.toLowerCase());

export const PhoneNumberSchema = z
  .string({ required_error: 'Phone number is required' })
  .trim()
  .length(9, { message: 'Phone number must be exactly 9 digits' })
  .regex(/^\d{9}$/, { message: 'Phone number must contain only digits' });

export const NewImageSchema = z.any().superRefine((file, ctx) => {
  if (!(file instanceof File)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Please select a valid image file',
    });
    return;
  }

  if (file.size === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Image is required',
    });
  }

  if (file.size > MAX_SIZE) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Image size must be less than 5MB',
    });
  }

  if (!VALID_IMAGE_TYPES.includes(file.type)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Only PNG, JPG images are allowed',
    });
  }
});
