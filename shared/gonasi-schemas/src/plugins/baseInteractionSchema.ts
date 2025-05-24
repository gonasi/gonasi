import { z } from 'zod';

import type { PluginTypeId } from './pluginData';

/**
 * Recursively defined JSON-compatible type
 */
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

/**
 * List of all supported plugin type IDs
 * Used to define the allowed values for the plugin_type field
 */
const pluginTypes: PluginTypeId[] = [
  'rich_text_editor',
  'true_or_false',
  'multiple_choice_single',
  'multiple_choice_multiple',
  'match_concepts',
  'sequence_ordering',
  'categorization',
  'bar_chart',
  'line_chart',
  'pie_chart',
  'historical_events',
  'project_milestones',
  'tap_to_reveal',
  'step_by_step_reveal',
  'video_player',
  'audio_player',
  'slideshow_player',
  'motion_simulation',
  'gravity_simulation',
];

/**
 * Zod enum constructed from the list of plugin types
 * Ensures strict validation against the defined plugin types
 */
const PluginType = z.enum(pluginTypes as [PluginTypeId, ...PluginTypeId[]]);

/**
 * Recursive Zod schema for validating arbitrary JSON structures
 */
export const JsonSchema: z.ZodType<Json> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(JsonSchema),
    z.record(JsonSchema),
  ]),
);

/**
 * Base schema for an interaction block
 * Includes common metadata and user interaction state
 */
export const BaseInteractionSchema = z.object({
  plugin_type: PluginType, // Type of the plugin
  block_id: z.string().uuid(), // Unique identifier for the block
  lesson_id: z.string().uuid(), // Identifier for the associated lesson
  is_complete: z.boolean().default(false), // Whether the interaction has been completed
  score: z.number().min(0).max(100).default(0), // Score given for the interaction
  attempts: z.number().min(1).default(1), // Number of attempts made
  state: JsonSchema, // Current state of the interaction
  last_response: JsonSchema.default({}), // Most recent user response - Not using it now
  feedback: JsonSchema.default({}), // Feedback provided by the user
  started_at: z.string().datetime(), // Timestamp when interaction started
  completed_at: z.string().datetime(), // Timestamp when interaction was completed
  time_spent_seconds: z.number().min(0).default(0), // Total time spent on the interaction
});

export type BaseInteractionSchemaType = z.infer<typeof BaseInteractionSchema>;

export type BaseInteractionUpdatableFields = Pick<
  BaseInteractionSchemaType,
  'plugin_type' | 'block_id' | 'lesson_id' | 'score' | 'attempts' | 'state'
>;
