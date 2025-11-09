import z from 'zod';

export const OrganizationTierChangeSchema = z.object({
  tier: z.enum(['launch', 'scale', 'impact', 'enterprise']),
  organizationId: z.string(),
});
export type OrganizationTierChangeSchemaTypes = z.infer<typeof OrganizationTierChangeSchema>;
