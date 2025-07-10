import { z } from 'zod';

import { NewImageSchema } from '../userValidation';

export const CourseTitleSchema = z
  .string({ required_error: 'Please enter a course title.' })
  .trim()
  .min(3, { message: 'The course title must be at least 3 characters long.' })
  .max(100, { message: 'The course title cannot exceed 100 characters.' });

export const CourseDescriptionSchema = z
  .string({ required_error: 'Please provide a description.' })
  .min(10, { message: 'The description should be at least 10 characters long.' })
  .max(500, { message: 'The description cannot exceed 500 characters.' })
  .trim();

const CourseCategorySchema = z.string({ required_error: 'Course category is required' }).trim();

const CourseSubcategorySchema = z
  .string({ required_error: 'Course subcategory is required' })
  .min(4, { message: 'Course subcategory is required' })
  .trim();

// NewCourseTitleSchema definition
export const NewCourseTitleSchema = z.object({
  name: CourseTitleSchema,
  organizationId: z.string(),
});
export type NewCourseTitleSchemaTypes = z.infer<typeof NewCourseTitleSchema>;

// EditCourseDetailsSchema definition
export const EditCourseDetailsSchema = z.object({
  courseId: z.string(),
  organizationId: z.string(),
  name: CourseTitleSchema,
  description: CourseDescriptionSchema,
});
export type EditCourseDetailsSchemaTypes = z.infer<typeof EditCourseDetailsSchema>;
export const SubmitCourseDetailsSchema = EditCourseDetailsSchema.merge(
  z.object({
    courseId: z.string(),
  }),
);
export type EditCourseDetailsSubmitValues = z.infer<typeof SubmitCourseDetailsSchema>;
// EditCourseDetailsSchema definition

// EditCourseImageSchema definition
export const EditCourseImageSchema = z.object({
  image: NewImageSchema,
});
export type EditCourseImageSchemaTypes = z.infer<typeof EditCourseImageSchema>;
export const SubmitEditCourseImageSchema = EditCourseImageSchema.merge(
  z.object({
    courseId: z.string(),
  }),
);
export type EditCourseImageSubmitValues = z.infer<typeof SubmitEditCourseImageSchema>;
// EditCourseImageSchema definition

// EditCourseGroupingSchema definition
export const EditCourseGroupingSchema = z.object({
  courseId: z.string(),
  category: CourseCategorySchema,
  subcategory: CourseSubcategorySchema,
});
export type EditCourseGroupingSchemaTypes = z.infer<typeof EditCourseGroupingSchema>;
