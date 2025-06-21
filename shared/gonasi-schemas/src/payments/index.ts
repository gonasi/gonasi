import z from 'zod';

export const InitializeEnrollTransactionSchema = z.object({
  courseId: z.string(),
  pricingTierId: z.string(),
});

export type InitializeEnrollTransactionSchemaTypes = z.infer<
  typeof InitializeEnrollTransactionSchema
>;
