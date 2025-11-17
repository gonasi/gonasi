// ------------------------------------------------------------
// org-subscriptions-downgrade-trigger.ts
// Executes scheduled organization downgrades 1 hour BEFORE period ends.
// Updated to handle 'temp' and 'launch' free tiers with one-launch-org limit.
// ------------------------------------------------------------

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const FRONTEND_URL = Deno.env.get('FRONTEND_URL');

console.log('[org-subscriptions-downgrade-trigger] Function started');

interface DowngradeRecord {
  organization_id: string;
  tier: string;
  next_tier: string;
  next_plan_code: string | null;
  paystack_subscription_code: string | null;
  downgrade_effective_at: string;
  cancel_at_period_end: boolean;
}

interface DowngradeResult {
  organization_id: string;
  success: boolean;
  error?: string;
  disabled_old?: boolean;
  created_new?: boolean;
  adjusted_tier?: string; // Track if tier was adjusted due to launch limit
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!PAYSTACK_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !FRONTEND_URL) {
    console.error('❌ Missing environment variables');
    return new Response(JSON.stringify({ error: 'Missing environment configuration' }), {
      status: 500,
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const now = new Date();

  // Execute downgrades 40 mins BEFORE expiry (to prevent auto-renewal)
  // Also catch anything that's already past expiry (up to 30 mins late)
  const fortyMinutesFromNow = new Date(now.getTime() + 40 * 60 * 1000).toISOString();

  const thirtyMinsAgo = new Date(now.getTime() - 30 * 60 * 1000).toISOString();

  console.log(`🕐 Looking for downgrades between ${thirtyMinsAgo} and ${fortyMinutesFromNow}`);

  // Find subscriptions whose downgrade should happen now
  const { data: dueDowngrades, error: fetchError } = await supabase
    .from('organization_subscriptions')
    .select(
      'organization_id, tier, next_tier, next_plan_code, paystack_subscription_code, downgrade_effective_at, cancel_at_period_end',
    )
    .eq('cancel_at_period_end', true)
    .not('next_tier', 'is', null)
    .lte('downgrade_effective_at', fortyMinutesFromNow)
    .gte('downgrade_effective_at', thirtyMinsAgo)
    .is('downgrade_executed_at', null);

  if (fetchError) {
    console.error('❌ Failed to fetch due downgrades', fetchError);
    return new Response(JSON.stringify({ error: 'Failed to fetch due downgrades' }), {
      status: 500,
    });
  }

  if (!dueDowngrades?.length) {
    console.log('✅ No downgrades due at this time');
    return new Response(JSON.stringify({ message: 'No downgrades due' }), { status: 200 });
  }

  console.log(`⚡ Processing ${dueDowngrades.length} due downgrades`);

  const results: DowngradeResult[] = [];

  for (const sub of dueDowngrades as DowngradeRecord[]) {
    const result = await processDowngrade(sub, supabase);
    results.push(result);
  }

  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  console.log(`✅ Downgrade batch complete: ${successful} succeeded, ${failed} failed`);

  return new Response(
    JSON.stringify({
      success: true,
      message: `Processed ${dueDowngrades.length} scheduled downgrades.`,
      details: { successful, failed, results },
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
});

async function processDowngrade(sub: DowngradeRecord, supabase: any): Promise<DowngradeResult> {
  const {
    organization_id,
    tier: currentTier,
    next_tier,
    next_plan_code,
    paystack_subscription_code,
    downgrade_effective_at,
  } = sub;

  const result: DowngradeResult = {
    organization_id,
    success: false,
    disabled_old: false,
    created_new: false,
  };

  try {
    const timeUntilExpiry = new Date(downgrade_effective_at).getTime() - Date.now();
    const minutesUntilExpiry = Math.round(timeUntilExpiry / 60000);

    console.log(
      `➡️ Processing downgrade for org ${organization_id}: ${currentTier} → ${next_tier} (expires in ${minutesUntilExpiry} mins)`,
    );

    // ──────────────────────────────────────────────────────────────────────────
    // STEP 0: Validate and adjust target tier if needed
    // ──────────────────────────────────────────────────────────────────────────
    let finalTargetTier = next_tier;
    let finalPlanCode = next_plan_code;

    // If downgrading to 'launch', check if user already has a launch org
    if (next_tier === 'launch') {
      const hasLaunchOrg = await checkUserHasLaunchOrg(supabase, organization_id);

      if (hasLaunchOrg) {
        console.log(
          `⚠️ User already has a launch tier org, adjusting downgrade to 'temp' for ${organization_id}`,
        );
        finalTargetTier = 'temp';
        finalPlanCode = null; // temp is free, no plan code needed
        result.adjusted_tier = 'temp';

        // Notify about adjustment
        await supabase.rpc('insert_org_notification', {
          p_organization_id: organization_id,
          p_type_key: 'org_tier_adjusted',
          p_metadata: {
            requested_tier: 'launch',
            actual_tier: 'temp',
            reason: 'launch_limit_reached',
            effective_date: downgrade_effective_at,
          },
          p_link: `${FRONTEND_URL}/${organization_id}/dashboard/subscriptions`,
          p_performed_by: null,
        });
      }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // STEP 1: Check current Paystack subscription status
    // ──────────────────────────────────────────────────────────────────────────
    let shouldDisable = false;
    let paystackStatus = null;
    let nextPaymentDate = null;
    let emailToken = null;

    if (paystack_subscription_code) {
      const statusRes = await fetch(
        `https://api.paystack.co/subscription/${paystack_subscription_code}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (statusRes.ok) {
        const statusData = await statusRes.json();
        paystackStatus = statusData.data?.status;
        nextPaymentDate = statusData.data?.next_payment_date;
        emailToken = statusData?.data.email_token;

        console.log(`📊 Paystack status for ${organization_id}:`, {
          status: paystackStatus,
          next_payment_date: nextPaymentDate,
        });

        // Only disable if still active or attention
        shouldDisable = ['active', 'attention'].includes(paystackStatus);

        // Safety check: if Paystack thinks renewal is >2 hours away, don't process yet
        if (nextPaymentDate) {
          const paymentTime = new Date(nextPaymentDate).getTime();
          const nowTime = Date.now();
          const hoursUntilPayment = (paymentTime - nowTime) / (60 * 60 * 1000);

          if (hoursUntilPayment > 2) {
            console.log(
              `⏸️ Skipping ${organization_id}: Paystack renewal is ${hoursUntilPayment.toFixed(1)}h away, too early`,
            );
            return { ...result, success: true, error: 'too_early' };
          }
        }
      } else {
        console.warn(`⚠️ Could not fetch Paystack status for ${organization_id}`);
        shouldDisable = true;
      }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // STEP 2: Disable old Paystack subscription (prevent auto-renewal)
    // ──────────────────────────────────────────────────────────────────────────
    const isFreeTarget = ['launch', 'temp'].includes(finalTargetTier);

    if (paystack_subscription_code && shouldDisable) {
      console.log(
        `🛑 Disabling old subscription for ${organization_id} (moving to ${finalTargetTier})`,
      );

      const disableRes = await fetch('https://api.paystack.co/subscription/disable', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: paystack_subscription_code,
          token: emailToken,
        }),
      });

      const disableData = await disableRes.json();

      if (!disableRes.ok || !disableData.status) {
        // For free tier downgrades, log error but don't fail
        if (isFreeTarget) {
          console.error(
            `⚠️ Failed to disable Paystack subscription for free tier downgrade:`,
            disableData,
          );
          console.log(`⚠️ Continuing with downgrade to free tier despite Paystack error`);
          result.disabled_old = false;
        } else {
          // For paid tier downgrades, this is critical
          throw new Error(
            `Failed to disable Paystack subscription: ${JSON.stringify(disableData)}`,
          );
        }
      } else {
        console.log(`✅ Disabled old subscription for ${organization_id}`);
        result.disabled_old = true;
      }
    } else if (!paystack_subscription_code) {
      console.log(`⏭️ No Paystack subscription to disable for ${organization_id}`);
      result.disabled_old = false;
    } else {
      console.log(`⏭️ Skipping disable for ${organization_id} (status: ${paystackStatus})`);
      result.disabled_old = false;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // STEP 3: Create new subscription for downgraded plan (ONLY if paid tier)
    // ──────────────────────────────────────────────────────────────────────────
    let newSubCode: string | null = null;
    let newSubNextPayment: string | null = null;

    if (isFreeTarget) {
      // Free tier (temp or launch) - no subscription needed
      console.log(
        `🆓 Downgrading ${organization_id} to free tier (${finalTargetTier}), no new subscription needed`,
      );
      result.created_new = false;
    } else if (finalPlanCode) {
      // Paid tier - create new subscription
      console.log(`🔄 Creating new subscription for ${organization_id} on plan ${finalPlanCode}`);

      const createSubRes = await fetch('https://api.paystack.co/subscription', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer: `${organization_id}@gonasi.com`,
          plan: finalPlanCode,
          start_date: nextPaymentDate,
        }),
      });

      const newSubData = await createSubRes.json();

      if (!createSubRes.ok || !newSubData.status) {
        // CRITICAL: We disabled old sub but can't create new one
        if (result.disabled_old && paystack_subscription_code) {
          console.error(`❌ New subscription creation failed, attempting rollback...`);
          await attemptRollback(paystack_subscription_code, organization_id);
        }
        throw new Error(`Failed to create new subscription: ${JSON.stringify(newSubData)}`);
      }

      newSubCode = newSubData.data?.subscription_code;
      newSubNextPayment = newSubData.data?.next_payment_date;

      console.log(`✅ Created new subscription for ${organization_id}:`, {
        code: newSubCode,
        next_payment: newSubNextPayment,
      });

      result.created_new = true;
    } else {
      // Edge case: finalPlanCode is missing for non-free tier
      console.error(`❌ Missing next_plan_code for paid tier ${finalTargetTier}`);
      throw new Error(`Missing plan code for paid tier downgrade to ${finalTargetTier}`);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // STEP 4: Update Supabase (only after Paystack operations succeed)
    // ──────────────────────────────────────────────────────────────────────────
    const nowIso = new Date().toISOString();

    const updatePayload: any = {
      tier: finalTargetTier,
      paystack_subscription_code: newSubCode,
      next_tier: null,
      next_plan_code: null,
      cancel_at_period_end: false,
      downgrade_effective_at: null,
      downgrade_executed_at: nowIso,
      status: 'active',
      updated_at: nowIso,
    };

    // Update period tracking for new subscription
    if (newSubCode && newSubNextPayment) {
      updatePayload.current_period_start = nowIso;
      updatePayload.current_period_end = newSubNextPayment;
    } else if (isFreeTarget) {
      // Free tiers have no period end
      updatePayload.current_period_start = nowIso;
      updatePayload.current_period_end = null;
    }

    // Store original tier for audit trail
    updatePayload.revert_tier = currentTier;

    const { error: updateError } = await supabase
      .from('organization_subscriptions')
      .update(updatePayload)
      .eq('organization_id', organization_id);

    if (updateError) {
      // CRITICAL: Paystack updated but DB failed
      console.error(`❌ CRITICAL: DB update failed for ${organization_id}`, updateError);
      await logFailedDowngrade(supabase, organization_id, 'db_update_failed', {
        error: updateError.message || String(updateError),
        new_subscription_code: newSubCode,
        old_subscription_code: paystack_subscription_code,
        disabled_old: result.disabled_old,
        created_new: result.created_new,
        target_tier: finalTargetTier,
        current_tier: currentTier,
        update_payload: updatePayload,
        critical_note: 'Paystack and database are OUT OF SYNC. Manual reconciliation required.',
      });
      throw updateError;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // STEP 5: Notify Organization
    // ──────────────────────────────────────────────────────────────────────────
    const effectiveDate = downgrade_effective_at || nowIso;

    const notificationMetadata: any = {
      tier_name: finalTargetTier,
      effective_date: effectiveDate,
      previous_tier: currentTier,
      new_subscription_code: newSubCode,
    };

    // Add adjustment info if tier was changed
    if (result.adjusted_tier) {
      notificationMetadata.tier_adjusted = true;
      notificationMetadata.requested_tier = next_tier;
      notificationMetadata.adjustment_reason = 'launch_limit_reached';
    }

    const { error: notifError } = await supabase.rpc('insert_org_notification', {
      p_organization_id: organization_id,
      p_type_key: 'org_tier_downgrade_activated',
      p_metadata: notificationMetadata,
      p_link: `${FRONTEND_URL}/${organization_id}/dashboard/subscriptions`,
      p_performed_by: null,
    });

    if (notifError) {
      console.error(`⚠️ Failed to send notification for ${organization_id}:`, notifError);
    }

    console.log(
      `✅ Downgrade complete for ${organization_id}: ${currentTier} → ${finalTargetTier}`,
    );
    result.success = true;
    return result;
  } catch (err) {
    console.error(`❌ Error downgrading org ${organization_id}`, err);
    result.error = err instanceof Error ? err.message : String(err);

    // Determine specific failure type
    let failureType = 'processing_error';
    if (result.error.includes('disable')) {
      failureType = 'paystack_disable_failed';
    } else if (result.error.includes('create new subscription')) {
      failureType = 'paystack_create_failed';
    } else if (result.error.includes('rollback')) {
      failureType = 'rollback_failed';
    } else if (result.error.includes('DB update')) {
      failureType = 'db_update_failed';
    }

    await logFailedDowngrade(supabase, organization_id, failureType, {
      error: result.error,
      disabled_old: result.disabled_old,
      created_new: result.created_new,
      attempted_at: new Date().toISOString(),
      target_tier: next_tier,
      current_tier: currentTier,
      old_subscription_code: paystack_subscription_code,
      downgrade_effective_at,
      stack_trace: err instanceof Error ? err.stack : undefined,
    });

    return result;
  }
}

/**
 * Check if the user who owns this organization already has another org on 'launch' tier
 */
async function checkUserHasLaunchOrg(supabase: any, organization_id: string): Promise<boolean> {
  try {
    // Get the owner of the current organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('owned_by')
      .eq('id', organization_id)
      .single();

    if (orgError || !org?.owned_by) {
      console.warn(`⚠️ Could not find owner for org ${organization_id}`);
      return false; // Fail open - allow downgrade to launch if we can't determine
    }

    const userId = org.owned_by;

    // Check if this user owns any OTHER organizations with 'launch' tier
    const { data: launchOrgs, error: launchError } = await supabase
      .from('organizations')
      .select('id, organization_subscriptions!inner(tier)')
      .eq('owned_by', userId)
      .eq('organization_subscriptions.tier', 'launch')
      .neq('id', organization_id); // Exclude current org

    if (launchError) {
      console.error(`❌ Error checking for launch orgs:`, launchError);
      return false; // Fail open
    }

    const hasLaunchOrg = launchOrgs && launchOrgs.length > 0;

    if (hasLaunchOrg) {
      console.log(`👤 User ${userId} already has ${launchOrgs.length} launch tier org(s)`);
    }

    return hasLaunchOrg;
  } catch (err) {
    console.error(`❌ Error in checkUserHasLaunchOrg:`, err);
    return false; // Fail open
  }
}

async function attemptRollback(subscription_code: string, organization_id: string): Promise<void> {
  try {
    console.log(`🔄 Attempting to re-enable subscription for ${organization_id}`);

    const rollbackRes = await fetch('https://api.paystack.co/subscription/enable', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: subscription_code,
        token: `${organization_id}@gonasi.com`,
      }),
    });

    const rollbackData = await rollbackRes.json();

    if (rollbackRes.ok && rollbackData.status) {
      console.log(`✅ Successfully rolled back subscription for ${organization_id}`);
    } else {
      console.error(`❌ Rollback failed for ${organization_id}:`, rollbackData);
    }
  } catch (err) {
    console.error(`❌ Rollback attempt threw error for ${organization_id}:`, err);
  }
}

async function logFailedDowngrade(
  supabase: any,
  organization_id: string,
  failure_type: string,
  metadata: any,
): Promise<void> {
  try {
    let severity = 'medium';
    if (failure_type === 'db_update_failed') {
      severity = 'critical';
    } else if (failure_type === 'paystack_create_failed') {
      severity = 'high';
    } else if (failure_type === 'rollback_failed') {
      severity = 'critical';
    }

    const { error } = await supabase.rpc('log_failed_downgrade', {
      p_organization_id: organization_id,
      p_failure_type: failure_type,
      p_metadata: metadata,
      p_severity: severity,
    });

    if (error) {
      console.error(`❌ Could not log failed downgrade for ${organization_id}:`, error);
    }
  } catch (err) {
    console.error(`❌ Could not log failed downgrade for ${organization_id}:`, err);
  }
}
