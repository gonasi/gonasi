import { z } from 'zod';

import { LiveSessionRichTextSchema } from './schemas/liveRichText';
import { LiveSessionTrueOrFalseSchema } from './schemas/liveTrueOrFalse';
import {
  LiveSessionRichTextStateInteractionSchema,
  LiveSessionTrueOrFalseStateInteractionSchema,
} from './interactions';

// Type that represents all possible plugin identifiers

// Block creation
export const LiveSessionBuilderSchema = z.discriminatedUnion('plugin_type', [
  LiveSessionTrueOrFalseSchema,
  LiveSessionRichTextSchema,
]);
export type LiveSessionBuilderSchemaTypes = z.infer<typeof LiveSessionBuilderSchema>;

// Block interaction
export const LiveSessionBlockInteractionSchema = z.discriminatedUnion('plugin_type', [
  LiveSessionTrueOrFalseStateInteractionSchema,
  LiveSessionRichTextStateInteractionSchema,
]);

export type LiveSessionBlockInteractionSchemaTypes = z.infer<
  typeof LiveSessionBlockInteractionSchema
>;
