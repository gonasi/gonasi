import { z } from 'zod';
/**
 * Schema for course overview information shown at the top level.
 */
import { z } from 'zod';

// Use flexible JSON schema for content/settings fields.
// Can be replaced later with more specific validation schemas.
const JsonSchema = z.any();

/**
 * Schema for a block within a lesson.
 * Each block corresponds to a plugin and contains settings and content.
 */
const BlockSchema = z.object({
  plugin_type: z.string(), // PluginTypeId in actual data
  id: z.string(),
  content: JsonSchema,
  settings: JsonSchema,
  position: z.number(),
  lesson_id: z.string(),
  updated_by: z.string(),
});

/**
 * Schema describing a type of lesson (e.g. video, quiz, article).
 */
const LessonTypeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  lucide_icon: z.string(),
  bg_color: z.string(),
});

/**
 * Schema representing a basic lesson within a chapter.
 * Does not include blocks.
 */
const LessonSchema = z.object({
  id: z.string(),
  course_id: z.string(),
  chapter_id: z.string(),
  lesson_type_id: z.string(),
  name: z.string(),
  position: z.number().nullable(),
  settings: JsonSchema,
  lesson_types: LessonTypeSchema, // Denormalized info for easier client use
});

/**
 * Schema for a lesson that includes its blocks.
 * This is used when fetching detailed lesson data.
 */
const LessonWithBlocksSchema = z.object({
  blocks: z.array(BlockSchema).nullable(),
  id: z.string(),
  course_id: z.string(),
  chapter_id: z.string(),
  lesson_type_id: z.string(),
  name: z.string(),
  position: z.number().nullable(),
  settings: JsonSchema,
  lesson_types: LessonTypeSchema,
});

/**
 * Schema representing a course chapter, which contains lessons.
 */
const ChapterSchema = z
  .object({
    lesson_count: z.number(),
    id: z.string(),
    course_id: z.string(),
    name: z
      .string()
      .min(3, { message: 'Chapter name must be at least 3 characters long.' })
      .max(100, { message: 'Chapter name must be under 100 characters.' }),
    description: z
      .string()
      .min(20, { message: 'Chapter description must be at least 20 characters.' }),
    position: z
      .number()
      .nonnegative({ message: 'Chapter position must be zero or a positive number.' }),
    requires_payment: z.boolean(),
    lessons: z.array(LessonSchema),
  })
  .superRefine((data, ctx) => {
    if (data.lessons.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.too_small,
        minimum: 2,
        type: 'array',
        inclusive: true,
        path: ['lessons'],
        message: `Chapter "${data.name}" must contain at least two lessons.`,
      });
    }
  });

export const CourseOverviewSchema = z
  .object({
    id: z.string({ required_error: 'Course ID is required.' }),
    name: z
      .string({ required_error: 'Course name is required.' })
      .min(1, 'Course name cannot be empty.'),
    description: z
      .string({ required_error: 'Course description is required.' })
      .min(10, 'Course description cannot be empty.'),
    image_url: z
      .string({ required_error: 'Image URL is required.' })
      .min(1, 'Course thumbnail is missing.'),
    blur_hash: z.string().nullable(),

    course_categories: z.unknown(), // Temporarily loose; strict check comes later
    course_sub_categories: z.unknown(),
    pathways: z.unknown(),
  })
  .superRefine((data, ctx) => {
    const objectFields = [
      { key: 'course_categories', message: 'Course needs to have a category.' },
      { key: 'course_sub_categories', message: 'No subcategory found.' },
      { key: 'pathways', message: 'Add a pathway, related courses are grouped this way.' },
    ];

    for (const { key, message } of objectFields) {
      const value = data[key as keyof typeof data];
      if (value === null || typeof value !== 'object' || Array.isArray(value)) {
        ctx.addIssue({
          path: [key],
          code: z.ZodIssueCode.custom,
          message,
        });
      }
    }
  });

export type CourseOverviewSchemaTypes = z.infer<typeof CourseOverviewSchema>;

/**
 * Schema for pricing plans associated with a course.
 * Includes frequency, promotion details, and tiering options.
 */
export const PricingSchema = z.array(
  z.object({
    id: z.string(),
    course_id: z.string(),
    payment_frequency: z.enum(['monthly', 'bi_monthly', 'quarterly', 'semi_annual', 'annual']),
    is_free: z.boolean(),
    price: z.number(),
    currency_code: z.string(),
    promotional_price: z.number().nullable(),
    promotion_start_date: z.string().nullable(),
    promotion_end_date: z.string().nullable(),
    tier_name: z.string().nullable(),
    tier_description: z.string().nullable(),
    is_active: z.boolean(),
    position: z.number(),
    is_popular: z.boolean(),
    is_recommended: z.boolean(),
  }),
);

export type PricingSchemaTypes = z.infer<typeof PricingSchema>;

/**
 * Flattened version of all lessons (with blocks) grouped per chapter.
 * Used to validate total course structure.
 */
const FlatLessonsWithBlocksSchema = z.array(z.array(LessonWithBlocksSchema));

/**
 * Array of chapter objects (each with nested lessons).
 */
const ValidateChaptersSchema = z.array(ChapterSchema);
export type ValidateChaptersSchemaTypes = z.infer<typeof ValidateChaptersSchema>;

/**
 * Master schema for validating full course publishing payload.
 * Includes deep validation via `.superRefine()`.
 */
export const PublishCourseSchema = z
  .object({
    pricingData: PricingSchema,
    courseOverview: CourseOverviewSchema,
    courseChapters: ValidateChaptersSchema,
    lessonsWithBlocks: FlatLessonsWithBlocksSchema,
  })
  .superRefine((data, ctx) => {
    const { pricingData, courseChapters } = data;

    // Rule 1: If any pricing is not free, there must be at least one free chapter
    const isFree = pricingData.every((p) => p.is_free);
    const hasFreeChapter = courseChapters.some((chapter) => chapter.requires_payment === false);

    if (!isFree && !hasFreeChapter) {
      ctx.addIssue({
        path: ['courseChapters.pricing'],
        code: z.ZodIssueCode.custom,
        message: `Courses with pricing must include at least one chapter that's free to access.`,
      });
    }
  });

export type PublishCourseSchemaTypes = z.infer<typeof PublishCourseSchema>;
