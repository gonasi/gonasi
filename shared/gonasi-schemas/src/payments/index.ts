import z from 'zod';

export const InitializeEnrollTransactionSchema = z.object({
  publishedCourseId: z.string(),
  pricingTierId: z.string(),
  organizationId: z.string(),
  cohortId: z.string().nullable().optional(),
});

export type InitializeEnrollTransactionSchemaTypes = z.infer<
  typeof InitializeEnrollTransactionSchema
>;
