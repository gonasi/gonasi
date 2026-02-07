import { z } from 'zod';

export const LiveSessionTrueOrFalseStateInteractionSchema = z.object({
  plugin_type: z.literal('live_session_true_or_false'),
  usertAttempt: z
    .object({
      selected: z.boolean(),
      timestamp: z.number(),
      isCorrect: z.boolean(),
    })
    .nullable()
    .default(null),
});

export type LiveSessionTrueOrFalseStateInteractionSchemaTypes = z.infer<
  typeof LiveSessionTrueOrFalseStateInteractionSchema
>;
