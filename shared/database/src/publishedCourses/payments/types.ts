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
