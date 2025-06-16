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
const ChapterSchema = z.object({
  lesson_count: z.number(), // Redundant but helps with summaries
  id: z.string(),
  course_id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  created_by: z.string(),
  position: z.number().nullable(),
  requires_payment: z.boolean(),
  lessons: z.array(LessonSchema),
});

/**
 * Schema for course overview information shown at the top level.
 */
export const CourseOverviewSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  image_url: z.string(),
  blur_hash: z.string().nullable(),
  course_categories: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .nullable(),
  course_sub_categories: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .nullable(),
  pathways: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .nullable(),
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
    courseOverview: CourseOverviewSchema,
    pricingData: PricingSchema,
    courseChapters: ValidateChaptersSchema,
    lessonsWithBlocks: FlatLessonsWithBlocksSchema,
  })
  .superRefine((data, ctx) => {
    const { pricingData, lessonsWithBlocks, courseChapters } = data;

    // Rule 1: If any pricing is not free, there must be at least one free chapter
    const isFree = pricingData.every((p) => p.is_free);
    const hasFreeChapter = courseChapters.some((chapter) => chapter.requires_payment === false);

    if (!isFree && !hasFreeChapter) {
      ctx.addIssue({
        path: ['courseChapters'],
        code: z.ZodIssueCode.custom,
        message:
          'At least one chapter must have requires_payment = false if pricing is not fully free.',
      });
    }

    // Rule 2: Every chapter must contain at least 2 lessons
    for (const chapter of courseChapters) {
      if (chapter.lessons.length < 2) {
        ctx.addIssue({
          path: ['courseChapters'],
          code: z.ZodIssueCode.custom,
          message: `Chapter ${chapter.id} must have at least 2 lessons.`,
        });
      }
    }

    // Rule 3: Every lesson must have at least 2 blocks
    const flatLessons = lessonsWithBlocks.flat();
    for (const lesson of flatLessons) {
      const blockCount = lesson.blocks?.length ?? 0;
      if (blockCount < 2) {
        ctx.addIssue({
          path: ['lessonsWithBlocks'],
          code: z.ZodIssueCode.custom,
          message: `Lesson ${lesson.id} must have at least 2 blocks.`,
        });
      }
    }
  });

export type PublishCourseSchemaTypes = z.infer<typeof PublishCourseSchema>;
