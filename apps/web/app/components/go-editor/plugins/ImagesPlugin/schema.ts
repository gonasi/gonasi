import { z } from 'zod';

import { NewImageSchema } from '@gonasi/schemas/userValidation';

const AltTextSchema = z
  .string({ required_error: 'Please enter alternative text for the image.' })
  .min(3, { message: 'Alternative text must be at least 3 characters long.' })
  .max(100, { message: 'Alternative text cannot exceed 100 characters.' })
  .refine((val) => /^[A-Za-z]+(?: [A-Za-z]+)*$/.test(val), {
    message:
      'Use only letters with single spaces between words. No extra spaces at the start or end.',
  });

// NewEditorImageSchema definition
export const NewEditorImageSchema = z.object({
  altText: AltTextSchema,
  src: NewImageSchema,
});
