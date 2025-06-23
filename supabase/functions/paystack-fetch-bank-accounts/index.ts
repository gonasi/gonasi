import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY');
const COUNTRY = 'kenya';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { currency, type } = body ?? {};

  if (!currency || !type) {
    return new Response(
      JSON.stringify({
        error: 'Missing required fields',
        details: ['currency', 'type'].filter((key) => !body?.[key]),
      }),
      {
        status: 422,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  try {
    const paystackResponse = await fetch(
      `https://api.paystack.co/bank?country=${COUNTRY}&type=${type}&currency=${currency}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const responseData = await paystackResponse.json();

    if (!paystackResponse.ok) {
      console.error('Paystack bank fetch error:', responseData);
      return new Response(
        JSON.stringify({
          error: 'Failed to fetch bank list from Paystack',
          details: responseData,
        }),
        {
          status: paystackResponse.status,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Unexpected error fetching banks:', error);
    return new Response(
      JSON.stringify({
        error: 'Unexpected error occurred while fetching banks',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
});
