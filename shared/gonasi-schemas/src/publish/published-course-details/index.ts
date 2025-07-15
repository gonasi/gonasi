import { z } from 'zod';

import { LessonTypeSchema } from '..';

// Reuse lesson schema but without blocks array
const CourseDetailsLessonSchema = z.object({
  id: z.string(),
  course_id: z.string(),
  chapter_id: z.string(),
  lesson_type_id: z.string(),
  name: z.string().nonempty(),
  position: z.number().int().nonnegative(),
  settings: z.any(),
  lesson_types: LessonTypeSchema,
  total_blocks: z.number().int().nonnegative(),
});
