import z from 'zod';

export const ChapterSchema = z
  .object({
    lesson_count: z
      .number({
        invalid_type_error: `Lesson count should be a <span class="go-title">number</span>.`,
      })
      .nonnegative({
        message: `Lesson count should be <span class="success">zero or more</span>.`,
      }),

    id: z
      .string({
        required_error: `This chapter needs an <span class="go-title">ID</span>.`,
      })
      .nonempty(`Chapter <span class="go-title">ID</span> can't be empty.`),

    course_id: z
      .string({
        required_error: `Which <span class="go-title">course</span> does this chapter belong to?`,
      })
      .nonempty(`<span class="go-title">Course ID</span> can't be empty.`),

    name: z
      .string({
        required_error: `Your chapter needs a <span class="go-title">name</span>.`,
      })
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

    lessons: z.array(z.any(), {
      required_error: `<span class="go-title">Lessons</span> are required.`,
      invalid_type_error: `<span class="go-title">Lessons</span> should be a list of lesson objects.`,
    }),
  })
  .superRefine((data, ctx) => {
    if (data.lessons.length < 2) {
      const count = data.lessons.length;
      const lessonText =
        count === 0 ? 'no lessons yet' : count === 1 ? 'only one lesson' : `${count} lessons`; // fallback (shouldn't hit)

      ctx.addIssue({
        path: ['lessons'],
        code: z.ZodIssueCode.custom,
        message: `Chapter <span class="go-title">${data.name}</span> needs at least <span class="error">two lessons</span>. Right now, it has <span class="go-title">${lessonText}</span>.`,
      });
    }
  });

// Schema for an array of chapters
export const ChaptersArraySchema = z
  .array(ChapterSchema, {
    required_error: `Your <span class="go-title">course</span> must have <span class="error">at least two chapters</span>.`,
    invalid_type_error: `Expected a list of chapters.`,
  })
  .superRefine((chapters, ctx) => {
    if (chapters.length < 2) {
      const count = chapters.length;
      const chapterText =
        count === 0 ? 'no chapters yet' : count === 1 ? 'only one chapter' : `${count} chapters`; // fallback

      ctx.addIssue({
        path: [],
        code: z.ZodIssueCode.custom,
        message: `Your <span class="go-title">course</span> needs at least <span class="error">two chapters</span>. Right now, it has <span class="go-title">${chapterText}</span>.`,
      });
    }
  });
