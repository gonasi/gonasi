import { z } from 'zod';

export const schema = z.object({
  richTextState: z
    .string({ required_error: 'Rich text is required.' })
    .trim()
    .min(10, 'Rich text must be at least 10 characters long.'),

  id: z.string().optional(),
});

export type RichTextSchema = z.infer<typeof schema>;
