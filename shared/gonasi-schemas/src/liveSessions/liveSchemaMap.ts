import { z } from 'zod';

import { LiveSessionTrueOrFalseSchema } from './schemas/liveTrueOrFalse';
import { LiveSessionTrueOrFalseStateInteractionSchema } from './interactions';

// Type that represents all possible plugin identifiers

// Block creation
export const LiveSessionBuilderSchema = z.discriminatedUnion('plugin_type', [
  LiveSessionTrueOrFalseSchema,
]);
export type LiveSessionBuilderSchemaTypes = z.infer<typeof LiveSessionBuilderSchema>;

// Block interaction
export const LiveSessionBlockInteractionSchema = z.discriminatedUnion('plugin_type', [
  LiveSessionTrueOrFalseStateInteractionSchema,
]);
export type LiveSessionBlockInteractionSchemaTypes = z.infer<
  typeof LiveSessionBlockInteractionSchema
>;
