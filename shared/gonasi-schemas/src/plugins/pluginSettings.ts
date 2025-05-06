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
    .boolean()
    .default(false)
    .describe('Automatically continue to the next block after completion'),

  /**
   * If true, a 'Continue' button is shown to let the user manually
   * move to the next block. Typically used when autoContinue is false.
   * This should usually appear *after* the user has completed the interaction.
   */
  showContinueButton: z
    .boolean()
    .default(true)
    .describe('Show a Continue button after interaction completion'),

  /**
   * Delay (in milliseconds) before the plugin block appears after being triggered.
   * Useful for pacing or sequencing multiple blocks smoothly.
   * Example: delayBeforeShow = 1000 means wait 1 second before showing the block.
   */
  delayBeforeShow: z.number().default(0).describe('Delay before showing the block (in ms)'),

  /**
   * If true, applies an entry animation when the block appears.
   * Can be used to draw attention or improve visual flow.
   */
  animateEntry: z.boolean().default(false).describe('Apply entry animation when block appears'),

  /**
   * If true, the block will be hidden from any navigation controls (e.g., timeline or sidebar),
   * making it inaccessible via direct navigation. It will only appear when triggered in sequence.
   */
  hideFromNavigation: z
    .boolean()
    .default(false)
    .describe('Hide this block from navigation controls'),

  /**
   * If true, allows the user to skip the block entirely (e.g., via a 'Skip' button).
   * Useful for optional or accessibility-sensitive content.
   */
  isSkippable: z.boolean().default(false).describe('Allow user to skip this block'),
});
