import { z } from 'zod';

/**
 * PluginSettings defines configuration options for rendering a plugin block within a lesson.
 */
export const PluginSettingsSchema = z
  .object({
    /**
     * Determines how the plugin block is rendered in the lesson.
     * - 'inline': Block appears as part of the page flow.
     * - 'standalone': Block occupies the full screen (e.g., modal or dedicated screen).
     */
    playbackMode: z.enum(['inline', 'standalone']).default('inline'),

    /**
     * If true, the plugin will automatically continue to the next block
     * after completion (e.g., after answering a question and seeing feedback),
     * without requiring the user to press a 'Continue' button.
     */
    autoContinue: z.boolean().default(false),

    /**
     * If true, a 'Continue' button is shown to let the user manually
     * move to the next block. Typically used when autoContinue is false.
     * This should usually appear *after* the user has completed the interaction.
     */
    showContinueButton: z.boolean().default(true),

    /**
     * Delay (in milliseconds) before the plugin block appears after being triggered.
     * Useful for pacing or sequencing multiple blocks smoothly.
     * Example: delayBeforeShow = 1000 means wait 1 second before showing the block.
     */
    delayBeforeShow: z.number().default(0),

    /**
     * If true, applies an entry animation when the block appears.
     * Can be used to draw attention or improve visual flow.
     */
    animateEntry: z.boolean().default(true),

    /**
     * If true, the block will be hidden from any navigation controls (e.g., timeline or sidebar),
     * making it inaccessible via direct navigation. It will only appear when triggered in sequence.
     */
    hideFromNavigation: z.boolean().default(false),

    /**
     * If true, allows the user to skip the block entirely (e.g., via a 'Skip' button).
     * Useful for optional or accessibility-sensitive content.
     */
    isSkippable: z.boolean().default(true),
  })
  .refine((data) => !(data.autoContinue && data.showContinueButton), {
    message: "'showContinueButton' must be false when 'autoContinue' is true",
    path: ['showContinueButton'],
  });

export type PluginSettings = z.infer<typeof PluginSettingsSchema>;
