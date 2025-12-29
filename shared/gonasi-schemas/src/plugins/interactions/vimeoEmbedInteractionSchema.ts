import { z } from 'zod';

export const VimeoEmbedInteractionSchema = z.object({
  plugin_type: z.literal('vimeo_embed'),

  // Core watch analytics
  furthestWatchedSeconds: z.number().min(0).default(0), // Furthest point reached
  completionPercentage: z.number().min(0).max(100).default(0), // % of video watched

  // Additional analytics
  totalWatchedSeconds: z.number().min(0).default(0), // Total time watched (can exceed duration if rewatched)
  playCount: z.number().min(0).default(0), // Number of times play was triggered
  pauseCount: z.number().min(0).default(0), // Number of times pause was triggered

  // Vimeo-specific data
  videoId: z.string().default(''), // Extracted Vimeo video ID
  videoDuration: z.number().min(0).default(0), // Total video duration in seconds
});

export type VimeoEmbedInteractionSchemaTypes = z.infer<typeof VimeoEmbedInteractionSchema>;
