import { z } from 'zod';

/**
 * Schema for configuring plugin behavior within a lesson.
 */

// Used in all plugins
export const BasePluginSettingsSchema = z.object({
  /**
   * Defines how the plugin block should appear within the lesson UI.
   * - 'inline': Embedded directly within the content flow.
   * - 'standalone': Presented separately (e.g., in a modal or full-screen view).
   */
  playbackMode: z
    .enum(['inline', 'standalone'])
    .default('inline')
    .describe('Display mode for the plugin block'),

  /**
   * Relative weight of the plugin in the lesson's progress computation.
   * Determines the width allocated to the plugin in the progress bar.
   * Must be a value between 1 and 10.
   */
  weight: z
    .number()
    .min(1)
    .max(10)
    .default(1)
    .describe('Relative weight of the plugin in progress calculation'),
});
