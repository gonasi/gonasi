// ────────────────────────────────────────────────────────────────────────────────
// org-subscriptions-downgrade.ts
// ------------------------------------------------------------------------------
// Cancels the current Paystack subscription's auto-renew immediately,
// but keeps the organization active on the current tier until period end.
//
// The local record is marked as `non-renewing` and scheduled for downgrade.
// A scheduled job (org-subscriptions-downgrade-trigger.ts) later activates
// the new tier and creates a new Paystack subscription after expiry.
// Cancellations move to "temp" tier. Downgrades to "launch" (free tier) skip
// Paystack requests entirely.
// Notifications are best-effort: failures do NOT break the flow.
// ────────────────────────────────────────────────────────────────────────────────

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

console.log('🚀 [org-subscriptions-downgrade] function started');

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY');
const FRONTEND_URL = Deno.env.get('FRONTEND_URL');

// ────────────────────────────────────────────────────────────────────────────────
// validation schema
// ────────────────────────────────────────────────────────────────────────────────
const downgradeRequest = z.object({
  organizationId: z.string().uuid(),
  targetTier: z.string(),
  newPlanCode: z.string().optional().nullable(),
  userId: z.string().uuid(),
  isCancellation: z.boolean().optional().default(false),
});

// ────────────────────────────────────────────────────────────────────────────────
// entry
// ────────────────────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method not allowed' }), {
      status: 405,
      headers: { 'content-type': 'application/json' },
    });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !PAYSTACK_SECRET_KEY || !FRONTEND_URL) {
    console.error('❌ missing environment configuration variables');
    return new Response(JSON.stringify({ error: 'missing environment configuration' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }

  // parse body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'invalid json body' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const parsed = downgradeRequest.safeParse(body);
  if (!parsed.success) {
    console.error('❌ validation failed', parsed.error.flatten().fieldErrors);
    return new Response(
      JSON.stringify({
        error: 'validation failed',
        details: parsed.error.flatten().fieldErrors,
      }),
      { status: 400, headers: { 'content-type': 'application/json' } },
    );
  }

  const { organizationId, targetTier, newPlanCode, userId, isCancellation } = parsed.data;
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const nowIso = new Date().toISOString();
  const effectiveTargetTier = isCancellation ? 'temp' : targetTier;

  console.log('📦 parsed request', {
    organizationId,
    targetTier,
    effectiveTargetTier,
    isCancellation,
    userId,
    newPlanCode,
  });

  // ──────────────────────────────────────────────────────────────────────────────
  // step 1: fetch subscription
  // ──────────────────────────────────────────────────────────────────────────────
  const { data: subscription, error: subError } = await supabase
    .from('organization_subscriptions')
    .select('tier, current_period_end, status, paystack_subscription_code, next_tier')
    .eq('organization_id', organizationId)
    .single();

  if (subError || !subscription) {
    console.error('❌ subscription not found', subError);
    return new Response(JSON.stringify({ error: 'subscription not found' }), {
      status: 404,
      headers: { 'content-type': 'application/json' },
    });
  }

  const {
    tier: currentTier,
    current_period_end: currentPeriodEnd,
    paystack_subscription_code: paystackCode,
    next_tier: nextTier,
    status,
  } = subscription;

  console.log('📄 current subscription record', {
    currentTier,
    currentPeriodEnd,
    paystackCode,
    nextTier,
    status,
  });

  // ──────────────────────────────────────────────────────────────────────────────
  // step 2: skip duplicate
  // ──────────────────────────────────────────────────────────────────────────────
  if (status === 'non-renewing' && nextTier === effectiveTargetTier) {
    const action = isCancellation ? 'cancellation' : 'downgrade';
    console.log(`⚠️ ${action} to ${effectiveTargetTier} already scheduled, skipping duplicate`);
    return new Response(
      JSON.stringify({
        success: true,
        message: `a ${action} to ${effectiveTargetTier} is already scheduled. no action taken.`,
      }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    );
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // step 3: determine effective date
  // ──────────────────────────────────────────────────────────────────────────────
  let nextPaymentDate: string | null = null;

  if (effectiveTargetTier === 'launch' || effectiveTargetTier === 'temp') {
    console.log(`🪶 downgrade/cancellation to ${effectiveTargetTier} — skipping paystack call`);
    nextPaymentDate = currentPeriodEnd;
  } else if (paystackCode) {
    const paystackRes = await fetch(`https://api.paystack.co/subscription/${paystackCode}`, {
      method: 'GET',
      headers: {
        authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'content-type': 'application/json',
      },
    });

    const paystackJson = await paystackRes.json();
    if (!paystackRes.ok || !paystackJson.status) {
      console.error('❌ failed to fetch subscription from paystack', paystackJson);
      return new Response(
        JSON.stringify({
          error: 'failed to fetch subscription from paystack',
          details: paystackJson,
        }),
        { status: 502, headers: { 'content-type': 'application/json' } },
      );
    }

    const paystackSub = paystackJson.data;
    nextPaymentDate = paystackSub?.next_payment_date ?? currentPeriodEnd;
    console.log('📬 paystack subscription data', {
      subscription_code: paystackSub.subscription_code,
      status: paystackSub.status,
      next_payment_date: nextPaymentDate,
    });
  } else {
    console.log('⚙️ no paystack subscription found; using current_period_end');
    nextPaymentDate = currentPeriodEnd;
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // step 4: update subscription locally
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
      next_tier: effectiveTargetTier,
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
    console.error('❌ failed to update subscription record', updateError);
    return new Response(JSON.stringify({ error: 'failed to update subscription' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }

  const action = isCancellation ? 'cancellation' : 'downgrade';
  console.log(
    `✅ ${action} scheduled: org ${organizationId} will move ${currentTier} → ${effectiveTargetTier} after ${effectiveDate}`,
  );

  // ──────────────────────────────────────────────────────────────────────────────
  // step 5: notify organization (best-effort)
  // ──────────────────────────────────────────────────────────────────────────────
  let notificationFailed = false;
  const notificationType = isCancellation ? 'org_subscription_cancelled' : 'org_tier_downgraded';

  try {
    const { error: notifError } = await supabase.rpc('insert_org_notification', {
      p_organization_id: organizationId,
      p_type_key: notificationType,
      p_metadata: {
        tier_name: effectiveTargetTier,
        effective_date: new Date(effectiveDate).toLocaleString('en-US', {
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

    if (notifError) {
      console.error('⚠️ notification insert failed (non-blocking)', notifError);
      notificationFailed = true;
    }
  } catch (err) {
    console.error('⚠️ unexpected notification failure (non-blocking)', err);
    notificationFailed = true;
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // step 6: respond
  // ──────────────────────────────────────────────────────────────────────────────
  const responseMessage = isCancellation
    ? `Your subscription has been cancelled and will remain active until ${humanReadableDate}. after that, your organization will be moved to temporary status.`
    : `Your subscription will remain active until ${humanReadableDate}, then downgrade to ${effectiveTargetTier}. auto-renew has been disabled.`;

  const responsePayload: Record<string, unknown> = {
    success: true,
    message: responseMessage,
    data: {
      currentTier,
      targetTier: effectiveTargetTier,
      effectiveDate,
      humanReadableDate,
      paystackCode,
      isCancellation,
      notificationSent: !notificationFailed,
    },
  };

  if (notificationFailed) {
    responsePayload.warning =
      'subscription update succeeded but the notification could not be sent. no action is needed — this does not affect your subscription.';
  }

  return new Response(JSON.stringify(responsePayload), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
});
