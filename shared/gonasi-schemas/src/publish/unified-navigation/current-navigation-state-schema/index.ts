import z from 'zod';

import { TimestampSchema, UUIDSchema } from '../base';

const ProgressDataSchema = z.object({
  id: UUIDSchema,
  is_completed: z.boolean(),
  completed_at: TimestampSchema,
  progress_percentage: z.number(),
});

export const CurrentNavigationStateSchema = z.object({
  block: z.union([ProgressDataSchema, z.null()]),
  lesson: z.union([ProgressDataSchema, z.null()]),
  chapter: z.union([ProgressDataSchema, z.null()]),
  course: z.object({
    id: UUIDSchema,
  }),
});
