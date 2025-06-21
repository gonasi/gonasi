// Setup type definitions for built-in Supabase Runtime APIs
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

console.log('[initialize-paystack-transaction]');

const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY');

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON body', { status: 400 });
  }

  const { email, name, amount, currencyCode } = body;

  // Validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const supportedCurrencies = ['KES', 'USD'];

  if (!email || !emailRegex.test(email)) {
    return new Response(JSON.stringify({ error: 'Invalid email address' }), { status: 400 });
  }

  if (typeof amount !== 'number' || amount <= 0) {
    return new Response(JSON.stringify({ error: 'Amount must be a positive number' }), {
      status: 400,
    });
  }

  if (!currencyCode || !supportedCurrencies.includes(currencyCode.toUpperCase())) {
    return new Response(JSON.stringify({ error: 'Unsupported or missing currency code' }), {
      status: 400,
    });
  }

  // Call Paystack
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
      }),
    });

    const paystackData = await paystackRes.json();

    if (!paystackRes.ok) {
      console.error('Paystack error:', paystackData);
      return new Response(
        JSON.stringify({
          error: 'Failed to initialize Paystack transaction',
          details: paystackData,
        }),
        {
          status: 500,
        },
      );
    }

    return new Response(JSON.stringify({ success: true, data: paystackData }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Unexpected error initializing transaction:', error);
    return new Response(JSON.stringify({ error: 'Unexpected error occurred' }), {
      status: 500,
    });
  }
});
