import { z } from 'zod';

import type { PluginTypeId } from '@gonasi/schemas/plugins';
import { RichTextContent } from '@gonasi/schemas/plugins';

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

// Step 4: Base block schema
const BlockBaseSchema = z.object({
  lesson_id: z.string().uuid(),
  plugin_type: PluginType,
  weight: z.number().min(1).max(10).default(5),
  content: JsonSchema,
});

// Step 5: Plugin-specific refinement
export const BlockSchema = BlockBaseSchema.superRefine((data, ctx) => {
  const contentSchema = getContentSchemaByType(data.plugin_type);
  const result = contentSchema.safeParse(data);

  if (!result.success) {
    result.error.errors.forEach((error) => {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Invalid content for plugin_type "${data.plugin_type}": ${error.message}`,
        path: ['content', ...(error.path || [])],
      });
    });
  }
});

// Step 6: Inferred validated block type
export type Block = z.infer<typeof BlockSchema>;

// Step 7: Runtime validator
export const parseBlock = (input: unknown) => BlockSchema.safeParse(input);

// Step 8: Optional runtime type guard
export const isValidBlock = (input: unknown): input is Block => parseBlock(input).success;
