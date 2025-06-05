import { icons } from 'lucide-react';
import { z } from 'zod';

const LessonTypeNameSchema = z
  .string({ required_error: 'Please enter a name for the lesson type' })
  .min(3, { message: 'Name is a bit too short' })
  .max(100, { message: 'Name is a bit too long' })
  .refine((val) => /^(\S+(?: \S+)*)$/.test(val), {
    message: 'No extra spaces at the start or end, and use only single spaces between words',
  });

const LessonTypeDescription = z
  .string({ required_error: 'A short description is needed' })
  .min(10, { message: 'Add a bit more to the description' })
  .max(500, { message: 'That description is a bit long' })
  .trim();

export const LucideIconSchema = z.string().refine((val) => val in icons, {
  message: 'That’s not a valid Lucide icon name',
});

const BgColorSchema = z
  .string()
  .min(1, { message: 'Please pick a background color' })
  .regex(/^hsl\(\s*\d{1,3}(deg)?\s+\d{1,3}%\s+\d{1,3}%\s*\)$/, {
    message: 'Color must be in HSL format like hsl(0 100% 50%) 🎨',
  });

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
