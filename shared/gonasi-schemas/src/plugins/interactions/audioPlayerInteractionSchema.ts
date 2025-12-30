import { z } from 'zod';

export const AudioPlayerInteractionSchema = z.object({
  plugin_type: z.literal('audio_player'),

  // Analytics tracking
  furthestListenedSeconds: z.number().min(0).default(0), // Furthest point reached
  completionPercentage: z.number().min(0).max(100).default(0), // % of audio listened

  // Optional: additional analytics
  totalListenedSeconds: z.number().min(0).default(0),
  playCount: z.number().min(0).default(0),
  pauseCount: z.number().min(0).default(0),
});

export type AudioPlayerInteractionSchemaTypes = z.infer<typeof AudioPlayerInteractionSchema>;
