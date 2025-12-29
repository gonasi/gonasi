import { z } from 'zod';

export const YoutubeEmbedInteractionSchema = z.object({
  plugin_type: z.literal('youtube_embed'),

  // Core watch analytics
  furthestWatchedSeconds: z.number().min(0).default(0), // Furthest point reached
  completionPercentage: z.number().min(0).max(100).default(0), // % of video watched

  // Additional analytics
  totalWatchedSeconds: z.number().min(0).default(0), // Total time watched (can exceed duration if rewatched)
  playCount: z.number().min(0).default(0), // Number of times play was triggered
  pauseCount: z.number().min(0).default(0), // Number of times pause was triggered

  // YouTube-specific data
  videoId: z.string().default(''), // Extracted YouTube video ID
  videoDuration: z.number().min(0).default(0), // Total video duration in seconds
});

export type YoutubeEmbedInteractionSchemaTypes = z.infer<typeof YoutubeEmbedInteractionSchema>;
