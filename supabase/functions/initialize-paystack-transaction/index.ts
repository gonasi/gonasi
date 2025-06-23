// Setup type definitions for built-in Supabase Runtime APIs
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

console.log('[initialize-paystack-transaction]');

// Load required environment variables
const BASE_URL = Deno.env.get('BASE_URL');
const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY');
const CALLBACK_PATH = '/payments/callback'; // Update if needed

// Zod schema for request body validation
const InitializeTransactionSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  name: z.string().min(1, { message: 'Name is required' }),
  amount: z.number().positive({ message: 'Amount must be a positive number' }),
  currencyCode: z.enum(['KES', 'USD'], { required_error: 'Currency code is required' }),
  reference: z.string().uuid({ message: 'Reference must be a valid UUID' }),
});

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    console.error('Invalid request method:', req.method);
    return new Response('Method not allowed', { status: 405 });
  }

  if (!BASE_URL || !PAYSTACK_SECRET_KEY) {
    console.error('Missing required environment variables', {
      BASE_URL,
      PAYSTACK_SECRET_KEY_EXISTS: !!PAYSTACK_SECRET_KEY,
    });
    return new Response(JSON.stringify({ error: 'Missing environment configuration' }), {
      status: 500,
    });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch (err) {
    console.error('Failed to parse JSON body:', err);
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }

  const parsed = InitializeTransactionSchema.safeParse(json);

  if (!parsed.success) {
    const errorMessages = parsed.error.flatten().fieldErrors;
    console.error('Validation failed:', errorMessages);
    return new Response(JSON.stringify({ error: 'Validation failed', details: errorMessages }), {
      status: 400,
    });
  }

  const { email, name, amount, currencyCode, reference } = parsed.data;

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
        callback_url: `${BASE_URL}${CALLBACK_PATH}`,
        metadata: {
          cancel_action: `${BASE_URL}${CALLBACK_PATH}`,
        },
      }),
    });

    const paystackData = await paystackRes.json();

    if (!paystackRes.ok) {
      console.error('Paystack API returned error:', paystackData);
      return new Response(
        JSON.stringify({
          error: 'Failed to initialize Paystack transaction',
          details: paystackData,
        }),
        { status: 500 },
      );
    }

    return new Response(JSON.stringify({ success: true, data: paystackData }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Unexpected error initializing Paystack transaction:', error);
    return new Response(JSON.stringify({ error: 'Unexpected error occurred' }), {
      status: 500,
    });
  }
});
