import z from 'zod';

import { RichTextSchema } from '../../plugins';
import { LessonTypeSchema } from '../base';

export const PublishRichTextSchema = RichTextSchema.extend({
  id: z.string({ required_error: 'Block ID is required for publishing.' }),
});

export const BlockSchema = z.discriminatedUnion('plugin_type', [RichTextSchema]);

export const BlocksArraySchema = z.array(BlockSchema, {
  required_error: `<span class="go-title">Lessons</span> are required.`,
  invalid_type_error: `<span class="go-title">Lessons</span> should be a list of lesson objects.`,
});

export const LessonSchema = z
  .object({
    blocks: BlocksArraySchema,
    id: z
      .string({ required_error: `This pricing option needs an <span class="go-title">ID</span>.` })
      .uuid(`<span class="go-title">Pricing ID</span> must be a valid UUID.`),
    course_id: z
      .string({ required_error: `Link this pricing to a <span class="go-title">course</span>.` })
      .uuid(`<span class="go-title">Course ID</span> must be a valid UUID.`),
    organization_id: z
      .string({ required_error: `Organization id is required` })
      .uuid(`Organization id must be a valid UUID.`),
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
    settings: z.any(),
    lesson_types: LessonTypeSchema,
  })
  .superRefine((data, ctx) => {
    if (!data.blocks || !Array.isArray(data.blocks)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['blocks'],
        message: `Lesson <span class="warning">${data.name}</span> is looking a bit empty — let's add some <span class="go-title">content blocks</span> to make it shine!`,
      });
      return;
    }

    if (data.blocks.length < 2) {
      const count = data.blocks.length;
      const blockText =
        count === 0 ? 'no content blocks yet' : count === 1 ? 'just one block' : `${count} blocks`; // fallback

      ctx.addIssue({
        code: z.ZodIssueCode.too_small,
        minimum: 2,
        type: 'array',
        inclusive: true,
        path: ['blocks'],
        message: `Lesson <span class="warning">${data.name}</span> needs at least <span class="error">two content blocks</span>. Right now, it has <span class="go-title">${blockText}</span>.`,
      });
    }
  });

// Schema for an array of lessons
export const LessonsArraySchema = z.array(LessonSchema, {
  required_error: `Your <span class="go-title">chapter</span> must have <span class="error">at least two lessons</span>.`,
  invalid_type_error: `Expected a list of lessons.`,
});
