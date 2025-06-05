import { z } from 'zod';

import { NewImageSchema } from '../userValidation';

const LearningPathsSchema = z
  .string({ required_error: 'Give your learning path a name' })
  .min(3, { message: 'Name should be at least 3 characters' })
  .max(100, { message: 'Name can’t be longer than 100 characters' })
  .refine((val) => /^[A-Za-z]+(?: [A-Za-z]+)*$/.test(val), {
    message: 'Use just letters with single spaces, no extra spaces at the start or end',
  });

const LearningPathDescriptionSchema = z
  .string({ required_error: 'Add a description' })
  .min(10, { message: 'Description needs to be at least 10 characters' })
  .max(500, { message: 'Description can’t be longer than 500 characters' })
  .trim();

// NewLearningPathSchema definition
export const NewLearningPathSchema = z.object({
  name: LearningPathsSchema,
  description: LearningPathDescriptionSchema,
  image: NewImageSchema,
});
export type NewLearningPathTypes = z.infer<typeof NewLearningPathSchema>;

export type NewLearningPathSubmitValues = z.infer<typeof NewLearningPathSchema>;

export const DeleteLearningPathSchema = z.object({
  imageUrl: z.string(),
  name: z.string(),
});
export type DeleteLearningPathTypes = z.infer<typeof DeleteLearningPathSchema>;

export const SubmitLearningPathDeleteSchema = DeleteLearningPathSchema.merge(
  z.object({
    learningPathId: z.string(),
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
  }),
);
export type EditLearningPathImageSubmitValues = z.infer<typeof SubmitLearningPathImageSchema>;

// EditLearningPathDetailsSchema definition
export const EditLearningPathDetailsSchema = z.object({
  name: LearningPathsSchema,
  description: LearningPathDescriptionSchema,
});
export type EditLearningPathDetailsTypes = z.infer<typeof EditLearningPathDetailsSchema>;

export const SubmitLearningPathDetailsSchema = EditLearningPathDetailsSchema.merge(
  z.object({
    learningPathId: z.string(),
  }),
);
export type EditLearningPathDetailsSubmitValues = z.infer<typeof SubmitLearningPathDetailsSchema>;

// AddCourseToLearningPathSchema definition
export const AddCourseToLearningPathSchema = z.object({
  courseId: z.string({ required_error: 'Please select a course' }),
});
export type AddCourseToLearningPathTypes = z.infer<typeof AddCourseToLearningPathSchema>;

export const SubmitAddCourseToLearningPathSchema = AddCourseToLearningPathSchema.merge(
  z.object({
    learningPathId: z.string(),
  }),
);
export type AddCourseToLearningPathSubmitValues = z.infer<
  typeof SubmitAddCourseToLearningPathSchema
>;

// RemoveCourseToLearningPathSchema definition
export const RemoveCourseToLearningPathSchema = z.object({
  courseId: z.string(),
});
export type RemoveCourseToLearningPathTypes = z.infer<typeof RemoveCourseToLearningPathSchema>;
export const SubmitRemoveCourseToLearningPathSchema = RemoveCourseToLearningPathSchema.merge(
  z.object({
    learningPathId: z.string(),
  }),
);
export type RemoveCourseToLearningPathSubmitValues = z.infer<
  typeof SubmitRemoveCourseToLearningPathSchema
>;
