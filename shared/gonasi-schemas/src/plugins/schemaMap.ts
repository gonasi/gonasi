import type { z } from 'zod';

import type { PluginTypeId } from './pluginData';
import {
  RichTextContentSchema,
  RichTextInteractionSchema,
  RichTextSettingsSchema,
} from './richTextSchema';

export const schemaMap = {
  rich_text_editor: RichTextContentSchema,
  true_false: RichTextContentSchema,
  multiple_choice_single: RichTextContentSchema,
  multiple_choice_multiple: RichTextContentSchema,
  match_concepts: RichTextContentSchema,
  sequence_ordering: RichTextContentSchema,
  categorization: RichTextContentSchema,
  bar_chart: RichTextContentSchema,
  line_chart: RichTextContentSchema,
  pie_chart: RichTextContentSchema,
  historical_events: RichTextContentSchema,
  project_milestones: RichTextContentSchema,
  tap_to_reveal: RichTextContentSchema,
  step_by_step_reveal: RichTextContentSchema,
  video_player: RichTextContentSchema,
  audio_player: RichTextContentSchema,
  slideshow_player: RichTextContentSchema,
  motion_simulation: RichTextContentSchema,
  gravity_simulation: RichTextContentSchema,
} satisfies Record<PluginTypeId, any>;

export const settingsSchemaMap = {
  rich_text_editor: RichTextSettingsSchema,
  true_false: RichTextSettingsSchema,
  multiple_choice_single: RichTextSettingsSchema,
  multiple_choice_multiple: RichTextSettingsSchema,
  match_concepts: RichTextSettingsSchema,
  sequence_ordering: RichTextSettingsSchema,
  categorization: RichTextSettingsSchema,
  bar_chart: RichTextSettingsSchema,
  line_chart: RichTextSettingsSchema,
  pie_chart: RichTextSettingsSchema,
  historical_events: RichTextSettingsSchema,
  project_milestones: RichTextSettingsSchema,
  tap_to_reveal: RichTextSettingsSchema,
  step_by_step_reveal: RichTextSettingsSchema,
  video_player: RichTextSettingsSchema,
  audio_player: RichTextSettingsSchema,
  slideshow_player: RichTextSettingsSchema,
  motion_simulation: RichTextSettingsSchema,
  gravity_simulation: RichTextSettingsSchema,
} satisfies Record<PluginTypeId, any>;

export const interactionSchemaMap = {
  rich_text_editor: RichTextInteractionSchema,
  true_false: RichTextInteractionSchema,
  multiple_choice_single: RichTextInteractionSchema,
  multiple_choice_multiple: RichTextInteractionSchema,
  match_concepts: RichTextInteractionSchema,
  sequence_ordering: RichTextInteractionSchema,
  categorization: RichTextInteractionSchema,
  bar_chart: RichTextInteractionSchema,
  line_chart: RichTextInteractionSchema,
  pie_chart: RichTextInteractionSchema,
  historical_events: RichTextInteractionSchema,
  project_milestones: RichTextInteractionSchema,
  tap_to_reveal: RichTextInteractionSchema,
  step_by_step_reveal: RichTextInteractionSchema,
  video_player: RichTextInteractionSchema,
  audio_player: RichTextInteractionSchema,
  slideshow_player: RichTextInteractionSchema,
  motion_simulation: RichTextInteractionSchema,
  gravity_simulation: RichTextInteractionSchema,
} satisfies Record<PluginTypeId, any>;

// Create a union type of all schema inferred types
export type BlockInteractionData =
  (typeof interactionSchemaMap)[keyof typeof interactionSchemaMap] extends z.ZodType<infer U>
    ? U
    : never;
