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
    required_error: `<lucide name="Repeat" size="12" /> Let us know how often this plan should charge.`,
    invalid_type_error: `<lucide name="AlertTriangle" size="12" /> Hmm, that doesn’t look like a valid payment frequency.`,
  },
);

const CurrencyCodeEnum = z.enum(['KES', 'USD'], {
  required_error: `<lucide name="Banknote" size="12" /> Currency is required.`,
  invalid_type_error: `<lucide name="AlertCircle" size="12" /> Only KES and USD are supported at the moment.`,
});

export type CurrencyCodeEnumType = z.infer<typeof CurrencyCodeEnum>;

// Price schema — coerced to number
const TierPrice = z.coerce
  .number({
    required_error: `<lucide name="DollarSign" size="12" /> How much does this tier cost?`,
    invalid_type_error: `The price must be a <span class="error">number.</span>`,
  })
  .int({
    message: `<span class="warning">Price must be a whole number</span> (no decimals allowed) <lucide name="Calculator" size="12" />`,
  });

export const CoursePricingSchema = z
  .object({
    pricingId: z.string().optional(),
    organizationId: z.string(),
    courseId: z
      .string({
        required_error: `<lucide name="Book" size="12" /> Course ID is required.`,
        invalid_type_error: `<span class="error">Course ID must be a string.</span>`,
      })
      .uuid(`<lucide name="Hash" size="12" /> That doesn’t look like a valid course ID.`),

    paymentFrequency: PaymentFrequencyEnum,

    isFree: z.boolean(),

    price: TierPrice,

    currencyCode: CurrencyCodeEnum,

    position: z.number().int().optional(),

    enablePromotionalPricing: z.coerce.boolean({
      required_error: `<lucide name="Percent" size="12" /> Enable promotional pricing.`,
      invalid_type_error: `<span class="error">enablePromotionalPricing must be true or false.</span>`,
    }),

    promotionalPrice: z.coerce
      .number({
        invalid_type_error: `<lucide name="Tag" size="12" /> Promo price must be a number.`,
      })
      .nonnegative(
        `<span class="warning">Promo price should be zero or more</span>, no negative deals here.`,
      )
      .nullable()
      .optional(),

    promotionStartDate: z.coerce
      .date({
        invalid_type_error: `<lucide name="Calendar" size="12" /> Promotion start date must be a valid date.`,
      })
      .nullable()
      .optional(),

    promotionEndDate: z.coerce
      .date({
        invalid_type_error: `<lucide name="CalendarClock" size="12" /> Promotion end date must be a valid date.`,
      })
      .nullable()
      .optional(),

    tierName: z
      .string({
        invalid_type_error: `<lucide name="Type" size="12" /> Tier name must be a string.`,
      })
      .max(100, `<span class="warning">Keep the tier name under 100 characters</span>, please.`)
      .nullable()
      .optional(),

    tierDescription: z
      .string({
        invalid_type_error: `<lucide name="AlignLeft" size="12" /> Tier description must be a string.`,
      })
      .nullable()
      .optional(),

    isActive: z.coerce.boolean({
      required_error: `<lucide name="CheckCircle" size="12" /> Let us know if this tier should be active.`,
      invalid_type_error: `<span class="error">isActive must be true or false.</span>`,
    }),

    isPopular: z.coerce.boolean({
      required_error: `<lucide name="Star" size="12" /> Please specify if this tier is popular.`,
      invalid_type_error: `<span class="error">isPopular must be true or false.</span>`,
    }),

    isRecommended: z.coerce.boolean({
      required_error: `<lucide name="ThumbsUp" size="12" /> Please specify if this tier is recommended.`,
      invalid_type_error: `<span class="error">isRecommended must be true or false.</span>`,
    }),

    createdAt: z.coerce
      .date({
        invalid_type_error: `<lucide name="Clock" size="12" /> createdAt must be a valid date.`,
      })
      .optional(),

    updatedAt: z.coerce
      .date({
        invalid_type_error: `<lucide name="Clock" size="12" /> updatedAt must be a valid date.`,
      })
      .optional(),
  })
  .superRefine((data, ctx) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const isPaid = !data.isFree;

    if (isPaid) {
      if (data.price <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `<lucide name="Ban" size="12" /> Paid tiers need to cost something, bump up that price.`,
          path: ['price'],
        });
      }

      if (data.currencyCode === 'KES') {
        if (data.price < 100 || data.price > 50000) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `<lucide name="AlertOctagon" size="12" /> Price in KES must be between KES 100 and KES 50,000.`,
            path: ['price'],
          });
        }
      } else if (data.currencyCode === 'USD') {
        if (data.price < 1 || data.price > 1000) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `<lucide name="AlertOctagon" size="12" /> Price in USD must be between $1 and $1,000.`,
            path: ['price'],
          });
        }
      }

      if (typeof data.promotionalPrice === 'number' && data.promotionalPrice >= data.price) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `<lucide name="ArrowDown" size="12" /> Promo price should be less than the regular price (${data.currencyCode} ${data.price})`,
          path: ['promotionalPrice'],
        });
      }
    }

    if (data.enablePromotionalPricing) {
      if (data.promotionalPrice == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `<lucide name="AlertCircle" size="12" /> Promotional price is required.`,
          path: ['promotionalPrice'],
        });
      }

      if (data.promotionStartDate == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `<lucide name="Clock" size="12" /> Promotional start date is required.`,
          path: ['promotionStartDate'],
        });
      }

      if (data.promotionEndDate == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `<lucide name="Clock" size="12" /> Promotional end date is required.`,
          path: ['promotionEndDate'],
        });
      }

      if (data.promotionStartDate instanceof Date && data.promotionStartDate < now) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `<lucide name="CalendarX" size="12" /> Promotion start date must be today or in the future.`,
          path: ['promotionStartDate'],
        });
      }
    }

    if (
      data.promotionStartDate instanceof Date &&
      data.promotionEndDate instanceof Date &&
      data.promotionStartDate >= data.promotionEndDate
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `<lucide name="CalendarCheck" size="12" /> Promotion start date needs to come before the end date.`,
        path: ['promotionStartDate'],
      });
    }
  });

export type CoursePricingSchemaTypes = z.infer<typeof CoursePricingSchema>;

export const DeleteCoursePricingTierSchema = z.object({
  coursePricingTierId: z.string(),
});
export type DeleteCoursePricingTierSchemaTypes = z.infer<typeof DeleteCoursePricingTierSchema>;

export const CourseTierPositionUpdateSchema = z.object({
  id: z.string().uuid(),
  position: z.number().int(),
});

export const CourseTierPositionUpdateArraySchema = z.array(CourseTierPositionUpdateSchema);

export type CourseTierPositionUpdate = z.infer<typeof CourseTierPositionUpdateSchema>;
export type CourseTierPositionUpdateArrayType = z.infer<typeof CourseTierPositionUpdateArraySchema>;
