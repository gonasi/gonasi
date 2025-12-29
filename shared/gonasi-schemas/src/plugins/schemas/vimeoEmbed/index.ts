import { z } from 'zod';

import { BasePluginSettingsSchema } from '../../pluginSettings';

//
// Content Schema
//
export const VimeoEmbedContentSchema = z.object({
  vimeo_url: z
    .string({ required_error: 'Vimeo URL or Video ID is required.' })
    .min(1, 'Vimeo URL or Video ID is required.'),
});
export type VimeoEmbedContentSchemaTypes = z.infer<typeof VimeoEmbedContentSchema>;

//
// Settings Schema
//
export const VimeoEmbedSettingsSchema = BasePluginSettingsSchema.extend({
  // Playback controls
  autoplay: z.boolean().default(false),
  controls: z.boolean().default(true),
  loop: z.boolean().default(false),
  muted: z.boolean().default(false),

  // Vimeo-specific features
  title: z.boolean().default(true).describe('Show video title'),
  byline: z.boolean().default(true).describe('Show author byline'),
  portrait: z.boolean().default(true).describe('Show author portrait'),
  color: z.string().default('00adef').describe('Player color (hex without #)'),

  // Time controls
  startTime: z.number().int().min(0).default(0).describe('Start at specific second'),

  // Playback restrictions
  allowSeek: z.boolean().default(true).describe('Allow seeking forward in the video'),

  // Privacy
  dnt: z.boolean().default(true).describe('Do Not Track - prevent session tracking'),
});
export type VimeoEmbedSettingsSchemaTypes = z.infer<typeof VimeoEmbedSettingsSchema>;

//
// Main Schema
//
export const VimeoEmbedSchema = z.object({
  id: z.string().optional(),
  organization_id: z.string({ required_error: 'Organization ID is required.' }),
  course_id: z.string({ required_error: 'Course ID is required.' }),
  chapter_id: z.string({ required_error: 'Chapter ID is required.' }),
  lesson_id: z.string({ required_error: 'Lesson ID is required.' }),
  plugin_type: z.literal('vimeo_embed'),
  content: VimeoEmbedContentSchema,
  settings: VimeoEmbedSettingsSchema,
});
export type VimeoEmbedSchemaTypes = z.infer<typeof VimeoEmbedSchema>;
