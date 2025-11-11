import type { TypedSupabaseClient } from '@gonasi/database/client';

import { getServerEnv } from '~/.server/env.server';

const { PAYSTACK_SECRET_KEY } = getServerEnv();

/**
 * Initiates a Paystack refund for a subscription upgrade and records it in wallet_ledger_entries.
 */
export async function refundSubscriptionUpgrade(
  supabaseAdmin: TypedSupabaseClient,
  organizationId: string,
  transactionReference: string,
  reason: 'subscription_creation_failed' | 'tier_update_failed' | 'manual_refund',
  merchantNote?: string,
) {
  console.log(`💸 Initiating refund for transaction ${transactionReference}`);

  // ─────────────────────────────────────────────────────────────
  // 1️⃣ Fetch the original payment ledger entry
  // ─────────────────────────────────────────────────────────────
  const { data: payment, error: paymentError } = await supabaseAdmin
    .from('wallet_ledger_entries')
    .select('*')
    .eq('payment_reference', transactionReference)
    .eq('destination_wallet_type', 'organization')
    .eq('organization_id', organizationId)
    .maybeSingle();

  if (paymentError || !payment) {
    console.error('❌ Cannot find payment to refund:', paymentError);
    return { success: false, error: 'Payment not found in ledger' };
  }

  // ─────────────────────────────────────────────────────────────
  // 2️⃣ Check for existing refund record (idempotency)
  // ─────────────────────────────────────────────────────────────
  const { data: existingRefund } = await supabaseAdmin
    .from('wallet_ledger_entries')
    .select('id')
    .eq('type', 'refund')
    .eq('related_entity_id', payment.id)
    .maybeSingle();

  if (existingRefund) {
    console.warn('⚠️ Refund already recorded for this payment.');
    return { success: true, message: 'Refund already processed' };
  }

  // ─────────────────────────────────────────────────────────────
  // 3️⃣ Initiate Paystack refund
  // ─────────────────────────────────────────────────────────────
  try {
    const refundRes = await fetch('https://api.paystack.co/refund', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transaction: transactionReference,
        customer_note: 'Refund for subscription upgrade',
        merchant_note: merchantNote || `Refund reason: ${reason}`,
      }),
    });

    const refundData = await refundRes.json();

    if (!refundRes.ok || !refundData.status) {
      console.error('❌ Paystack refund failed:', refundData);
      return { success: false, error: refundData.message };
    }

    const refundInfo = refundData.data;
    console.log('✅ Paystack refund initiated:', refundInfo.id);

    // ─────────────────────────────────────────────────────────────
    // 4️⃣ Record refund in ledger
    // ─────────────────────────────────────────────────────────────
    const { error: ledgerError } = await supabaseAdmin.from('wallet_ledger_entries').insert({
      source_wallet_type: 'organization',
      source_wallet_id: payment.destination_wallet_id,
      destination_wallet_type: 'external',
      destination_wallet_id: null,
      currency_code: payment.currency_code,
      amount: payment.amount,
      direction: 'debit',
      payment_reference: transactionReference,
      type: 'refund',
      related_entity_type: 'wallet_ledger_entries',
      related_entity_id: payment.id,
      metadata: {
        refund_reason: reason,
        paystack_refund_id: refundInfo.id,
        paystack_refund_data: refundInfo,
        original_payment_reference: payment.payment_reference,
        refund_initiated_at: new Date().toISOString(),
      },
    });

    if (ledgerError) {
      console.error('⚠️ Failed to record refund in ledger:', ledgerError);
      return { success: false, error: 'Refund initiated but ledger insert failed' };
    }

    console.log('✅ Refund recorded successfully in ledger');
    return { success: true, refundId: refundInfo.id };
  } catch (err) {
    console.error('❌ Refund error:', err);
    return { success: false, error: String(err) };
  }
}
