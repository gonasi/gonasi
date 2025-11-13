// ────────────────────────────────────────────────────────────────────────────────
// org-subscriptions-reactivation.ts
// ------------------------------------------------------------------------------
// Reactivates an organization's subscription.
// - Can cancel a scheduled downgrade, restoring current subscription.
// - Full reactivation (e.g., creating new Paystack subscription) is a TODO.
// ────────────────────────────────────────────────────────────────────────────────

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

console.log('🚀 [org-subscriptions-reactivation] Function started');

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
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !FRONTEND_URL) {
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

  const parsed = ReactivationRequest.safeParse(body);
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

  const { organizationId, targetTier, currentTier, userId, cancelScheduledDowngrade } = parsed.data;
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  console.log('🔁 Reactivation request', { organizationId, targetTier, cancelScheduledDowngrade });

  // ──────────────────────────────────────────────────────────────────────────────
  // STEP 1: Cancel Scheduled Downgrade
  // ──────────────────────────────────────────────────────────────────────────────
  if (cancelScheduledDowngrade) {
    const { error: updateError } = await supabase
      .from('organization_subscriptions')
      .update({
        next_tier: null,
        downgrade_requested_at: null,
        downgrade_effective_at: null,
        downgrade_executed_at: null,
        cancel_at_period_end: false,
        status: 'active',
        updated_at: new Date().toISOString(),
        updated_by: userId,
      })
      .eq('organization_id', organizationId)
      .select();

    // Send notification
    await supabase.rpc('insert_org_notification', {
      p_organization_id: organizationId,
      p_type_key: 'org_downgrade_cancelled',
      p_metadata: {
        tier_name: targetTier,
        current_tier_name: currentTier,
      },
      p_link: `${FRONTEND_URL}/${organizationId}/dashboard/subscriptions`,
      p_performed_by: userId,
    });

    if (updateError) {
      console.error('❌ Failed to cancel scheduled downgrade', updateError);
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Failed to cancel scheduled downgrade. Please try again.',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }

    console.log(`✅ Scheduled downgrade cancelled for org ${organizationId}`);
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Scheduled downgrade cancelled and subscription reactivated.',
        changeType: 'reactivation',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // TODO: Full reactivation (creating new subscription if needed)
  // ──────────────────────────────────────────────────────────────────────────────
  console.warn('⚠️ Full reactivation flow not yet implemented');
  return new Response(
    JSON.stringify({
      success: false,
      message: 'Full reactivation flow not yet implemented.',
    }),
    { status: 501, headers: { 'Content-Type': 'application/json' } },
  );
});
