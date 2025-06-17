import { z } from 'zod';

const JsonSchema = z.any();

const BlockSchema = z.object({
  plugin_type: z.string({
    required_error: `Just need to pick a <span>plugin type</span> and we're good to go!`,
    invalid_type_error: `The <span>plugin type</span> should be text.`,
  }),
  id: z.string({
    required_error: `Every block needs a unique <span>ID</span> - no worries, this is usually automatic!`,
    invalid_type_error: `<span>Block ID</span> should be text.`,
  }),
  content: JsonSchema,
  settings: JsonSchema,
  position: z.number({
    required_error: `Let's add a <span>position</span> for this block so everything stays organized.`,
    invalid_type_error: `The <span>position</span> should be a number like 1, 2, or 3.`,
  }),
  lesson_id: z.string({
    required_error: `This block needs to be connected to a <span>lesson</span>.`,
    invalid_type_error: `<span>Lesson ID</span> should be text.`,
  }),
  updated_by: z.string({
    required_error: `We just need to know who <span>last updated</span> this block.`,
    invalid_type_error: `<span>Updated by</span> should be a user ID.`,
  }),
});

const LessonTypeSchema = z.object({
  id: z.string({
    required_error: `This lesson type needs an <span>ID</span> to identify it.`,
    invalid_type_error: `<span>Lesson type ID</span> should be text.`,
  }),
  name: z.string({
    required_error: `What would you like to call this <span>lesson type</span>?`,
    invalid_type_error: `<span>Name</span> should be text.`,
  }),
  description: z.string({
    required_error: `A quick <span>description</span> would help users understand this lesson type.`,
    invalid_type_error: `<span>Description</span> should be text.`,
  }),
  lucide_icon: z.string({
    required_error: `Pick an <span>icon</span> that represents this lesson type nicely.`,
    invalid_type_error: `<span>Icon</span> should be text.`,
  }),
  bg_color: z.string({
    required_error: `Choose a <span>background color</span> that looks good for this type.`,
    invalid_type_error: `<span>Background color</span> should be text.`,
  }),
});

const LessonSchema = z.object({
  id: z.string({
    required_error: `Each lesson needs its own unique <span>ID</span>.`,
    invalid_type_error: `<span>Lesson ID</span> should be text.`,
  }),
  course_id: z.string({
    required_error: `This lesson needs to be linked to a <span>course</span>.`,
    invalid_type_error: `<span>Course ID</span> should be text.`,
  }),
  chapter_id: z.string({
    required_error: `Every lesson belongs in a <span>chapter</span>.`,
    invalid_type_error: `<span>Chapter ID</span> should be text.`,
  }),
  lesson_type_id: z.string({
    required_error: `Please choose what <span>type of lesson</span> this is.`,
    invalid_type_error: `<span>Lesson type ID</span> should be text.`,
  }),
  name: z.string({
    required_error: `Your lesson needs a catchy <span>name</span> so students know what to expect.`,
    invalid_type_error: `<span>Lesson name</span> should be text.`,
  }),
  position: z
    .number({
      invalid_type_error: `<span>Lesson position</span> should be a number to keep things in order.`,
    })
    .nullable(),
  settings: JsonSchema,
  lesson_types: LessonTypeSchema,
});

const LessonWithBlocksSchema = z
  .object({
    blocks: z
      .array(BlockSchema, {
        invalid_type_error: `<span>Blocks</span> should be a list of content blocks.`,
      })
      .nullable(),
    id: z.string({
      required_error: `This lesson is missing an <span>ID</span> - let's add one!`,
      invalid_type_error: `<span>Lesson ID</span> should be text.`,
    }),
    course_id: z.string({
      required_error: `Which <span>course</span> does this lesson belong to?`,
      invalid_type_error: `<span>Course ID</span> should be text.`,
    }),
    chapter_id: z.string({
      required_error: `Which <span>chapter</span> should this lesson go in?`,
      invalid_type_error: `<span>Chapter ID</span> should be text.`,
    }),
    lesson_type_id: z.string({
      required_error: `Let's pick a <span>lesson type</span> for this one.`,
      invalid_type_error: `<span>Lesson type ID</span> should be text.`,
    }),
    name: z.string({
      required_error: `Give your lesson a great <span>name</span> that students will love.`,
      invalid_type_error: `<span>Lesson name</span> should be text.`,
    }),
    position: z
      .number({
        invalid_type_error: `<span>Lesson position</span> should be a number.`,
      })
      .nullable(),
    settings: JsonSchema,
    lesson_types: LessonTypeSchema,
  })
  .superRefine((data, ctx) => {
    // Check if blocks array is null or undefined
    if (!data.blocks) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['blocks'],
        message: `Lesson <span>${data.name}</span> is looking a bit empty - let's add some <span>content blocks</span> to make it shine!`,
      });
      return;
    }

    // Check if lesson has at least 2 blocks
    if (data.blocks.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.too_small,
        minimum: 2,
        type: 'array',
        inclusive: true,
        path: ['blocks'],
        message: `Lesson <span>${data.name}</span> needs at least <span>2 content blocks</span> to be ready for students.`,
      });
    }
  });

const ChapterSchema = z.object({
  lesson_count: z
    .number({ invalid_type_error: `Lesson count should be a <span>number</span>.` })
    .nonnegative({
      message: `Lesson count should be <span>zero or more</span>.`,
    }),
  id: z
    .string({ required_error: `This chapter needs an <span>ID</span>.` })
    .nonempty(`Chapter <span>ID</span> can't be empty.`),
  course_id: z
    .string({ required_error: `Which <span>course</span> does this chapter belong to?` })
    .nonempty(`<span>Course ID</span> can't be empty.`),
  name: z
    .string({ required_error: `Your chapter needs a <span>name</span>.` })
    .min(3, { message: `Chapter name should be at least <span>3 characters</span> long.` })
    .max(100, { message: `Keep the chapter name under <span>100 characters</span>.` }),
  description: z
    .string({
      required_error: `Add a <span>description</span> to help students know what to expect.`,
    })
    .min(10, {
      message: `Chapter description should be at least <span>10 characters</span> long.`,
    }),
  position: z
    .number({
      invalid_type_error: `Chapter <span>position</span> should be a <span>number</span>.`,
    })
    .nonnegative({
      message: `Chapter position should be <span>zero or higher</span>.`,
    }),
  requires_payment: z.boolean({
    invalid_type_error: `Please let us know if this chapter <span>requires payment</span>.`,
  }),
  lessons: z.array(LessonSchema, {
    invalid_type_error: `<span>Lessons</span> should be a list of lesson objects.`,
  }),
});

export const CourseOverviewSchema = z
  .object({
    id: z.string({ required_error: `Your course needs a unique <span>ID</span>.` }),
    name: z
      .string({ required_error: `What's your course called? Add a <span>name</span> here.` })
      .min(1, `Course <span>name</span> can't be empty.`),
    description: z
      .string({
        required_error: `Tell students what your course is about with a <span>description</span>.`,
      })
      .min(
        10,
        `Course <span>description</span> should be a bit longer to help students understand what they'll learn.`,
      ),
    image_url: z
      .string({
        required_error: `Add an eye-catching <span>thumbnail image</span> for your course.`,
      })
      .min(1, `Your course needs a <span>thumbnail image</span> to look professional.`),
    blur_hash: z.string().nullable(),
    course_categories: z.unknown(),
    course_sub_categories: z.unknown(),
    pathways: z.unknown(),
  })
  .superRefine((data, ctx) => {
    const objectFields = [
      {
        key: 'course_categories',
        message: `Pick a <span>category</span> that fits your course best.`,
      },
      {
        key: 'course_sub_categories',
        message: `Choose a <span>subcategory</span> to help students find your course.`,
      },
      {
        key: 'pathways',
        message: `Add your course to a <span>learning pathway</span> so students can discover related content.`,
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
      .string({ required_error: `This pricing option needs an <span>ID</span>.` })
      .nonempty(`<span>Pricing ID</span> can't be empty.`),
    course_id: z
      .string({ required_error: `Link this pricing to a <span>course</span>.` })
      .nonempty(`<span>Course ID</span> can't be empty.`),
    payment_frequency: z.enum(['monthly', 'bi_monthly', 'quarterly', 'semi_annual', 'annual'], {
      invalid_type_error: `Choose how often students will pay with a <span>payment frequency</span>.`,
    }),
    is_free: z.boolean({
      invalid_type_error: `Let us know if this course is <span>free</span> or paid.`,
    }),
    price: z
      .number({ invalid_type_error: `<span>Price</span> should be a number.` })
      .min(0, `<span>Price</span> can't be negative.`),
    currency_code: z
      .string({ required_error: `What <span>currency</span> are you using?` })
      .length(3, `<span>Currency code</span> should be 3 letters (like USD, EUR, GBP).`),
    promotional_price: z
      .number({ invalid_type_error: `<span>Promotional price</span> should be a number.` })
      .min(0, `<span>Promotional price</span> can't be negative.`)
      .nullable(),
    promotion_start_date: z.string().nullable(),
    promotion_end_date: z.string().nullable(),
    tier_name: z.string().nullable(),
    tier_description: z.string().nullable(),
    is_active: z.boolean({
      invalid_type_error: `Is this <span>pricing option</span> currently available to students?`,
    }),
    position: z
      .number({ invalid_type_error: `<span>Position</span> should be a number.` })
      .min(0, `<span>Position</span> should be zero or higher.`),
    is_popular: z.boolean({
      invalid_type_error: `Is this your <span>most popular</span> pricing option?`,
    }),
    is_recommended: z.boolean({
      invalid_type_error: `Do you <span>recommend</span> this pricing tier to most students?`,
    }),
  }),
);

export type PricingSchemaTypes = z.infer<typeof PricingSchema>;

// Updated schema to use flattened array structure instead of nested arrays
const LessonsWithBlocksSchema = z.array(LessonWithBlocksSchema).superRefine((data, ctx) => {
  // Check if the array is empty or all lessons are empty
  if (!data || data.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['noLessonsInCourse'],
      message: `<span>No lessons</span> found in this course. Add some lessons to get started!`,
    });
    return;
  }

  // Group lessons by chapter for validation
  const lessonsByChapter = data.reduce(
    (acc, lesson) => {
      const chapterId = lesson.chapter_id;

      if (!acc[chapterId]) {
        acc[chapterId] = [];
      }

      acc[chapterId].push(lesson);
      return acc;
    },
    {} as Record<string, typeof data>,
  );

  // Validate each chapter has at least one lesson
  Object.entries(lessonsByChapter).forEach(([chapterId, lessons]) => {
    if (lessons.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['chapters', chapterId, 'noLessons'],
        message: `Chapter <span>${chapterId}</span> needs at least one lesson.`,
      });
    }
  });
});

const ValidateChaptersSchema = z.array(ChapterSchema);
export type ValidateChaptersSchemaTypes = z.infer<typeof ValidateChaptersSchema>;

export const PublishCourseSchema = z
  .object({
    pricingData: PricingSchema,
    courseOverview: CourseOverviewSchema,
    courseChapters: ValidateChaptersSchema,
    lessonsWithBlocks: LessonsWithBlocksSchema,
  })
  .superRefine((data, ctx) => {
    const { pricingData, courseChapters, lessonsWithBlocks } = data;
    const isFree = pricingData.every((p) => p.is_free);
    const hasFreeChapter = courseChapters.some((chapter) => chapter.requires_payment === false);

    if (courseChapters.length < 2) {
      ctx.addIssue({
        path: ['courseChapters', 'chapterCount'],
        code: z.ZodIssueCode.custom,
        message: `Your course needs at least <span>2 chapters</span> to provide a complete learning journey.`,
      });
    }

    if (courseChapters.length) {
      courseChapters.forEach((chapter) => {
        if (chapter.lessons.length < 2) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['courseChapters', chapter.id, 'insufficientLessons'],
            message: `Each chapter must include at least 2 lessons. <span>${chapter.name}</span> currently has only <span>${chapter.lessons.length}</span>.`,
          });
        }
      });
    }

    // Validate that chapters referenced in lessonsWithBlocks actually exist
    if (lessonsWithBlocks.length > 0) {
      const chapterIds = new Set(courseChapters.map((c) => c.id));
      const lessonChapterIds = new Set(lessonsWithBlocks.map((l) => l.chapter_id));

      lessonChapterIds.forEach((chapterId) => {
        if (!chapterIds.has(chapterId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['lessonsWithBlocks', 'orphanedLessons'],
            message: `Found lessons referencing non-existent chapter <span>${chapterId}</span>.`,
          });
        }
      });
    }

    if (!isFree && !hasFreeChapter) {
      ctx.addIssue({
        path: ['courseChapters', 'pricing'],
        code: z.ZodIssueCode.custom,
        message: `Since your course has paid content, you'll need at least <span>one free chapter</span> so students can preview what they're getting.`,
      });
    }
  });

export type PublishCourseSchemaTypes = z.infer<typeof PublishCourseSchema>;
