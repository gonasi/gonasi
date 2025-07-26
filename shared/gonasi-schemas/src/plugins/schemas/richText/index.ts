import { z } from 'zod';

import { BasePluginSettingsSchema } from '../../pluginSettings';
import { NonEmptyLexicalState } from '../../utils';

export const RichTextContentSchema = z.object({
  richTextState: NonEmptyLexicalState,
});

export const RichTextSettingsSchema = BasePluginSettingsSchema.extend({});

export const RichTextSchema = z.object({
  id: z.string().optional(),
  organization_id: z.string({ required_error: 'Organization Id is required.' }),
  course_id: z.string({ required_error: 'Course Id is required.' }),
  chapter_id: z.string({ required_error: 'Chapter Id is required.' }),
  lesson_id: z.string({ required_error: 'Lesson Id is required.' }),
  plugin_type: z.literal('rich_text_editor'),
  content: RichTextContentSchema,
  settings: RichTextSettingsSchema,
});
export type RichTextSchemaTypes = z.infer<typeof RichTextSchema>;
