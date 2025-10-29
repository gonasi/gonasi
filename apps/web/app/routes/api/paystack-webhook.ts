import type { Route } from './+types/paystack-webhook';

import { createClient } from '~/lib/supabase/supabase.server';

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
  try {
    const clientIp = getClientIp(request);

    if (!clientIp || !PAYSTACK_IPS.has(clientIp)) {
      console.warn('Blocked webhook request from unauthorized IP:', clientIp);
      return new Response('Forbidden', { status: 403 });
    }

    const { supabase } = createClient(request);
    const payload = await request.json();

    const headers = {
      'x-paystack-signature': request.headers.get('x-paystack-signature'),
      'user-agent': request.headers.get('user-agent'),
      'x-forwarded-for': request.headers.get('x-forwarded-for'),
    };

    console.log('Paystack Webhook Received:', {
      event: payload.event,
      timestamp: new Date().toISOString(),
      clientIp,
      headers,
      data: payload.data,
    });

    if (payload.event === 'charge.success') {
      const tx = payload.data;
      const metadata = tx.metadata ?? {};

      if (!metadata || metadata.transaction_type !== 'course_sale') {
        console.warn(
          '[PaystackWebhook] Skipped non-course transaction:',
          metadata?.transaction_type,
        );
        return new Response('Ignored non-course transaction', { status: 200 });
      }

      // Validate required metadata fields
      if (!metadata.userId || !metadata.publishedCourseId || !metadata.pricingTierId) {
        console.error('[PaystackWebhook] Missing required metadata fields:', {
          userId: metadata.userId,
          publishedCourseId: metadata.publishedCourseId,
          pricingTierId: metadata.pricingTierId,
        });
        return new Response('Missing required metadata', { status: 400 });
      }

      // Validate payment reference
      if (!tx.reference) {
        console.error('[PaystackWebhook] Missing payment reference');
        return new Response('Missing payment reference', { status: 400 });
      }

      // Convert amounts from smallest currency unit (kobo/cents) to major units
      // Example: 10000 kobo = 100 KES, 15000 cents = 150 USD
      const amountPaid =
        typeof tx.amount === 'number' ? tx.amount / 100 : parseFloat(String(tx.amount)) / 100;

      const paystackFee =
        typeof tx.fees === 'number'
          ? tx.fees / 100
          : tx.fees
            ? parseFloat(String(tx.fees)) / 100
            : 0;

      console.log('[PaystackWebhook] Payment amounts:', {
        raw_amount: tx.amount,
        raw_fees: tx.fees,
        amount_paid: amountPaid,
        paystack_fee: paystackFee,
        currency: tx.currency,
        settlement_amount: amountPaid - paystackFee,
      });

      // Build comprehensive metadata for ledger entries
      const rpcMetadata = {
        webhook_received_at: new Date().toISOString(),
        webhook_event: payload.event,
        webhook_payload_timestamp: payload.timestamp ?? null,
        clientIp,
        headers,

        // Paystack transaction details
        paystack_transaction_id: String(tx.id),
        paystack_domain: tx.domain,
        paystack_status: tx.status,
        paystack_gateway_response: tx.gateway_response,
        paid_at: tx.paid_at,
        created_at: tx.created_at,

        // Payment method details
        channel: tx.channel,
        authorization: tx.authorization,

        // Customer details
        customer: {
          id: tx.customer?.id,
          email: tx.customer?.email,
          customer_code: tx.customer?.customer_code,
        },

        // Fee breakdown (if provided by Paystack)
        fees_breakdown: tx.fees_breakdown,

        // Original metadata from transaction initialization
        original_metadata: metadata,

        // Source tracking
        source: tx.source,
        referrer: metadata?.referrer ?? null,

        // Amount tracking
        requested_amount: tx.requested_amount,
        settlement_amount: amountPaid - paystackFee,
      };

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

      console.log('[PaystackWebhook] Calling RPC with params:', {
        reference: rpcParams.p_paystack_reference,
        user_id: rpcParams.p_user_id,
        course_id: rpcParams.p_published_course_id,
        tier_id: rpcParams.p_tier_id,
        amount_paid: rpcParams.p_amount_paid,
        currency: rpcParams.p_currency_code,
        paystack_fee: rpcParams.p_paystack_fee,
        payment_method: rpcParams.p_payment_method,
      });

      // Call RPC function to process payment
      const { data: result, error: rpcError } = await supabase.rpc(
        'process_course_payment_from_paystack',
        rpcParams,
      );

      if (rpcError) {
        console.error('[PaystackWebhook] RPC failed:', {
          error: rpcError,
          code: rpcError.code,
          message: rpcError.message,
          details: rpcError.details,
          hint: rpcError.hint,
        });
        return new Response(
          JSON.stringify({
            error: 'Payment processing failed',
            message: rpcError.message,
          }),
          { status: 500, headers: { 'Content-Type': 'application/json' } },
        );
      }

      // Check if RPC returned success
      if (!result?.success) {
        console.error('[PaystackWebhook] RPC returned failure:', result);
        return new Response(
          JSON.stringify({
            error: 'Payment processing failed',
            message: result?.message ?? 'Unknown error',
            result,
          }),
          { status: 500, headers: { 'Content-Type': 'application/json' } },
        );
      }

      console.log('[PaystackWebhook] ✅ Payment processed successfully:', {
        enrollment_id: result.enrollment?.enrollment_id,
        user_id: result.enrollment?.user_id,
        course_title: result.enrollment?.course_title,
        tier_name: result.enrollment?.tier_name,
        amount_paid: result.payment?.amount_paid,
        currency: result.payment?.currency,
        distribution: result.distribution,
        ledger_entries: result.ledger_entries,
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Payment processed and user enrolled',
          enrollment_id: result.enrollment?.enrollment_id,
          paystack_reference: tx.reference,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Handle failed charges
    if (payload.event === 'charge.failed') {
      console.log('❌ Payment Failed:', {
        reference: payload.data.reference,
        amount: payload.data.amount,
        currency: payload.data.currency,
        customer: payload.data.customer,
        status: payload.data.status,
        gateway_response: payload.data.gateway_response,
        message: payload.data.message,
      });

      // TODO: You might want to:
      // - Update enrollment status to 'payment_failed'
      // - Send notification to user about failed payment
      // - Log failed payment attempt

      return Response.json({
        message: 'Payment failure recorded',
        event: payload.event,
      });
    }

    // Handle other webhook events
    console.log('Unhandled webhook event:', payload.event);
    return Response.json({
      message: 'Webhook received',
      event: payload.event,
    });
  } catch (error) {
    console.error('Error processing Paystack webhook:', error);

    // Log full error details for debugging
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
    }

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
