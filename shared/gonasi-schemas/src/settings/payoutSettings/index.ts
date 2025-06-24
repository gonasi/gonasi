import { z } from 'zod';

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
  // Add more currencies as needed
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
      .optional(),

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

    bankCode: z.string().nullable().optional(),

    accountNumber: z.string().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    const { currency, type } = data;
    const bankCode = (data.bankCode ?? '').trim();
    const accNum = (data.accountNumber ?? '').trim();

    // USD requires Bank payout method
    if (currency === 'USD' && type !== 'kepss') {
      ctx.addIssue({
        path: ['type'],
        code: z.ZodIssueCode.custom,
        message:
          '<lucide name="AlertOctagon" size="12" /> <span class="go-title">Payout method</span> must be <span class="go-title">Bank</span> when currency is <span class="go-title">USD</span>.',
      });
    }

    // bankCode required based on type
    if (!bankCode) {
      if (type === 'mobile_money') {
        ctx.addIssue({
          path: ['bankCode'],
          code: z.ZodIssueCode.custom,
          message:
            '<lucide name="Smartphone" size="12" /> <span class="go-title">Mobile Money Provider</span> is required. Please select your provider (M-Pesa, Airtel Money, etc.)',
        });
      } else if (type === 'kepss') {
        ctx.addIssue({
          path: ['bankCode'],
          code: z.ZodIssueCode.custom,
          message:
            '<lucide name="Building2" size="12" /> <span class="go-title">Bank</span> is required. Please select your bank from the list.',
        });
      } else {
        ctx.addIssue({
          path: ['bankCode'],
          code: z.ZodIssueCode.custom,
          message:
            '<lucide name="Banknote" size="12" /> <span class="go-title">Provider</span> is required.',
        });
      }
    }

    // accountNumber required and format-validated based on type
    if (!accNum) {
      ctx.addIssue({
        path: ['accountNumber'],
        code: z.ZodIssueCode.custom,
        message:
          type === 'mobile_money'
            ? '<lucide name="Phone" size="12" /> <span class="go-title">Mobile Money Number</span> is required. Enter your registered mobile money number.'
            : type === 'kepss'
              ? '<lucide name="CreditCard" size="12" /> <span class="go-title">Bank Account Number</span> is required. Enter your complete account number.'
              : '<lucide name="Hash" size="12" /> <span class="go-title">Account Number</span> is required.',
      });
    } else {
      if (type === 'mobile_money' && !/^\d{9}$/.test(accNum)) {
        ctx.addIssue({
          path: ['accountNumber'],
          code: z.ZodIssueCode.custom,
          message:
            '<lucide name="AlertTriangle" size="12" /> <span class="go-title">Invalid Mobile Money Number</span>. Must be exactly 9 digits (e.g., 712345678).',
        });
      }

      if (type === 'kepss' && !/^\d{10,17}$/.test(accNum)) {
        ctx.addIssue({
          path: ['accountNumber'],
          code: z.ZodIssueCode.custom,
          message:
            '<lucide name="AlertTriangle" size="12" /> <span class="go-title">Invalid Bank Account Number</span>. Must be between 10-17 digits with no spaces or special characters.',
        });
      }
    }
  });

export type UpsertPayoutDetailsSchemaTypes = z.infer<typeof UpsertPayoutDetailsSchema>;
