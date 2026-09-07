import { connectToDatabase } from '@/lib/mongodb';
import { COLLECTIONS } from '@/config/constants';
import { getTransfermitPayment, completePaymentTransaction, failPaymentTransaction } from '@/lib/transfermit';

export async function GET(req) {
  const url = new URL(req.url);
  const pmt = url.searchParams.get('pmt');
  const ref = url.searchParams.get('ref');

  if (!pmt && !ref) {
    return new Response(JSON.stringify({ message: 'Missing payment parameters (pmt or ref).' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // 1. If Transfermit payment ID is provided and API key is set, check live status
    if (pmt && process.env.TRANSFERMIT_API_KEY) {
      try {
        const pmtData = await getTransfermitPayment(pmt);
        const state = pmtData?.state;
        const referenceId = pmtData?.referenceId || ref;

        if (state === 'COMPLETED') {
          const completion = await completePaymentTransaction({
            referenceId,
            paymentId: pmt,
            amount: pmtData?.amount,
            currency: pmtData?.currency,
            paymentMethod: pmtData?.paymentMethod,
            cardDetails: pmtData?.paymentMethodDetails,
          });

          return new Response(
            JSON.stringify({
              success: true,
              status: 'completed',
              message: 'Payment completed successfully.',
              alreadyCompleted: completion.alreadyCompleted,
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }

        if (['DECLINED', 'ERROR', 'CANCELLED'].includes(state)) {
          await failPaymentTransaction({ referenceId, paymentId: pmt, reason: `Status: ${state}` });
          return new Response(
            JSON.stringify({
              success: false,
              status: state.toLowerCase(),
              message: `Payment was ${state.toLowerCase()}.`,
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            status: state?.toLowerCase() || 'pending',
            message: 'Payment is being processed.',
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      } catch (apiErr) {
        console.warn('[Verify Transfermit] Gateway query warning:', apiErr.message);
      }
    }

    // 2. Fallback to local database check
    const { db } = await connectToDatabase();
    const query = {
      $or: [
        ...(ref ? [{ 'transactions.id': ref }] : []),
        ...(pmt ? [{ 'transactions.providerRef': pmt }] : []),
      ],
    };

    const userDoc = await db.collection(COLLECTIONS.USER).findOne(query);
    if (!userDoc) {
      return new Response(JSON.stringify({ message: 'Transaction record not found.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const tx = (userDoc.transactions || []).find(
      (t) => (ref && t.id === ref) || (pmt && t.providerRef === pmt)
    );

    return new Response(
      JSON.stringify({
        success: tx?.status === 'completed',
        status: tx?.status || 'pending',
        amount: tx?.amount,
        currency: tx?.currency,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[Verify TopUp] Error:', error);
    return new Response(JSON.stringify({ message: error.message || 'Verification error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
