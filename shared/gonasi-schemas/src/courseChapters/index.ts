import { z } from 'zod';

const ChapterNameSchema = z
  .string({ required_error: 'Chapter name is required' })
  .min(3, { message: 'Chapter name is too short' })
  .max(100, { message: 'Chapter name is too long' })
  .trim();

const ChapterDescriptionSchema = z
  .string({ required_error: 'Description is required' })
  .min(10, { message: 'Description is too short' })
  .max(500, { message: 'Description is too long' })
  .trim();

// NewChapterSchema definition
export const NewChapterSchema = z.object({
  name: ChapterNameSchema,
  description: ChapterDescriptionSchema,
  requiresPayment: z.boolean(),
});
export type NewChapterSchemaTypes = z.infer<typeof NewChapterSchema>;

export const SubmitNewChapterSchema = NewChapterSchema.merge(
  z.object({
    courseId: z.string(),
  }),
);
export type NewChapterSubmitValues = z.infer<typeof SubmitNewChapterSchema>;
// NewChapterSchema definition

// EditChapterSchema definition
export const EditChapterSchema = z.object({
  name: ChapterNameSchema,
  description: ChapterDescriptionSchema,
  requiresPayment: z.boolean(),
});
export type EditChapterSchemaTypes = z.infer<typeof EditChapterSchema>;
export const SubmitEditChapterSchema = EditChapterSchema.merge(
  z.object({
    chapterId: z.string(),
  }),
);
export type EditChapterSubmitValues = z.infer<typeof SubmitEditChapterSchema>;
// NewChapterSchema definition

// DeleteChapterSchema definition
export const DeleteChapterSchema = z.object({
  chapterId: z.string(),
});
export type DeleteChapterSchemaTypes = z.infer<typeof DeleteChapterSchema>;
export const SubmitDeleteChapterSchema = DeleteChapterSchema.merge(
  z.object({
    chapterId: z.string(),
  }),
);
export type DeleteChapterSubmitValues = z.infer<typeof SubmitDeleteChapterSchema>;
// NewChapterSchema definition

export const ChapterPositionUpdateSchema = z.object({
  id: z.string(),
  position: z.number(),
});

export const ChapterPositionUpdateArraySchema = z.array(ChapterPositionUpdateSchema);

export type ChapterPositionUpdateArraySchemaTypes = z.infer<
  typeof ChapterPositionUpdateArraySchema
>;
