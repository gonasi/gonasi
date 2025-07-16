import z from 'zod';

export const InitializeEnrollTransactionSchema = z.object({
  publishedCourseId: z.string(),
  pricingTierId: z.string(),
  organizationId: z.string(),
});

export type InitializeEnrollTransactionSchemaTypes = z.infer<
  typeof InitializeEnrollTransactionSchema
>;
