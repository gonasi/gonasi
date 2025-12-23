import { z } from 'zod';

import { BasePluginSettingsSchema } from '../../pluginSettings';

//
// Content Schema
//
export const VideoPlayerContentSchema = z.object({
  video_id: z.string({ required_error: 'Video is required.' }),
  poster_image_id: z.string().optional(), // Optional thumbnail
});
export type VideoPlayerContentSchemaTypes = z.infer<typeof VideoPlayerContentSchema>;

//
// Settings Schema
//
export const VideoPlayerSettingsSchema = BasePluginSettingsSchema.extend({
  // Playback controls
  autoplay: z.boolean().default(false),
  controls: z.boolean().default(true),
  loop: z.boolean().default(false),
  muted: z.boolean().default(false),

  // Playback restrictions
  allowSeek: z.boolean().default(true).describe('Allow seeking forward in the video'),
  playbackSpeed: z.boolean().default(true).describe('Show playback speed controls'),
});
export type VideoPlayerSettingsSchemaTypes = z.infer<typeof VideoPlayerSettingsSchema>;

//
// Main Schema
//
export const VideoPlayerSchema = z.object({
  id: z.string().optional(),
  organization_id: z.string({ required_error: 'Organization ID is required.' }),
  course_id: z.string({ required_error: 'Course ID is required.' }),
  chapter_id: z.string({ required_error: 'Chapter ID is required.' }),
  lesson_id: z.string({ required_error: 'Lesson ID is required.' }),
  plugin_type: z.literal('video_player'),
  content: VideoPlayerContentSchema,
  settings: VideoPlayerSettingsSchema,
});
export type VideoPlayerSchemaTypes = z.infer<typeof VideoPlayerSchema>;
