import type { Route } from './+types/paystack-webhook';

export async function action({ request }: Route.ActionArgs) {
  try {
    // Parse the webhook payload
    const payload = await request.json();

    // Log the entire webhook event
    console.log('Paystack Webhook Received:', {
      event: payload.event,
      data: payload.data,
      timestamp: new Date().toISOString(),
      headers: {
        'x-paystack-signature': request.headers.get('x-paystack-signature'),
        'user-agent': request.headers.get('user-agent'),
      },
    });

    // Handle specific events
    switch (payload.event) {
      case 'charge.success':
        console.log('Payment Successful:', {
          reference: payload.data.reference,
          amount: payload.data.amount,
          currency: payload.data.currency,
          customer: payload.data.customer,
          status: payload.data.status,
          paid_at: payload.data.paid_at,
        });

        // Add your payment success logic here
        // e.g., update database, send confirmation email, etc.

        break;

      case 'charge.failed':
        console.log('Payment Failed:', {
          reference: payload.data.reference,
          amount: payload.data.amount,
          currency: payload.data.currency,
          customer: payload.data.customer,
          status: payload.data.status,
          gateway_response: payload.data.gateway_response,
        });
        break;

      case 'transfer.success':
        console.log('Transfer Successful:', {
          reference: payload.data.reference,
          amount: payload.data.amount,
          recipient: payload.data.recipient,
          status: payload.data.status,
        });
        break;

      case 'transfer.failed':
        console.log('Transfer Failed:', {
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
