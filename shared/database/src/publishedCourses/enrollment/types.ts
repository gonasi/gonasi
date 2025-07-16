import { z } from 'zod';

// Zod schema for validating the response shape
export const InitializeEnrollTransactionResponseSchema = z.object({
  status: z.boolean(),
  message: z.string(),
  data: z.object({
    authorization_url: z.string().url(),
    access_code: z.string(),
    reference: z.string(),
  }),
});

export type InitializeEnrollTransactionResponse = z.infer<
  typeof InitializeEnrollTransactionResponseSchema
>;

export const InitializeEnrollMetadataSchema = z.object({
  courseId: z.string().uuid(),
  pricingTierId: z.string().uuid(),
  organizationId: z.string().uuid(),

  userId: z.string().uuid(),
  userEmail: z.string().email(),
  userName: z.string(),

  tierName: z.string().optional(),
  tierDescription: z.string().optional(),

  paymentFrequency: z.enum(['monthly', 'quarterly', 'bi_monthly', 'semi_annual', 'annual']),

  isPromotional: z.boolean(),
  promotionalPrice: z.number().nullable(),
  effectivePrice: z.number().nonnegative(),
});
export type InitializeEnrollMetadata = z.infer<typeof InitializeEnrollMetadataSchema>;
