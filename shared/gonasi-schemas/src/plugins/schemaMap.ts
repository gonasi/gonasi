import { z } from 'zod';

import { RichTextStateInteractionSchema } from './interactions/richTextInteractionSchema';
import { TrueOrFalseStateInteractionSchema } from './interactions';
import { RichTextSchema, TrueOrFalseSchema } from './schemas';
// Type that represents all possible plugin identifiers

export const BuilderSchema = z.discriminatedUnion('plugin_type', [
  RichTextSchema,
  TrueOrFalseSchema,
]);
export type BuilderSchemaTypes = z.infer<typeof BuilderSchema>;

export const BlockInteractionSchema = z.discriminatedUnion('plugin_type', [
  RichTextStateInteractionSchema,
  TrueOrFalseStateInteractionSchema,
]);
export type BlockInteractionSchemaTypes = z.infer<typeof BlockInteractionSchema>;
