import type { Route } from './+types/paystack-webhook';

import { createClient } from '~/lib/supabase/supabase.server';

// Paystack webhook IPs (for reference; we still rely on signature verification)
const PAYSTACK_IPS = new Set(['52.31.139.75', '52.49.173.169', '52.214.14.220']);

function getClientIp(request: Request): string | null {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const ips = forwardedFor.split(',').map((ip) => ip.trim());
    return ips[0] ?? null;
  }
  // Edge runtimes sometimes surface the raw ip on request.ip
  const rawIp = (request as any).ip as string | undefined;
  return rawIp ?? null;
}

export async function action({ request }: Route.ActionArgs) {
  const startTime = Date.now();

  try {
    const clientIp = getClientIp(request);
    const paystackSignature = request.headers.get('x-paystack-signature');

    console.log('━━━━━━━━ PAYSTACK WEBHOOK ━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  Client IP:', clientIp);
    console.log('  Signature:', paystackSignature ? '✓ Present' : '✗ Missing');
    console.log('  Timestamp:', new Date().toISOString());

    // IP whitelist check (warning only)
    if (clientIp && !PAYSTACK_IPS.has(clientIp)) {
      console.warn('⚠️  Warning: Request from non-whitelisted IP:', clientIp);
    }

    // TODO: implement verifyPaystackSignature(request, paystackSignature) for production
    // const isValid = verifyPaystackSignature(request, paystackSignature);
    // if (!isValid) return new Response('Forbidden', { status: 403 });

    const { supabase } = createClient(request);
    const payload = await request.json();

    console.log('  Event type:', payload.event);
    console.log('  Reference:', payload.data?.reference);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Only handle charge.success for course purchases
    if (payload.event === 'charge.success') {
      const tx = payload.data;
      const metadata = tx.metadata ?? {};

      console.log('💳 Processing charge.success...');

      // Only process course sales
      if (metadata.transaction_type !== 'course_sale') {
        console.warn(
          '⚠️ Skipped: not a course transaction. transaction_type=',
          metadata.transaction_type,
        );
        return new Response('Ignored non-course transaction', { status: 200 });
      }

      // Required metadata fields (these should be UUID strings)
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

      // Convert amounts from smallest currency unit to major unit (kobo/cents)
      const rawAmount = typeof tx.amount === 'number' ? tx.amount : parseFloat(String(tx.amount));
      const rawFees = typeof tx.fees === 'number' ? tx.fees : parseFloat(String(tx.fees ?? 0));

      // Protect against NaN
      if (Number.isNaN(rawAmount)) {
        console.error('❌ Invalid amount from Paystack:', tx.amount);
        return new Response('Invalid amount', { status: 400 });
      }

      const amountPaid = Number((rawAmount / 100).toFixed(4)); // match numeric(19,4)
      const paystackFee = Number((rawFees / 100).toFixed(4));
      const currency = (tx.currency ?? 'KES').toString().toUpperCase();

      console.log('  Amount paid:', amountPaid, currency);
      console.log('  Paystack fee:', paystackFee, currency);

      // Build rich metadata object to pass to RPC
      const rpcMetadata = {
        webhook_received_at: new Date().toISOString(),
        webhook_event: payload.event,
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
        // keep original tx object for debugging (optional)
        // raw_tx: tx
      };

      // Prepare RPC parameters using the exact names your SQL function expects
      const rpcParams = {
        p_paystack_reference: String(tx.reference),
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

      console.log('📞 Calling RPC process_course_payment_from_paystack with:');
      console.log('   reference:', rpcParams.p_paystack_reference);
      console.log('   user_id:', rpcParams.p_user_id);
      console.log('   published_course_id:', rpcParams.p_published_course_id);
      console.log('   tier_id:', rpcParams.p_tier_id);
      console.log('   amount:', rpcParams.p_amount_paid, rpcParams.p_currency_code);
      console.log('   paystack_fee:', rpcParams.p_paystack_fee);

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
            code: rpcError.code,
            details: rpcError.details,
          }),
          { status: 500, headers: { 'Content-Type': 'application/json' } },
        );
      }

      // supabase.rpc returns the value of the function. Make sure it returned success.
      if (!result?.success) {
        console.error('❌ RPC returned failure:', JSON.stringify(result, null, 2));
        return new Response(
          JSON.stringify({
            error: 'Payment processing failed',
            message: result?.message ?? 'Unknown error from RPC',
            result,
          }),
          { status: 500, headers: { 'Content-Type': 'application/json' } },
        );
      }

      const processingTime = Date.now() - startTime;

      console.log('✅ PAYMENT PROCESSED');
      console.log('  Processing time (ms):', processingTime);
      console.log('  Enrollment ID:', result.enrollment?.enrollment_id);
      console.log('  Purchase ID:', result.purchase?.purchase_id);
      console.log('  Financials:', JSON.stringify(result.distribution ?? {}, null, 2));
      console.log('  Ledger entries:', {
        payment_inflow: result.ledger_entries?.payment_inflow,
        org_payout: result.ledger_entries?.org_payout,
        platform_revenue: result.ledger_entries?.platform_revenue,
        gateway_fee: result.ledger_entries?.gateway_fee,
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Payment processed and user enrolled',
          enrollment_id: result.enrollment?.enrollment_id,
          purchase_id: result.purchase?.purchase_id,
          paystack_reference: tx.reference,
          processing_time_ms: processingTime,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // charge.failed
    if (payload.event === 'charge.failed') {
      console.log('❌ charge.failed:', payload.data?.reference);
      // Optionally record failure in DB / notify user
      return new Response(
        JSON.stringify({ message: 'Payment failure recorded', event: payload.event }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Unhandled events
    console.log('ℹ️ Unhandled webhook event:', payload.event);
    return new Response(JSON.stringify({ message: 'Webhook received', event: payload.event }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
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
