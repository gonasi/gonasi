// Import types for Supabase Edge Runtime
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

// Import Zod for schema validation
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

console.log('[paystack-create-subaccount] Function initialized');

// 🚫 DO NOT MODIFY THIS VALUE 🚫
// This constant defines the platform’s commission (in percent).
// It represents the split between total customer payment and company earnings.
// Changing this value will impact ALL payout calculations across the system.
const PERCENT_CHARGE = 15.0; // Platform's commission (%)

// Load required environment variables
const BASE_URL = Deno.env.get('BASE_URL');
const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY');

// Schema for validating incoming request body
const CreateSubaccountSchema = z.object({
  business_name: z.string(),
  bank_code: z.string(),
  account_number: z.string(),
  description: z.string(),
  primary_contact_email: z.string(),
  primary_contact_name: z.string(),
  primary_contact_phone: z.string(),
});

// Edge function entrypoint
Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  if (!BASE_URL || !PAYSTACK_SECRET_KEY) {
    console.error('Missing required environment variables:', {
      BASE_URL,
      PAYSTACK_SECRET_KEY_EXISTS: !!PAYSTACK_SECRET_KEY,
    });

    return new Response(
      JSON.stringify({ error: 'Server misconfigured: Missing environment variables.' }),
      { status: 500 },
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch (err) {
    console.error('Failed to parse JSON body:', err);
    return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), { status: 400 });
  }

  const parsed = CreateSubaccountSchema.safeParse(json);

  if (!parsed.success) {
    const errorMessages = parsed.error.flatten().fieldErrors;
    console.error('Validation failed:', errorMessages);

    return new Response(JSON.stringify({ error: 'Validation failed', details: errorMessages }), {
      status: 400,
    });
  }

  // Destructure validated data
  const {
    business_name,
    bank_code,
    account_number,
    description,
    primary_contact_email,
    primary_contact_name,
    primary_contact_phone,
  } = parsed.data;

  try {
    // ✅ Correct Paystack endpoint
    const paystackRes = await fetch('https://api.paystack.co/subaccount', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        business_name,
        settlement_bank: bank_code,
        account_number,
        percentage_charge: PERCENT_CHARGE,
        description,
        primary_contact_email,
        primary_contact_name,
        primary_contact_phone,
      }),
    });

    let paystackData: any;
    try {
      const text = await paystackRes.text();
      paystackData = text ? JSON.parse(text) : {};
    } catch (parseErr) {
      console.error('Failed to parse Paystack response:', parseErr);
      paystackData = { parse_error: true };
    }

    if (!paystackRes.ok) {
      console.error('Paystack API error:', paystackData);
      return new Response(
        JSON.stringify({
          error: 'Failed to create subaccount via Paystack',
          details: paystackData,
        }),
        { status: 500 },
      );
    }

    return new Response(JSON.stringify({ success: true, data: paystackData }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Unexpected error during Paystack request:', error);
    return new Response(JSON.stringify({ error: 'Unexpected server error' }), {
      status: 500,
    });
  }
});
