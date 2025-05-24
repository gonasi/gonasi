import { z } from 'zod';

export const RichTextStateInteractionSchema = z.object({
  continue: z.boolean().default(false),
});
