import { z } from 'zod';

const LessonTitleSchema = z
  .string({ required_error: 'Please enter a lesson title' })
  .min(3, { message: 'Lesson title needs to be at least 3 characters' })
  .max(100, { message: 'Lesson title can’t be longer than 100 characters' })
  .trim();

const LessonTypeSchema = z
  .string({ required_error: 'Please pick a lesson type' })
  .min(3, { message: 'Lesson type needs at least 3 characters' })
  .max(100, { message: 'Lesson type can’t be longer than 100 characters' })
  .trim();

// Schema for creating a new lesson title
export const NewLessonDetailsSchema = z.object({
  name: LessonTitleSchema,
  lessonType: LessonTypeSchema,
});
export type NewLessonDetailsSchemaTypes = z.infer<typeof NewLessonDetailsSchema>;

// Schema for submitting a new lesson with additional identifiers
export const SubmitNewLessonDetailsSchema = NewLessonDetailsSchema.merge(
  z.object({
    chapterId: z.string(),
    courseId: z.string(),
  }),
);
export type NewLessonSubmitValues = z.infer<typeof SubmitNewLessonDetailsSchema>;

// Schema for editing a new lesson title
export const EditLessonDetailsSchema = z.object({
  name: LessonTitleSchema,
  lessonType: LessonTypeSchema,
});
export type EditLessonDetailsSchemaTypes = z.infer<typeof EditLessonDetailsSchema>;

// Schema for submitting a new lesson with additional identifiers
export const SubmitEditLessonDetailsSchema = EditLessonDetailsSchema.merge(
  z.object({
    lessonId: z.string(),
  }),
);
export type EditLessonSubmitValues = z.infer<typeof SubmitEditLessonDetailsSchema>;

// Schema for deleting a new lesson title
export const DeleteLessonSchema = z.object({
  lessonId: z.string(),
});
export type DeleteLessonDetailsTypes = z.infer<typeof DeleteLessonSchema>;

// Schema for submitting a new lesson with additional identifiers
export type DeleteLessonSubmitValues = z.infer<typeof DeleteLessonSchema>;

export const LessonPositionUpdateSchema = z.object({
  id: z.string().uuid(),
  position: z.number().int(),
  updated_by: z.string().uuid(),
  chapter_id: z.string().uuid().optional(), // optional if used for validation/filtering
});

export const LessonPositionUpdateArraySchema = z.array(LessonPositionUpdateSchema);

export type LessonPositionUpdate = z.infer<typeof LessonPositionUpdateSchema>;
export type LessonPositionUpdateArray = z.infer<typeof LessonPositionUpdateArraySchema>;

export const ResetLessonSchema = z.object({
  lessonId: z.string(),
});
