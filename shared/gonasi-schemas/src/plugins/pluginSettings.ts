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
   * If true, the plugin will automatically continue to the next block
   * after completion (e.g., after answering a question and seeing feedback),
   * without requiring the user to press a 'Continue' button.
   */
  autoContinue: z
    .union([z.string(), z.boolean()]) // Accept both string and boolean inputs
    .transform((value) => {
      // Coerce to boolean for internal use
      if (typeof value === 'boolean') return value;
      return value === 'true';
    })
    .default('false') // Default as string to match form expectations
    .describe('Automatically continue to the next block after completion'),
  /**
   * Delay (in milliseconds) before the plugin block appears after being triggered.
   * Useful for pacing or sequencing multiple blocks smoothly.
   * Example: delayBeforeShow = 1000 means wait 1 second before showing the block.
   */
  delayBeforeShow: z
    .number()
    .min(0, { message: 'Delay must be at least 0 seconds' })
    .max(5, { message: 'Delay must be at most 5 seconds' })
    .default(0)
    .describe('Delay before showing the block (in seconds)'),
});

export const WeightSchema = z.number().min(1).max(10).default(5);
