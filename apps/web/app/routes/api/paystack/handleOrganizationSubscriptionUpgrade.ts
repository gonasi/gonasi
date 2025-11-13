// ────────────────────────────────────────────────────────────────────────────────
// ORGANIZATION SUBSCRIPTION UPGRADE HANDLER (Paystack-compliant disable)
// ────────────────────────────────────────────────────────────────────────────────
import type { TypedSupabaseClient } from '@gonasi/database/client';
import type { Database } from '@gonasi/database/schema';

import { refundSubscriptionUpgrade } from './refundSubscriptionUpgrade';

import { getServerEnv } from '~/.server/env.server';

const { PAYSTACK_SECRET_KEY, BASE_URL } = getServerEnv();

// ────────────────────────────────────────────────
// Helper: Fetch Paystack subscription details
// ────────────────────────────────────────────────
async function fetchPaystackSubscription(subscriptionCode: string) {
  const res = await fetch(`https://api.paystack.co/subscription/${subscriptionCode}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await res.json();
  if (!res.ok || !data.status) {
    throw new Error(`Failed to fetch Paystack subscription: ${data.message}`);
  }

  return data.data;
}

// ────────────────────────────────────────────────
// Helper: Disable Paystack subscription
// ────────────────────────────────────────────────
async function disablePaystackSubscription(subscriptionCode: string, emailToken: string) {
  const res = await fetch('https://api.paystack.co/subscription/disable', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      code: subscriptionCode,
      token: emailToken,
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.status) {
    throw new Error(`Failed to disable subscription: ${data.message}`);
  }

  console.log('✅ Subscription disabled:', subscriptionCode);
}

// ────────────────────────────────────────────────
// Main Handler
// ────────────────────────────────────────────────
export async function handleOrganizationSubscriptionUpgrade(
  supabaseAdmin: TypedSupabaseClient,
  tx: any,
  metadata: any,
  clientIp: string | null,
  startTime: number,
) {
  console.log('⬆️ Processing subscription upgrade payment:', tx.reference);
  console.log('  ↳ Metadata:', JSON.stringify(metadata, null, 2));

  // ① VALIDATE METADATA
  const {
    organization_id: organizationId,
    current_plan_tier: currentTier,
    target_plan_tier: targetTier,
    organization_email: organizationEmail,
  } = metadata;

  if (!organizationId || !currentTier || !targetTier || !organizationEmail) {
    return new Response('Missing required metadata', { status: 400 });
  }

  console.log(`🏢 Organization: ${organizationId}`);
  console.log(`🎯 Upgrading from tier: ${currentTier} → ${targetTier}`);

  // ② NORMALIZE PAYMENT AMOUNTS
  const rawAmount = Number(tx.amount);
  const rawFees = Number(tx.fees ?? 0);

  if (Number.isNaN(rawAmount)) {
    console.error('❌ Invalid amount from Paystack:', tx.amount);
    return new Response('Invalid amount', { status: 400 });
  }

  const amountPaid = Number((rawAmount / 100).toFixed(4));
  const paystackFee = Number((rawFees / 100).toFixed(4));
  const netRevenue = Number((amountPaid - paystackFee).toFixed(4));
  const currency = String(
    tx.currency ?? 'USD',
  ).toUpperCase() as Database['public']['Enums']['currency_code'];

  console.log(`💵 Prorated Charge: ${amountPaid} ${currency}`);
  console.log(`💸 Paystack Fee: ${paystackFee} ${currency}`);
  console.log(`💰 Net Revenue: ${netRevenue} ${currency}`);

  // ③ RECORD PAYMENT IN WALLET LEDGER
  const paymentMetadata = {
    webhook_received_at: new Date().toISOString(),
    webhook_event: 'charge.success',
    transaction_type: 'organization_subscription_upgrade',
    paystack_transaction_id: String(tx.id),
    previous_tier: currentTier,
    new_tier: targetTier,
    clientIp,
    is_prorated_charge: true,
    raw_paystack_payload: tx,
  };

  const { error: paymentError } = await supabaseAdmin.rpc('process_subscription_upgrade_payment', {
    p_payment_reference: String(tx.reference),
    p_organization_id: organizationId,
    p_amount_paid: amountPaid,
    p_currency_code: currency,
    p_paystack_fee: paystackFee,
    p_metadata: paymentMetadata,
  });

  if (paymentError) console.warn('⚠️ Failed to record payment, continuing upgrade:', paymentError);

  // ④ FETCH TARGET TIER PLAN CODE
  const { data: targetTierData, error: tierError } = await supabaseAdmin
    .from('tier_limits')
    .select('paystack_plan_code')
    .eq('tier', targetTier)
    .single();

  if (tierError || !targetTierData?.paystack_plan_code) {
    console.error('❌ Failed to fetch target tier plan code:', tierError);
    return new Response('Invalid target tier', { status: 400 });
  }

  const newPlanCode = targetTierData.paystack_plan_code;
  console.log(`📋 New Paystack Plan Code: ${newPlanCode}`);

  // ⑤ FETCH CURRENT SUBSCRIPTION
  let authorizationToken: string | undefined;

  try {
    const { data: currentSubData } = await supabaseAdmin
      .from('organization_subscriptions')
      .select('paystack_subscription_code, paystack_customer_code')
      .eq('organization_id', organizationId)
      .eq('tier', currentTier)
      .single();

    if (currentSubData?.paystack_subscription_code) {
      const currentSub = await fetchPaystackSubscription(currentSubData.paystack_subscription_code);
      authorizationToken = currentSub.authorization?.authorization_code ?? currentSub.email_token;

      // Disable the old subscription properly
      await disablePaystackSubscription(
        currentSubData.paystack_subscription_code,
        currentSub.email_token,
      );
    } else {
      console.warn('⚠️ No current subscription found to disable.');
    }
  } catch (err) {
    console.error('❌ Failed to fetch or disable current subscription:', err);
    await refundSubscriptionUpgrade(
      supabaseAdmin,
      organizationId,
      tx.reference,
      'disable_current_subscription_failed',
      `Failed to disable current subscription: ${String(err)}`,
    );
    return new Response(
      JSON.stringify({
        error: 'Failed to disable current subscription - refund initiated',
        refund_status: 'pending',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // ⑥ CREATE NEW PAYSTACK SUBSCRIPTION
  let paystackSubscriptionCode: string | null = null;

  try {
    const createBody: Record<string, any> = {
      customer: tx.customer.customer_code,
      plan: newPlanCode,
    };
    if (authorizationToken) createBody.authorization = authorizationToken;

    const createRes = await fetch('https://api.paystack.co/subscription', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(createBody),
    });

    const createData = await createRes.json();
    if (!createRes.ok || !createData.status) {
      console.error('❌ Paystack subscription creation failed:', createData);
      await refundSubscriptionUpgrade(
        supabaseAdmin,
        organizationId,
        tx.reference,
        'subscription_creation_failed',
        `Failed to create Paystack subscription: ${createData.message}`,
      );
      return new Response(
        JSON.stringify({
          error: 'Subscription creation failed - refund initiated',
          refund_status: 'pending',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }

    paystackSubscriptionCode = createData.data.subscription_code;
    console.log('✅ Paystack subscription created:', paystackSubscriptionCode);
  } catch (err) {
    console.error('❌ Exception during subscription creation:', err);
    await refundSubscriptionUpgrade(
      supabaseAdmin,
      organizationId,
      tx.reference,
      'subscription_creation_failed',
      `Exception during subscription creation: ${String(err)}`,
    );
    return new Response(
      JSON.stringify({
        error: 'Subscription creation error - refund initiated',
        refund_status: 'pending',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // ⑦ UPDATE LOCAL SUBSCRIPTION TIER (Direct Supabase Update + Clear Downgrade Fields)
  const now = new Date().toISOString();

  const { error: subError } = await supabaseAdmin
    .from('organization_subscriptions')
    .update({
      tier: targetTier,
      paystack_subscription_code: paystackSubscriptionCode,
      updated_at: now,
      updated_by: organizationId, // or use tx.customer.email if you track user actions
      cancel_at_period_end: false,
      downgrade_requested_at: null,
      downgrade_effective_at: null,
      downgrade_requested_by: null,
      next_tier: null,
      next_plan_code: null,
      next_payment_date: null,
      status: 'active',
    })
    .eq('organization_id', organizationId);

  if (subError) {
    console.error('❌ Failed to update local subscription:', subError);

    if (paystackSubscriptionCode) {
      try {
        await disablePaystackSubscription(paystackSubscriptionCode, organizationEmail);
      } catch (disableErr) {
        console.error(
          '❌ Failed to disable new subscription after local update failure:',
          disableErr,
        );
      }
    }

    await refundSubscriptionUpgrade(
      supabaseAdmin,
      organizationId,
      tx.reference,
      'tier_update_failed',
      `Failed to update local subscription tier: ${subError.message}`,
    );

    return new Response(
      JSON.stringify({
        error: 'Failed to update subscription tier - refund initiated',
        refund_status: 'pending',
        details: subError,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // ⑧ SUCCESS RESPONSE & NOTIFICATION
  await supabaseAdmin.rpc('insert_org_notification', {
    p_organization_id: organizationId,
    p_type_key: 'org_tier_upgraded',
    p_metadata: { tier_name: targetTier },
    p_link: `${BASE_URL}/${organizationId}/dashboard/subscriptions`,
  });

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Subscription upgraded successfully',
      organization_id: organizationId,
      previous_tier: currentTier,
      new_tier: targetTier,
      prorated_charge: amountPaid,
      net_platform_revenue: netRevenue,
      payment_reference: tx.reference,
      processing_time_ms: Date.now() - startTime,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
}
