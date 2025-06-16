import { z } from 'zod';

const JsonSchema = z.any();

const BlockSchema = z.object({
  plugin_type: z.string({
    required_error: 'Please select a <span>plugin type</span> to continue.',
    invalid_type_error: 'The <span>plugin type</span> must be a text value.',
  }),
  id: z.string({
    required_error: 'Oops! Every block needs an <span>ID</span>.',
    invalid_type_error: '<span>Block ID</span> should be a string.',
  }),
  content: JsonSchema,
  settings: JsonSchema,
  position: z.number({
    required_error: 'Let’s set a <span>position</span> for this block.',
    invalid_type_error: 'The <span>position</span> must be a number (e.g., 1, 2, 3).',
  }),
  lesson_id: z.string({
    required_error: 'Each block must be linked to a <span>lesson</span>.',
    invalid_type_error: '<span>Lesson ID</span> must be a string.',
  }),
  updated_by: z.string({
    required_error: 'Please include who <span>updated</span> this block.',
    invalid_type_error: '<span>Updated by</span> should be a string (user ID).',
  }),
});

const LessonTypeSchema = z.object({
  id: z.string({
    required_error: 'Missing <span>lesson type ID</span> — please provide one.',
    invalid_type_error: '<span>Lesson type ID</span> should be a string.',
  }),
  name: z.string({
    required_error: 'What’s the <span>name</span> of this lesson type?',
    invalid_type_error: '<span>Name</span> must be a string.',
  }),
  description: z.string({
    required_error: 'Give a brief <span>description</span> of this lesson type.',
    invalid_type_error: '<span>Description</span> must be a string.',
  }),
  lucide_icon: z.string({
    required_error: 'Please choose an <span>icon</span> to represent this type.',
    invalid_type_error: '<span>Icon</span> should be a string value.',
  }),
  bg_color: z.string({
    required_error: 'Pick a <span>background color</span> for this lesson type.',
    invalid_type_error: '<span>Background color</span> must be a string.',
  }),
});

const LessonSchema = z.object({
  id: z.string({
    required_error: 'Each lesson needs a unique <span>ID</span>.',
    invalid_type_error: '<span>Lesson ID</span> should be a string.',
  }),
  course_id: z.string({
    required_error: 'Please link this lesson to a <span>course</span>.',
    invalid_type_error: '<span>Course ID</span> must be a string.',
  }),
  chapter_id: z.string({
    required_error: 'Every lesson belongs to a <span>chapter</span>.',
    invalid_type_error: '<span>Chapter ID</span> must be a string.',
  }),
  lesson_type_id: z.string({
    required_error: 'Choose a <span>lesson type</span> for this lesson.',
    invalid_type_error: '<span>Lesson type ID</span> must be a string.',
  }),
  name: z.string({
    required_error: 'Give your lesson a clear <span>name</span>.',
    invalid_type_error: '<span>Lesson name</span> must be a string.',
  }),
  position: z
    .number({
      invalid_type_error: '<span>Lesson position</span> should be a number, like 1 or 2.',
    })
    .nullable(),
  settings: JsonSchema,
  lesson_types: LessonTypeSchema,
});

const LessonWithBlocksSchema = z
  .object({
    blocks: z
      .array(BlockSchema, {
        invalid_type_error: '<span>Blocks</span> must be a list of valid block objects.',
      })
      .nullable(),
    id: z.string({
      required_error: 'Missing <span>lesson ID</span> — please provide one.',
      invalid_type_error: '<span>Lesson ID</span> should be a string.',
    }),
    course_id: z.string({
      required_error: 'Which <span>course</span> is this lesson part of?',
      invalid_type_error: '<span>Course ID</span> should be a string.',
    }),
    chapter_id: z.string({
      required_error: 'Which <span>chapter</span> is this lesson in?',
      invalid_type_error: '<span>Chapter ID</span> should be a string.',
    }),
    lesson_type_id: z.string({
      required_error: 'Please assign a <span>lesson type</span>.',
      invalid_type_error: '<span>Lesson type ID</span> must be a string.',
    }),
    name: z.string({
      required_error: 'Give your lesson a <span>name</span> so users can find it.',
      invalid_type_error: '<span>Lesson name</span> must be a string.',
    }),
    position: z
      .number({
        invalid_type_error: '<span>Lesson position</span> should be a number.',
      })
      .nullable(),
    settings: JsonSchema,
    lesson_types: LessonTypeSchema,
  })
  .superRefine((data, ctx) => {
    if (!data.blocks) {
      ctx.addIssue({
        code: z.ZodIssueCode.too_small,
        minimum: 2,
        type: 'array',
        inclusive: true,
        path: ['lessonsWithBlocks.noBlocksFound'],
        message: `Lesson <span>${data.name}</span> contains no <span>blocks</span>.`,
      });
    }

    if (data.blocks && data.blocks.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.too_small,
        minimum: 2,
        type: 'array',
        inclusive: true,
        path: ['lessonsWithBlocks.lessThanTwoBlocks'],
        message: `Lesson <span>${data.name}</span> must contain at least <span>two blocks</span>.`,
      });
    }
  });

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

export const PricingSchema = z.array(
  z.object({
    id: z
      .string({ required_error: '<span>Pricing ID</span> is required.' })
      .nonempty('<span>Pricing ID</span> cannot be empty.'),
    course_id: z
      .string({ required_error: '<span>Course ID</span> is required.' })
      .nonempty('<span>Course ID</span> cannot be empty.'),
    payment_frequency: z.enum(['monthly', 'bi_monthly', 'quarterly', 'semi_annual', 'annual'], {
      invalid_type_error: 'Select a valid <span>payment frequency</span>.',
    }),
    is_free: z.boolean({
      invalid_type_error: 'Please specify if the course is <span>free</span>.',
    }),
    price: z
      .number({ invalid_type_error: 'Price must be a <span>number</span>.' })
      .min(0, 'Price cannot be <span>negative</span>.'),
    currency_code: z
      .string({ required_error: '<span>Currency code</span> is required.' })
      .length(3, '<span>Currency code</span> must be a 3-letter ISO code.'),
    promotional_price: z
      .number({ invalid_type_error: 'Promotional price must be a <span>number</span>.' })
      .min(0, 'Promotional price cannot be <span>negative</span>.')
      .nullable(),
    promotion_start_date: z.string().nullable(),
    promotion_end_date: z.string().nullable(),
    tier_name: z.string().nullable(),
    tier_description: z.string().nullable(),
    is_active: z.boolean({
      invalid_type_error: 'Please indicate if the <span>pricing tier</span> is active.',
    }),
    position: z
      .number({ invalid_type_error: '<span>Position</span> must be a number.' })
      .min(0, '<span>Position</span> must be <span>zero</span> or a <span>positive number</span>.'),
    is_popular: z.boolean({
      invalid_type_error: 'Please indicate if this tier is <span>popular</span>.',
    }),
    is_recommended: z.boolean({
      invalid_type_error: 'Please indicate if this tier is <span>recommended</span>.',
    }),
  }),
);

export type PricingSchemaTypes = z.infer<typeof PricingSchema>;

const FlatLessonsWithBlocksSchema = z.array(z.array(LessonWithBlocksSchema));
const ValidateChaptersSchema = z.array(ChapterSchema);
export type ValidateChaptersSchemaTypes = z.infer<typeof ValidateChaptersSchema>;

export const PublishCourseSchema = z
  .object({
    pricingData: PricingSchema,
    courseOverview: CourseOverviewSchema,
    courseChapters: ValidateChaptersSchema,
    lessonsWithBlocks: FlatLessonsWithBlocksSchema,
  })
  .superRefine((data, ctx) => {
    const { pricingData, courseChapters } = data;
    const isFree = pricingData.every((p) => p.is_free);
    const hasFreeChapter = courseChapters.some((chapter) => chapter.requires_payment === false);

    if (courseChapters.length < 2) {
      ctx.addIssue({
        path: ['courseChapters.chapterCount'],
        code: z.ZodIssueCode.custom,
        message: `A course must contain at least <span>2 chapters</span> to be valid.`,
      });
    }

    if (!isFree && !hasFreeChapter) {
      ctx.addIssue({
        path: ['courseChapters.pricing'],
        code: z.ZodIssueCode.custom,
        message: `Courses with pricing must include at least <span>one chapter</span> that's <span>free to access</span>.`,
      });
    }
  });

export type PublishCourseSchemaTypes = z.infer<typeof PublishCourseSchema>;
