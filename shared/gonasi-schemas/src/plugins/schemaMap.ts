import type { z } from 'zod';

import {
  MultipleChoiceMultipleAnswersContentSchema,
  MultipleChoiceMultipleAnswersInteractionSchema,
  MultipleChoiceMultipleAnswersSettingsSchema,
  MultipleChoiceSingleAnswerContentSchema,
  MultipleChoiceSingleAnswerInteractionSchema,
  MultipleChoiceSingleAnswerSettingsSchema,
  TapToRevealContentSchema,
  TapToRevealSettingsSchema,
  TapToRevealStateInteractionSchema,
  TrueOrFalseStateInteractionSchema,
} from '@gonasi/schemas/plugins';

import type { PluginTypeId } from './pluginData'; // Type that represents all possible plugin identifiers
import {
  RichTextContentSchema,
  RichTextSettingsSchema,
  RichTextStateInteractionSchema,
} from './richTextSchema';
import { TrueOrFalseContentSchema, TrueOrFalseSettingsSchema } from './trueOrFalseSchema';

/**
 * -----------------------------
 * CONTENT SCHEMAS
 * -----------------------------
 *
 * Maps each plugin type ID to its corresponding Zod content schema.
 * These schemas define the expected shape of the "content" data
 * that a plugin block (like a quiz or chart) should have.
 */
export const schemaMap = {
  rich_text_editor: RichTextContentSchema,
  true_or_false: TrueOrFalseContentSchema,
  multiple_choice_single: MultipleChoiceSingleAnswerContentSchema,
  multiple_choice_multiple: MultipleChoiceMultipleAnswersContentSchema,
  match_concepts: RichTextContentSchema,
  sequence_ordering: RichTextContentSchema,
  categorization: RichTextContentSchema,
  bar_chart: RichTextContentSchema,
  line_chart: RichTextContentSchema,
  pie_chart: RichTextContentSchema,
  historical_events: RichTextContentSchema,
  project_milestones: RichTextContentSchema,
  tap_to_reveal: TapToRevealContentSchema,
  step_by_step_reveal: RichTextContentSchema,
  video_player: RichTextContentSchema,
  audio_player: RichTextContentSchema,
  slideshow_player: RichTextContentSchema,
  motion_simulation: RichTextContentSchema,
  gravity_simulation: RichTextContentSchema,
} as const;

// Derive the type of the schema map object
export type SchemaMapType = typeof schemaMap;

// Type that infers the data shape from a schema for a given plugin type
export type SchemaData<T extends PluginTypeId> = z.infer<SchemaMapType[T]>;

// Helper function to fetch the content schema for a given plugin type
export function getSchema<T extends PluginTypeId>(type: T): SchemaMapType[T] {
  return schemaMap[type];
}

/**
 * -----------------------------
 * SETTINGS SCHEMAS
 * -----------------------------
 *
 * Maps plugin type IDs to their settings schemas.
 * These define settings/configuration fields for a given block,
 * separate from the main content or interaction data.
 */
export const settingsSchemaMap = {
  rich_text_editor: RichTextSettingsSchema,
  true_or_false: TrueOrFalseSettingsSchema,
  multiple_choice_single: MultipleChoiceSingleAnswerSettingsSchema,
  multiple_choice_multiple: MultipleChoiceMultipleAnswersSettingsSchema,
  match_concepts: RichTextSettingsSchema,
  sequence_ordering: RichTextSettingsSchema,
  categorization: RichTextSettingsSchema,
  bar_chart: RichTextSettingsSchema,
  line_chart: RichTextSettingsSchema,
  pie_chart: RichTextSettingsSchema,
  historical_events: RichTextSettingsSchema,
  project_milestones: RichTextSettingsSchema,
  tap_to_reveal: TapToRevealSettingsSchema,
  step_by_step_reveal: RichTextSettingsSchema,
  video_player: RichTextSettingsSchema,
  audio_player: RichTextSettingsSchema,
  slideshow_player: RichTextSettingsSchema,
  motion_simulation: RichTextSettingsSchema,
  gravity_simulation: RichTextSettingsSchema,
} as const;

export type SettingsSchemaMapType = typeof settingsSchemaMap;

// Type that infers the settings data shape for a given plugin type
export type SettingsData<T extends PluginTypeId> = z.infer<SettingsSchemaMapType[T]>;

// Helper function to get the settings schema for a plugin type
export function getSettingsSchema<T extends PluginTypeId>(type: T): SettingsSchemaMapType[T] {
  return settingsSchemaMap[type];
}

/**
 * -----------------------------
 * INTERACTION SCHEMAS
 * -----------------------------
 *
 * These define how a user can interact with a plugin (e.g., clicking, dragging).
 * It maps plugin type IDs to their corresponding interaction schemas.
 */
export const interactionSchemaMap = {
  rich_text_editor: RichTextStateInteractionSchema,
  true_or_false: TrueOrFalseStateInteractionSchema,
  multiple_choice_single: MultipleChoiceSingleAnswerInteractionSchema,
  multiple_choice_multiple: MultipleChoiceMultipleAnswersInteractionSchema,
  match_concepts: RichTextStateInteractionSchema,
  sequence_ordering: RichTextStateInteractionSchema,
  categorization: RichTextStateInteractionSchema,
  bar_chart: RichTextStateInteractionSchema,
  line_chart: RichTextStateInteractionSchema,
  pie_chart: RichTextStateInteractionSchema,
  historical_events: RichTextStateInteractionSchema,
  project_milestones: RichTextStateInteractionSchema,
  tap_to_reveal: TapToRevealStateInteractionSchema,
  step_by_step_reveal: RichTextStateInteractionSchema,
  video_player: RichTextStateInteractionSchema,
  audio_player: RichTextStateInteractionSchema,
  slideshow_player: RichTextStateInteractionSchema,
  motion_simulation: RichTextStateInteractionSchema,
  gravity_simulation: RichTextStateInteractionSchema,
} as const;

export type InteractionSchemaMapType = typeof interactionSchemaMap;

// Type that infers the interaction data shape for a given plugin type
export type InteractionData<T extends PluginTypeId> = z.infer<InteractionSchemaMapType[T]>;

// Helper to retrieve the interaction schema based on plugin type
export function getInteractionSchema<T extends PluginTypeId>(type: T): InteractionSchemaMapType[T] {
  return interactionSchemaMap[type];
}

/**
 * -----------------------------
 * UNION TYPE FOR INTERACTION DATA
 * -----------------------------
 *
 * Represents the possible runtime types for *any* plugin's interaction data.
 * Useful when working with multiple plugin types generically (e.g., form validation).
 */
export type BlockInteractionData =
  InteractionSchemaMapType[keyof InteractionSchemaMapType] extends z.ZodType<infer U> ? U : never;
