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
    lesson_count: z
      .number({ invalid_type_error: 'Lesson count must be a <span>number</span>.' })
      .nonnegative({
        message: 'Lesson count must be <span>zero</span> or a <span>positive number</span>.',
      }),

    id: z
      .string({ required_error: 'Chapter <span>ID</span> is required.' })
      .nonempty('Chapter <span>ID</span> cannot be empty.'),

    course_id: z
      .string({ required_error: 'Course <span>ID</span> is required.' })
      .nonempty('Course <span>ID</span> cannot be empty.'),

    name: z
      .string({ required_error: 'Chapter <span>name</span> is required.' })
      .min(3, { message: 'Chapter name must be at least <span>3 characters</span> long.' })
      .max(100, { message: 'Chapter name must be under <span>100 characters</span>.' }),

    description: z
      .string({ required_error: 'Chapter <span>description</span> is required.' })
      .min(10, { message: 'Chapter description must be at least <span>10 characters</span>.' }),

    position: z
      .number({
        invalid_type_error: 'Chapter <span>position</span> must be a <span>number</span>.',
      })
      .nonnegative({
        message: 'Chapter position must be <span>zero</span> or a <span>positive number</span>.',
      }),

    requires_payment: z.boolean({
      invalid_type_error: 'Please specify if this chapter <span>requires payment</span>.',
    }),

    lessons: z.array(LessonSchema, {
      invalid_type_error: '<span>Lessons</span> must be an array of valid lesson objects.',
    }),
  })
  .superRefine((data, ctx) => {
    if (data.lessons.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.too_small,
        minimum: 2,
        type: 'array',
        inclusive: true,
        path: ['lessons'],
        message: `Chapter <span>${data.name}</span> must contain at least <span>two lessons</span>.`,
      });
    }
  });

export const CourseOverviewSchema = z
  .object({
    id: z.string({ required_error: 'Course <span>ID</span> is required.' }),

    name: z
      .string({ required_error: 'Course <span>name</span> is required.' })
      .min(1, 'Course <span>name</span> cannot be empty.'),

    description: z
      .string({ required_error: 'Course <span>description</span> is required.' })
      .min(10, 'Course <span>description</span> cannot be empty.'),

    image_url: z
      .string({ required_error: '<span>Image URL</span> is required.' })
      .min(1, 'Course <span>thumbnail</span> is missing.'),

    blur_hash: z.string().nullable(),

    course_categories: z.unknown(),
    course_sub_categories: z.unknown(),
    pathways: z.unknown(),
  })
  .superRefine((data, ctx) => {
    const objectFields = [
      { key: 'course_categories', message: 'Course needs to have a <span>category</span>.' },
      { key: 'course_sub_categories', message: 'No <span>subcategory</span> found.' },
      {
        key: 'pathways',
        message: 'Add a <span>pathway</span>, related courses are grouped this way.',
      },
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
    id: z
      .string({ required_error: 'Pricing ID is required.' })
      .nonempty('Pricing ID cannot be empty.'),
    course_id: z
      .string({ required_error: 'Course ID is required.' })
      .nonempty('Course ID cannot be empty.'),
    payment_frequency: z.enum(['monthly', 'bi_monthly', 'quarterly', 'semi_annual', 'annual'], {
      invalid_type_error: 'Select a valid payment frequency.',
    }),
    is_free: z.boolean({ invalid_type_error: 'Please specify if the course is free.' }),
    price: z
      .number({ invalid_type_error: 'Price must be a number.' })
      .min(0, 'Price cannot be negative.'),
    currency_code: z
      .string({ required_error: 'Currency code is required.' })
      .length(3, 'Currency code must be a 3-letter ISO code.'),
    promotional_price: z
      .number({ invalid_type_error: 'Promotional price must be a number.' })
      .min(0, 'Promotional price cannot be negative.')
      .nullable(),
    promotion_start_date: z.string().nullable(),
    promotion_end_date: z.string().nullable(),
    tier_name: z.string().nullable(),
    tier_description: z.string().nullable(),
    is_active: z.boolean({ invalid_type_error: 'Please indicate if the pricing tier is active.' }),
    position: z
      .number({ invalid_type_error: 'Position must be a number.' })
      .min(0, 'Position must be zero or a positive number.'),
    is_popular: z.boolean({ invalid_type_error: 'Please indicate if this tier is popular.' }),
    is_recommended: z.boolean({
      invalid_type_error: 'Please indicate if this tier is recommended.',
    }),
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

    if (courseChapters.length < 2) {
      ctx.addIssue({
        path: ['courseChapters.length'],
        code: z.ZodIssueCode.custom,
        message: `A course must contain at least <span>2 chapters</span> to be valid.`,
      });
    }

    if (!isFree && !hasFreeChapter) {
      ctx.addIssue({
        path: ['courseChapters.pricing'],
        code: z.ZodIssueCode.custom,
        message: `Courses with pricing must include at least one chapter that's free to access.`,
      });
    }
  });

export type PublishCourseSchemaTypes = z.infer<typeof PublishCourseSchema>;
