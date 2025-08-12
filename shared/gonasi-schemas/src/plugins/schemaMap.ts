import { z } from 'zod';

import {
  GuidedImageHotspotsInteractionSchema,
  MultipleChoiceMultipleAnswersInteractionSchema,
  MultipleChoiceSingleAnswerInteractionSchema,
  RichTextStateInteractionSchema,
  TrueOrFalseStateInteractionSchema,
} from './interactions';
import {
  GuidedImageHotspotSchema,
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
  GuidedImageHotspotSchema,
]);
export type BuilderSchemaTypes = z.infer<typeof BuilderSchema>;

// Block interaction
export const BlockInteractionSchema = z.discriminatedUnion('plugin_type', [
  RichTextStateInteractionSchema,
  TrueOrFalseStateInteractionSchema,
  MultipleChoiceSingleAnswerInteractionSchema,
  MultipleChoiceMultipleAnswersInteractionSchema,
  GuidedImageHotspotsInteractionSchema,
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
const PublishedGuidedImageHotspotsSchema = GuidedImageHotspotSchema.merge(PublishedFields);

export const PublishedBuilderSchema = z.discriminatedUnion('plugin_type', [
  PublishedRichTextSchema,
  PublishedTrueOrFalseSchema,
  PublishedMultipleChoiceSingleAnswerSchema,
  PublishedMultipleChoiceMultipleAnswersSchema,
  PublishedGuidedImageHotspotsSchema,
]);
export type PublishedBuilderSchemaTypes = z.infer<typeof PublishedBuilderSchema>;
