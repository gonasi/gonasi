import { z } from 'zod';

import { PluginSettingsSchema } from './pluginSettings';

export const RichTextContent = z.object({
  data: z.object({
    richTextState: z
      .string({ required_error: 'Rich text is required.' })
      .trim()
      .min(10, 'Rich text must be at least 10 characters long.'),

    id: z.string().optional(),
  }),
  settings: PluginSettingsSchema,
});

export type RichTextSchema = z.infer<typeof RichTextContent>;
