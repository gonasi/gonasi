import { z } from 'zod';

import { BasePluginSettingsSchema } from '../../pluginSettings';

//
// Content Schema
//
export const YoutubeEmbedContentSchema = z.object({
  youtube_url: z
    .string({ required_error: 'YouTube URL or Video ID is required.' })
    .min(1, 'YouTube URL or Video ID is required.'),
});
export type YoutubeEmbedContentSchemaTypes = z.infer<typeof YoutubeEmbedContentSchema>;

//
// Settings Schema
//
export const YoutubeEmbedSettingsSchema = BasePluginSettingsSchema.extend({
  // Playback controls
  autoplay: z.boolean().default(false),
  controls: z.boolean().default(true),
  loop: z.boolean().default(false),
  muted: z.boolean().default(false),

  // YouTube-specific features
  captions: z.boolean().default(false).describe('Enable closed captions'),
  startTime: z.number().int().min(0).default(0).describe('Start at specific second'),
  endTime: z
    .number()
    .int()
    .min(0)
    .optional()
    .describe('End at specific second (optional)'),

  // Playback restrictions
  allowSeek: z.boolean().default(true).describe('Allow seeking forward in the video'),
  privacyEnhanced: z
    .boolean()
    .default(true)
    .describe('Use youtube-nocookie.com for privacy'),
});
export type YoutubeEmbedSettingsSchemaTypes = z.infer<typeof YoutubeEmbedSettingsSchema>;

//
// Main Schema
//
export const YoutubeEmbedSchema = z.object({
  id: z.string().optional(),
  organization_id: z.string({ required_error: 'Organization ID is required.' }),
  course_id: z.string({ required_error: 'Course ID is required.' }),
  chapter_id: z.string({ required_error: 'Chapter ID is required.' }),
  lesson_id: z.string({ required_error: 'Lesson ID is required.' }),
  plugin_type: z.literal('youtube_embed'),
  content: YoutubeEmbedContentSchema,
  settings: YoutubeEmbedSettingsSchema,
});
export type YoutubeEmbedSchemaTypes = z.infer<typeof YoutubeEmbedSchema>;
