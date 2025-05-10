import { z } from 'zod';

import { PluginSettingsSchema } from './pluginSettings';

export const RichTextSchema = z.object({
  richTextState: z
    .string({ required_error: 'Rich text is required.' })
    .trim()
    .min(10, 'Rich text must be at least 10 characters long.'),

  id: z.string().optional(),
});

export const RichTextSettingsSchema = PluginSettingsSchema.extend({});

export type RichTextSchemaType = z.infer<typeof RichTextSchema>;
export type RichTextSettingsType = z.infer<typeof RichTextSettingsSchema>;
