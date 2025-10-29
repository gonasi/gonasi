// ============================================================
// verify-paystack-transaction
// ============================================================
// Validates a Paystack transaction reference received via
// POST (for use with supabase.functions.invoke()).
// ============================================================

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

console.log('[verify-paystack-transaction]');

const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY');

// Zod schema for request body validation
const BodySchema = z.object({
  reference: z.string().min(1, 'Missing reference'),
});

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => null);
    const parsed = BodySchema.safeParse(body);

    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Missing or invalid reference' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!PAYSTACK_SECRET_KEY) {
      return new Response(JSON.stringify({ error: 'Paystack secret key is not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { reference } = parsed.data;

    const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      console.error('[Paystack verification failed]', await res.text());
      return new Response(JSON.stringify({ error: 'Failed to verify transaction with Paystack' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await res.json();

    return new Response(
      JSON.stringify({
        reference,
        transaction: result.data,
        status: result.status,
      }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('[Error verifying transaction]', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
