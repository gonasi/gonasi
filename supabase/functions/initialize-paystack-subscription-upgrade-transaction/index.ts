// Setup type definitions for built-in Supabase Runtime APIs
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

console.log('[initialize-paystack-subscription-upgrade-transaction]');

const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY');
const FRONTEND_URL = Deno.env.get('FRONTEND_URL');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Validate request body
const InitializeSubscriptionSchema = z.object({
  organizationId: z.string().min(1, { message: 'Organization id required' }),
  targetTier: z.string().min(1, { message: 'Target tier is required' }),
});

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  if (!PAYSTACK_SECRET_KEY || !FRONTEND_URL || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: 'Missing environment configuration' }), {
      status: 500,
    });
  }

  // Parse JSON
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
      { status: 400 },
    );
  }

  const { organizationId, targetTier } = parsed.data;
  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

  try {
    //
    // ✅ Fetch target tier limits
    //
    const { data: targetTierLimits, error: targetTierErr } = await supabase
      .from('tier_limits')
      .select('tier, paystack_plan_code, plan_currency, price_monthly_usd')
      .eq('tier', targetTier)
      .single();

    if (targetTierErr || !targetTierLimits) {
      return new Response(
        JSON.stringify({ error: `Invalid or unavailable tier selected: ${targetTier}` }),
        { status: 400 },
      );
    }

    //
    // ✅ Fetch current subscription
    //
    const { data: currentSub, error: fetchSubErr } = await supabase
      .from('organization_subscriptions')
      .select('tier, current_period_start, current_period_end')
      .eq('organization_id', organizationId)
      .single();

    if (fetchSubErr || !currentSub) {
      return new Response(JSON.stringify({ error: 'Subscription not found' }), { status: 404 });
    }

    //
    // ✅ Fetch current tier limits
    //
    const { data: currentTierLimits, error: currentTierErr } = await supabase
      .from('tier_limits')
      .select('tier, paystack_plan_code, plan_currency, price_monthly_usd')
      .eq('tier', currentSub.tier)
      .single();

    if (currentTierErr || !currentTierLimits) {
      return new Response(JSON.stringify({ error: `Invalid current tier: ${currentSub.tier}` }), {
        status: 400,
      });
    }

    //
    // ✅ Prevent downgrade or lateral move
    //
    if (targetTierLimits.tier === currentTierLimits.tier) {
      return new Response(JSON.stringify({ error: 'Cannot upgrade to the same tier' }), {
        status: 400,
      });
    }

    const currentPrice = currentTierLimits.price_monthly_usd;
    const targetPrice = targetTierLimits.price_monthly_usd;

    if (targetPrice < currentPrice) {
      return new Response(
        JSON.stringify({ error: 'New tier price is lower — downgrade not allowed' }),
        { status: 400 },
      );
    }

    //
    // ✅ Calculate prorated upgrade charge
    //
    const periodStart = new Date(currentSub.current_period_start);
    const periodEnd = new Date(currentSub.current_period_end);
    const now = new Date();

    const totalDays = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / 86400000);
    const daysRemaining = Math.ceil((periodEnd.getTime() - now.getTime()) / 86400000);

    const priceDifference = targetPrice - currentPrice;
    const proratedAmount = Math.round(((priceDifference * daysRemaining) / totalDays) * 100);

    const planCurrency = targetTierLimits.plan_currency || 'USD';

    console.log(`📊 Upgrade details:
      Current: ${currentTierLimits.tier} ($${currentPrice})
      Target:  ${targetTierLimits.tier} ($${targetPrice})
      Days remaining: ${daysRemaining}/${totalDays}
      Prorated charge: ${proratedAmount / 100} ${planCurrency}
    `);

    //
    // ✅ Initialize Paystack transaction
    //
    const body = {
      email: `${organizationId}@gonasi.com`,
      amount: proratedAmount,
      currency: planCurrency,
      callback_url: `${FRONTEND_URL}/${organizationId}/dashboard/subscriptions/status`,
      metadata: {
        transaction_type: 'organization_subscription_upgrade',
        organization_id: organizationId,
        cancel_action: `${FRONTEND_URL}/${organizationId}/dashboard/subscriptions/${targetTierLimits.tier}`,
        current_plan_tier: currentTierLimits.tier,
        target_plan_tier: targetTierLimits.tier,
        target_plan_code: targetTierLimits.paystack_plan_code,
        target_plan_currency: planCurrency,
        organization_email: `${organizationId}@gonasi.com`,
      },
    };

    console.log('Initializing Paystack subscription transaction:', body);

    const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const paystackData = await paystackRes.json();
    console.log('📥 Paystack response:', paystackData);

    if (!paystackRes.ok) {
      return new Response(
        JSON.stringify({
          error: 'Failed to initialize subscription transaction',
          details: paystackData,
        }),
        { status: 500 },
      );
    }

    //
    // ✅ SUCCESS — Return in PaystackSubscriptionResponse format
    //
    return new Response(
      JSON.stringify({
        success: true,
        data: paystackData, // This is already in the correct format from Paystack
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (err) {
    console.error('Unexpected error initializing subscription:', err);
    return new Response(
      JSON.stringify({
        success: false,
        data: null,
        error: 'Unexpected server error',
      }),
      { status: 500 },
    );
  }
});
