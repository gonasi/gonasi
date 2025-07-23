import { z } from 'zod';

const UUIDSchema = z.string().uuid();

export const CourseNavigationInfoSchema = z.object({
  id: UUIDSchema,
  name: z.string(),
  description: z.string(),
  organization_id: UUIDSchema,
});
