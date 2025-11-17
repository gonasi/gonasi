// ────────────────────────────────────────────────────────────────────────────────
// org-subscriptions-reactivation.ts
// ------------------------------------------------------------------------------
// Reactivates an organization's subscription.
// - Can cancel a scheduled downgrade, restoring current subscription.
// - Full reactivation (e.g., creating new Paystack subscription) is a TODO.
// Notifications are best-effort: failures do NOT block success.
// ────────────────────────────────────────────────────────────────────────────────

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

console.log('🚀 [org-subscriptions-reactivation] function started');

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const FRONTEND_URL = Deno.env.get('FRONTEND_URL');

// ────────────────────────────────────────────────────────────────────────────────
// Validation Schema
// ────────────────────────────────────────────────────────────────────────────────
const ReactivationRequest = z.object({
  organizationId: z.string().uuid(),
  targetTier: z.string(),
  currentTier: z.string(),
  userId: z.string().uuid(),
  cancelScheduledDowngrade: z.boolean().optional().default(false),
});

// ────────────────────────────────────────────────────────────────────────────────
// Edge Function Entry Point
// ────────────────────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method not allowed' }), {
      status: 405,
      headers: { 'content-type': 'application/json' },
    });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !FRONTEND_URL) {
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

  const parsed = ReactivationRequest.safeParse(body);
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

  const { organizationId, targetTier, currentTier, userId, cancelScheduledDowngrade } = parsed.data;
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  console.log('🔁 reactivation request', { organizationId, targetTier, cancelScheduledDowngrade });

  // ──────────────────────────────────────────────────────────────────────────────
  // STEP 1: Cancel Scheduled Downgrade
  // ──────────────────────────────────────────────────────────────────────────────
  if (cancelScheduledDowngrade) {
    const nowIso = new Date().toISOString();

    const { error: updateError } = await supabase
      .from('organization_subscriptions')
      .update({
        next_tier: null,
        downgrade_requested_at: null,
        downgrade_effective_at: null,
        downgrade_executed_at: null,
        cancel_at_period_end: false,
        status: 'active',
        updated_at: nowIso,
        updated_by: userId,
      })
      .eq('organization_id', organizationId)
      .select();

    // ──────────────────────────────────────────────────────────────
    // Send notification (best-effort)
    // ──────────────────────────────────────────────────────────────
    let notificationFailed = false;
    try {
      const { error: notifError } = await supabase.rpc('insert_org_notification', {
        p_organization_id: organizationId,
        p_type_key: 'org_downgrade_cancelled',
        p_metadata: {
          tier_name: targetTier,
          current_tier_name: currentTier,
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

    if (updateError) {
      console.error('❌ failed to cancel scheduled downgrade', updateError);
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Failed to cancel scheduled downgrade. Please try again.',
        }),
        { status: 500, headers: { 'content-type': 'application/json' } },
      );
    }

    console.log(`✅ scheduled downgrade cancelled for org ${organizationId}`);

    const responsePayload: Record<string, unknown> = {
      success: true,
      message: 'Scheduled downgrade cancelled and subscription reactivated.',
      changeType: 'reactivation',
      notificationSent: !notificationFailed,
    };

    if (notificationFailed) {
      responsePayload.warning =
        'subscription update succeeded but the notification could not be sent. no action is needed — this does not affect your subscription.';
    }

    return new Response(JSON.stringify(responsePayload), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // TODO: Full reactivation (creating new subscription if needed)
  // ──────────────────────────────────────────────────────────────────────────────
  console.warn('⚠️ full reactivation flow not yet implemented');
  return new Response(
    JSON.stringify({
      success: false,
      message: 'Full reactivation flow not yet implemented.',
    }),
    { status: 501, headers: { 'content-type': 'application/json' } },
  );
});
