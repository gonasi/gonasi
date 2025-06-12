import { z } from 'zod';

// Update pricing type schema
export const UpdateCoursePricingTypeSchema = z.object({
  setToType: z.enum(['free', 'paid']),
});

export type UpdateCoursePricingTypeSchemaTypes = z.infer<typeof UpdateCoursePricingTypeSchema>;

// Enums
const PaymentFrequencyEnum = z.enum(
  ['monthly', 'bi_monthly', 'quarterly', 'semi_annual', 'annual'],
  {
    required_error: 'Let us know how often this plan should charge.',
    invalid_type_error: 'Hmm, that doesn’t look like a valid payment frequency.',
  },
);

const CurrencyCodeEnum = z.enum(['KES', 'USD'], {
  required_error: 'Currency is required.',
  invalid_type_error: 'Only KES and USD are supported at the moment.',
});

// Price schema — coerced to number
const TierPrice = z.coerce
  .number({
    required_error: 'How much does this tier cost?',
    invalid_type_error: 'The price must be a number.',
  })
  .int({ message: 'Price must be a whole number (no decimals allowed).' });

export const CoursePricingSchema = z
  .object({
    courseId: z
      .string({
        required_error: 'Course ID is required.',
        invalid_type_error: 'Course ID must be a string.',
      })
      .uuid('That doesn’t look like a valid course ID.')
      .optional(),

    paymentFrequency: PaymentFrequencyEnum,

    price: TierPrice,

    currencyCode: CurrencyCodeEnum,

    enablePromotionalPricing: z.coerce.boolean({
      required_error: 'Enable promotional pricing.',
      invalid_type_error: 'enablePromotionalPricing must be true or false.',
    }),

    discountPercentage: z.coerce
      .number({
        invalid_type_error: 'Discount must be a number.',
      })
      .min(0, 'Discount can’t be less than 0%.')
      .max(100, 'Whoa! discount can’t be more than 100%.')
      .nullable()
      .optional(),

    promotionalPrice: z.coerce
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

    isActive: z.coerce.boolean({
      required_error: 'Let us know if this tier should be active.',
      invalid_type_error: 'isActive must be true or false.',
    }),

    isPopular: z.coerce.boolean({
      required_error: 'Please specify if this tier is popular.',
      invalid_type_error: 'isPopular must be true or false.',
    }),

    isRecommended: z.coerce.boolean({
      required_error: 'Please specify if this tier is recommended.',
      invalid_type_error: 'isRecommended must be true or false.',
    }),

    createdAt: z.coerce
      .date({
        invalid_type_error: 'createdAt must be a valid date.',
      })
      .optional(),

    updatedAt: z.coerce
      .date({
        invalid_type_error: 'updatedAt must be a valid date.',
      })
      .optional(),
  })
  .superRefine((data, ctx) => {
    // Ensure paid tiers have a price greater than 0
    if (data.price <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Paid tiers need to cost something — bump up that price.',
        path: ['price'],
      });
    }

    // Currency-specific pricing rules
    if (data.currencyCode === 'KES') {
      if (data.price < 100 || data.price > 50000) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Price in KES must be between KES 100 and KES 50,000.',
          path: ['price'],
        });
      }
    } else if (data.currencyCode === 'USD') {
      if (data.price < 1 || data.price > 1000) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Price in USD must be between $1 and $1,000.',
          path: ['price'],
        });
      }
    }

    // Promotional price logic
    if (typeof data.promotionalPrice === 'number' && data.promotionalPrice >= data.price) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Promo price should be less than the regular price — otherwise, what’s the deal?',
        path: ['promotionalPrice'],
      });
    }

    // Promo date logic
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
  });

export type CoursePricingSchemaTypes = z.infer<typeof CoursePricingSchema>;
