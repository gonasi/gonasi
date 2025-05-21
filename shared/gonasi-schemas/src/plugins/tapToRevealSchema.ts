import { z } from 'zod';

import { BaseInteractionSchema } from './baseInteractionSchema';
import { BasePluginSettingsSchema } from './pluginSettings';

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

export const TapToRevealSchema = z.object({
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

export const TapToRevealSettingsSchema = BasePluginSettingsSchema.extend({});

export const TapToRevealInteractionSchema = BaseInteractionSchema.extend({
  revealedCards: z
    .array(
      z.object({
        uuid: z.string(),
        timestamp: z.number(),
      }),
    )
    .default([]),
});

// Types
export type TapToRevealCardType = z.infer<typeof TapToRevealCardSchema>;
export type TapToRevealSchemaType = z.infer<typeof TapToRevealSchema>;
export type TapToRevealSettingsType = z.infer<typeof TapToRevealSettingsSchema>;
export type TapToRevealInteractionType = z.infer<typeof TapToRevealInteractionSchema>;
