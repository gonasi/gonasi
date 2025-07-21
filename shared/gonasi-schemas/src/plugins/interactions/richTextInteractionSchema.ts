import { z } from 'zod';

export const RichTextStateInteractionSchema = z.object({
  plugin_type: z.literal('rich_text_editor'),
  continue: z.literal(true),
});
