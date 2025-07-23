import z from 'zod';

import { UUIDSchema } from '../base';

export const PreviousNavigationStateSchema = z.object({
  block: z.union([
    z.object({
      id: UUIDSchema,
      lesson_id: UUIDSchema,
      chapter_id: UUIDSchema,
      course_id: UUIDSchema,
    }),
    z.null(),
  ]),
  lesson: z.union([
    z.object({
      id: UUIDSchema,
      chapter_id: UUIDSchema,
      course_id: UUIDSchema,
    }),
    z.null(),
  ]),
  chapter: z.union([
    z.object({
      id: UUIDSchema,
      course_id: UUIDSchema,
    }),
    z.null(),
  ]),
});
