import { z } from 'zod';

const JsonSchema = z.any();

const VisibilityEnum = z.enum(['public', 'private']);
const PaymentFrequencyEnum = z.enum([
  'monthly',
  'bi_monthly',
  'quarterly',
  'semi_annual',
  'annual',
]);

const LessonTypeSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  lucide_icon: z.string(),
  bg_color: z.string(),
});

const BlockSchema = z.object({
  id: z.string().uuid(),
  lesson_id: z.string().uuid(),
  plugin_type: z.string(),
  content: JsonSchema,
  settings: JsonSchema,
  position: z.number().int().nonnegative(),
});

const LessonSchema = z.object({
  id: z.string().uuid(),
  course_id: z.string().uuid(),
  chapter_id: z.string().uuid(),
  lesson_type_id: z.string().uuid(),
  name: z.string().nonempty(),
  position: z.number().int().nonnegative(),
  settings: JsonSchema,
  total_blocks: z.number().int().nonnegative(),
  lesson_types: LessonTypeSchema,
  blocks: z.array(BlockSchema),
});

const ChapterSchema = z.object({
  id: z.string().uuid(),
  course_id: z.string().uuid(),
  name: z.string().nonempty(),
  description: z.string().nonempty(),
  position: z.number().int().nonnegative(),
  lesson_count: z.number().int().nonnegative(),
  total_lessons: z.number().int().nonnegative(),
  total_blocks: z.number().int().nonnegative(),
  lessons: z.array(LessonSchema),
});

const CourseStructureSchema = z.object({
  total_chapters: z.number().int().nonnegative(),
  total_lessons: z.number().int().nonnegative(),
  total_blocks: z.number().int().nonnegative(),
  chapters: z.array(ChapterSchema),
});

const PricingTierSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  course_id: z.string().uuid(),
  payment_frequency: PaymentFrequencyEnum,
  is_free: z.boolean(),
  price: z.number().nullable(),
  currency_code: z.string(),
  promotional_price: z.number().nullable(),
  promotion_start_date: z.string().nullable(),
  promotion_end_date: z.string().nullable(),
  tier_name: z.string(),
  tier_description: z.string(),
  is_active: z.boolean(),
  position: z.number().int().nonnegative(),
  is_popular: z.boolean(),
  is_recommended: z.boolean(),
});

export const PublishCourseSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  category_id: z.string().uuid().nullable(),
  subcategory_id: z.string().uuid().nullable(),
  is_active: z.boolean(),
  name: z.string(),
  description: z.string(),
  image_url: z.string().url().nullable(),
  blur_hash: z.string().nullable(),
  visibility: VisibilityEnum,

  course_structure: CourseStructureSchema,
  pricing_tiers: z.array(PricingTierSchema),
});
