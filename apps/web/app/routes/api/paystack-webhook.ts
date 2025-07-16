import type { Route } from './+types/paystack-webhook';

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
      case 'charge.success':
        console.log('✅ Payment Successful:', {
          reference: payload.data.reference,
          amount: payload.data.amount,
          currency: payload.data.currency,
          customer: payload.data.customer,
          status: payload.data.status,
          paid_at: payload.data.paid_at,
        });

        // TODO: Update database, send confirmation email, etc.
        break;

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
