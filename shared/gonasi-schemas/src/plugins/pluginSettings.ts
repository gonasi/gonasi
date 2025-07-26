import { z } from 'zod';

/**
 * Shared plugin settings used across all plugin types.
 */
export const BasePluginSettingsSchema = z.object({
  /**
   * Determines how the plugin appears in the lesson:
   * - 'inline': Displays within the main content flow.
   * - 'standalone': Pops out in a modal or fullscreen.
   */
  playbackMode: z.enum(['inline', 'standalone'], {
    errorMap: () => ({
      message: "Choose how the plugin should appear — 'inline' or 'standalone'.",
    }),
  }),

  /**
   * How much this plugin contributes to lesson progress (1–10).
   * Affects both its progress bar size and weight in completion metrics.
   */
  weight: z
    .number({
      required_error: 'Specify the plugin’s weight (1–10).',
      invalid_type_error: 'Weight must be a number between 1 and 10.',
    })
    .min(1, { message: 'Weight must be at least 1.' })
    .max(10, { message: 'Weight must not exceed 10.' }),
});

/**
 * Additional layout settings for plugins that display multiple items.
 */
export const LayoutPluginSettingsSchema = z.object({
  /**
   * Controls how many items appear per row in the plugin block:
   * - 'single': 1 item per row
   * - 'double': 2 items per row
   */
  layoutStyle: z
    .enum(['single', 'double'])
    .describe("Controls row layout: 'single' (1 per row) or 'double' (2 per row)."),

  /**
   * Defines how to randomize items within the plugin block:
   * - 'none': Keep original order
   * - 'shuffle': Fully randomize all items
   */
  randomization: z
    .enum(['none', 'shuffle'])
    .describe("Randomization behavior: 'none' (keep order) or 'shuffle' (full shuffle)."),
});
