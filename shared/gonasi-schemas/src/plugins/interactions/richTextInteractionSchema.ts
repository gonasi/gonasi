import { z } from 'zod';

export const RichTextInteractionSchema = z.object({
  continue: z.boolean().default(false),
});
