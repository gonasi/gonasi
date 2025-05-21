import { z } from 'zod';

import { BasePluginSettingsSchema } from './pluginSettings';

export const RichTextContentSchema = z.object({
  content: z
    .string({ required_error: 'Rich text content is required.' })
    .trim()
    .min(10, 'Rich text content must be at least 10 characters long.'),
});

export const RichTextSettingsSchema = BasePluginSettingsSchema.extend({});

export const SubmitCreateRichTextSchema = RichTextContentSchema.extend({
  lessonId: z.string({ required_error: 'Lesson ID is required.' }),
  pluginType: z.literal('rich_text_editor').default('rich_text_editor'),
  weight: z.number().default(1),
  settings: RichTextSettingsSchema.default({}),
});

export const SubmitEditRichTextSettingsSchema = RichTextSettingsSchema.extend({
  blockId: z.string({ required_error: 'Block ID is required.' }),
});

export type RichTextContentSchemaType = z.infer<typeof RichTextContentSchema>;
export type RichTextSettingsSchemaType = z.infer<typeof RichTextSettingsSchema>;
export type SubmitCreateRichTextSchemaType = z.infer<typeof SubmitCreateRichTextSchema>;
export type SubmitEditRichTextSettingsSchemaType = z.infer<typeof SubmitEditRichTextSettingsSchema>;
