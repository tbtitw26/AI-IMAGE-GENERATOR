import { connectToDatabase } from '@/lib/mongodb';
import { getUserFromToken } from '@/lib/auth';
import { COLLECTIONS } from '@/config/constants';
import { convertToBaseEur } from '@/config/currency';
import { createInvoicePdf } from '@/lib/pdf';
import { sendEmail, buildInvoiceEmail } from '@/lib/email';
import { createTransfermitPayment } from '@/lib/transfermit';

const supportedCurrencies = new Set(['USD', 'EUR', 'GBP']);

export async function POST(req) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return new Response(JSON.stringify({ message: 'Authentication required.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const user = await getUserFromToken(req);
  if (!user) {
    return new Response(JSON.stringify({ message: 'Invalid or expired session.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const body = await req.json().catch(() => ({}));
  const { amount, currency = 'EUR', paymentMethod = 'card' } = body;
  const numericAmount = Number(amount);

  if (!numericAmount || numericAmount < 10) {
    return new Response(JSON.stringify({ message: 'Minimum top-up amount is 10.00.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const normalizedCurrency = String(currency).toUpperCase();
  if (!supportedCurrencies.has(normalizedCurrency)) {
    return new Response(JSON.stringify({ message: 'Unsupported currency. Use USD, EUR or GBP.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { db } = await connectToDatabase();
    const referenceId = `AF-${Date.now()}`;
    const paymentMethodLabel =
      paymentMethod === 'bank'
        ? 'Instant Bank Transfer'
        : paymentMethod === 'crypto'
        ? 'Crypto'
        : 'Credit/Debit Card';

    // Check if Transfermit gateway is configured with an API key
    if (process.env.TRANSFERMIT_API_KEY) {
      // 1. Record pending transaction in DB
      await db.collection(COLLECTIONS.USER).updateOne(
        { _id: user._id },
        {
          $push: {
            transactions: {
              id: referenceId,
              type: 'top_up',
              amount: numericAmount,
              currency: normalizedCurrency,
              paymentMethod: paymentMethodLabel,
              date: new Date(),
              status: 'pending',
              provider: 'transfermit',
              providerRef: null,
            },
          },
        }
      );

      // 2. Determine base URL for callbacks
      const origin = req.headers.get('origin');
      const baseUrl =
        origin ||
        process.env.APP_URL ||
        process.env.NEXT_PUBLIC_APP_URL ||
        'http://localhost:3000';

      const returnUrl = `${baseUrl.replace(/\/+$/, '')}/dashboard/wallet?status=return&ref=${referenceId}`;
      const webhookUrl = `${baseUrl.replace(/\/+$/, '')}/api/webhooks/transfermit`;

      // Extract client IP
      const clientIp =
        req.headers.get('cf-connecting-ip') ||
        (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() ||
        req.headers.get('x-real-ip') ||
        undefined;

      // 3. Request deposit from Transfermit API
      const gatewayResponse = await createTransfermitPayment({
        amount: numericAmount,
        currency: normalizedCurrency,
        referenceId,
        paymentMethod,
        returnUrl,
        webhookUrl,
        customer: {
          referenceId: String(user._id),
          firstName: user.firstName || 'Customer',
          lastName: user.lastName || 'Customer',
          email: user.email,
          phone: user.phone,
          ip: clientIp,
        },
        billingAddress: {
          addressLine1: user.streetAddress || 'Pärnu mnt 20',
          city: user.city || 'Tallinn',
          postalCode: user.postalCode || '10141',
          countryCode: (user.country || 'EE').slice(0, 2).toUpperCase(),
        },
      });

      // 4. Update transaction with provider payment ID
      if (gatewayResponse.paymentId) {
        await db.collection(COLLECTIONS.USER).updateOne(
          { _id: user._id, 'transactions.id': referenceId },
          {
            $set: {
              'transactions.$.providerRef': gatewayResponse.paymentId,
              'transactions.$.status': gatewayResponse.state === 'COMPLETED' ? 'completed' : 'pending',
            },
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          redirectUrl: gatewayResponse.redirectUrl,
          paymentId: gatewayResponse.paymentId,
          referenceId,
          state: gatewayResponse.state,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // --- Fallback Test Mode (when TRANSFERMIT_API_KEY is not yet filled in .env) ---
    const addedBaseEur = convertToBaseEur(numericAmount, normalizedCurrency);

    await db.collection(COLLECTIONS.USER).updateOne(
      { _id: user._id },
      {
        $inc: {
          balanceEur: addedBaseEur,
          [`balance.${normalizedCurrency}`]: numericAmount,
        },
        $push: {
          transactions: {
            id: referenceId,
            type: 'top_up',
            amount: numericAmount,
            currency: normalizedCurrency,
            paymentMethod: paymentMethodLabel,
            date: new Date(),
            status: 'completed',
            provider: 'demo',
          },
        },
      }
    );

    const pdfBuffer = await createInvoicePdf({
      invoiceNumber: referenceId,
      date: new Date().toISOString().split('T')[0],
      customerName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
      amount: numericAmount.toFixed(2),
      currency: normalizedCurrency,
      paymentMethod: paymentMethodLabel,
      billingAddress: {
        street: user.streetAddress || '',
        city: user.city || '',
        postalCode: user.postalCode || '',
        country: user.country || '',
      },
    });

    await sendEmail({
      to: user.email,
      ...buildInvoiceEmail({
        name: user.firstName || user.email,
        invoiceNumber: referenceId,
        amount: numericAmount.toFixed(2),
        currency: normalizedCurrency,
      }),
      attachments: [
        {
          filename: `${referenceId}.pdf`,
          content: pdfBuffer,
        },
      ],
    }).catch(() => null);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Top-up completed successfully (Test Mode). Invoice has been generated.',
        referenceId,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Top-up failed:', error);
    return new Response(
      JSON.stringify({ message: error.message || 'Top-up failed due to a server error.' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
