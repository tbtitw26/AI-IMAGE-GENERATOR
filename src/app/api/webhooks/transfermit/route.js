import {
  verifyWebhookSignature,
  completePaymentTransaction,
  failPaymentTransaction,
} from '@/lib/transfermit';

export async function POST(req) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('signature') || req.headers.get('Signature');

    // 1. Validate signature if webhook secret is configured
    if (process.env.TRANSFERMIT_WEBHOOK_SECRET) {
      const isValid = verifyWebhookSignature(rawBody, signature);
      if (!isValid) {
        console.warn('[Webhook Transfermit] Invalid HMAC-SHA256 signature received.');
        return new Response(JSON.stringify({ error: 'Invalid signature' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // 2. Parse payload
    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const {
      id: paymentId,
      referenceId,
      state,
      amount,
      currency,
      paymentMethod,
      paymentMethodDetails,
    } = payload;

    console.log(`[Webhook Transfermit] Payment ${paymentId || referenceId} state: ${state}`);

    // 3. Process state machine
    if (state === 'COMPLETED') {
      const result = await completePaymentTransaction({
        referenceId,
        paymentId,
        amount,
        currency,
        paymentMethod,
        cardDetails: paymentMethodDetails,
      });

      if (!result.success && result.notFound) {
        console.warn(`[Webhook Transfermit] Reference ID ${referenceId} / ${paymentId} not found in DB.`);
      }

      return new Response(JSON.stringify({ received: true, status: 'completed' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (['DECLINED', 'ERROR', 'CANCELLED'].includes(state)) {
      await failPaymentTransaction({
        referenceId,
        paymentId,
        reason: `Payment ${state.toLowerCase()}`,
      });

      return new Response(JSON.stringify({ received: true, status: state.toLowerCase() }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Default 200 acknowledgment for intermediate states (e.g., PENDING, CHECKOUT, etc.)
    return new Response(JSON.stringify({ received: true, status: state }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Webhook Transfermit] Processing error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
