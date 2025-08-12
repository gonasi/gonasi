import { z } from 'zod';

import { BasePluginSettingsSchema } from '../../pluginSettings';

//
// Hotspot Schema
//
export const GuidedImageHotspot = z.object({
  id: z.string({ required_error: 'Hotspot ID is required.' }),
  xPercent: z
    .number({ required_error: 'X position is required.' })
    .min(0, { message: 'X position must be at least 0%.' })
    .max(100, { message: 'X position cannot exceed 100%.' }),
  yPercent: z
    .number({ required_error: 'Y position is required.' })
    .min(0, { message: 'Y position must be at least 0%.' })
    .max(100, { message: 'Y position cannot exceed 100%.' }),
  message: z
    .string({ required_error: 'Hotspot message is required.' })
    .min(1, { message: 'Hotspot message cannot be empty.' }),
  zoomLevel: z
    .number({ required_error: 'Zoom level is required.' })
    .min(0.1, { message: 'Zoom level must be at least 0.1x.' })
    .max(10, { message: 'Zoom level cannot exceed 10x.' }),
});

//
// Content Schema
//
export const GuidedImageHotspotContentSchema = z.object({
  image_id: z.string({ required_error: 'Image ID is required.' }),
  hotspots: z
    .array(GuidedImageHotspot, { required_error: 'Hotspots are required.' })
    .min(1, { message: 'At least one hotspot is required.' }),
});
export type GuidedImageHotspotContentSchemaTypes = z.infer<typeof GuidedImageHotspotContentSchema>;

//
// Settings Schema
//
export const GuidedImageHotspotSchemaSettings = BasePluginSettingsSchema;

//
// Main Schema
//
export const GuidedImageHotspotSchema = z.object({
  id: z.string().optional(),
  organization_id: z.string({ required_error: 'Organization ID is required.' }),
  course_id: z.string({ required_error: 'Course ID is required.' }),
  chapter_id: z.string({ required_error: 'Chapter ID is required.' }),
  lesson_id: z.string({ required_error: 'Lesson ID is required.' }),
  plugin_type: z.literal('guided_image_hotspots', {
    errorMap: () => ({ message: 'Plugin type must be "guided_image_hotspots".' }),
  }),
  content: GuidedImageHotspotContentSchema,
  settings: GuidedImageHotspotSchemaSettings,
});
export type GuidedImageHotspotSchemaTypes = z.infer<typeof GuidedImageHotspotSchema>;
