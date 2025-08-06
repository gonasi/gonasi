import { z } from 'zod';

import { BasePluginSettingsSchema, LayoutPluginSettingsSchema } from '../../pluginSettings';
import { NonEmptyLexicalState } from '../../utils';
import { ChoiceSchema } from '../choiceSchema';

//
// Content Schema
//
export const MultipleChoiceSingleAnswerContentSchema = z
  .object({
    questionState: NonEmptyLexicalState,
    choices: z
      .array(ChoiceSchema)
      .min(2, 'You must provide at least two choices.')
      .max(6, 'You can provide up to six choices.'),
    hint: z
      .string()
      .trim()
      .min(10, 'Hint must be at least 10 characters.')
      .max(100, 'Hint must be 100 characters or fewer.')
      .optional(),
    explanationState: NonEmptyLexicalState,
  })
  .refine((data) => data.choices.filter((choice) => choice.isCorrect).length === 1, {
    message: 'Exactly one choice must be marked as correct.',
    path: ['choices'],
  });

export type MultipleChoiceSingleAnswerContentSchemaTypes = z.infer<
  typeof MultipleChoiceSingleAnswerContentSchema
>;

//
// Settings Schema
//
export const MultipleChoiceSingleAnswerSettingsSchema = BasePluginSettingsSchema.merge(
  LayoutPluginSettingsSchema,
).extend({});

export type MultipleChoiceSingleAnswerSettingsSchemaTypes = z.infer<
  typeof MultipleChoiceSingleAnswerSettingsSchema
>;

//
// Full Schema
//
export const MultipleChoiceSingleAnswerSchema = z.object({
  id: z.string().optional(),
  organization_id: z.string({ required_error: 'Organization Id is required.' }),
  course_id: z.string({ required_error: 'Course Id is required.' }),
  chapter_id: z.string({ required_error: 'Chapter Id is required.' }),
  lesson_id: z.string({ required_error: 'Lesson Id is required.' }),
  plugin_type: z.literal('multiple_choice_single'),
  content: MultipleChoiceSingleAnswerContentSchema,
  settings: MultipleChoiceSingleAnswerSettingsSchema,
});

export type MultipleChoiceSingleAnswerSchemaTypes = z.infer<
  typeof MultipleChoiceSingleAnswerSchema
>;
