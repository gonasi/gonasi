import z from 'zod';

export const PricingSchema = z.array(
  z.object({
    id: z
      .string({ required_error: `This pricing option needs an <span class="go-title">ID</span>.` })
      .nonempty(`<span class="go-title">Pricing ID</span> can't be empty.`),
    course_id: z
      .string({ required_error: `Link this pricing to a <span class="go-title">course</span>.` })
      .nonempty(`<span class="go-title">Course ID</span> can't be empty.`),
    organization_id: z
      .string({ required_error: `Organization id is required` })
      .nonempty(`Organization id can't be empty.`),
    payment_frequency: z.enum(['monthly', 'bi_monthly', 'quarterly', 'semi_annual', 'annual'], {
      invalid_type_error: `Choose how often students will pay with a <span class="go-title">payment frequency</span>.`,
    }),
    is_free: z.boolean({
      invalid_type_error: `Let us know if this course is <span class="go-title">free</span> or paid.`,
    }),
    price: z
      .number({ invalid_type_error: `<span class="go-title">Price</span> should be a number.` })
      .min(0, `<span class="go-title">Price</span> can't be negative.`),
    currency_code: z
      .string({ required_error: `What <span class="go-title">currency</span> are you using?` })
      .length(
        3,
        `<span class="go-title">Currency code</span> should be 3 letters (like USD, EUR, GBP).`,
      ),
    promotional_price: z
      .number({
        invalid_type_error: `<span class="go-title">Promotional price</span> should be a number.`,
      })
      .min(0, `<span class="go-title">Promotional price</span> can't be negative.`)
      .nullable(),
    promotion_start_date: z.string().nullable(),
    promotion_end_date: z.string().nullable(),
    tier_name: z.string().nullable(),
    tier_description: z.string().nullable(),
    is_active: z.boolean({
      invalid_type_error: `Is this <span class="go-title">pricing option</span> currently available to students?`,
    }),
    position: z
      .number({ invalid_type_error: `<span class="go-title">Position</span> should be a number.` })
      .min(0, `<span class="go-title">Position</span> should be zero or higher.`),
    is_popular: z.boolean({
      invalid_type_error: `Is this your <span class="success">most popular</span> pricing option?`,
    }),
    is_recommended: z.boolean({
      invalid_type_error: `Do you <span class="success">recommend</span> this pricing tier to most students?`,
    }),
  }),
);

export type PricingSchemaTypes = z.infer<typeof PricingSchema>;
