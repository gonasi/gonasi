import type { Route } from './+types/paystack-webhook';

import { createClient } from '~/lib/supabase/supabase.server';

// Reference Paystack IPs (for logs only — signature is the real security)
const PAYSTACK_IPS = new Set(['52.31.139.75', '52.49.173.169', '52.214.14.220']);

function getClientIp(request: Request): string | null {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const ips = forwardedFor.split(',').map((ip) => ip.trim());
    return ips[0] ?? null;
  }
  return (request as any).ip ?? null;
}

export async function action({ request }: Route.ActionArgs) {
  const startTime = Date.now();

  try {
    // ─────────────────────────────────────────────
    // ① BASIC SECURITY & LOGGING
    // ─────────────────────────────────────────────
    const clientIp = getClientIp(request);
    const paystackSignature = request.headers.get('x-paystack-signature');

    console.log('━━━━━━━━ PAYSTACK WEBHOOK ━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  Client IP:', clientIp);
    console.log('  Signature:', paystackSignature ? '✓ Present' : '✗ Missing');
    console.log('  Timestamp:', new Date().toISOString());

    // Warn if IP not in known Paystack IPs (for debugging only)
    if (clientIp && !PAYSTACK_IPS.has(clientIp)) {
      console.warn('⚠️  Non-whitelisted IP:', clientIp);
    }

    // TODO: ② Verify signature before continuing (production critical)
    // if (!verifyPaystackSignature(request, paystackSignature)) {
    //   return new Response('Forbidden', { status: 403 });
    // }

    // ─────────────────────────────────────────────
    // ③ PARSE PAYLOAD & PREPARE SUPABASE CLIENT
    // ─────────────────────────────────────────────
    const payload = await request.json();
    const { supabase } = createClient(request);

    console.log('  Event type:', payload.event);
    console.log('  Reference:', payload.data?.reference);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // ─────────────────────────────────────────────
    // ④ HANDLE charge.success (multiple transaction types)
    // ─────────────────────────────────────────────
    if (payload.event === 'charge.success') {
      const tx = payload.data;
      const metadata = tx.metadata ?? {};
      const transactionType = metadata.transaction_type ?? 'unknown';

      console.log('💳 Processing charge.success for type:', transactionType);

      // → Route based on transaction type
      switch (transactionType) {
        case 'course_sale':
          // Handle single course purchase
          return await handleCourseSale(supabase, tx, metadata, clientIp, startTime);

        case 'organization_subscription':
          // Handle recurring organization subscription (future)
          // return await handleOrganizationSubscription(...);
          console.log('🏢 Skipped organization_subscription (TODO)');
          return new Response('Pending org subscription handler', { status: 200 });

        default:
          console.warn('⚠️ Unrecognized transaction_type:', transactionType);
          return new Response('Ignored unknown transaction_type', { status: 200 });
      }
    }

    // ─────────────────────────────────────────────
    // ⑤ HANDLE charge.failed
    // ─────────────────────────────────────────────
    if (payload.event === 'charge.failed') {
      console.log('❌ charge.failed:', payload.data?.reference);
      // Optionally log failed attempts or notify users
      return new Response(
        JSON.stringify({ message: 'Payment failure recorded', event: payload.event }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // ─────────────────────────────────────────────
    // ⑥ HANDLE UNRECOGNIZED EVENTS
    // ─────────────────────────────────────────────
    console.log('ℹ️ Unhandled webhook event:', payload.event);
    return new Response(JSON.stringify({ message: 'Webhook received', event: payload.event }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    // ─────────────────────────────────────────────
    // ⑦ ERROR HANDLING
    // ─────────────────────────────────────────────
    const processingTime = Date.now() - startTime;
    console.error('💥 WEBHOOK PROCESSING ERROR:', err);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Error processing webhook',
        error: err instanceof Error ? err.message : String(err),
        processing_time_ms: processingTime,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}

// ─────────────────────────────────────────────
// ⑧ COURSE SALE HANDLER
// ─────────────────────────────────────────────
async function handleCourseSale(
  supabase: ReturnType<typeof createClient>['supabase'],
  tx: any,
  metadata: any,
  clientIp: string | null,
  startTime: number,
) {
  // ✅ Validate required metadata
  const required = ['userId', 'publishedCourseId', 'pricingTierId'];
  const missing = required.filter((f) => !metadata[f]);
  if (missing.length > 0) {
    console.error('❌ Missing required metadata fields:', missing);
    return new Response('Missing required metadata', { status: 400 });
  }

  if (!tx.reference) {
    console.error('❌ Missing payment reference');
    return new Response('Missing payment reference', { status: 400 });
  }

  // ✅ Normalize & validate amounts
  const rawAmount = typeof tx.amount === 'number' ? tx.amount : parseFloat(String(tx.amount));
  const rawFees = typeof tx.fees === 'number' ? tx.fees : parseFloat(String(tx.fees ?? 0));

  if (Number.isNaN(rawAmount)) {
    console.error('❌ Invalid amount from Paystack:', tx.amount);
    return new Response('Invalid amount', { status: 400 });
  }

  const amountPaid = Number((rawAmount / 100).toFixed(4));
  const paystackFee = Number((rawFees / 100).toFixed(4));
  const currency = (tx.currency ?? 'KES').toString().toUpperCase();

  // ✅ Prepare metadata for audit and RPC
  const rpcMetadata = {
    webhook_received_at: new Date().toISOString(),
    webhook_event: 'charge.success',
    webhook_processing_time_ms: Date.now() - startTime,
    clientIp,
    paystack_transaction_id: String(tx.id),
    paystack_domain: tx.domain,
    paystack_status: tx.status,
    paystack_gateway_response: tx.gateway_response,
    paid_at: tx.paid_at,
    created_at: tx.created_at,
    channel: tx.channel,
    authorization: tx.authorization,
    customer: {
      id: tx.customer?.id,
      email: tx.customer?.email,
      customer_code: tx.customer?.customer_code,
    },
    raw_amount_kobo: rawAmount,
    raw_fees_kobo: rawFees,
    amount_paid: amountPaid,
    paystack_fee: paystackFee,
    net_settlement: Number((amountPaid - paystackFee).toFixed(4)),
    original_metadata: metadata,
    source: tx.source,
    ip_address: tx.ip_address,
  };

  // ✅ Prepare RPC params (matches your SQL function)
  const rpcParams = {
    p_payment_reference: String(tx.reference),
    p_paystack_transaction_id: String(tx.id),
    p_user_id: String(metadata.userId),
    p_published_course_id: String(metadata.publishedCourseId),
    p_tier_id: String(metadata.pricingTierId),
    p_amount_paid: amountPaid,
    p_currency_code: currency,
    p_payment_method: tx.channel ?? 'card',
    p_paystack_fee: paystackFee,
    p_metadata: rpcMetadata,
  };

  console.log('📞 Calling process_course_payment_from_paystack RPC...');
  const { data: result, error: rpcError } = await supabase.rpc(
    'process_course_payment_from_paystack',
    rpcParams,
  );

  if (rpcError) {
    console.error('❌ RPC ERROR:', rpcError);
    return new Response(
      JSON.stringify({
        error: 'Payment processing failed',
        message: rpcError.message,
        details: rpcError.details,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  if (!result?.success) {
    console.error('❌ RPC returned failure:', result);
    return new Response(
      JSON.stringify({
        error: 'Payment processing failed',
        message: result?.message ?? 'Unknown error from RPC',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const processingTime = Date.now() - startTime;
  console.log('✅ COURSE PAYMENT PROCESSED:', result);

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Course payment processed successfully',
      enrollment_id: result.enrollment?.enrollment_id,
      purchase_id: result.purchase?.purchase_id,
      payment_reference: tx.reference,
      processing_time_ms: processingTime,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
}
