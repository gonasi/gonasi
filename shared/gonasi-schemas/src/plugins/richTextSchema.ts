import { z } from 'zod';

import { BaseInteractionSchema } from './baseInteractionSchema';
import { BasePluginSettingsSchema } from './pluginSettings';

//
// Content Schema
//
export const RichTextContentSchema = z.object({
  content: z
    .string({ required_error: 'Rich text content is required.' })
    .trim()
    .min(10, 'Rich text content must be at least 10 characters long.'),
});

//
// Plugin Settings Schema
//
export const RichTextSettingsSchema = BasePluginSettingsSchema.extend({});

//
// Create Block Schema
//
export const SubmitCreateRichTextSchema = RichTextContentSchema.extend({
  lessonId: z.string({ required_error: 'Lesson ID is required.' }),
  pluginType: z.literal('rich_text_editor').default('rich_text_editor'),
  weight: z.number().default(1),
  settings: RichTextSettingsSchema.default({}),
});

//
// Edit Block Settings Schema
//
export const SubmitEditRichTextSettingsSchema = RichTextSettingsSchema.extend({
  blockId: z.string({ required_error: 'Block ID is required.' }),
});

//
// Interaction Schema
//
export const RichTextInteractionSchema = BaseInteractionSchema.extend({
  continue: z.boolean().default(false),
});

//
// Types
//
export type RichTextContentSchemaType = z.infer<typeof RichTextContentSchema>;
export type RichTextSettingsSchemaType = z.infer<typeof RichTextSettingsSchema>;
export type SubmitCreateRichTextSchemaType = z.infer<typeof SubmitCreateRichTextSchema>;
export type SubmitEditRichTextSettingsSchemaType = z.infer<typeof SubmitEditRichTextSettingsSchema>;
export type RichTextInteractionSchemaType = z.infer<typeof RichTextInteractionSchema>;
