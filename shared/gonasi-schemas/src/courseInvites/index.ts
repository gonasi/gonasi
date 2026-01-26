import { z } from 'zod';

import { EmailSchema } from '../userValidation';

export const InviteToCourseSchema = z.object({
  publishedCourseId: z
    .string({
      required_error: 'Course ID is required.',
      invalid_type_error: 'Course ID must be a string.',
    })
    .uuid({ message: 'Invalid course ID.' }),
  organizationId: z
    .string({
      required_error: 'Organization ID is required.',
      invalid_type_error: 'Organization ID must be a string.',
    })
    .uuid({ message: 'Invalid organization ID.' }),
  email: EmailSchema,
  cohortId: z.string().uuid({ message: 'Invalid cohort ID.' }).optional().nullable(),
  pricingTierId: z
    .string({
      required_error: 'Pricing tier is required.',
      invalid_type_error: 'Pricing tier must be a string.',
    })
    .uuid({ message: 'Invalid pricing tier ID.' }),
});

export type InviteToCourseSchemaTypes = z.infer<typeof InviteToCourseSchema>;

export const ResendCourseInviteSchema = z.object({
  publishedCourseId: z.string(),
  token: z.string(),
});

export type ResendCourseInviteSchemaTypes = z.infer<typeof ResendCourseInviteSchema>;

export const RevokeCourseInviteSchema = z.object({
  publishedCourseId: z.string(),
  token: z.string(),
});

export type RevokeCourseInviteSchemaTypes = z.infer<typeof RevokeCourseInviteSchema>;
