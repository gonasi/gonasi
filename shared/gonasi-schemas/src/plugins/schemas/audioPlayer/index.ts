import { z } from 'zod';

import { BasePluginSettingsSchema } from '../../pluginSettings';

//
// Content Schema
//
export const AudioPlayerContentSchema = z.object({
  audio_id: z.string({ required_error: 'Audio file is required.' }),
  cover_image_id: z.string().optional(), // Optional cover art
});
export type AudioPlayerContentSchemaTypes = z.infer<typeof AudioPlayerContentSchema>;

//
// Settings Schema
//
export const AudioPlayerSettingsSchema = BasePluginSettingsSchema.extend({
  // Playback controls
  autoplay: z.boolean().default(false),
  loop: z.boolean().default(false),

  // Playback restrictions
  allowSeek: z.boolean().default(true).describe('Allow seeking forward in the audio'),
  playbackSpeed: z.boolean().default(true).describe('Show playback speed controls'),
  showTimestamp: z.boolean().default(true).describe('Show current time and duration'),
});
export type AudioPlayerSettingsSchemaTypes = z.infer<typeof AudioPlayerSettingsSchema>;

//
// Main Schema
//
export const AudioPlayerSchema = z.object({
  id: z.string().optional(),
  organization_id: z.string({ required_error: 'Organization ID is required.' }),
  course_id: z.string({ required_error: 'Course ID is required.' }),
  chapter_id: z.string({ required_error: 'Chapter ID is required.' }),
  lesson_id: z.string({ required_error: 'Lesson ID is required.' }),
  plugin_type: z.literal('audio_player'),
  content: AudioPlayerContentSchema,
  settings: AudioPlayerSettingsSchema,
});
export type AudioPlayerSchemaTypes = z.infer<typeof AudioPlayerSchema>;
