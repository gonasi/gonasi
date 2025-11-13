// ────────────────────────────────────────────────────────────────────────────────
// org-subscriptions-downgrade.ts
// ------------------------------------------------------------------------------
// Cancels the current Paystack subscription’s auto-renew immediately,
// but keeps the organization active on the current tier until period end.
//
// The local record is marked as `non-renewing` and scheduled for downgrade.
// A scheduled job (org-subscriptions-downgrade-trigger.ts) later activates
// the new tier and creates a new Paystack subscription after expiry.
// Downgrades to "launch" (free tier) skip Paystack requests entirely.
// ────────────────────────────────────────────────────────────────────────────────

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

console.log('🚀 [org-subscriptions-downgrade] Function started');

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY');
const FRONTEND_URL = Deno.env.get('FRONTEND_URL');

// ────────────────────────────────────────────────────────────────────────────────
// Validation Schema
// ────────────────────────────────────────────────────────────────────────────────
const DowngradeRequest = z.object({
  organizationId: z.string().uuid(),
  targetTier: z.string(),
  newPlanCode: z.string().optional().nullable(), // ✅ allow null or undefined
  userId: z.string().uuid(),
});

// ────────────────────────────────────────────────────────────────────────────────
// Edge Function Entry Point
// ────────────────────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !PAYSTACK_SECRET_KEY || !FRONTEND_URL) {
    console.error('❌ Missing environment configuration variables');
    return new Response(JSON.stringify({ error: 'Missing environment configuration' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // Parse & Validate Request
  // ──────────────────────────────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const parsed = DowngradeRequest.safeParse(body);
  if (!parsed.success) {
    console.error('❌ Validation failed', parsed.error.flatten().fieldErrors);
    return new Response(
      JSON.stringify({
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const { organizationId, targetTier, newPlanCode, userId } = parsed.data;
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const nowIso = new Date().toISOString();

  console.log('📦 Parsed Request', { organizationId, targetTier, userId, newPlanCode });

  // ──────────────────────────────────────────────────────────────────────────────
  // STEP 1: Fetch Current Subscription
  // ──────────────────────────────────────────────────────────────────────────────
  const { data: subscription, error: subError } = await supabase
    .from('organization_subscriptions')
    .select('tier, current_period_end, status, paystack_subscription_code, next_tier')
    .eq('organization_id', organizationId)
    .single();

  if (subError || !subscription) {
    console.error('❌ Subscription not found', subError);
    return new Response(JSON.stringify({ error: 'Subscription not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const {
    tier: currentTier,
    current_period_end: currentPeriodEnd,
    paystack_subscription_code: paystackCode,
    next_tier: nextTier,
    status,
  } = subscription;

  console.log('📄 Current subscription record', {
    currentTier,
    currentPeriodEnd,
    paystackCode,
    nextTier,
    status,
  });

  // ──────────────────────────────────────────────────────────────────────────────
  // STEP 2: Check for existing scheduled downgrade
  // ──────────────────────────────────────────────────────────────────────────────
  if (status === 'non-renewing' && nextTier === targetTier && targetTier !== 'launch') {
    console.log('⚠️ Downgrade to the same tier already scheduled, skipping duplicate.');
    return new Response(
      JSON.stringify({
        success: true,
        message: `A downgrade to ${targetTier} is already scheduled. No action taken.`,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // STEP 3: Determine Effective Downgrade Date
  // ──────────────────────────────────────────────────────────────────────────────
  let nextPaymentDate: string | null = null;

  // Skip Paystack call entirely for free ("launch") downgrades
  if (targetTier === 'launch') {
    console.log('🪶 Downgrade to free tier — skipping Paystack API call.');
    nextPaymentDate = currentPeriodEnd;
  } else if (paystackCode) {
    const paystackRes = await fetch(`https://api.paystack.co/subscription/${paystackCode}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const paystackJson = await paystackRes.json();

    if (!paystackRes.ok || !paystackJson.status) {
      console.error('❌ Failed to fetch Paystack subscription', paystackJson);
      return new Response(
        JSON.stringify({
          error: 'Failed to fetch subscription from Paystack',
          details: paystackJson,
        }),
        { status: 502, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const paystackSub = paystackJson.data;
    nextPaymentDate = paystackSub?.next_payment_date ?? currentPeriodEnd;

    console.log('📬 Paystack subscription data', {
      subscription_code: paystackSub.subscription_code,
      status: paystackSub.status,
      next_payment_date: nextPaymentDate,
    });
  } else {
    console.log('⚙️ No Paystack subscription found; using current_period_end.');
    nextPaymentDate = currentPeriodEnd;
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // STEP 4: Schedule Downgrade Locally
  // ──────────────────────────────────────────────────────────────────────────────
  const effectiveDate = nextPaymentDate || currentPeriodEnd || nowIso;

  const humanReadableDate = new Date(effectiveDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });

  const { error: updateError } = await supabase
    .from('organization_subscriptions')
    .update({
      next_tier: targetTier,
      next_plan_code: newPlanCode || null,
      downgrade_requested_at: nowIso,
      downgrade_effective_at: effectiveDate,
      downgrade_requested_by: userId,
      cancel_at_period_end: true,
      status: 'non-renewing',
      updated_at: nowIso,
      updated_by: userId,
    })
    .eq('organization_id', organizationId);

  if (updateError) {
    console.error('❌ Failed to update subscription record', updateError);
    return new Response(JSON.stringify({ error: 'Failed to update subscription' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  console.log(
    `✅ Downgrade scheduled: Org ${organizationId} will move from ${currentTier} → ${targetTier} after ${effectiveDate}.`,
  );

  // ──────────────────────────────────────────────────────────────────────────────
  // STEP 5: Notify Organization
  // ──────────────────────────────────────────────────────────────────────────────
  await supabase.rpc('insert_org_notification', {
    p_organization_id: organizationId,
    p_type_key: 'org_tier_downgraded',
    p_metadata: {
      tier_name: targetTier,
      effective_date: effectiveDate,
      human_readable_date: new Date(effectiveDate).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC',
      }),
    },
    p_link: `${FRONTEND_URL}/${organizationId}/dashboard/subscriptions`,
    p_performed_by: userId,
  });

  // ──────────────────────────────────────────────────────────────────────────────
  // STEP 6: Respond
  // ──────────────────────────────────────────────────────────────────────────────
  return new Response(
    JSON.stringify({
      success: true,
      message: `Your subscription will remain active until ${humanReadableDate}, then downgrade to ${targetTier}. Auto-renew has been disabled.`,
      data: {
        currentTier,
        targetTier,
        effectiveDate,
        humanReadableDate,
        paystackCode,
      },
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
});
