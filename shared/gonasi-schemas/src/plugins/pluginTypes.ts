import { z } from 'zod';

import type { PluginTypeId } from '@gonasi/schemas/plugins';
import {
  RichTextSchema,
  RichTextSettingsSchema,
  TrueOrFalseInteractionSchema,
  TrueOrFalseSchema,
  TrueOrFalseSettingsSchema,
  WeightSchema,
} from '@gonasi/schemas/plugins';

import { RichTextInteractionSchema } from './interactions/richTextInteractionSchema';
import {
  MultipleChoiceMultipleAnswersInteractionSchema,
  MultipleChoiceMultipleAnswersSchema,
  MultipleChoiceMultipleAnswersSettingsSchema,
} from './multipleChoiceMultipleAnswersSchema';
import {
  MultipleChoiceSingleAnswerInteractionSchema,
  MultipleChoiceSingleAnswerSchema,
  MultipleChoiceSingleAnswerSettingsSchema,
} from './multipleChoiceSingleAnswerSchema';

/**
 * Recursive JSON type compatible with Supabase
 */
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

/**
 * Step 1: All supported plugin type IDs
 */
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

/**
 * Zod enum created from plugin type IDs
 */
const PluginType = z.enum(pluginTypes as [PluginTypeId, ...PluginTypeId[]]);

/**
 * Step 2: Recursive schema for validating arbitrary JSON structures
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
 * Step 3: Schema dispatchers for plugin-specific logic
 */
export const getContentSchemaByType = (type: PluginTypeId) => {
  switch (type) {
    case 'rich_text_editor':
      return RichTextSchema;
    case 'true_false':
      return TrueOrFalseSchema;
    case 'multiple_choice_single':
      return MultipleChoiceSingleAnswerSchema;
    case 'multiple_choice_multiple':
      return MultipleChoiceMultipleAnswersSchema;
    default:
      throw new Error(`Unsupported plugin type: ${type}`);
  }
};

export const getSettingsSchemaByType = (type: PluginTypeId) => {
  switch (type) {
    case 'rich_text_editor':
      return RichTextSettingsSchema;
    case 'true_false':
      return TrueOrFalseSettingsSchema;
    case 'multiple_choice_single':
      return MultipleChoiceSingleAnswerSettingsSchema;
    case 'multiple_choice_multiple':
      return MultipleChoiceMultipleAnswersSettingsSchema;
    default:
      throw new Error(`Unsupported plugin type: ${type}`);
  }
};

export const getInteractionSchemaByType = (type: PluginTypeId) => {
  switch (type) {
    case 'rich_text_editor':
      return RichTextInteractionSchema;
    case 'true_false':
      return TrueOrFalseInteractionSchema;
    case 'multiple_choice_single':
      return MultipleChoiceSingleAnswerInteractionSchema;
    case 'multiple_choice_multiple':
      return MultipleChoiceMultipleAnswersInteractionSchema;
    default:
      throw new Error(`Unsupported plugin type for interaction: ${type}`);
  }
};

/**
 * Step 4: Shared base schemas for blocks and interactions
 */
const BlockBaseSchema = z.object({
  lesson_id: z.string().uuid(),
  plugin_type: PluginType,
  weight: z.number().min(1).max(10).default(5),
  content: JsonSchema,
});

const SettingsBaseSchema = z.object({
  block_id: z.string().uuid(),
  plugin_type: PluginType,
  weight: WeightSchema,
  settings: JsonSchema,
});

export const InteractionBaseSchema = z.object({
  plugin_type: PluginType,
  block_id: z.string().uuid(),
  lesson_id: z.string().uuid(),
  is_complete: z.boolean().default(false),
  score: z.number().min(0).max(100).default(0),
  attempts: z.number().min(1).default(1),
  state: JsonSchema,
  last_response: JsonSchema,
  feedback: JsonSchema,
  started_at: z.string().datetime(),
  completed_at: z.string().datetime(),
  time_spent_seconds: z.number().min(0).default(0),
});

/**
 * Step 5: Plugin-specific validation for content and interaction schemas
 */
export const BlockSchema = BlockBaseSchema.superRefine((data, ctx) => {
  const contentSchema = getContentSchemaByType(data.plugin_type);
  const result = contentSchema.safeParse(data);

  if (!result.success) {
    result.error.errors.forEach((error) => {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Invalid content for plugin_type "${data.plugin_type}": ${error.message}`,
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
        path: ['custom', ...(error.path || [])],
      });
    });
  }
});

export const SettingsSchema = SettingsBaseSchema.superRefine((data, ctx) => {
  const settingsSchema = getSettingsSchemaByType(data.plugin_type);
  const result = settingsSchema.safeParse(data);

  if (!result.success) {
    result.error.errors.forEach((error) => {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `The settings for plugin type "${data.plugin_type}" are invalid: ${error.message}`,
        path: ['custom', ...(error.path || [])],
      });
    });
  }
});

/**
 * Step 6: Inferred types for runtime use
 */
export type Block = z.infer<typeof BlockSchema>;
export type Interaction = z.infer<typeof InteractionSchema>;
export type Settings = z.infer<typeof SettingsSchema>;

/**
 * Step 7: Runtime validators for unknown input
 */
export const parseBlock = (input: unknown) => BlockSchema.safeParse(input);
export const parseInteraction = (input: unknown) => InteractionSchema.safeParse(input);
export const parseSettings = (input: unknown) => SettingsSchema.safeParse(input);

/**
 * Step 8: Runtime type guards
 */
export const isValidBlock = (input: unknown): input is Block => parseBlock(input).success;

export const isValidInteraction = (input: unknown): input is Interaction => {
  console.log(input);
  const result = parseInteraction(input);

  if (!result.success) {
    // Log validation errors for debugging
    console.error(
      'Interaction validation failed:',
      result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', '),
    );
  }

  return result.success;
};
export const isValidSetting = (input: unknown): input is Settings => parseBlock(input).success;
