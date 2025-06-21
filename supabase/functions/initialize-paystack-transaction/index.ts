// Setup type definitions for built-in Supabase Runtime APIs
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

console.log('[initialize-paystack-transaction]');

const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY');
const PAYSTACK_PUBLIC_KEY = Deno.env.get('PAYSTACK_PUBLIC_KEY');

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

  const data = {
    message: `Hello ${name}!`,
    email,
    amount,
    currencyCode,
  };

  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  });
});
