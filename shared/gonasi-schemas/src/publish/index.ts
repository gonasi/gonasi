import { z } from 'zod';

import { CourseDescriptionSchema, CourseTitleSchema } from '../courses';

export const CourseOverviewSchema = z.object({
  id: z.string(),
  name: CourseTitleSchema,
  description: CourseDescriptionSchema,
  imageUrl: z.string(),
  courseCategory: z.object({
    id: z.string(),
    name: z.string(),
  }),
  courseSubCategory: z.object({
    id: z.string(),
    name: z.string(),
  }),
  pathways: z.object({
    id: z.string(),
    name: z.string(),
  }),
});

export type CourseOverviewSchemaTypes = z.infer<typeof CourseOverviewSchema>;

export const PricingSchema = z.array(
  z.object({
    id: z.string(),
    courseId: z.string(),
    paymentFrequency: z.enum(['monthly', 'bi_monthly', 'quarterly', 'semi_annual', 'annual']),
    isFree: z.boolean(),
    price: z.number(),
    currencyCode: z.string(),
    promotionalPrice: z.number().nullable(),
    promotionStartDate: z.string().nullable(),
    promotionEndDate: z.string().nullable(),
    tierName: z.string().nullable(),
    tierDescription: z.string().nullable(),
    isActive: z.boolean(),
    position: z.number(),
    isPopular: z.boolean(),
    isRecommended: z.boolean(),
  }),
);

export type PricingSchemaTypes = z.infer<typeof PricingSchema>;

export const PublishCourseSchema = z.object({
  courseOverview: CourseOverviewSchema,
  pricing: PricingSchema,
});

export type PublishCourseSchemaTypes = z.infer<typeof PublishCourseSchema>;
