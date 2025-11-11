// Setup type definitions for built-in Supabase Runtime APIs
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

console.log('[initialize-paystack-subscription-transaction]');

const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY');
const FRONTEND_URL = Deno.env.get('FRONTEND_URL');

// ✅ Correct schema based on Paystack docs
const InitializeSubscriptionSchema = z.object({
  organizationId: z.string().min(1, { message: 'Organization id required' }),
  plan: z.string().min(1, { message: 'Plan code is required' }),
  tier: z.string().min(1, { message: 'Tier is required' }),
  amount: z.number().min(1, { message: 'Amount is required' }),
  metadata: z.record(z.any()).optional(),
});

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  if (!PAYSTACK_SECRET_KEY || !FRONTEND_URL) {
    return new Response(JSON.stringify({ error: 'Missing environment configuration' }), {
      status: 500,
    });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }

  const parsed = InitializeSubscriptionSchema.safeParse(json);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      }),
      {
        status: 400,
      },
    );
  }

  const { organizationId, plan, amount, metadata, tier } = parsed.data;

  try {
    const body = {
      email: `${organizationId}@gonasi.com`,
      // ✅ plan automatically overrides amount
      plan,
      amount,
      callback_url: `${FRONTEND_URL}/${organizationId}/dashboard/subscriptions`,
      metadata: {
        transaction_type: 'organization_subscription',
        organizationId,
        // ✅ cancel link for the UI
        cancel_action: `${FRONTEND_URL}/${organizationId}/dashboard/subscriptions/${tier}`,
        ...metadata,
      },
    };

    console.log('Initializing subscription transaction:', body);

    // ✅ Correct endpoint
    const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const paystackData = await paystackRes.json();

    console.log('📥 Paystack raw response:', paystackData);

    if (!paystackRes.ok) {
      return new Response(
        JSON.stringify({
          error: 'Failed to initialize subscription transaction',
          details: paystackData,
        }),
        { status: 500 },
      );
    }

    // ✅ Return Paystack "authorization_url" for frontend redirect
    return new Response(
      JSON.stringify({
        success: true,
        data: paystackData,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Unexpected error initializing subscription:', error);
    return new Response(JSON.stringify({ error: 'Unexpected error occurred' }), {
      status: 500,
    });
  }
});
