// ─────────────────────────────────────────────────────────────────
// ORGANIZATION SUBSCRIPTION WEBHOOK HANDLER
// ─────────────────────────────────────────────────────────────────
// Handles subscription lifecycle events from Paystack:
// - subscription.create
// - invoice.create (3 days before payment)
// - charge.success (recurring payment)
// - invoice.payment_failed
// - invoice.update
// - subscription.not_renew
// - subscription.disable
// ─────────────────────────────────────────────────────────────────

import type { TypedSupabaseClient } from '@gonasi/database/client';

interface PaystackSubscriptionData {
  subscription_code: string;
  status: 'active' | 'non-renewing' | 'attention' | 'completed' | 'cancelled';
  amount: number;
  next_payment_date: string;
  email_token: string;
  cron_expression: string;
  createdAt: string;
  customer: {
    id: number;
    email: string;
    customer_code: string;
  };
  plan: {
    id: number;
    name: string;
    plan_code: string;
    description: string;
    amount: number;
    interval: string;
    currency: string;
  };
}

interface PaystackInvoiceData {
  invoice_code: string;
  subscription: PaystackSubscriptionData;
  amount: number;
  status: 'success' | 'pending' | 'failed';
  paid: boolean;
  paid_at?: string;
  description?: string;
  customer: {
    id: number;
    email: string;
    customer_code: string;
  };
  transaction?: {
    reference: string;
    status: string;
    amount: number;
    currency: string;
  };
  period_start: string;
  period_end: string;
}

// ─────────────────────────────────────────────────────────────────
// MAIN HANDLER: Route subscription events to appropriate handlers
// ─────────────────────────────────────────────────────────────────
export async function handleOrganizationSubscription(
  supabase: TypedSupabaseClient,
  payload: any,
  clientIp: string | null,
  startTime: number,
) {
  const event = payload.event;

  console.log(JSON.stringify(payload, null, 2));

  console.log('🏢 Processing organization subscription event:', event);

  switch (event) {
    case 'subscription.create':
      return await handleSubscriptionCreate(supabase, payload.data, clientIp, startTime);

    case 'invoice.create':
      return await handleInvoiceCreate(supabase, payload.data, clientIp, startTime);

    case 'charge.success':
      // Only handle if it's a subscription charge
      if (payload.data?.metadata?.transaction_type === 'organization_subscription') {
        return await handleSubscriptionPaymentSuccess(supabase, payload.data, clientIp, startTime);
      }
      break;

    case 'invoice.payment_failed':
      return await handleInvoicePaymentFailed(supabase, payload.data, clientIp, startTime);

    case 'invoice.update':
      return await handleInvoiceUpdate(supabase, payload.data, clientIp, startTime);

    case 'subscription.not_renew':
      return await handleSubscriptionNotRenew(supabase, payload.data, clientIp, startTime);

    case 'subscription.disable':
      return await handleSubscriptionDisable(supabase, payload.data, clientIp, startTime);

    default:
      console.log('ℹ️ Unhandled subscription event:', event);
      return new Response(JSON.stringify({ message: 'Event acknowledged', event }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
  }
}

// ─────────────────────────────────────────────────────────────────
// 1. SUBSCRIPTION CREATE
// ─────────────────────────────────────────────────────────────────
async function handleSubscriptionCreate(
  supabase: TypedSupabaseClient,
  data: PaystackSubscriptionData,
  clientIp: string | null,
  startTime: number,
) {
  console.log('📝 Creating new subscription:', data.subscription_code);

  const customerEmail = data.customer.email;
  const organizationId = customerEmail.split('@')[0];

  if (!organizationId || !customerEmail.includes('@gonasi.com')) {
    console.error('❌ Invalid customer email format:', customerEmail);
    return new Response('Invalid customer email format', { status: 400 });
  }

  console.log('🏢 Extracted organization_id:', organizationId);

  // Map Paystack plan → your tier enum
  const planName = data.plan.name.toLowerCase();
  let tier: 'launch' | 'scale' | 'impact' | 'enterprise' = 'launch';
  if (planName.includes('scale')) tier = 'scale';
  else if (planName.includes('impact')) tier = 'impact';
  else if (planName.includes('enterprise')) tier = 'enterprise';

  console.log('📊 Determined tier:', tier);

  // ✅ CALL THE UPDATED FUNCTION
  const { data: subscription, error: subError } = await supabase.rpc(
    'subscription_upsert_webhook',
    {
      org_id: organizationId,
      new_tier: tier,
      new_status: data.status,

      // Paystack timestamps
      start_ts: data.createdAt,
      period_start: data.createdAt,
      period_end: data.next_payment_date,

      cancel_at_period_end: false,

      // ✅ SEND THE PAYSTACK NEXT PAYMENT DATE
      initial_next_payment_date: data.next_payment_date,
    },
  );

  if (subError) {
    console.error('❌ Error creating subscription via RPC:', subError);
    return new Response(
      JSON.stringify({
        error: 'Failed to create subscription',
        details: subError,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  console.log('✅ Subscription created:', subscription.id);

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Subscription created',
      subscription_id: subscription.id,
      processing_time_ms: Date.now() - startTime,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
}

// ─────────────────────────────────────────────────────────────────
// 2. INVOICE CREATE (3 days before payment)
// ─────────────────────────────────────────────────────────────────
async function handleInvoiceCreate(
  supabase: TypedSupabaseClient,
  data: PaystackInvoiceData,
  clientIp: string | null,
  startTime: number,
) {
  console.log('📄 Invoice created (upcoming payment):', data.invoice_code);

  // This is a notification that payment will be attempted
  // You can use this to:
  // - Send reminder emails to organization admins
  // - Check if payment method is still valid
  // - Prepare for potential payment issues

  // For now, just log and acknowledge
  console.log('  Next payment date:', data.subscription.next_payment_date);
  console.log('  Amount:', data.amount / 100);

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Invoice notification received',
      invoice_code: data.invoice_code,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
}

// ─────────────────────────────────────────────────────────────────
// 3. SUBSCRIPTION PAYMENT SUCCESS (charge.success for recurring)
// ─────────────────────────────────────────────────────────────────
// BUSINESS LOGIC: Organizations are CUSTOMERS paying for platform access
// - Platform receives net revenue (gross payment - Paystack fee)
// - No revenue distribution to organizations
// ─────────────────────────────────────────────────────────────────
async function handleSubscriptionPaymentSuccess(
  supabase: TypedSupabaseClient,
  tx: any,
  clientIp: string | null,
  startTime: number,
) {
  console.log('💰 Processing subscription payment:', tx.reference);

  const metadata = tx.metadata ?? {};
  const organizationId = metadata.organizationId;

  if (!organizationId) {
    console.error('❌ Missing organizationId in payment metadata');
    return new Response('Missing organizationId', { status: 400 });
  }

  // Normalize amounts
  const rawAmount = typeof tx.amount === 'number' ? tx.amount : parseFloat(String(tx.amount));
  const rawFees = typeof tx.fees === 'number' ? tx.fees : parseFloat(String(tx.fees ?? 0));

  const amountPaid = Number((rawAmount / 100).toFixed(4));
  const paystackFee = Number((rawFees / 100).toFixed(4));
  const netRevenue = Number((amountPaid - paystackFee).toFixed(4));
  const currency = (tx.currency ?? 'KES').toString().toUpperCase();

  console.log(`  💵 Gross: ${amountPaid} ${currency}, Fee: ${paystackFee}, Net: ${netRevenue}`);

  const subscriptionCode =
    tx.plan?.plan_code || tx.subscription?.subscription_code || tx.subscription_code || null;

  const paymentMetadata = {
    webhook_received_at: new Date().toISOString(),
    webhook_event: 'charge.success',
    paystack_transaction_id: String(tx.id),
    subscription_code: subscriptionCode,
    tier: metadata.targetTier || null,
    clientIp,
    raw_paystack_payload: {
      id: tx.id,
      reference: tx.reference,
      status: tx.status,
      paid_at: tx.paid_at ?? tx.paidAt,
      plan: tx.plan,
      metadata: tx.metadata ?? null,
    },
  };

  const { data: result, error: rpcError } = await supabase.rpc('process_subscription_payment', {
    p_payment_reference: String(tx.reference),
    p_organization_id: organizationId,
    p_amount_paid: amountPaid,
    p_currency_code: currency,
    p_paystack_fee: paystackFee,
    p_metadata: paymentMetadata,
  });

  if (rpcError) {
    console.error('❌ RPC ERROR:', rpcError);
    return new Response(
      JSON.stringify({
        error: 'Payment processing failed',
        message: rpcError.message,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  console.log('✅ Subscription payment recorded:', result);

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Subscription payment processed (ledger only)',
      payment_reference: tx.reference,
      net_platform_revenue: netRevenue,
      processing_time_ms: Date.now() - startTime,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
}

// ─────────────────────────────────────────────────────────────────
// 4. INVOICE PAYMENT FAILED
// ─────────────────────────────────────────────────────────────────
async function handleInvoicePaymentFailed(
  supabase: TypedSupabaseClient,
  data: PaystackInvoiceData,
  clientIp: string | null,
  startTime: number,
) {
  console.log('❌ Subscription payment failed:', data.invoice_code);
  console.log('  Failure reason:', data.description);

  // Extract organization_id from customer email
  const customerEmail = data.customer.email;
  const organizationId = customerEmail.split('@')[0];

  if (!organizationId || !customerEmail.includes('@gonasi.com')) {
    console.error('❌ Cannot find organization_id from email:', customerEmail);
    return new Response('Missing organization context', { status: 400 });
  }

  console.log('🏢 Extracted organization_id:', organizationId);

  // Update subscription status to 'past_due'
  const { error: updateError } = await supabase
    .from('organization_subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('organization_id', organizationId);

  if (updateError) {
    console.error('❌ Error updating subscription status:', updateError);
  }

  // TODO: Send notification to organization admins
  // TODO: Log failed payment attempt

  console.log('✅ Subscription marked as past_due');

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Payment failure recorded',
      invoice_code: data.invoice_code,
      action_required: 'Update payment method',
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
}

// ─────────────────────────────────────────────────────────────────
// 5. INVOICE UPDATE (final status after payment attempt)
// ─────────────────────────────────────────────────────────────────
async function handleInvoiceUpdate(
  supabase: TypedSupabaseClient,
  data: PaystackInvoiceData,
  clientIp: string | null,
  startTime: number,
) {
  console.log('🔄 Invoice updated:', data.invoice_code);
  console.log('  Final status:', data.status);
  console.log('  Paid:', data.paid);
  console.log('**************************** handleInvoiceUpdate: ', data);

  // Update subscription based on invoice status
  if (data.paid && data.status === 'success') {
    // Extract organization_id from customer email
    const customerEmail = data.customer.email;
    const organizationId = customerEmail.split('@')[0];

    if (organizationId && customerEmail.includes('@gonasi.com')) {
      const { error } = await supabase
        .from('organization_subscriptions')
        .update({
          status: 'active',
          current_period_start: data.period_start,
          current_period_end: data.period_end,
          updated_at: new Date().toISOString(),
        })
        .eq('organization_id', organizationId);

      if (error) {
        console.error('❌ Error updating subscription:', error);
      } else {
        console.log('✅ Subscription updated to active');
      }
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Invoice update processed',
      invoice_code: data.invoice_code,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
}

// ─────────────────────────────────────────────────────────────────
// 6. SUBSCRIPTION NOT RENEWING
// ─────────────────────────────────────────────────────────────────
async function handleSubscriptionNotRenew(
  supabase: TypedSupabaseClient,
  data: PaystackSubscriptionData,
  clientIp: string | null,
  startTime: number,
) {
  console.log('⚠️ Subscription set to not renew:', data.subscription_code);

  // Extract organization_id from customer email
  const customerEmail = data.customer.email;
  const organizationId = customerEmail.split('@')[0];

  if (!organizationId || !customerEmail.includes('@gonasi.com')) {
    console.error('❌ Missing organization_id from email:', customerEmail);
    return new Response('Missing organization_id', { status: 400 });
  }

  console.log('🏢 Extracted organization_id:', organizationId);

  // Mark subscription as non-renewing (but still active until period end)
  const { error } = await supabase
    .from('organization_subscriptions')
    .update({
      cancel_at_period_end: true,
      status: 'canceled', // Use 'canceled' status from the enum
    })
    .eq('organization_id', organizationId);

  if (error) {
    console.error('❌ Error updating subscription:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to update subscription', details: error }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  console.log('✅ Subscription marked for cancellation');

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Subscription will not renew',
      subscription_code: data.subscription_code,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
}

// ─────────────────────────────────────────────────────────────────
// 7. SUBSCRIPTION DISABLED
// ─────────────────────────────────────────────────────────────────
async function handleSubscriptionDisable(
  supabase: TypedSupabaseClient,
  data: PaystackSubscriptionData,
  clientIp: string | null,
  startTime: number,
) {
  console.log('🛑 Subscription disabled:', data.subscription_code);

  // Extract organization_id from customer email
  const customerEmail = data.customer.email;
  const organizationId = customerEmail.split('@')[0];

  if (!organizationId || !customerEmail.includes('@gonasi.com')) {
    console.error('❌ Missing organization_id from email:', customerEmail);
    return new Response('Missing organization_id', { status: 400 });
  }

  console.log('🏢 Extracted organization_id:', organizationId);

  // Determine final status based on Paystack status
  const finalStatus = data.status === 'completed' ? 'canceled' : 'canceled';

  // Update subscription to canceled/completed
  const { error } = await supabase
    .from('organization_subscriptions')
    .update({
      status: finalStatus,
      cancel_at_period_end: false,
      updated_at: new Date().toISOString(),
    })
    .eq('organization_id', organizationId);

  if (error) {
    console.error('❌ Error disabling subscription:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to disable subscription', details: error }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  console.log('✅ Subscription disabled');

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Subscription disabled',
      subscription_code: data.subscription_code,
      final_status: finalStatus,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
}
