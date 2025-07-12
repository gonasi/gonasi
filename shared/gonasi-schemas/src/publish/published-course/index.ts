import z from 'zod';

import { PricingSchema } from '../course-pricing';

export const PublishedCourseSchema = z.object({
  id: z.string(),
  organization_id: z.string(),

  category_id: z.string(),
  subcategory_id: z.string(),

  name: z.string(),
  description: z.string(),
  image_url: z.string(),
  blur_hash: z.string().nullable(),

  visibility: z.enum(['public', 'private']),
  is_active: z.boolean(),

  pricing_tiers: PricingSchema,
  published_at: z.string().datetime(),
  published_by: z.string(),

  total_chapters: z.number().int().nonnegative(),
  total_lessons: z.number().int().nonnegative(),
  total_blocks: z.number().int().nonnegative(),

  has_free_tier: z.boolean().nullable(),
  min_price: z.number().nullable(),

  total_enrollments: z.number().int().nonnegative(),
  active_enrollments: z.number().int().nonnegative(),
  completion_rate: z.number().min(0).max(100),
  average_rating: z.number().nullable(),
  total_reviews: z.number().int().nonnegative(),

  signed_url: z.string().url(),
});

export const PaginatedPublishedCoursesSchema = z.object({
  count: z.number().int().nonnegative(),
  data: z.array(PublishedCourseSchema),
});

export type PaginatedPublishedCourses = z.infer<typeof PaginatedPublishedCoursesSchema>;
