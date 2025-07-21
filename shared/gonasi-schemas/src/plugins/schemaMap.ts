import { z } from 'zod';

import { RichTextStateInteractionSchema } from './interactions/richTextInteractionSchema';
// Type that represents all possible plugin identifiers
import { RichTextSchema } from './richTextSchema';

export const BuilderSchema = z.discriminatedUnion('plugin_type', [RichTextSchema]);

export const BlockInteractionSchema = z.discriminatedUnion('plugin_type', [
  RichTextStateInteractionSchema,
]);
export type BlockInteractionSchemaTypes = z.infer<typeof BlockInteractionSchema>;
