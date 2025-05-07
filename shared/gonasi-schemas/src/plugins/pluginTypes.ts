import { z } from 'zod';

import type { PluginTypeId } from '@gonasi/schemas/plugins';
import { RichTextContent } from '@gonasi/schemas/plugins';

import { RichTextInteractionSchema } from './interactions/richTextInteractionSchema';

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

// Step 1: All valid plugin types
const pluginTypes: PluginTypeId[] = [
  'rich_text_editor',
  'image_upload',
  'gltf_embed',
  'video_embed',
  'note_callout',
  'true_false',
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

const PluginType = z.enum(pluginTypes as [PluginTypeId, ...PluginTypeId[]]);

// Step 2: Recursive JSON schema (for Supabase compatibility)
const JsonSchema: z.ZodType<Json> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(JsonSchema),
    z.record(JsonSchema),
  ]),
);

// Step 3: Helper function to return schema for each plugin type
export const getContentSchemaByType = (type: PluginTypeId) => {
  switch (type) {
    case 'rich_text_editor':
      return RichTextContent;

    default:
      throw new Error('Unsupported plugin type');
  }
};

export const getInteractionSchemaByType = (type: PluginTypeId) => {
  switch (type) {
    case 'rich_text_editor':
      return RichTextInteractionSchema;
    default:
      throw new Error('Unsupported plugin type for interaction');
  }
};

// Step 4: Base block schema
const BlockBaseSchema = z.object({
  lesson_id: z.string().uuid(),
  plugin_type: PluginType,
  weight: z.number().min(1).max(10).default(5),
  content: JsonSchema,
});

export const InteractionBaseSchema = z.object({
  block_id: z.string().uuid({ message: 'block_id must be a valid UUID.' }), // UUID validation
  plugin_type: PluginType,
  started_at: z
    .string()
    .datetime({ message: 'started_at must be a valid ISO 8601 datetime string.' }),
  completed_at: z
    .string()
    .datetime({ message: 'completed_at must be a valid ISO 8601 datetime string.' })
    .optional(),
  score: z
    .number()
    .min(0, { message: 'Score must be at least 0.' })
    .max(100, { message: 'Score must not exceed 100.' })
    .default(0),
  feedback: z.string().optional(),
  attempts: z.number().min(1, { message: 'Attempts must be at least 1.' }).default(1),
  custom: JsonSchema,
});

// Step 5: Plugin-specific refinement
export const BlockSchema = BlockBaseSchema.superRefine((data, ctx) => {
  const contentSchema = getContentSchemaByType(data.plugin_type);
  const result = contentSchema.safeParse(data);

  if (!result.success) {
    result.error.errors.forEach((error) => {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Invalid custom for plugin_type "${data.plugin_type}": ${error.message}`,
        path: ['custom', ...(error.path || [])],
      });
    });
  }
});

export const InteractionSchema = InteractionBaseSchema.superRefine((data, ctx) => {
  const interactionSchema = getInteractionSchemaByType(data.plugin_type);
  const result = interactionSchema.safeParse(data);

  if (!result.success) {
    result.error.errors.forEach((error) => {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Invalid interaction for plugin_type "${data.plugin_type}": ${error.message}`,
        path: ['content', ...(error.path || [])],
      });
    });
  }
});

// Step 6: Inferred validated block type
export type Block = z.infer<typeof BlockSchema>;
export type Interaction = z.infer<typeof InteractionSchema>;

// Step 7: Runtime validator
export const parseBlock = (input: unknown) => BlockSchema.safeParse(input);
export const parseInteraction = (input: unknown) => InteractionSchema.safeParse(input);

// Step 8: Optional runtime type guard
export const isValidBlock = (input: unknown): input is Block => parseBlock(input).success;
export const isValidInteraction = (input: unknown): input is Interaction =>
  parseInteraction(input).success;
