// ────────────────────────────────────────────────────────────────────────────────
// ORGANIZATION SUBSCRIPTION UPGRADE HANDLER
// ────────────────────────────────────────────────────────────────────────────────
// Handles one-time prorated upgrade payments for organization subscriptions.
//
// Triggered by: Paystack webhook event `charge.success`
// Applies when:  `transaction_type = 'organization_subscription_upgrade'`
//
// Flow:
//  1. User initiates upgrade to a higher tier
//  2. Edge function calculates prorated charge for remaining period
//  3. User completes payment via Paystack
//  4. This webhook handles the successful payment event
//  5. Records payment in wallet ledger
//  6. Creates a new Paystack subscription for the new tier
//  7. Updates the local subscription tier immediately
//
// Notes:
//  - This handler does *not* affect existing organization_subscriptions rows directly;
//    instead, it calls an RPC function to update the tier.
//  - Errors in ledger recording are logged but non-fatal.
// ────────────────────────────────────────────────────────────────────────────────

import type { TypedSupabaseClient } from '@gonasi/database/client';
import type { Database } from '@gonasi/database/schema';

import { refundSubscriptionUpgrade } from './refundSubscriptionUpgrade';

import { getServerEnv } from '~/.server/env.server';

const { PAYSTACK_SECRET_KEY } = getServerEnv();

export async function handleOrganizationSubscriptionUpgrade(
  supabaseAdmin: TypedSupabaseClient,
  tx: any,
  metadata: any,
  clientIp: string | null,
  startTime: number,
) {
  console.log('⬆️ Processing subscription upgrade payment:', tx.reference);
  console.log('  ↳ Metadata:', JSON.stringify(metadata, null, 2));

  // ────────────────────────────────────────────────────────────────────────────────
  // ① VALIDATE METADATA
  // ────────────────────────────────────────────────────────────────────────────────
  const {
    organization_id: organizationId,
    current_plan_tier: currentTier,
    target_plan_tier: targetTier,
    target_plan_code: targetPlanCode,
    organization_email: organizationEmail,
  } = metadata;

  if (!organizationId) return new Response('Missing organizationId', { status: 400 });
  if (!currentTier) return new Response('Missing currentTier', { status: 400 });
  if (!targetTier) return new Response('Missing targetTier', { status: 400 });
  if (!targetPlanCode) return new Response('Missing targetPlanCode', { status: 400 });
  if (!organizationEmail) return new Response('Missing organizationEmail', { status: 400 });

  console.log(`  🏢 Organization: ${organizationId}`);
  console.log(`  🎯 Upgrading to tier: ${targetTier}`);
  console.log(`  targetPlanCode: ${targetPlanCode}`);

  // ────────────────────────────────────────────────────────────────────────────────
  // ② NORMALIZE PAYMENT AMOUNTS
  // ────────────────────────────────────────────────────────────────────────────────
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

  console.log(`  💵 Prorated Charge: ${amountPaid} ${currency}`);
  console.log(`  💸 Paystack Fee: ${paystackFee} ${currency}`);
  console.log(`  💰 Net Revenue: ${netRevenue} ${currency}`);

  // ────────────────────────────────────────────────────────────────────────────────
  // ③ RECORD UPGRADE PAYMENT IN WALLET LEDGER
  // ────────────────────────────────────────────────────────────────────────────────
  const paymentMetadata = {
    webhook_received_at: new Date().toISOString(),
    webhook_event: 'charge.success',
    transaction_type: 'organization_subscription_upgrade',
    paystack_transaction_id: String(tx.id),
    previous_tier: currentTier,
    new_tier: targetTier,
    clientIp,
    is_prorated_charge: true,
    raw_paystack_payload: {
      id: tx.id,
      reference: tx.reference,
      status: tx.status,
      paid_at: tx.paid_at ?? tx.paidAt,
      metadata: tx.metadata ?? null,
    },
  };

  const { data: paymentResult, error: paymentError } = await supabaseAdmin.rpc(
    'process_subscription_upgrade_payment',
    {
      p_payment_reference: String(tx.reference),
      p_organization_id: organizationId,
      p_amount_paid: amountPaid,
      p_currency_code: currency,
      p_paystack_fee: paystackFee,
      p_metadata: paymentMetadata,
    },
  );

  if (paymentError) {
    console.error('❌ Failed to record upgrade payment:', paymentError);
    console.warn('⚠️ Continuing upgrade despite payment recording failure');
  } else {
    console.log('✅ Upgrade payment recorded successfully:', paymentResult);
  }

  // ────────────────────────────────────────────────────────────────────────────────
  // ④ FETCH TARGET TIER PLAN CODE
  // ────────────────────────────────────────────────────────────────────────────────
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
  console.log(`  📋 New Paystack Plan Code: ${newPlanCode}`);

  // ────────────────────────────────────────────────────────────────────────────────
  // ⑤ CREATE NEW PAYSTACK SUBSCRIPTION
  // ────────────────────────────────────────────────────────────────────────────────
  // Replace section ⑤ (CREATE NEW PAYSTACK SUBSCRIPTION)
  console.log('🆕 Creating new Paystack subscription...');

  let paystackSubscriptionCode: string | null = null;

  try {
    const createBody: Record<string, any> = {
      customer: tx.customer.customer_code,
      plan: newPlanCode,
    };

    if (tx.authorization?.authorization_code) {
      createBody.authorization = tx.authorization.authorization_code;
    }

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

      // 🔴 REFUND: Subscription creation failed
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

    // 🔴 REFUND: Exception occurred
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

  // Replace section ⑥ (UPDATE LOCAL SUBSCRIPTION TIER)
  const { data: subscription, error: subError } = await supabaseAdmin.rpc(
    'subscription_update_tier',
    {
      org_id: organizationId,
      new_tier: targetTier,
    },
  );

  if (subError || !subscription) {
    console.error('❌ Failed to update local subscription:', subError);

    // 🔴 REFUND: Local tier update failed
    // Also need to cancel the Paystack subscription we just created
    if (paystackSubscriptionCode) {
      try {
        await fetch(`https://api.paystack.co/subscription/disable`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: paystackSubscriptionCode,
            token: tx.customer.email,
          }),
        });
        console.log('✅ Cancelled Paystack subscription');
      } catch (cancelErr) {
        console.error('❌ Failed to cancel Paystack subscription:', cancelErr);
      }
    }

    await refundSubscriptionUpgrade(
      supabaseAdmin,
      organizationId,
      tx.reference,
      'tier_update_failed',
      `Failed to update local subscription tier: ${subError?.message}`,
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

  // ────────────────────────────────────────────────────────────────────────────────
  // ⑦ SUCCESS RESPONSE
  // ────────────────────────────────────────────────────────────────────────────────
  console.log('⚠️ TODO: Send upgrade confirmation email & analytics event');

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
