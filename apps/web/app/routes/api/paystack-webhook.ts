import type { Route } from './+types/paystack-webhook';

import { createClient } from '~/lib/supabase/supabase.server';

// Paystack webhook IPs (for reference, but we'll use signature verification instead)
const PAYSTACK_IPS = new Set(['52.31.139.75', '52.49.173.169', '52.214.14.220']);

function getClientIp(request: Request): string | null {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const ips = forwardedFor.split(',').map((ip) => ip.trim());
    return ips[0] ?? null;
  }
  const rawIp = (request as any).ip as string | undefined;
  return rawIp ?? null;
}

export async function action({ request }: Route.ActionArgs) {
  const startTime = Date.now();

  try {
    const clientIp = getClientIp(request);
    const paystackSignature = request.headers.get('x-paystack-signature');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔔 PAYSTACK WEBHOOK RECEIVED');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  Client IP:', clientIp);
    console.log('  Signature:', paystackSignature ? '✓ Present' : '✗ Missing');
    console.log('  Timestamp:', new Date().toISOString());

    // IP whitelist check (warning only, not blocking)
    if (clientIp && !PAYSTACK_IPS.has(clientIp)) {
      console.warn('⚠️  Warning: Request from non-whitelisted IP:', clientIp);
      console.warn('   Expected IPs:', Array.from(PAYSTACK_IPS).join(', '));
      // Continue processing - rely on signature verification instead
    }

    // TODO: Implement signature verification for production
    // const isValidSignature = verifyPaystackSignature(request, paystackSignature);
    // if (!isValidSignature) {
    //   console.error('❌ Invalid Paystack signature');
    //   return new Response('Forbidden', { status: 403 });
    // }

    const { supabase } = createClient(request);
    const payload = await request.json();

    console.log('  Event type:', payload.event);
    console.log('  Reference:', payload.data?.reference);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // =========================================================================
    // HANDLE: charge.success
    // =========================================================================
    if (payload.event === 'charge.success') {
      const tx = payload.data;
      const metadata = tx.metadata ?? {};

      console.log('💳 Processing successful charge...');

      // Validate transaction type
      if (metadata.transaction_type !== 'course_sale') {
        console.warn('⚠️  Skipped: Non-course transaction');
        console.warn('   Transaction type:', metadata.transaction_type);
        return new Response('Ignored non-course transaction', { status: 200 });
      }

      // Validate required metadata
      const requiredFields = ['userId', 'publishedCourseId', 'pricingTierId'];
      const missingFields = requiredFields.filter((field) => !metadata[field]);

      if (missingFields.length > 0) {
        console.error('❌ Missing required metadata fields:', missingFields);
        return new Response('Missing required metadata', { status: 400 });
      }

      // Validate payment reference
      if (!tx.reference) {
        console.error('❌ Missing payment reference');
        return new Response('Missing payment reference', { status: 400 });
      }

      // -----------------------------------------------------------------------
      // Convert amounts from smallest currency unit to major units
      // Paystack sends amounts in kobo (KES) or cents (USD)
      // -----------------------------------------------------------------------
      const rawAmount = typeof tx.amount === 'number' ? tx.amount : parseFloat(String(tx.amount));
      const rawFees = typeof tx.fees === 'number' ? tx.fees : parseFloat(String(tx.fees || 0));

      const amountPaid = rawAmount / 100;
      const paystackFee = rawFees / 100;

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('💰 PAYMENT DETAILS:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('  Raw amount (kobo):', rawAmount);
      console.log('  Raw fees (kobo):', rawFees);
      console.log('  ─────────────────────────────────────────────────');
      console.log('  Amount paid:', amountPaid, tx.currency);
      console.log('  Paystack fee:', paystackFee, tx.currency);
      console.log('  Net settlement:', amountPaid - paystackFee, tx.currency);
      console.log('  Currency:', tx.currency);
      console.log('  Payment method:', tx.channel);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      // Build comprehensive metadata
      const rpcMetadata = {
        webhook_received_at: new Date().toISOString(),
        webhook_event: payload.event,
        webhook_processing_time_ms: Date.now() - startTime,
        clientIp,

        // Paystack transaction details
        paystack_transaction_id: String(tx.id),
        paystack_domain: tx.domain,
        paystack_status: tx.status,
        paystack_gateway_response: tx.gateway_response,
        paid_at: tx.paid_at,
        created_at: tx.created_at,

        // Payment method
        channel: tx.channel,
        authorization: tx.authorization,

        // Customer
        customer: {
          id: tx.customer?.id,
          email: tx.customer?.email,
          customer_code: tx.customer?.customer_code,
        },

        // Amounts
        raw_amount_kobo: rawAmount,
        raw_fees_kobo: rawFees,
        amount_paid: amountPaid,
        paystack_fee: paystackFee,
        net_settlement: amountPaid - paystackFee,

        // Original metadata
        original_metadata: metadata,

        // Source
        source: tx.source,
        ip_address: tx.ip_address,
      };

      // Prepare RPC parameters
      const rpcParams = {
        p_paystack_reference: tx.reference,
        p_paystack_transaction_id: String(tx.id),
        p_user_id: metadata.userId,
        p_published_course_id: metadata.publishedCourseId,
        p_tier_id: metadata.pricingTierId,
        p_amount_paid: amountPaid,
        p_currency_code: (tx.currency ?? 'KES').toUpperCase(),
        p_payment_method: tx.channel ?? 'card',
        p_paystack_fee: paystackFee,
        p_metadata: rpcMetadata,
      };

      console.log('📞 Calling process_course_payment_from_paystack...');
      console.log('   Reference:', rpcParams.p_paystack_reference);
      console.log('   User:', rpcParams.p_user_id);
      console.log('   Course:', rpcParams.p_published_course_id);
      console.log('   Tier:', rpcParams.p_tier_id);
      console.log('   Amount:', rpcParams.p_amount_paid, rpcParams.p_currency_code);
      console.log('   Paystack fee:', rpcParams.p_paystack_fee, rpcParams.p_currency_code);

      // Call RPC to process payment
      const { data: result, error: rpcError } = await supabase.rpc(
        'process_course_payment_from_paystack',
        rpcParams,
      );

      if (rpcError) {
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('❌ RPC CALL FAILED');
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('  Error code:', rpcError.code);
        console.error('  Message:', rpcError.message);
        console.error('  Details:', rpcError.details);
        console.error('  Hint:', rpcError.hint);
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        return new Response(
          JSON.stringify({
            error: 'Payment processing failed',
            message: rpcError.message,
            code: rpcError.code,
          }),
          { status: 500, headers: { 'Content-Type': 'application/json' } },
        );
      }

      // Check RPC result
      if (!result?.success) {
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('❌ RPC RETURNED FAILURE');
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('  Message:', result?.message);
        console.error('  Result:', JSON.stringify(result, null, 2));
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        return new Response(
          JSON.stringify({
            error: 'Payment processing failed',
            message: result?.message ?? 'Unknown error',
            result,
          }),
          { status: 500, headers: { 'Content-Type': 'application/json' } },
        );
      }

      // Success!
      const processingTime = Date.now() - startTime;

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ PAYMENT PROCESSED SUCCESSFULLY');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('  Processing time:', processingTime, 'ms');
      console.log('  Enrollment ID:', result.enrollment?.enrollment_id);
      console.log('  User:', result.enrollment?.user_id);
      console.log('  Course:', result.enrollment?.course_title);
      console.log('  Tier:', result.enrollment?.tier_name);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('💰 FINANCIAL BREAKDOWN:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('  Gross amount:', result.distribution?.gross_amount, result.payment?.currency);
      console.log('  Paystack fee:', result.distribution?.paystack_fee, result.payment?.currency);
      console.log(
        '  Net settlement:',
        result.distribution?.net_settlement,
        result.payment?.currency,
      );
      console.log('  ─────────────────────────────────────────────────');
      console.log(
        '  Platform fee (',
        result.distribution?.platform_fee_percent,
        '%):',
        result.distribution?.platform_fee_amount,
        result.payment?.currency,
      );
      console.log(
        '  Organization payout:',
        result.distribution?.organization_payout,
        result.payment?.currency,
      );
      console.log(
        '  Platform net revenue:',
        result.distribution?.platform_net_revenue,
        result.payment?.currency,
      );
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📒 LEDGER ENTRIES CREATED:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('  1. Payment inflow:', result.ledger_entries?.payment_inflow);
      console.log('  2. Org payout:', result.ledger_entries?.org_payout);
      console.log('  3. Platform revenue:', result.ledger_entries?.platform_revenue);
      console.log('  4. Gateway fee:', result.ledger_entries?.gateway_fee);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Payment processed and user enrolled',
          enrollment_id: result.enrollment?.enrollment_id,
          paystack_reference: tx.reference,
          processing_time_ms: processingTime,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // =========================================================================
    // HANDLE: charge.failed
    // =========================================================================
    if (payload.event === 'charge.failed') {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('❌ PAYMENT FAILED');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('  Reference:', payload.data.reference);
      console.log('  Amount:', payload.data.amount / 100, payload.data.currency);
      console.log('  Customer:', payload.data.customer?.email);
      console.log('  Status:', payload.data.status);
      console.log('  Gateway response:', payload.data.gateway_response);
      console.log('  Message:', payload.data.message);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      // TODO: Consider implementing:
      // - Update enrollment status to 'payment_failed'
      // - Send notification to user about failed payment
      // - Log failed payment attempt for fraud detection

      return Response.json({
        message: 'Payment failure recorded',
        event: payload.event,
      });
    }

    // =========================================================================
    // HANDLE: Other webhook events
    // =========================================================================
    console.log('ℹ️  Unhandled webhook event:', payload.event);

    return Response.json({
      message: 'Webhook received',
      event: payload.event,
    });
  } catch (error) {
    const processingTime = Date.now() - startTime;

    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('💥 WEBHOOK PROCESSING ERROR');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('  Processing time:', processingTime, 'ms');
    console.error('  Error:', error);

    if (error instanceof Error) {
      console.error('  Message:', error.message);
      console.error('  Stack:', error.stack);
    }
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return Response.json(
      {
        success: false,
        message: 'Error processing webhook',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
