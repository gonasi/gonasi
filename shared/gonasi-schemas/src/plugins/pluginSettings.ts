import { z } from 'zod';

export const PluginSettingsSchema = z.object({
  /**
   * Determines how the plugin block is rendered in the lesson.
   * - 'inline': Block appears as part of the page flow.
   * - 'standalone': Block occupies the full screen (e.g., modal or dedicated screen).
   */
  playbackMode: z
    .enum(['inline', 'standalone'])
    .default('inline')
    .describe('Determines how the plugin block is rendered in the lesson'),

  /**
   * Delay (in seconsds) before the plugin block appears after being triggered.
   * Useful for pacing or sequencing multiple blocks smoothly.
   * Example: delayBeforeShow = 1000 means wait 1 second before showing the block.
   */
  delayBeforeShow: z
    .number()
    .min(0, { message: 'Delay must be at least 0 seconds' })
    .max(5, { message: 'Delay must be at most 5 seconds' })
    .default(0)
    .describe('Delay before showing the block (in seconds)'),

  /**
   * Layout style for displaying items in the plugin block.
   * Controls how many items appear per row to adjust visual density.
   * - 'single': 1 item per row
   * - 'double': 2 items per row
   * Example: layoutStyle = 'double' means display 2 items side by side in each row.
   */
  layoutStyle: z
    .enum(['single', 'double'])
    .default('single')
    .describe("Controls how many items appear per row: 'single' (1) or 'double' (2)"),
});

export const WeightSchema = z.number().min(1).max(10).default(5);
