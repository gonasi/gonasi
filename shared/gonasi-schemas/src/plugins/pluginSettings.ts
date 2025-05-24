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

export const LayoutPluginSettingsSchema = z.object({
  /**
   * Layout style for displaying items in the plugin block.
   * Controls how many items appear per row to adjust visual density.
   * - 'single': 1 item per row
   * - 'double': 2 items per row
   */
  layoutStyle: z
    .enum(['single', 'double'])
    .default('single')
    .describe("Controls how many items appear per row: 'single' (1) or 'double' (2)"),

  /**
   * Determines the randomization behavior of the plugin items.
   * - 'none': Keep original order
   * - 'shuffle': Fully randomize the order
   * - 'partial': Partially shuffle items (e.g., group-level shuffling, if applicable)
   */
  randomization: z
    .enum(['none', 'shuffle'])
    .default('none')
    .describe('Determines how items are randomized in the plugin block'),
});
