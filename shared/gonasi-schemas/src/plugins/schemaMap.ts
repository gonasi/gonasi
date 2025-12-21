import { z } from 'zod';

import {
  FillInTheBlankStateInteractionSchema,
  GuidedImageHotspotsInteractionSchema,
  MatchingGameInteractionSchema,
  MultipleChoiceMultipleAnswersInteractionSchema,
  MultipleChoiceSingleAnswerInteractionSchema,
  RichTextStateInteractionSchema,
  StepByStepRevealInteractionSchema,
  TrueOrFalseStateInteractionSchema,
} from './interactions';
import {
  FillInTheBlankSchema,
  GuidedImageHotspotSchema,
  MatchingGameSchema,
  MultipleChoiceMultipleAnswersSchema,
  MultipleChoiceSingleAnswerSchema,
  RichTextSchema,
  StepByStepRevealSchema,
  TrueOrFalseSchema,
} from './schemas';

// Type that represents all possible plugin identifiers

// Block creation
export const BuilderSchema = z.discriminatedUnion('plugin_type', [
  RichTextSchema,
  TrueOrFalseSchema,
  FillInTheBlankSchema,
  MultipleChoiceSingleAnswerSchema,
  MultipleChoiceMultipleAnswersSchema,
  MatchingGameSchema,
  GuidedImageHotspotSchema,
  StepByStepRevealSchema,
]);
export type BuilderSchemaTypes = z.infer<typeof BuilderSchema>;

// Block interaction
export const BlockInteractionSchema = z.discriminatedUnion('plugin_type', [
  RichTextStateInteractionSchema,
  TrueOrFalseStateInteractionSchema,
  FillInTheBlankStateInteractionSchema,
  MultipleChoiceSingleAnswerInteractionSchema,
  MultipleChoiceMultipleAnswersInteractionSchema,
  MatchingGameInteractionSchema,
  GuidedImageHotspotsInteractionSchema,
  StepByStepRevealInteractionSchema,
]);
export type BlockInteractionSchemaTypes = z.infer<typeof BlockInteractionSchema>;

// Published block (includes common metadata like id and position)
const PublishedFields = z.object({
  id: z.string(),
  position: z.number().int().nonnegative(),
});

const PublishedRichTextSchema = RichTextSchema.merge(PublishedFields);
const PublishedTrueOrFalseSchema = TrueOrFalseSchema.merge(PublishedFields);
const PublishedFillInTheBlankSchema = FillInTheBlankSchema.merge(PublishedFields);
const PublishedMultipleChoiceSingleAnswerSchema =
  MultipleChoiceSingleAnswerSchema.merge(PublishedFields);
const PublishedMultipleChoiceMultipleAnswersSchema =
  MultipleChoiceMultipleAnswersSchema.merge(PublishedFields);
const PublishedMatchingGameSchema = MatchingGameSchema.merge(PublishedFields);
const PublishedGuidedImageHotspotsSchema = GuidedImageHotspotSchema.merge(PublishedFields);
const PublishedStepByStepRevealSchema = StepByStepRevealSchema.merge(PublishedFields);

export const PublishedBuilderSchema = z.discriminatedUnion('plugin_type', [
  PublishedRichTextSchema,
  PublishedTrueOrFalseSchema,
  PublishedFillInTheBlankSchema,
  PublishedMultipleChoiceSingleAnswerSchema,
  PublishedMultipleChoiceMultipleAnswersSchema,
  PublishedMatchingGameSchema,
  PublishedGuidedImageHotspotsSchema,
  PublishedStepByStepRevealSchema,
]);
export type PublishedBuilderSchemaTypes = z.infer<typeof PublishedBuilderSchema>;
