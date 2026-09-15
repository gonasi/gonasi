// Setup type definitions for built-in Supabase Runtime APIs
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

console.log('[initialize-paystack-transaction]');

// Load required environment variables
const FRONTEND_URL = Deno.env.get('FRONTEND_URL');
const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY');

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// Zod schema for request body validation
const InitializeTransactionSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  // Not all profiles have a full name set, so don't block payment on it
  name: z.string().nullish(),
  // Paystack requires amounts as integers in the currency subunit (cents)
  amount: z
    .number()
    .positive({ message: 'Amount must be a positive number' })
    .transform((value) => Math.round(value)),
  currencyCode: z.enum(['KES', 'USD'], { required_error: 'Currency code is required' }),
  reference: z.string().uuid({ message: 'Reference must be a valid UUID' }),
  metadata: z.any(),
});

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    console.error('Invalid request method:', req.method);
    return new Response('Method not allowed', { status: 405 });
  }

  if (!FRONTEND_URL || !PAYSTACK_SECRET_KEY) {
    console.error('Missing required environment variables', {
      FRONTEND_URL,
      PAYSTACK_SECRET_KEY_EXISTS: !!PAYSTACK_SECRET_KEY,
    });
    return jsonResponse({ error: 'Missing environment configuration' }, 500);
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch (err) {
    console.error('Failed to parse JSON body:', err);
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const parsed = InitializeTransactionSchema.safeParse(json);

  if (!parsed.success) {
    const errorMessages = parsed.error.flatten().fieldErrors;
    console.error('Validation failed:', errorMessages);
    return jsonResponse({ error: 'Validation failed', details: errorMessages }, 400);
  }

  const { email, name, amount, currencyCode, reference, metadata } = parsed.data;

  try {
    const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        name,
        amount,
        currency: currencyCode.toUpperCase(),
        reference,
        callback_url: `${FRONTEND_URL}/c/${metadata.publishedCourseId}/enroll/status`,
        metadata: {
          cancel_action: `${FRONTEND_URL}/c/${metadata.publishedCourseId}/enroll/${metadata.pricingTierId}/cancel`,
          transaction_type: 'course_sale',
          ...metadata,
        },
      }),
    });

    const paystackData = await paystackRes.json();

    if (!paystackRes.ok) {
      console.error('Paystack API returned error:', {
        status: paystackRes.status,
        response: paystackData,
        amount,
        currency: currencyCode,
        reference,
      });
      // Paystack 4xx means the request itself was rejected (bad amount, unsupported currency, ...)
      return jsonResponse(
        {
          error: paystackData?.message ?? 'Failed to initialize Paystack transaction',
          details: paystackData,
        },
        paystackRes.status >= 400 && paystackRes.status < 500 ? 400 : 502,
      );
    }

    return jsonResponse({ success: true, data: paystackData });
  } catch (error) {
    console.error('Unexpected error initializing Paystack transaction:', error);
    return jsonResponse({ error: 'Unexpected error occurred' }, 500);
  }
});
