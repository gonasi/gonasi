import { z } from 'zod';

import { MultipleChoiceSingleAnswerInteractionSchema } from './interactions/multipleChoiceSingleAnswerInteractionSchema';
import { RichTextStateInteractionSchema } from './interactions/richTextInteractionSchema';
import {
  MultipleChoiceMultipleAnswersInteractionSchema,
  TrueOrFalseStateInteractionSchema,
} from './interactions';
import {
  MultipleChoiceMultipleAnswersSchema,
  MultipleChoiceSingleAnswerSchema,
  RichTextSchema,
  TrueOrFalseSchema,
} from './schemas';

// Type that represents all possible plugin identifiers

// Block creation
export const BuilderSchema = z.discriminatedUnion('plugin_type', [
  RichTextSchema,
  TrueOrFalseSchema,
  MultipleChoiceSingleAnswerSchema,
  MultipleChoiceMultipleAnswersSchema,
]);
export type BuilderSchemaTypes = z.infer<typeof BuilderSchema>;

// Block interaction
export const BlockInteractionSchema = z.discriminatedUnion('plugin_type', [
  RichTextStateInteractionSchema,
  TrueOrFalseStateInteractionSchema,
  MultipleChoiceSingleAnswerInteractionSchema,
  MultipleChoiceMultipleAnswersInteractionSchema,
]);
export type BlockInteractionSchemaTypes = z.infer<typeof BlockInteractionSchema>;

// Published block (includes common metadata like id and position)
const PublishedFields = z.object({
  id: z.string(),
  position: z.number().int().nonnegative(),
});

const PublishedRichTextSchema = RichTextSchema.merge(PublishedFields);
const PublishedTrueOrFalseSchema = TrueOrFalseSchema.merge(PublishedFields);
const PublishedMultipleChoiceSingleAnswerSchema =
  MultipleChoiceSingleAnswerSchema.merge(PublishedFields);
const PublishedMultipleChoiceMultipleAnswersSchema =
  MultipleChoiceMultipleAnswersSchema.merge(PublishedFields);

export const PublishedBuilderSchema = z.discriminatedUnion('plugin_type', [
  PublishedRichTextSchema,
  PublishedTrueOrFalseSchema,
  PublishedMultipleChoiceSingleAnswerSchema,
  PublishedMultipleChoiceMultipleAnswersSchema,
]);
export type PublishedBuilderSchemaTypes = z.infer<typeof PublishedBuilderSchema>;
