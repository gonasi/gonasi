import { z } from 'zod';

const JsonSchema = z.any();

const BlockSchema = z.object({
  plugin_type: z.string({
    required_error: `Just need to pick a <span class="go-title">plugin type</span> and we're good to go!`,
    invalid_type_error: `The <span class="go-title">plugin type</span> should be text.`,
  }),
  id: z.string({
    required_error: `Every block needs a unique <span class="go-title">ID</span> - no worries, this is usually automatic!`,
    invalid_type_error: `<span class="go-title">Block ID</span> should be text.`,
  }),
  content: JsonSchema,
  settings: JsonSchema,
  position: z.number({
    required_error: `Let's add a <span class="go-title">position</span> for this block so everything stays organized.`,
    invalid_type_error: `The <span class="go-title">position</span> should be a number like 1, 2, or 3.`,
  }),
  lesson_id: z.string({
    required_error: `This block needs to be connected to a <span class="go-title">lesson</span>.`,
    invalid_type_error: `<span class="go-title">Lesson ID</span> should be text.`,
  }),
  updated_by: z.string({
    required_error: `We just need to know who <span class="go-title">last updated</span> this block.`,
    invalid_type_error: `<span class="go-title">Updated by</span> should be a user ID.`,
  }),
});

const LessonTypeSchema = z.object({
  id: z.string({
    required_error: `This lesson type needs an <span class="go-title">ID</span> to identify it.`,
    invalid_type_error: `<span class="go-title">Lesson type ID</span> should be text.`,
  }),
  name: z.string({
    required_error: `What would you like to call this <span class="go-title">lesson type</span>?`,
    invalid_type_error: `<span class="go-title">Name</span> should be text.`,
  }),
  description: z.string({
    required_error: `A quick <span class="go-title">description</span> would help users understand this lesson type.`,
    invalid_type_error: `<span class="go-title">Description</span> should be text.`,
  }),
  lucide_icon: z.string({
    required_error: `Pick an <span class="go-title">icon</span> that represents this lesson type nicely.`,
    invalid_type_error: `<span class="go-title">Icon</span> should be text.`,
  }),
  bg_color: z.string({
    required_error: `Choose a <span class="go-title">background color</span> that looks good for this type.`,
    invalid_type_error: `<span class="go-title">Background color</span> should be text.`,
  }),
});

const LessonSchema = z.object({
  id: z.string({
    required_error: `Each lesson needs its own unique <span class="go-title">ID</span>.`,
    invalid_type_error: `<span class="go-title">Lesson ID</span> should be text.`,
  }),
  course_id: z.string({
    required_error: `This lesson needs to be linked to a <span class="go-title">course</span>.`,
    invalid_type_error: `<span class="go-title">Course ID</span> should be text.`,
  }),
  chapter_id: z.string({
    required_error: `Every lesson belongs in a <span class="go-title">chapter</span>.`,
    invalid_type_error: `<span class="go-title">Chapter ID</span> should be text.`,
  }),
  lesson_type_id: z.string({
    required_error: `Please choose what <span class="go-title">type of lesson</span> this is.`,
    invalid_type_error: `<span class="go-title">Lesson type ID</span> should be text.`,
  }),
  name: z.string({
    required_error: `Your lesson needs a catchy <span class="go-title">name</span> so students know what to expect.`,
    invalid_type_error: `<span class="go-title">Lesson name</span> should be text.`,
  }),
  position: z
    .number({
      invalid_type_error: `<span class="go-title">Lesson position</span> should be a number to keep things in order.`,
    })
    .nullable(),
  settings: JsonSchema,
  lesson_types: LessonTypeSchema,
});

const LessonWithBlocksSchema = z
  .object({
    blocks: z
      .array(BlockSchema, {
        invalid_type_error: `<span class="go-title">Blocks</span> should be a list of content blocks.`,
      })
      .nullable(),
    id: z.string({
      required_error: `This lesson is missing an <span class="go-title">ID</span> - let's add one!`,
      invalid_type_error: `<span class="go-title">Lesson ID</span> should be text.`,
    }),
    course_id: z.string({
      required_error: `Which <span class="go-title">course</span> does this lesson belong to?`,
      invalid_type_error: `<span class="go-title">Course ID</span> should be text.`,
    }),
    chapter_id: z.string({
      required_error: `Which <span class="go-title">chapter</span> should this lesson go in?`,
      invalid_type_error: `<span class="go-title">Chapter ID</span> should be text.`,
    }),
    lesson_type_id: z.string({
      required_error: `Let's pick a <span class="go-title">lesson type</span> for this one.`,
      invalid_type_error: `<span class="go-title">Lesson type ID</span> should be text.`,
    }),
    name: z.string({
      required_error: `Give your lesson a great <span class="go-title">name</span> that students will love.`,
      invalid_type_error: `<span class="go-title">Lesson name</span> should be text.`,
    }),
    position: z
      .number({
        invalid_type_error: `<span class="go-title">Lesson position</span> should be a number.`,
      })
      .nullable(),
    settings: JsonSchema,
    lesson_types: LessonTypeSchema,
  })
  .superRefine((data, ctx) => {
    // Check if blocks array is null or undefined
    if (!data.blocks || data.blocks.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['blocks'],
        message: `Lesson <span class="warning">${data.name}</span> is looking a bit empty, let's add some <span class="go-title">content blocks</span> to make it shine!`,
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
        message: `Lesson <span class="warning">${data.name}</span> needs at least <span class="error">2 content blocks</span> to be ready for students.`,
      });
    }
  });

const ChapterSchema = z.object({
  lesson_count: z
    .number({
      invalid_type_error: `Lesson count should be a <span class="go-title">number</span>.`,
    })
    .nonnegative({
      message: `Lesson count should be <span class="success">zero or more</span>.`,
    }),
  id: z
    .string({ required_error: `This chapter needs an <span class="go-title">ID</span>.` })
    .nonempty(`Chapter <span class="go-title">ID</span> can't be empty.`),
  course_id: z
    .string({
      required_error: `Which <span class="go-title">course</span> does this chapter belong to?`,
    })
    .nonempty(`<span class="go-title">Course ID</span> can't be empty.`),
  name: z
    .string({ required_error: `Your chapter needs a <span class="go-title">name</span>.` })
    .min(3, {
      message: `Chapter name should be at least <span class="error">3 characters</span> long.`,
    })
    .max(100, {
      message: `Keep the chapter name under <span class="warning">100 characters</span>.`,
    }),
  description: z
    .string({
      required_error: `Add a <span class="go-title">description</span> to help students know what to expect.`,
    })
    .min(10, {
      message: `Chapter description should be at least <span class="error">10 characters</span> long.`,
    }),
  position: z
    .number({
      invalid_type_error: `Chapter <span class="go-title">position</span> should be a <span class="go-title">number</span>.`,
    })
    .nonnegative({
      message: `Chapter position should be <span class="success">zero or higher</span>.`,
    }),
  requires_payment: z.boolean({
    invalid_type_error: `Please let us know if this chapter <span class="go-title">requires payment</span>.`,
  }),
  lessons: z.array(LessonSchema, {
    invalid_type_error: `<span class="go-title">Lessons</span> should be a list of lesson objects.`,
  }),
});

export const CourseOverviewSchema = z
  .object({
    id: z.string({
      required_error: `<lucide name="KeyRound" size="12" /> Your course needs a unique <span class="go-title">ID</span>.`,
    }),
    name: z
      .string({
        required_error: `<lucide name="Type" size="12" /> What's your course called? Add a <span class="go-title">name</span> here.`,
      })
      .min(
        1,
        `<lucide name="AlertCircle" size="12" /> Course <span class="go-title">name</span> can’t be empty.`,
      ),
    description: z
      .string({
        required_error: `<lucide name="AlignLeft" size="12" /> Tell students what your course is about with a <span class="go-title">description</span>.`,
      })
      .min(
        10,
        `<lucide name="FileText" size="12" /> Course <span class="go-title">description</span> should be a bit longer to help students understand what they'll learn.`,
      ),
    image_url: z
      .string({
        required_error: `<lucide name="Image" size="12" /> Add an eye-catching <span class="go-title">thumbnail image</span> for your course.`,
      })
      .min(
        1,
        `<lucide name="ImageOff" size="12" /> Your course needs a <span class="go-title">thumbnail image</span> to look professional.`,
      ),
    blur_hash: z.string().nullable(),

    // Allow these to be nullable/optional so custom errors run in superRefine
    course_categories: z
      .object({
        id: z.string(),
        name: z.string(),
      })
      .optional()
      .nullable(),

    course_sub_categories: z
      .object({
        id: z.string(),
        name: z.string(),
      })
      .optional()
      .nullable(),

    pathways: z
      .object({
        id: z.string(),
        name: z.string(),
      })
      .optional()
      .nullable(),
  })
  .superRefine((data, ctx) => {
    const objectFields = [
      {
        key: 'course_categories',
        label: 'category',
        icon: 'ListTree',
        message: `Pick a <span class="go-title">category</span> that fits your course best.`,
      },
      {
        key: 'course_sub_categories',
        label: 'subcategory',
        icon: 'ListCollapse',
        message: `Choose a <span class="go-title">subcategory</span> to help students find your course.`,
      },
      {
        key: 'pathways',
        label: 'pathway',
        icon: 'Route',
        message: `Add your course to a <span class="go-title">learning pathway</span> so students can discover related content.`,
      },
    ];

    for (const { key, message, icon } of objectFields) {
      const value = data[key as keyof typeof data];

      const isMissingOrInvalid =
        value === null ||
        typeof value !== 'object' ||
        Array.isArray(value) ||
        !('id' in value) ||
        !('name' in value) ||
        typeof value.id !== 'string' ||
        typeof value.name !== 'string';

      if (isMissingOrInvalid) {
        ctx.addIssue({
          path: [key],
          code: z.ZodIssueCode.custom,
          message: `<lucide name="${icon}" size="12" /> ${message}`,
        });
      }
    }
  });

export type CourseOverviewSchemaTypes = z.infer<typeof CourseOverviewSchema>;

export const PricingSchema = z.array(
  z.object({
    id: z
      .string({ required_error: `This pricing option needs an <span class="go-title">ID</span>.` })
      .nonempty(`<span class="go-title">Pricing ID</span> can't be empty.`),
    course_id: z
      .string({ required_error: `Link this pricing to a <span class="go-title">course</span>.` })
      .nonempty(`<span class="go-title">Course ID</span> can't be empty.`),
    payment_frequency: z.enum(['monthly', 'bi_monthly', 'quarterly', 'semi_annual', 'annual'], {
      invalid_type_error: `Choose how often students will pay with a <span class="go-title">payment frequency</span>.`,
    }),
    is_free: z.boolean({
      invalid_type_error: `Let us know if this course is <span class="go-title">free</span> or paid.`,
    }),
    price: z
      .number({ invalid_type_error: `<span class="go-title">Price</span> should be a number.` })
      .min(0, `<span class="go-title">Price</span> can't be negative.`),
    currency_code: z
      .string({ required_error: `What <span class="go-title">currency</span> are you using?` })
      .length(
        3,
        `<span class="go-title">Currency code</span> should be 3 letters (like USD, EUR, GBP).`,
      ),
    promotional_price: z
      .number({
        invalid_type_error: `<span class="go-title">Promotional price</span> should be a number.`,
      })
      .min(0, `<span class="go-title">Promotional price</span> can't be negative.`)
      .nullable(),
    promotion_start_date: z.string().nullable(),
    promotion_end_date: z.string().nullable(),
    tier_name: z.string().nullable(),
    tier_description: z.string().nullable(),
    is_active: z.boolean({
      invalid_type_error: `Is this <span class="go-title">pricing option</span> currently available to students?`,
    }),
    position: z
      .number({ invalid_type_error: `<span class="go-title">Position</span> should be a number.` })
      .min(0, `<span class="go-title">Position</span> should be zero or higher.`),
    is_popular: z.boolean({
      invalid_type_error: `Is this your <span class="success">most popular</span> pricing option?`,
    }),
    is_recommended: z.boolean({
      invalid_type_error: `Do you <span class="success">recommend</span> this pricing tier to most students?`,
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
      message: `<span class="error">No lessons</span> found in this course. Add some lessons to get started!`,
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
        message: `Chapter <span class="warning">${chapterId}</span> needs at least one lesson.`,
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
        message: `Your course needs at least <span class="error">2 chapters</span> to provide a complete learning journey.`,
      });
    }

    if (courseChapters.length) {
      courseChapters.forEach((chapter) => {
        if (chapter.lessons.length < 2) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['courseChapters', chapter.id, 'insufficientLessons'],
            message: `Each chapter must include at least 2 lessons. <span class="warning">${chapter.name}</span> currently has only <span class="error">${chapter.lessons.length}</span>.`,
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
            message: `Found lessons referencing non-existent chapter <span class="error">${chapterId}</span>.`,
          });
        }
      });
    }

    if (!isFree && !hasFreeChapter) {
      ctx.addIssue({
        path: ['courseChapters', 'pricing'],
        code: z.ZodIssueCode.custom,
        message: `Since your course has paid content, you'll need at least <span class="warning">one free chapter</span> so students can preview what they're getting.`,
      });
    }
  });

export type PublishCourseSchemaTypes = z.infer<typeof PublishCourseSchema>;
