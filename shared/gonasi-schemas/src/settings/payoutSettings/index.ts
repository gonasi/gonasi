import z from 'zod';

export const SUPPORTED_CURRENCIES = [
  {
    value: 'KES',
    label: 'Kenyan Shilling',
    imageUrl: 'https://flagcdn.com/ke.svg',
  },
  {
    value: 'USD',
    label: 'US Dollar',
    imageUrl: 'https://flagcdn.com/us.svg',
  },
  // {
  //   value: 'NGN',
  //   label: 'Nigerian Naira',
  //   imageUrl: 'https://flagcdn.com/ng.svg',
  // },
  // {
  //   value: 'GHS',
  //   label: 'Ghanaian Cedi',
  //   imageUrl: 'https://flagcdn.com/gh.svg',
  // },
  // {
  //   value: 'ZAR',
  //   label: 'South African Rand',
  //   imageUrl: 'https://flagcdn.com/za.svg',
  // },
];

export const PAYOUT_TYPE = [
  {
    value: 'kepss',
    label: '🏦 Bank',
  },
  {
    value: 'mobile_money',
    label: '📱 Mobile Money',
  },
];

const supportedCurrencyValues = SUPPORTED_CURRENCIES.map((c) => c.value);
const supportedPayoutValues = PAYOUT_TYPE.map((p) => p.value);

export const UpsertPayoutDetailsSchema = z
  .object({
    userId: z
      .string({
        invalid_type_error:
          '<lucide name="Hash" size="12" /> <span class="go-title">User ID</span> must be a string.',
      })
      .uuid(
        '<lucide name="ShieldAlert" size="12" /> <span class="go-title">User ID</span> is not in a valid format.',
      )
      .nullable(),

    currency: z
      .string({
        required_error:
          '<lucide name="Wallet" size="12" /> <span class="go-title">Currency</span> is required.',
        invalid_type_error: '<span class="go-title">Currency</span> must be a string.',
      })
      .refine((val) => supportedCurrencyValues.includes(val), {
        message:
          '<lucide name="AlertCircle" size="12" /> <span class="go-title">Currency</span> is not supported.',
      }),

    type: z
      .string({
        required_error: '<span class="go-title">Payout method</span> is required.',
        invalid_type_error: '<span class="go-title">Type</span> must be a string.',
      })
      .refine((val) => supportedPayoutValues.includes(val), {
        message:
          '<lucide name="AlertCircle" size="12" /> <span class="go-title">Type</span> is not supported.',
      }),

    bankCode: z.string({
      required_error:
        '<lucide name="Banknote" size="12" /> <span class="go-title">Bank/Provider</span> is required.',
      invalid_type_error:
        '<lucide name="Type" size="12" /> <span class="go-title">Bank/Provider</span> must be a string.',
    }),

    accountNumber: z.string({
      required_error:
        '<lucide name="CreditCard" size="12" /> <span class="go-title">Account number</span> is required.',
      invalid_type_error:
        '<lucide name="Type" size="12" /> <span class="go-title">Account number</span> must be a string.',
    }),
  })
  .superRefine((data, ctx) => {
    if (data.currency === 'USD' && data.type !== 'kepss') {
      ctx.addIssue({
        path: ['type'],
        code: z.ZodIssueCode.custom,
        message:
          '<lucide name="AlertOctagon" size="12" /> <span class="go-title">Payout method</span> must be <span class="go-title">Bank</span> when currency is <span class="go-title">USD</span>.',
      });
    }
  });

export type UpsertPayoutDetailsSchemaTypes = z.infer<typeof UpsertPayoutDetailsSchema>;
