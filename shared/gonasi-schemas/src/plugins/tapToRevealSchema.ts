// TODO: DELETE ONCE IMPLEMENTATION IS COMPLETE

import { z } from 'zod';

import { BaseInteractionSchema } from './baseInteractionSchema';
import { BasePluginSettingsSchema, LayoutPluginSettingsSchema } from './pluginSettings';

export const TapToRevealCardSchema = z.object({
  frontContent: z
    .string({ required_error: 'Front content is required.' })
    .trim()
    .min(5, 'Front content must be at least 5 characters long.'),
  backContent: z
    .string({ required_error: 'Back content is required.' })
    .trim()
    .min(5, 'Back content must be at least 5 characters long.'),
  uuid: z.string({ required_error: 'Card uuid is required' }),
});

//
// Content Schema
//
export const TapToRevealContentSchema = z.object({
  title: z
    .string({ required_error: 'Title is required.' })
    .trim()
    .min(5, 'Title must be at least 5 characters long.'),

  cards: z
    .array(TapToRevealCardSchema)
    .min(1, 'At least one card is required.')
    .max(10, 'No more than 10 cards are allowed.'),

  uuid: z.string().optional(),
});

//
// Plugin Settings Schema
//
export const TapToRevealSettingsSchema = BasePluginSettingsSchema.merge(
  LayoutPluginSettingsSchema,
).extend({});

//
// Create Block Schema
//
export const SubmitCreateTapToRevealSchema = z.object({
  content: TapToRevealContentSchema,
  lessonId: z.string({ required_error: 'Lesson ID is required.' }),
  plugin_type: z.literal('tap_to_reveal').default('tap_to_reveal'),
  weight: z.number().default(1),
  settings: TapToRevealSettingsSchema,
});

//
// Edit Block Settings Schema
//
export const SubmitEditTapToRevealSettingsSchema = TapToRevealSettingsSchema.extend({
  blockId: z.string({ required_error: 'Block ID is required.' }),
});

//
// Interaction Schema
//
export const TapToRevealStateInteractionSchema = BaseInteractionSchema.extend({
  revealedCards: z
    .array(
      z.object({
        uuid: z.string(),
        timestamp: z.number(),
      }),
    )
    .default([]),
});

//
// Types
//
export type TapToRevealContentSchemaType = z.infer<typeof TapToRevealContentSchema>;
export type TapToRevealSettingsSchemaType = z.infer<typeof TapToRevealSettingsSchema>;
export type SubmitCreateTapToRevealSchemaType = z.infer<typeof SubmitCreateTapToRevealSchema>;
export type SubmitEditTapToRevealSettingsSchemaType = z.infer<
  typeof SubmitEditTapToRevealSettingsSchema
>;
export type TapToRevealStateInteractionSchemaType = z.infer<
  typeof TapToRevealStateInteractionSchema
>;
export type TapToRevealCardSchemaType = z.infer<typeof TapToRevealCardSchema>;
