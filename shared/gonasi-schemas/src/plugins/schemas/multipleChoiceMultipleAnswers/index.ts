import { z } from 'zod';

import { BasePluginSettingsSchema, LayoutPluginSettingsSchema } from '../../pluginSettings';
import { NonEmptyLexicalState } from '../../utils';
import { ChoiceSchema } from '../choiceSchema';

//
// Content Schema
//
export const MultipleChoiceMultipleAnswersContentSchema = z
  .object({
    questionState: NonEmptyLexicalState,
    choices: z
      .array(ChoiceSchema)
      .min(3, 'You must provide at least three choices.')
      .max(10, 'You can provide up to ten choices.'),
    hint: z
      .string()
      .trim()
      .min(10, 'Hint must be at least 10 characters.')
      .max(100, 'Hint must be 100 characters or fewer.')
      .optional(),
    explanationState: NonEmptyLexicalState,
  })
  .refine((data) => data.choices.filter((choice) => choice.isCorrect).length >= 2, {
    message: 'You must mark at least two choices as correct.',
    path: ['choices'],
  });

export type MultipleChoiceMultipleAnswersContentSchemaTypes = z.infer<
  typeof MultipleChoiceMultipleAnswersContentSchema
>;

//
// Settings Schema
//
export const MultipleChoiceMultipleAnswersSettingsSchema = BasePluginSettingsSchema.merge(
  LayoutPluginSettingsSchema,
).extend({});

export type MultipleChoiceMultipleAnswersSettingsSchemaTypes = z.infer<
  typeof MultipleChoiceMultipleAnswersSettingsSchema
>;

//
// Full Schema
//
export const MultipleChoiceMultipleAnswersSchema = z.object({
  id: z.string().optional(),
  organization_id: z.string({ required_error: 'Organization Id is required.' }),
  course_id: z.string({ required_error: 'Course Id is required.' }),
  chapter_id: z.string({ required_error: 'Chapter Id is required.' }),
  lesson_id: z.string({ required_error: 'Lesson Id is required.' }),
  plugin_type: z.literal('multiple_choice_multiple'),
  content: MultipleChoiceMultipleAnswersContentSchema,
  settings: MultipleChoiceMultipleAnswersSettingsSchema,
});

export type MultipleChoiceMultipleAnswersSchemaTypes = z.infer<
  typeof MultipleChoiceMultipleAnswersSchema
>;
