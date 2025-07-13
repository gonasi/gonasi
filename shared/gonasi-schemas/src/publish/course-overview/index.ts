import z from 'zod';

export const CourseOverviewSchema = z
  .object({
    id: z
      .string({ required_error: `This pricing option needs an <span class="go-title">ID</span>.` })
      .uuid(`<span class="go-title">Pricing ID</span> must be a valid UUID.`),
    organization_id: z
      .string({ required_error: `Organization id is required` })
      .uuid(`Organization id must be a valid UUID.`),
    visibility: z.enum(['public', 'private'], {
      required_error: 'Please choose a visibility setting.',
      invalid_type_error: 'Visibility must be either "public" or "private".',
    }),
    name: z
      .string({
        required_error: `<lucide name="Type" size="12" /> What's your course called? Add a <span class="go-title">name</span> here.`,
      })
      .min(
        1,
        `<lucide name="AlertCircle" size="12" /> Course <span class="go-title">name</span> can't be empty.`,
      ),
    description: z
      .string({
        required_error: `<lucide name="AlignLeft" size="12" /> Tell students what your course is about with a <span class="go-title">description</span>.`,
      })
      .nullable()
      .refine((val) => val !== null && val.length >= 10, {
        message: `<lucide name="FileText" size="12" /> Course <span class="go-title">description</span> should be at least 10 characters long to help students understand what they'll learn.`,
      }),
    image_url: z
      .string({
        required_error: `<lucide name="Image" size="12" /> Add an eye-catching <span class="go-title">thumbnail image</span> for your course.`,
      })
      .nullable()
      .refine((val) => val !== null && val.length > 0, {
        message: `<lucide name="ImageOff" size="12" /> Your course needs a <span class="go-title">thumbnail image</span> to look professional.`,
      }),
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
