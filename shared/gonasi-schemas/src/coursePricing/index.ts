import { z } from 'zod';

export const UpdateCoursePricingTypeSchema = z.object({
  setToType: z.enum(['free', 'paid']),
});

export type UpdateCoursePricingTypeSchemaTypes = z.infer<typeof UpdateCoursePricingTypeSchema>;

// Enum for payment frequency
const PaymentFrequencyEnum = z.enum(
  ['monthly', 'bi_monthly', 'quarterly', 'semi_annual', 'annual'],
  {
    required_error: 'Let us know how often this plan should charge.',
    invalid_type_error: 'Hmm, that doesn’t look like a valid payment frequency.',
  },
);

// Currency code
const CurrencyCodeEnum = z.enum(['KES', 'USD'], {
  required_error: 'Currency is required, KES or USD please.',
  invalid_type_error: 'Only KES and USD are supported at the moment.',
});

export const CoursePricingSchema = z
  .object({
    id: z
      .string({
        required_error: 'An ID is required.',
        invalid_type_error: 'The ID must be a string.',
      })
      .uuid('Invalid ID format.')
      .optional(),

    courseId: z
      .string({
        required_error: 'Course ID is required.',
        invalid_type_error: 'Course ID must be a string.',
      })
      .uuid('That doesn’t look like a valid course ID.')
      .optional(),

    paymentFrequency: PaymentFrequencyEnum,

    isFree: z.boolean({
      required_error: 'Let us know if this tier is free or not.',
      invalid_type_error: 'This should be true or false, no in-betweens!',
    }),

    price: z
      .number({
        required_error: 'How much does this tier cost?',
        invalid_type_error: 'The price must be a number.',
      })
      .nonnegative('The price can’t be negative. We’re not paying them, right?'),

    currencyCode: CurrencyCodeEnum,

    discountPercentage: z
      .number({
        invalid_type_error: 'Discount must be a number.',
      })
      .min(0, 'Discount can’t be less than 0%.')
      .max(100, 'Whoa! discount can’t be more than 100%.')
      .nullable()
      .optional(),

    promotionalPrice: z
      .number({
        invalid_type_error: 'Promo price must be a number.',
      })
      .nonnegative('Promo price should be zero or more, no negative deals here.')
      .nullable()
      .optional(),

    promotionStartDate: z.coerce
      .date({
        invalid_type_error: 'Promotion start date must be a valid date.',
      })
      .nullable()
      .optional(),

    promotionEndDate: z.coerce
      .date({
        invalid_type_error: 'Promotion end date must be a valid date.',
      })
      .nullable()
      .optional(),

    tierName: z
      .string({
        invalid_type_error: 'Tier name must be a string.',
      })
      .max(100, 'Keep the tier name under 100 characters, please.')
      .nullable()
      .optional(),

    tierDescription: z
      .string({
        invalid_type_error: 'Tier description must be a string.',
      })
      .nullable()
      .optional(),

    isActive: z.boolean({
      required_error: 'Let us know if this tier should be active.',
      invalid_type_error: 'isActive must be true or false.',
    }),

    isPopular: z.boolean({
      required_error: 'Please specify if this tier is popular.',
      invalid_type_error: 'isPopular must be true or false.',
    }),

    isRecommended: z.boolean({
      required_error: 'Please specify if this tier is recommended.',
      invalid_type_error: 'isRecommended must be true or false.',
    }),

    createdAt: z
      .date({
        invalid_type_error: 'createdAt must be a valid date.',
      })
      .optional(),

    updatedAt: z
      .date({
        invalid_type_error: 'updatedAt must be a valid date.',
      })
      .optional(),
  })
  .superRefine((data, ctx) => {
    // Free tier validations
    if (data.isFree) {
      const hasPromotions =
        typeof data.promotionalPrice === 'number' ||
        typeof data.discountPercentage === 'number' ||
        data.promotionStartDate instanceof Date ||
        data.promotionEndDate instanceof Date;

      if (hasPromotions) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Free tiers don’t need promotions — they’re already free!',
          path: ['promotionalPrice'],
        });
      }

      if (data.price !== 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'If it’s free, the price should be zero. 🤑',
          path: ['price'],
        });
      }
    } else {
      // Paid tier validations
      if (data.price <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Paid tiers need to cost something — bump up that price.',
          path: ['price'],
        });
      }

      if (typeof data.promotionalPrice === 'number' && data.promotionalPrice >= data.price) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'Promo price should be less than the regular price — otherwise, what’s the deal?',
          path: ['promotionalPrice'],
        });
      }

      if (
        data.promotionStartDate instanceof Date &&
        data.promotionEndDate instanceof Date &&
        data.promotionStartDate >= data.promotionEndDate
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'Promotion start date needs to come before the end date — time flows forward, not backward.',
          path: ['promotionStartDate'],
        });
      }
    }
  });

export type CoursePricingSchemaTypes = z.infer<typeof CoursePricingSchema>;
