import { z } from 'zod';

import { BasePluginSettingsSchema } from './pluginSettings';
import { NonEmptyLexicalState } from './utils';

export const RichTextContentSchema = z.object({
  richTextState: NonEmptyLexicalState,
});

export const RichTextSettingsSchema = BasePluginSettingsSchema.extend({});

export const RichTextSchema = z.object({
  blockId: z.string().optional(),
  courseId: z.string({ required_error: 'Course Id is required.' }),
  lessonId: z.string({ required_error: 'Lesson Id is required.' }),
  pluginType: z.literal('rich_text_editor'),
  content: RichTextContentSchema,
  settings: RichTextSettingsSchema,
});

export type RichTextSchemaTypes = z.infer<typeof RichTextSchema>;

// TODO: Delete all below when finished

//
// Edit Block Settings Schema
//
export const SubmitEditRichTextSettingsSchema = RichTextSettingsSchema.extend({
  blockId: z.string({ required_error: 'Block ID is required.' }),
});

//
// Interaction Schema
//
export const RichTextStateInteractionSchema = z.object({
  continue: z.boolean().default(false),
});

//
// Types
//
export type RichTextContentSchemaType = z.infer<typeof RichTextContentSchema>;
export type RichTextSettingsSchemaType = z.infer<typeof RichTextSettingsSchema>;
export type SubmitEditRichTextSettingsSchemaType = z.infer<typeof SubmitEditRichTextSettingsSchema>;
export type RichTextStateInteractionSchemaType = z.infer<typeof RichTextStateInteractionSchema>;
