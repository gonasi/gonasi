import { z } from 'zod';

import { BasePluginSettingsSchema, LayoutPluginSettingsSchema } from '../../pluginSettings';

//
// Content Schema
//
export const TrueOrFalseContentSchema = z.object({
  questionState: z
    .string({ required_error: 'Question is required.' })
    .trim()
    .min(5, 'The question must be at least 5 characters long.'),

  correctAnswer: z.enum(['true', 'false'], {
    required_error: 'Select whether the correct answer is true or false.',
  }),

  hint: z
    .string()
    .trim()
    .min(10, 'Hint must be at least 10 characters.')
    .max(100, 'Hint must be 100 characters or fewer.')
    .optional(),

  explanationState: z
    .string({ required_error: 'Explanation is required.' })
    .trim()
    .min(10, 'The explanation must be at least 10 characters long.'),
});
export type TrueOrFalseContentSchemaTypes = z.infer<typeof TrueOrFalseContentSchema>;

export const TrueOrFalseSettingsSchema = BasePluginSettingsSchema.merge(
  LayoutPluginSettingsSchema,
).extend({});
export type TrueOrFalseSettingsSchemaTypes = z.infer<typeof TrueOrFalseSettingsSchema>;

export const TrueOrFalseSchema = z.object({
  id: z.string().optional(),
  organization_id: z.string({ required_error: 'Organization Id is required.' }),
  course_id: z.string({ required_error: 'Course Id is required.' }),
  chapter_id: z.string({ required_error: 'Chapter Id is required.' }),
  lesson_id: z.string({ required_error: 'Lesson Id is required.' }),
  plugin_type: z.literal('true_or_false'),
  content: TrueOrFalseContentSchema,
  settings: TrueOrFalseSettingsSchema,
});
export type TrueOrFalseSchemaTypes = z.infer<typeof TrueOrFalseSchema>;
