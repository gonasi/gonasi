import type { Route } from './+types/paystack-webhook';

import { createClient } from '~/lib/supabase/supabase.server';

const PAYSTACK_IPS = new Set(['52.31.139.75', '52.49.173.169', '52.214.14.220']);

/**
 * Extract the client IP address from the request headers or request object.
 * Falls back to `null` if not found.
 */
function getClientIp(request: Request): string | null {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const ips = forwardedFor.split(',').map((ip) => ip.trim());
    return ips[0] ?? null;
  }

  // Fallback: This may be undefined depending on the platform
  const rawIp = (request as any).ip as string | undefined;
  return rawIp ?? null;
}

export async function action({ request }: Route.ActionArgs) {
  try {
    const clientIp: string | null = getClientIp(request);

    if (!clientIp || !PAYSTACK_IPS.has(clientIp)) {
      console.warn('Blocked webhook request from unauthorized IP:', clientIp);
      return new Response('Forbidden', { status: 403 });
    }

    const { supabase } = createClient(request);

    // Parse the webhook payload
    const payload = await request.json();

    console.log('Paystack Webhook Received:', {
      event: payload.event,
      data: payload.data,
      timestamp: new Date().toISOString(),
      headers: {
        'x-paystack-signature': request.headers.get('x-paystack-signature'),
        'user-agent': request.headers.get('user-agent'),
        'x-forwarded-for': request.headers.get('x-forwarded-for'),
      },
      clientIp,
    });

    switch (payload.event) {
      case 'charge.success': {
        console.log('✅ Payment Successful:');

        const tx = payload.data;
        const metadata = tx.metadata;

        if (!metadata || metadata.transaction_type !== 'COURSE_ENROLLMENT') {
          console.warn(
            '[PaystackWebhook] Skipped non-course transaction:',
            metadata?.transaction_type,
          );
          return new Response('Ignored non-course transaction', { status: 200 });
        }

        const { data: enrollData, error: enrollError } = await supabase.rpc(
          'enroll_user_in_published_course',
          {
            p_user_id: metadata.userId,
            p_published_course_id: metadata.publishedCourseId,
            p_tier_id: metadata.pricingTierId,
            p_tier_name: metadata.tierName ?? '',
            p_tier_description: metadata.tierDescription ?? '',
            p_payment_frequency: metadata.paymentFrequency ?? 'one_time',
            p_currency_code: tx.currency ?? 'KES',
            p_is_free: false,
            p_effective_price: parseFloat(metadata.effectivePrice ?? '0'),
            p_organization_id: metadata.organizationId,
            p_promotional_price:
              metadata.promotionalPrice != null ? parseFloat(metadata.promotionalPrice) : undefined,
            p_is_promotional: metadata.isPromotional === 'true',
            p_payment_processor_id: String(tx.id),
            p_payment_amount: tx.amount / 100,
            p_payment_processor_fee: tx.fees / 100,
            p_payment_method: tx.channel ?? null,
            p_created_by: metadata.userId,
          },
        );

        if (enrollError) {
          console.error('[PaystackWebhook] Enrollment RPC failed:', enrollError);
          return new Response('Enrollment failed', { status: 500 });
        }

        console.log('[PaystackWebhook] Enrollment successful:', enrollData);
        return new Response('✅ Enrollment processed', { status: 200 });
      }

      case 'charge.failed':
        console.log('❌ Payment Failed:', {
          reference: payload.data.reference,
          amount: payload.data.amount,
          currency: payload.data.currency,
          customer: payload.data.customer,
          status: payload.data.status,
          gateway_response: payload.data.gateway_response,
        });
        break;

      case 'transfer.success':
        console.log('💸 Transfer Successful:', {
          reference: payload.data.reference,
          amount: payload.data.amount,
          recipient: payload.data.recipient,
          status: payload.data.status,
        });
        break;

      case 'transfer.failed':
        console.log('⚠️ Transfer Failed:', {
          reference: payload.data.reference,
          amount: payload.data.amount,
          recipient: payload.data.recipient,
          status: payload.data.status,
          failure_reason: payload.data.failure_reason,
        });
        break;

      default:
        console.log('Unhandled webhook event:', payload.event);
        break;
    }

    return Response.json({
      message: 'Webhook processed successfully',
      event: payload.event,
    });
  } catch (error) {
    console.error('Error processing Paystack webhook:', error);

    return Response.json(
      {
        message: 'Error processing webhook',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
