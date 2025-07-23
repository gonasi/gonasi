import { z } from 'zod';

const CompletionStatsSchema = z.object({
  total: z.number().int(),
  completed: z.number().int(),
  percentage: z.number(), // rounded numeric, could have decimal places
  is_complete: z.boolean(),
});

export const CompletionNavigationStateSchema = z.object({
  blocks: CompletionStatsSchema,
  lessons: CompletionStatsSchema,
  chapters: CompletionStatsSchema,
  course: z.object({
    is_complete: z.boolean(),
  }),
});
