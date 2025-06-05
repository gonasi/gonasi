import { z } from 'zod';

const MAX_SIZE = 1024 * 1024 * 5; // 5MB
const VALID_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];

export const EmailSchema = z
  .string({ required_error: 'Please enter your email' })
  .email({ message: 'That doesn’t look like a valid email' })
  .min(3, { message: 'Email seems too short' })
  .max(100, { message: 'Email is a bit too long' })
  .transform((value) => value.toLowerCase());

export const PasswordSchema = z
  .string({ required_error: 'Password is missing' })
  .min(6, { message: 'Try a longer password (6+ characters)' })
  .refine((val) => new TextEncoder().encode(val).length <= 72, {
    message: 'Password is too long. Keep it under 72 characters',
  });

export const FullNameSchema = z
  .string({ required_error: 'Name is required' })
  .min(3, { message: 'Name is too short' })
  .max(100, { message: 'Name is too long' })
  .refine((val) => /^[A-Za-z]+(?: [A-Za-z]+)*$/.test(val), {
    message: 'Only use letters and single spaces between words',
  });

export const UsernameSchema = z
  .string({ required_error: 'Username is required' })
  .min(3, { message: 'Username is too short' })
  .max(50, { message: 'Username is too long' })
  .trim()
  .toLowerCase()
  .regex(/^(?!.*[_.]{2})[a-z0-9][a-z0-9._]*[a-z0-9]$/, {
    message:
      'Use only letters, numbers, dots, and underscores. No starting or ending with them, and no doubles',
  })
  .transform((value) => value.toLowerCase());

export const PhoneNumberSchema = z
  .string({ required_error: 'Phone number is required' })
  .trim()
  .length(9, { message: 'Phone number should be 9 digits' })
  .regex(/^\d{9}$/, { message: 'Only digits please' });

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
      message: 'Looks like no image was selected',
    });
  }

  if (file.size > MAX_SIZE) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Image must be under 5MB',
    });
  }

  if (!VALID_IMAGE_TYPES.includes(file.type)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Only PNG, JPG, JPEG or GIF images are allowed 🖼️',
    });
  }
});
