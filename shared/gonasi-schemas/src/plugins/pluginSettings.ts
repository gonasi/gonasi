import { z } from 'zod';

/**
 * Schema for configuring plugin behavior within a lesson.
 */

// Used in all plugins
export const BasePluginSettingsSchema = z.object({
  /**
   * How do you want this plugin to show up in the lesson?
   * - 'inline': It'll sit nicely in the middle of your content.
   * - 'standalone': It'll pop out, like in a modal or full-screen view.
   */
  playbackMode: z.enum(['inline', 'standalone'], {
    errorMap: () => ({
      message: "Choose how the plugin should appear — 'inline' or 'standalone'.",
    }),
  }),

  /**
   * How much should this plugin count toward lesson progress?
   * This affects how wide it appears in the progress bar.
   * Should be a number from 1 to 10.
   */
  weight: z
    .number({
      required_error: 'Tell us how much weight this plugin should have (1–10).',
      invalid_type_error: 'The weight needs to be a number between 1 and 10.',
    })
    .min(1, { message: 'The weight must be at least 1.' })
    .max(10, { message: 'The weight can’t be more than 10.' }),
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
