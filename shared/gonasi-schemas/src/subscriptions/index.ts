import z from 'zod';

export const OrganizationTierChangeSchema = z.object({
  tier: z.enum(['temp', 'launch', 'scale', 'impact']),
  organizationId: z.string(),
  baseUrl: z.string(),
});
export type OrganizationTierChangeSchemaTypes = z.infer<typeof OrganizationTierChangeSchema>;
