// ------------------------------------------------------------
// org-subscriptions-downgrade-trigger.ts
// Executes scheduled organization downgrades when current period ends.
// Should be triggered by a Supabase cron or Paystack webhook.
// ------------------------------------------------------------

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

console.log('[org-subscriptions-downgrade-trigger] Function started');

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!PAYSTACK_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing environment variables');
    return new Response(JSON.stringify({ error: 'Missing environment configuration' }), {
      status: 500,
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const now = new Date();

  // Grace window: 1 hour after expiry to avoid timing overlap
  const graceCutoff = new Date(now.getTime() - 60 * 60 * 1000).toISOString();

  // Find subscriptions whose downgrade date has passed
  const { data: dueDowngrades, error: fetchError } = await supabase
    .from('organization_subscriptions')
    .select(
      'organization_id, tier, next_tier, next_plan_code, paystack_subscription_code, downgrade_effective_at, cancel_at_period_end',
    )
    .eq('cancel_at_period_end', true)
    .not('next_tier', 'is', null)
    .lte('downgrade_effective_at', graceCutoff);

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

  for (const sub of dueDowngrades) {
    const {
      organization_id,
      tier: currentTier,
      next_tier,
      next_plan_code,
      paystack_subscription_code,
    } = sub;

    try {
      console.log(`➡️ Downgrading org ${organization_id} from ${currentTier} → ${next_tier}`);

      // Step 1: Disable old Paystack subscription (stop auto-renew)
      const disableRes = await fetch('https://api.paystack.co/subscription/disable', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: paystack_subscription_code,
          token: `${organization_id}@gonasi.com`, // consistent pattern
        }),
      });

      const disableData = await disableRes.json();
      if (!disableRes.ok || !disableData.status) {
        console.error('❌ Failed to disable Paystack subscription', disableData);
        continue;
      }

      console.log('[Paystack disable success]', disableData);

      // Step 2: Create new subscription for downgraded plan (if paid)
      let newSubData = null;
      if (next_plan_code) {
        const createSubRes = await fetch('https://api.paystack.co/subscription', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customer: `${organization_id}@gonasi.com`,
            plan: next_plan_code,
          }),
        });

        newSubData = await createSubRes.json();
        console.log('[Paystack new subscription]', newSubData);

        if (!createSubRes.ok || !newSubData.status) {
          console.error('❌ Failed to create new Paystack subscription', newSubData);
          continue;
        }
      }

      // Step 3: Update Supabase
      const { error: updateError } = await supabase
        .from('organization_subscriptions')
        .update({
          tier: next_tier,
          paystack_subscription_code: newSubData?.data?.subscription_code || null,
          next_tier: null,
          next_plan_code: null,
          cancel_at_period_end: false,
          downgrade_effective_at: null,
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('organization_id', organization_id);

      if (updateError) throw updateError;

      console.log(`✅ Downgrade complete for ${organization_id}`);
    } catch (err) {
      console.error(`❌ Error downgrading org ${sub.organization_id}`, err);
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: `Processed ${dueDowngrades.length} scheduled downgrades.`,
    }),
    { status: 200 },
  );
});
