import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

console.log('✅ Function started: user-notifications-email-dispatch');

Deno.serve(async (req) => {
  console.log('📥 Incoming request:', req);

  try {
    const body = await req.json();
    console.log('🧾 Parsed JSON body:', body);
  } catch (err) {
    console.error('⚠️ Failed to parse JSON body:', err);
  }

  const headers = Object.fromEntries(req.headers.entries());
  console.log('📦 Request headers:', headers);

  return new Response(
    JSON.stringify({ message: 'Function received request — check logs for details.' }),
    { headers: { 'Content-Type': 'application/json' } },
  );
});
