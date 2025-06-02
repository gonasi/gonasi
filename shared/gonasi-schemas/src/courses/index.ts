import { z } from 'zod';

import { NewImageSchema } from '../userValidation';

const CourseTitleSchema = z
  .string({ required_error: 'Please enter a course title.' })
  .trim()
  .min(3, { message: 'The course title must be at least 3 characters long.' })
  .max(100, { message: 'The course title cannot exceed 100 characters.' });

const CourseDescriptionSchema = z
  .string({ required_error: 'Please provide a description.' })
  .min(10, { message: 'The description should be at least 10 characters long.' })
  .max(500, { message: 'The description cannot exceed 500 characters.' })
  .trim();

const CourseCategorySchema = z.string({ required_error: 'Course category is required' }).trim();

const CourseSubcategorySchema = z
  .string({ required_error: 'Course subcategory is required' })
  .trim();

const CoursePathwaySchema = z.string({ required_error: 'Course pathway is required' }).trim();

const CourseMonthlySubscriptionPriceSchema = z
  .number({ required_error: 'Please provide a monthly subscription price.' })
  .refine(
    (value) => {
      const price = value;
      return price >= 0 && price <= 50000;
    },
    { message: 'The maximum monthly subscription price is KES 50,000.' },
  );

// NewCourseTitleSchema definition
export const NewCourseTitleSchema = z.object({
  name: CourseTitleSchema,
});
export type NewCourseTitleTypes = z.infer<typeof NewCourseTitleSchema>;
export const NewCourseTitleSubmit = NewCourseTitleSchema.merge(
  z.object({
    username: z.string(),
  }),
);
export type NewCourseTitleSubmitValues = z.infer<typeof NewCourseTitleSubmit>;
// NewCourseTitleSchema definition

// EditCourseDetailsSchema definition
export const EditCourseDetailsSchema = z.object({
  name: CourseTitleSchema,
  description: CourseDescriptionSchema,
  monthlySubscriptionPrice: CourseMonthlySubscriptionPriceSchema,
});
export type EditCourseDetailsTypes = z.infer<typeof EditCourseDetailsSchema>;
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
  imageUrl: z.string().nullable().optional(),
});
export type EditCourseImageTypes = z.infer<typeof EditCourseImageSchema>;
export const SubmitEditCourseImageSchema = EditCourseImageSchema.merge(
  z.object({
    courseId: z.string(),
  }),
);
export type EditCourseImageSubmitValues = z.infer<typeof SubmitEditCourseImageSchema>;
// EditCourseImageSchema definition

// EditCourseCategorySchema definition
export const EditCourseCategorySchema = z.object({
  category: CourseCategorySchema,
});
export type EditCourseCcategoryTypes = z.infer<typeof EditCourseCategorySchema>;
export const SubmitEditCourseCategorySchema = EditCourseCategorySchema.merge(
  z.object({
    courseId: z.string(),
  }),
);
export type EditCourseCategorySubmitValues = z.infer<typeof SubmitEditCourseCategorySchema>;
// EditCourseCategorySchema definition

// EditCourseSubcategorySchema definition
export const EditCourseSubcategorySchema = z.object({
  subcategory: CourseSubcategorySchema,
});
export type EditCourseSubcategoryTypes = z.infer<typeof EditCourseSubcategorySchema>;
export const SubmitEditCourseSubcategorySchema = EditCourseSubcategorySchema.merge(
  z.object({
    courseId: z.string(),
  }),
);
export type EditCourseSubcategorySubmitValues = z.infer<typeof SubmitEditCourseSubcategorySchema>;
// EditCourseSubcategorySchema definition

// EditCoursePathwaySchema definition
export const EditCoursePathwaySchema = z.object({
  pathway: CoursePathwaySchema,
});
export type EditCoursePathwayTypes = z.infer<typeof EditCoursePathwaySchema>;
export const SubmitEditCoursePathwaySchema = EditCoursePathwaySchema.merge(
  z.object({
    courseId: z.string(),
  }),
);
export type EditCoursePathwaySubmitValues = z.infer<typeof SubmitEditCoursePathwaySchema>;
// EditCoursePathwaySchema definition

export const DeleteLearningPathSchema = z.object({
  imageUrl: z.string(),
  name: z.string(),
});
export type DeleteLearningPathTypes = z.infer<typeof DeleteLearningPathSchema>;

export const SubmitLearningPathDeleteSchema = DeleteLearningPathSchema.merge(
  z.object({
    learningPathId: z.string(),
    userId: z.string(), // The ID of the user making the submission
  }),
);
export type DeleteLearningPathSubmitValues = z.infer<typeof SubmitLearningPathDeleteSchema>;

// EditLearningPathImageSchema definition
export const EditLearningPathImageSchema = z.object({
  image: NewImageSchema,
  imageUrl: z.string(),
});
export type EditLearningPathImageTypes = z.infer<typeof EditLearningPathImageSchema>;

export const SubmitLearningPathImageSchema = EditLearningPathImageSchema.merge(
  z.object({
    learningPathId: z.string(),
    userId: z.string(), // The ID of the user making the submission
  }),
);
export type EditLearningPathImageSubmitValues = z.infer<typeof SubmitLearningPathImageSchema>;

// EditLearningPathDetailsSchema definition
export const EditLearningPathDetailsSchema = z.object({
  name: CourseTitleSchema,
  description: CourseDescriptionSchema,
});
export type EditLearningPathDetailsTypes = z.infer<typeof EditLearningPathDetailsSchema>;

export const SubmitLearningPathDetailsSchema = EditLearningPathDetailsSchema.merge(
  z.object({
    learningPathId: z.string(),
    userId: z.string(), // The ID of the user making the submission
  }),
);
export type EditLearningPathDetailsSubmitValues = z.infer<typeof SubmitLearningPathDetailsSchema>;
