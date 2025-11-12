// ------------------------------------------------------------
// org-subscriptions-downgrade.ts
// Handles organization subscription downgrades on Paystack
// Includes detailed debug logs for local development
// ------------------------------------------------------------

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

console.log('[org-subscriptions-downgrade] Function started');

// ------------------------------------------------------------
// Environment configuration
// ------------------------------------------------------------
const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// ------------------------------------------------------------
// Request validation schema
// ------------------------------------------------------------
const DowngradeSubscriptionSchema = z.object({
  organizationId: z.string().uuid(),
  targetTier: z.string(), // allow any string; will validate later
  newPlanCode: z.string().optional(),
  userId: z.string().uuid(),
});

// ------------------------------------------------------------
// Main handler
// ------------------------------------------------------------
Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    console.log('❌ Method not allowed:', req.method);
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!PAYSTACK_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.log('❌ Missing environment variables');
    return new Response(JSON.stringify({ error: 'Missing environment configuration' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // ------------------------------------------------------------
  // Parse and validate request body
  // ------------------------------------------------------------
  let json: unknown;
  try {
    json = await req.json();
    console.log('[Request body]', json);
  } catch (err) {
    console.error('❌ Failed to parse JSON:', err);
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const parsed = DowngradeSubscriptionSchema.safeParse(json);
  if (!parsed.success) {
    console.error('❌ Validation failed:', parsed.error.format());
    return new Response(
      JSON.stringify({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const { organizationId, targetTier, newPlanCode, userId } = parsed.data;
  console.log('[Parsed request]', { organizationId, targetTier, newPlanCode, userId });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const now = new Date().toISOString();

  try {
    // ------------------------------------------------------------
    // Step 1: Fetch current subscription from Supabase
    // ------------------------------------------------------------
    const { data: subscription, error: subError } = await supabase
      .from('organization_subscriptions')
      .select('tier, current_period_end, status')
      .eq('organization_id', organizationId)
      .single();

    if (subError || !subscription) {
      console.error('❌ Subscription not found in Supabase', { subError, organizationId });
      return new Response(JSON.stringify({ error: 'Subscription not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('[Current subscription]', subscription);

    const currentTier = subscription.tier;
    const currentStatus = subscription.status;
    const currentPeriodEnd = subscription.current_period_end || now;

    // ------------------------------------------------------------
    // Step 2: Fetch active subscription from Paystack
    // ------------------------------------------------------------
    const paystackRes = await fetch(
      `https://api.paystack.co/subscription?customer=${organizationId}@gonasi.com&perPage=1&page=1`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      },
    );
    const paystackData = await paystackRes.json();
    console.log('[Paystack subscriptions]', paystackData);

    if (!paystackRes.ok || !paystackData.status) {
      console.error('❌ Failed to fetch subscriptions from Paystack', paystackData);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch Paystack subscriptions', details: paystackData }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const activeSubs = (paystackData.data || []).filter((s: any) => s.status === 'active');
    console.log('[Active subscriptions]', activeSubs);

    if (activeSubs.length !== 1) {
      console.error('❌ Unexpected active subscription count', activeSubs.length);
      return new Response(
        JSON.stringify({
          error: 'Organization must have exactly one active subscription',
          count: activeSubs.length,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const { subscription_code: subscriptionCode, email_token: emailToken } = activeSubs[0];
    if (!subscriptionCode || !emailToken) {
      console.error('❌ Missing subscription_code or email_token', activeSubs[0]);
      return new Response(
        JSON.stringify({
          error: 'Subscription missing required identifiers',
          details: activeSubs[0],
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // ------------------------------------------------------------
    // Step 3: Disable current Paystack subscription
    // ------------------------------------------------------------
    const disableRes = await fetch('https://api.paystack.co/subscription/disable', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code: subscriptionCode, token: emailToken }),
    });
    const disableData = await disableRes.json();
    console.log('[Paystack disable response]', disableData);

    if (!disableRes.ok) {
      console.error('❌ Failed to disable subscription', disableData);
      return new Response(
        JSON.stringify({ error: 'Failed to disable Paystack subscription', details: disableData }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // ------------------------------------------------------------
    // Step 4: Determine downgrade type
    // ------------------------------------------------------------
    const isFreeTier = targetTier === 'launch';
    const effectiveDate = currentPeriodEnd;

    if (isFreeTier) {
      // Free-tier downgrade
      console.log('⚡ Scheduling free-tier downgrade');
      const { error: updateError } = await supabase
        .from('organization_subscriptions')
        .update({
          next_tier: targetTier,
          status: 'non-renewing',
          downgrade_requested_at: now,
          downgrade_effective_at: effectiveDate,
          downgrade_requested_by: userId,
          cancel_at_period_end: true,
          updated_at: now,
          updated_by: userId,
        })
        .eq('organization_id', organizationId);

      if (updateError) {
        console.error('❌ Failed to update subscription in Supabase', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update subscription', details: updateError }),
          { status: 500, headers: { 'Content-Type': 'application/json' } },
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `Your subscription will remain on ${currentTier} until ${effectiveDate}, then move to Launch (free) tier.`,
          data: { currentTier, targetTier, effectiveDate },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // ------------------------------------------------------------
    // Paid tier downgrade: create new Paystack subscription
    // ------------------------------------------------------------
    console.log('⚡ Scheduling paid-tier downgrade via Paystack');

    // Ensure newPlanCode exists
    if (!newPlanCode) {
      console.error('❌ Missing Paystack plan code for target tier', targetTier);
      return new Response(
        JSON.stringify({ error: `Target tier ${targetTier} is missing Paystack plan code.` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const createSubRes = await fetch('https://api.paystack.co/subscription', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customer: `${organizationId}@gonasi.com`,
        plan: newPlanCode,
        start_date: effectiveDate,
      }),
    });
    const createSubData = await createSubRes.json();
    console.log('[Paystack create subscription response]', createSubData);

    if (!createSubRes.ok || !createSubData.status) {
      console.error('❌ Failed to create new subscription', createSubData);
      return new Response(
        JSON.stringify({
          error: 'Failed to create new Paystack subscription',
          details: createSubData,
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // ------------------------------------------------------------
    // Step 5: Update Supabase subscription record
    // ------------------------------------------------------------
    const { error: updateError } = await supabase
      .from('organization_subscriptions')
      .update({
        next_tier: targetTier,
        status: 'non-renewing',
        downgrade_requested_at: now,
        downgrade_effective_at: effectiveDate,
        downgrade_requested_by: userId,
        cancel_at_period_end: true,
        updated_at: now,
        updated_by: userId,
        next_subscription_code: createSubData.data.subscription_code,
        next_email_token: createSubData.data.email_token,
      })
      .eq('organization_id', organizationId);

    if (updateError) {
      console.error('❌ Failed to update Supabase subscription record', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update subscription record', details: updateError }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // ------------------------------------------------------------
    // Step 6: Return success response
    // ------------------------------------------------------------
    return new Response(
      JSON.stringify({
        success: true,
        message: `Your downgrade to ${targetTier} is scheduled. You’ll remain on ${currentTier} until ${effectiveDate}, then your new ${targetTier} plan will start automatically.`,
        data: {
          currentTier,
          targetTier,
          effectiveDate,
          paystack: {
            subscriptionCode: createSubData.data.subscription_code,
            emailToken: createSubData.data.email_token,
            nextPaymentDate: createSubData.data.next_payment_date,
          },
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('❌ Unexpected error during downgrade', err);
    return new Response(
      JSON.stringify({
        error: 'Unexpected error occurred',
        details: err instanceof Error ? err.message : String(err),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});
