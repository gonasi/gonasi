import { icons } from 'lucide-react';
import { z } from 'zod';

const LessonTypeNameSchema = z
  .string({ required_error: 'Lesson type name is required' })
  .min(3, { message: 'Lesson type name is too short' })
  .max(100, { message: 'Lesson type name is too long' })
  .refine((val) => /^(\S+(?: \S+)*)$/.test(val), {
    message:
      'Lesson type name must not have leading/trailing spaces and must use only single spaces between words',
  });

const LessonTypeDescription = z
  .string({ required_error: 'Description is required' })
  .min(10, { message: 'Description is too short' })
  .max(500, { message: 'Description is too long' })
  .trim();

export const LucideIconSchema = z.string().refine((val) => val in icons, {
  message: 'Must be a valid Lucide icon',
});

const BgColorSchema = z
  .string()
  .min(1, { message: 'Required' })
  .regex(/^hsl\(\s*\d{1,3}(deg)?\s+\d{1,3}%\s+\d{1,3}%\s*\)$/, {
    message: 'Invalid HSL color',
  });

// NewLessonTypeSchema definition
export const NewLessonTypeSchema = z.object({
  name: LessonTypeNameSchema,
  description: LessonTypeDescription,
  lucideIcon: LucideIconSchema,
  bgColor: BgColorSchema,
});

export type NewLessonTypes = z.infer<typeof NewLessonTypeSchema>;
export type NewLessonTypeSubmitValues = z.infer<typeof NewLessonTypeSchema>;

export const DeleteLessonTypeSchema = z.object({
  id: z.string(),
});

export type DeleteLessonTypes = z.infer<typeof DeleteLessonTypeSchema>;

// EditLessonTypeSchema definition
export const EditLessonTypeSchema = z.object({
  name: LessonTypeNameSchema,
  description: LessonTypeDescription,
  lucideIcon: LucideIconSchema,
  bgColor: BgColorSchema,
});

export type EditLessonTypes = z.infer<typeof EditLessonTypeSchema>;

export const SubmitEditLessonTypeSchema = EditLessonTypeSchema.merge(
  z.object({
    lessonTypeId: z.string(),
  }),
);
export type EditLessonTypeSubmitValues = z.infer<typeof SubmitEditLessonTypeSchema>;
