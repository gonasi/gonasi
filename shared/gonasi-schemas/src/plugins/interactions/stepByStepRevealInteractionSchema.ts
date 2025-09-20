import { z } from 'zod';

export const StepByStepRevealInteractionSchema = z.object({
  plugin_type: z.literal('step_by_step_reveal'),

  revealedCards: z
    .array(
      z.object({
        id: z.string(),
        timestamp: z.number(),
      }),
    )
    .default([]),
  showContinueButton: z.boolean().default(false),
});

export type StepByStepRevealInteractionSchemaTypes = z.infer<
  typeof StepByStepRevealInteractionSchema
>;
