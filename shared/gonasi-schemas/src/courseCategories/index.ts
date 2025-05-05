import { z } from 'zod';

const CourseCategorySchema = z
  .string({ required_error: 'Course category is required' })
  .min(3, { message: 'Course category is too short' })
  .max(100, { message: 'Course category is too long' })
  .refine((val) => /^(\S+(?: \S+)*)$/.test(val), {
    message:
      'Course category must not have leading/trailing spaces and must use only single spaces between words',
  });

const CourseDescriptionSchema = z
  .string({ required_error: 'Description is required' })
  .min(10, { message: 'Description is too short' })
  .max(500, { message: 'Description is too long' })
  .trim();

// NewCourseCategorySchema definition
export const NewCourseCategorySchema = z.object({
  name: CourseCategorySchema,
  description: CourseDescriptionSchema,
});
export type NewCourseCategoryTypes = z.infer<typeof NewCourseCategorySchema>;

export type NewCourseCategorySubmitValues = z.infer<typeof NewCourseCategorySchema>;

export const DeleteCourseCategorySchema = z.object({
  id: z.string(),
});
export type DeleteCourseCategoryTypes = z.infer<typeof DeleteCourseCategorySchema>;

// EditCourseCategoryDetailsSchema definition
export const EditCourseCategoryDetailsSchema = z.object({
  name: CourseCategorySchema,
  description: CourseDescriptionSchema,
});
export type EditCourseCategoryDetailsTypes = z.infer<typeof EditCourseCategoryDetailsSchema>;
export const SubmitEditCourseCategoryDetailsSchema = EditCourseCategoryDetailsSchema.merge(
  z.object({
    courseCategoryId: z.string(),
  }),
);
export type EditCourseCategoryDetailsSubmitValues = z.infer<
  typeof SubmitEditCourseCategoryDetailsSchema
>;
