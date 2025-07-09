import { z } from 'zod';

const ChapterNameSchema = z
  .string({
    required_error: `<lucide name="Type" size="12" /> Give your <span class="go-title">chapter a title</span> to get started.`,
  })
  .min(3, {
    message: `<span class="go-title">Chapter name</span> is too short. Try at least 3 characters.`,
  })
  .max(100, {
    message: `<span class="go-title">Chapter name</span> is too long. Keep it under 100 characters.`,
  })
  .trim();

const ChapterDescriptionSchema = z
  .string({
    required_error: `A quick <span class="go-title">description</span> helps others understand what this chapter is about.`,
  })
  .min(10, {
    message: `<lucide name="Info" size="12" /> <span class="go-title">Description</span> is too short. Add a bit more detail.`,
  })
  .max(500, {
    message: `<span class="go-title">Description</span> is too long. Try to keep it under 500 characters.`,
  })
  .trim();

// NewChapterSchema definition
export const NewChapterSchema = z.object({
  name: ChapterNameSchema,
  description: ChapterDescriptionSchema,
});
export type NewChapterSchemaTypes = z.infer<typeof NewChapterSchema>;

export const SubmitNewChapterSchema = NewChapterSchema.merge(
  z.object({
    courseId: z.string(),
    organizationId: z.string(),
  }),
);
export type NewChapterSubmitValues = z.infer<typeof SubmitNewChapterSchema>;
// NewChapterSchema definition

// EditChapterSchema definition
export const EditChapterSchema = z.object({
  name: ChapterNameSchema,
  description: ChapterDescriptionSchema,
});
export type EditChapterSchemaTypes = z.infer<typeof EditChapterSchema>;
export const SubmitEditChapterSchema = EditChapterSchema.merge(
  z.object({
    chapterId: z.string(),
    organizationId: z.string(),
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
