import { z } from 'zod';

export const UpdateCoursePricingTypeSchema = z.object({
  setToType: z.enum(['free', 'paid']),
});

export type UpdateCoursePricingTypeSchemaTypes = z.infer<typeof UpdateCoursePricingTypeSchema>;
