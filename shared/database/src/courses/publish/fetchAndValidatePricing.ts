import type z from 'zod';

import { PricingSchema } from '@gonasi/schemas/publish/course-pricing';

import type { TypedSupabaseClient } from '../../client';

export type PricingKeys = keyof z.infer<typeof PricingSchema.element>;

export interface PricingValidationError {
  field: PricingKeys;
  message: string;
  navigation: {
    route: string;
  };
  pricingIndex?: number;
  pricingId?: string;
}

interface FetchPricingArgs {
  supabase: TypedSupabaseClient;
  courseId: string;
  organizationId: string;
}

interface PricingValidationSuccess {
  success: true;
  data: z.infer<typeof PricingSchema>;
  errors: null;
  completionStatus: {
    total: number;
    completed: number;
    percentage: number;
  };
}

interface PricingValidationFailure {
  success: false;
  data: Partial<z.infer<typeof PricingSchema>> | null;
  errors: PricingValidationError[];
  completionStatus: {
    total: number;
    completed: number;
    percentage: number;
  };
}

export type PricingValidationResult = PricingValidationSuccess | PricingValidationFailure;

const PRICING_ERROR_NAVIGATION: Record<
  PricingKeys,
  (args: { organizationId: string; courseId: string; pricingId?: string }) => { route: string }
> = {
  id: ({ organizationId, courseId }) => ({
    route: `/${organizationId}/builder/${courseId}/monetization/pricing`,
  }),
  course_id: ({ organizationId, courseId }) => ({
    route: `/${organizationId}/builder/${courseId}/monetization/pricing`,
  }),
  payment_frequency: ({ organizationId, courseId }) => ({
    route: `/${organizationId}/builder/${courseId}/monetization/pricing`,
  }),
  is_free: ({ organizationId, courseId }) => ({
    route: `/${organizationId}/builder/${courseId}/monetization/pricing`,
  }),
  price: ({ organizationId, courseId }) => ({
    route: `/${organizationId}/builder/${courseId}/monetization/pricing`,
  }),
  currency_code: ({ organizationId, courseId }) => ({
    route: `/${organizationId}/builder/${courseId}/monetization/pricing`,
  }),
  promotional_price: ({ organizationId, courseId }) => ({
    route: `/${organizationId}/builder/${courseId}/monetization/pricing`,
  }),
  promotion_start_date: ({ organizationId, courseId }) => ({
    route: `/${organizationId}/builder/${courseId}/monetization/pricing`,
  }),
  promotion_end_date: ({ organizationId, courseId }) => ({
    route: `/${organizationId}/builder/${courseId}/monetization/pricing`,
  }),
  tier_name: ({ organizationId, courseId }) => ({
    route: `/${organizationId}/builder/${courseId}/monetization/pricing`,
  }),
  tier_description: ({ organizationId, courseId }) => ({
    route: `/${organizationId}/builder/${courseId}/monetization/pricing`,
  }),
  is_active: ({ organizationId, courseId }) => ({
    route: `/${organizationId}/builder/${courseId}/monetization/pricing`,
  }),
  position: ({ organizationId, courseId }) => ({
    route: `/${organizationId}/builder/${courseId}/monetization/pricing`,
  }),
  is_popular: ({ organizationId, courseId }) => ({
    route: `/${organizationId}/builder/${courseId}/monetization/pricing`,
  }),
  is_recommended: ({ organizationId, courseId }) => ({
    route: `/${organizationId}/builder/${courseId}/monetization/pricing`,
  }),
};

function calculatePricingCompletionStatus(data: any[]): {
  total: number;
  completed: number;
  percentage: number;
} {
  const pricingRequirements: {
    field: PricingKeys;
    weight: number;
    isValid: (value: any) => boolean;
  }[] = [
    {
      field: 'price',
      weight: 1,
      isValid: (v) => typeof v === 'number' && v >= 0,
    },
    {
      field: 'currency_code',
      weight: 1,
      isValid: (v) => typeof v === 'string' && v.length === 3,
    },
    {
      field: 'payment_frequency',
      weight: 1,
      isValid: (v) =>
        typeof v === 'string' &&
        ['monthly', 'bi_monthly', 'quarterly', 'semi_annual', 'annual'].includes(v),
    },
    {
      field: 'is_active',
      weight: 1,
      isValid: (v) => typeof v === 'boolean',
    },
  ];

  const totalPoints = data.length * pricingRequirements.length;
  let completedPoints = 0;

  data.forEach((tier) => {
    pricingRequirements.forEach((req) => {
      const value = tier[req.field];
      if (req.isValid(value)) {
        completedPoints += req.weight;
      }
    });
  });

  const percentage = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;

  return {
    total: totalPoints,
    completed: completedPoints,
    percentage,
  };
}

export async function fetchAndValidatePricing({
  supabase,
  courseId,
  organizationId,
}: FetchPricingArgs): Promise<PricingValidationResult> {
  const { data, error } = await supabase
    .from('course_pricing_tiers')
    .select(
      `
        id,
        course_id,
        organization_id,
        payment_frequency,
        is_free,
        price,
        currency_code,
        promotional_price,
        promotion_start_date,
        promotion_end_date,
        tier_name,
        tier_description,
        is_active,
        position,
        is_popular,
        is_recommended,
        created_at, 
        updated_at,
        created_by,
        updated_by
      `,
    )
    .match({ course_id: courseId, organization_id: organizationId });

  if (error || !data) {
    return {
      success: false,
      data: null,
      errors: [
        {
          field: 'course_id',
          message: `<lucide name="AlertTriangle" size="12" /> We couldn't find pricing for this course.`,
          navigation: { route: `/${organizationId}/builder/${courseId}/monetization/pricing` },
        },
      ],
      completionStatus: { total: 0, completed: 0, percentage: 0 },
    };
  }

  const validation = PricingSchema.safeParse(data);

  if (!validation.success) {
    const completionStatus = calculatePricingCompletionStatus(data);

    const pricingValidationErrors: PricingValidationError[] = validation.error.issues.map(
      (issue) => {
        const pathSegments = issue.path;
        const pricingIndex = typeof pathSegments[0] === 'number' ? pathSegments[0] : undefined;
        const field = (pathSegments[pathSegments.length - 1] || 'id') as PricingKeys;

        const pricingId =
          pricingIndex !== undefined && data[pricingIndex] ? data[pricingIndex].id : undefined;

        const navigationFn = PRICING_ERROR_NAVIGATION[field];
        const navigation = navigationFn
          ? navigationFn({ organizationId, courseId, pricingId })
          : { route: `/${organizationId}/builder/${courseId}/monetization/pricing` };

        return {
          field,
          message: issue.message,
          navigation,
          pricingIndex,
          pricingId,
        };
      },
    );

    return {
      success: false,
      data,
      errors: pricingValidationErrors,
      completionStatus,
    };
  }

  const completionStatus = calculatePricingCompletionStatus(validation.data);

  return {
    success: true,
    data: validation.data,
    errors: null,
    completionStatus,
  };
}
