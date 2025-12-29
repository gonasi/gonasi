import { z } from 'zod';

export const VideoPlayerInteractionSchema = z.object({
  plugin_type: z.literal('video_player'),

  // Analytics tracking (user requested)
  furthestWatchedSeconds: z.number().min(0).default(0), // Furthest point reached
  completionPercentage: z.number().min(0).max(100).default(0), // % of video watched

  // Optional: additional analytics
  totalWatchedSeconds: z.number().min(0).default(0),
  playCount: z.number().min(0).default(0),
  pauseCount: z.number().min(0).default(0),
});

export type VideoPlayerInteractionSchemaTypes = z.infer<typeof VideoPlayerInteractionSchema>;
