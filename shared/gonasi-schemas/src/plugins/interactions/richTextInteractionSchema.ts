import { z } from 'zod';

export const RichTextInteractionSchema = z.object({
  action: z.literal('continue'),
});
