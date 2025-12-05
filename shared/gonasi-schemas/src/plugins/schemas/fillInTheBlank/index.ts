import { z } from 'zod';

import { BasePluginSettingsSchema } from '../../pluginSettings';
import { NonEmptyLexicalState } from '../../utils';

//
// Content Schema
//
export const FillInTheBlankContentSchema = z.object({
  questionState: NonEmptyLexicalState,
  correctAnswer: z
    .string()
    .trim()
    .min(1, 'The correct answer is required.')
    .max(50, 'The correct answer must be 50 characters or fewer.'),
  hint: z
    .string()
    .trim()
    .min(10, 'Hint must be at least 10 characters.')
    .max(100, 'Hint must be 100 characters or fewer.')
    .optional(),
  explanationState: NonEmptyLexicalState,
  caseSensitive: z.boolean(),
});
export type FillInTheBlankContentSchemaTypes = z.infer<typeof FillInTheBlankContentSchema>;

export const FillInTheBlankSettingsSchema = BasePluginSettingsSchema.extend({});
export type FillInTheBlankSettingsSchemaTypes = z.infer<typeof FillInTheBlankSettingsSchema>;

export const FillInTheBlankSchema = z.object({
  id: z.string().optional(),
  organization_id: z.string({ required_error: 'Organization Id is required.' }),
  course_id: z.string({ required_error: 'Course Id is required.' }),
  chapter_id: z.string({ required_error: 'Chapter Id is required.' }),
  lesson_id: z.string({ required_error: 'Lesson Id is required.' }),
  plugin_type: z.literal('fill_in_the_blank'),
  content: FillInTheBlankContentSchema,
  settings: FillInTheBlankSettingsSchema,
});
export type FillInTheBlankSchemaTypes = z.infer<typeof FillInTheBlankSchema>;
