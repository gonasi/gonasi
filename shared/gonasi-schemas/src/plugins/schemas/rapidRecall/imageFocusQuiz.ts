import { z } from 'zod';

import { BasePluginSettingsSchema } from '../../pluginSettings';
import { NonEmptyLexicalState } from '../../utils';

// ============================================================================
// Focus Region Schema
// ============================================================================

/**
 * Individual focus region with normalized coordinates (0-100%)
 * Works uniformly for SVG, JPEG, and PNG images
 */
export const FocusRegionSchema = z.object({
  /** Unique identifier for the region */
  id: z.string({ required_error: 'Region ID is required.' }),

  /** X position as percentage (0-100) from left edge */
  x: z
    .number({ required_error: 'X position is required.' })
    .min(0, 'X position must be at least 0%.')
    .max(100, 'X position cannot exceed 100%.'),

  /** Y position as percentage (0-100) from top edge */
  y: z
    .number({ required_error: 'Y position is required.' })
    .min(0, 'Y position must be at least 0%.')
    .max(100, 'Y position cannot exceed 100%.'),

  /** Width as percentage (0-100) of image width */
  width: z
    .number({ required_error: 'Width is required.' })
    .min(1, 'Width must be at least 1%.')
    .max(100, 'Width cannot exceed 100%.'),

  /** Height as percentage (0-100) of image height */
  height: z
    .number({ required_error: 'Height is required.' })
    .min(1, 'Height must be at least 1%.')
    .max(100, 'Height cannot exceed 100%.'),

  /** Answer text revealed after delay (supports rich text formatting) */
  answerState: NonEmptyLexicalState,

  /** Optional audio file ID to play when answer is revealed */
  audioId: z.string().optional(),

  /** Optional reveal delay override for this specific region (in seconds) */
  revealDelay: z
    .number()
    .min(0, 'Reveal delay must be at least 0 seconds.')
    .max(30, 'Reveal delay cannot exceed 30 seconds.')
    .optional(),

  /** Position index for ordering (allows shuffling) */
  index: z.number().int().min(0),

  /** Saved zoom level for this region (for cropper restoration) */
  zoom: z.number().min(1).max(10).optional(),

  /** Saved crop X position for this region (for cropper restoration) */
  cropX: z.number().optional(),

  /** Saved crop Y position for this region (for cropper restoration) */
  cropY: z.number().optional(),
});
export type FocusRegionSchemaTypes = z.infer<typeof FocusRegionSchema>;

// ============================================================================
// Content Schema
// ============================================================================

export const ImageFocusQuizContentSchema = z.object({
  /** Image asset ID from file library */
  imageId: z.string({ required_error: 'Image is required.' }),

  /** Image width in pixels (for coordinate normalization) */
  imageWidth: z
    .number({ required_error: 'Image width is required.' })
    .positive('Image width must be greater than 0.'),

  /** Image height in pixels (for coordinate normalization) */
  imageHeight: z
    .number({ required_error: 'Image height is required.' })
    .positive('Image height must be greater than 0.'),

  /** Array of focus regions with answers */
  regions: z
    .array(FocusRegionSchema, { required_error: 'At least one focus region is required.' })
    .min(1, 'You must define at least one focus region.')
    .max(20, 'You can define up to 20 focus regions.'),

  /** Optional instruction/context text shown before quiz starts */
  instructionState: NonEmptyLexicalState.optional(),

  /** How long (in seconds) to display the full image before first region focuses */
  initialDisplayDuration: z
    .number()
    .min(0.5, 'Initial display duration must be at least 0.5 seconds.')
    .max(5, 'Initial display duration cannot exceed 5 seconds.')
    .default(1),
});
export type ImageFocusQuizContentSchemaTypes = z.infer<typeof ImageFocusQuizContentSchema>;

// ============================================================================
// Settings Schema
// ============================================================================

export const ImageFocusQuizSettingsSchema = BasePluginSettingsSchema.extend({
  /** How answers are revealed: auto (after delay) or manual (user tap/click) */
  revealMode: z
    .enum(['auto', 'manual'], {
      errorMap: () => ({ message: 'Reveal mode must be either "auto" or "manual".' }),
    })
    .default('auto'),

  /** Default time (in seconds) to wait before revealing the answer (auto mode) */
  defaultRevealDelay: z
    .number()
    .min(0, 'Default reveal delay must be at least 0 seconds.')
    .max(30, 'Default reveal delay cannot exceed 30 seconds.')
    .default(4),

  /** Blur intensity for unfocused areas in pixels (0-20px) */
  blurIntensity: z
    .number()
    .min(0, 'Blur intensity must be at least 0px (no blur).')
    .max(20, 'Blur intensity cannot exceed 20px.')
    .default(8),

  /** Dim/opacity for unfocused areas (0-1, where 1 is fully dimmed/black) */
  dimIntensity: z
    .number()
    .min(0, 'Dim intensity must be at least 0 (no dimming).')
    .max(1, 'Dim intensity cannot exceed 1 (fully dimmed).')
    .default(0.6),

  /** Whether to briefly show full image between regions (slower, more context) */
  showFullImageBetweenRegions: z.boolean().default(false),

  /** How long (in seconds) to show full image between regions (if enabled) */
  betweenRegionsDuration: z
    .number()
    .min(0.3, 'Between regions duration must be at least 0.3 seconds.')
    .max(5, 'Between regions duration cannot exceed 5 seconds.')
    .default(0.8),

  /** Whether to automatically advance to next region after answer is shown */
  autoAdvance: z.boolean().default(true),

  /** How long (in seconds) to wait before auto-advancing to next region */
  autoAdvanceDelay: z
    .number()
    .min(1, 'Auto-advance delay must be at least 1 second.')
    .max(60, 'Auto-advance delay cannot exceed 60 seconds.')
    .default(3),

  /** Whether to shuffle the order of regions during playback */
  randomization: z.enum(['none', 'shuffle']).default('none'),

  /** Animation duration in milliseconds for zoom/blur transitions */
  animationDuration: z
    .number()
    .min(200, 'Animation duration must be at least 200ms.')
    .max(2000, 'Animation duration cannot exceed 2000ms.')
    .default(600),

  /** Whether to play audio for regions that have audio files */
  playAudio: z.boolean().default(true),
});
export type ImageFocusQuizSettingsSchemaTypes = z.infer<typeof ImageFocusQuizSettingsSchema>;

// ============================================================================
// Main Plugin Schema
// ============================================================================

export const ImageFocusQuizSchema = z.object({
  id: z.string().optional(),
  organization_id: z.string({ required_error: 'Organization ID is required.' }),
  course_id: z.string({ required_error: 'Course ID is required.' }),
  chapter_id: z.string({ required_error: 'Chapter ID is required.' }),
  lesson_id: z.string({ required_error: 'Lesson ID is required.' }),
  plugin_type: z.literal('image_focus_quiz', {
    errorMap: () => ({ message: 'Plugin type must be "image_focus_quiz".' }),
  }),
  content: ImageFocusQuizContentSchema,
  settings: ImageFocusQuizSettingsSchema,
});
export type ImageFocusQuizSchemaTypes = z.infer<typeof ImageFocusQuizSchema>;
