import { connectToDatabase } from '../../../../lib/mongodb';
import { getUserFromToken } from '../../../../lib/auth';
import { createInvoicePdf } from '../../../../lib/pdf';
import { sendEmail, buildInvoiceEmail } from '../../../../lib/email';
import { COLLECTIONS } from '../../../../config/constants';

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

  const { amount, currency, paymentMethod } = await req.json();
  const numericAmount = Number(amount);

  if (!numericAmount || numericAmount < 10) {
    return new Response(JSON.stringify({ message: 'Minimum top-up amount is $10.00 USD.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!supportedCurrencies.has(currency)) {
    return new Response(JSON.stringify({ message: 'Unsupported currency. Use USD, EUR or GBP.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { db } = await connectToDatabase();
    const invoiceNumber = `AF-${Date.now()}`;
    const paymentMethodLabel = paymentMethod === 'visa' ? 'VISA' : paymentMethod === 'mastercard' ? 'Mastercard' : paymentMethod;

    await db.collection(COLLECTIONS.USER).updateOne(
    { _id: user._id },
    {
      $inc: { [`balance.${currency}`]: numericAmount },
      $push: {
        transactions: {
          id: invoiceNumber,
          type: 'top_up',
          amount: numericAmount,
          currency,
          paymentMethod: paymentMethodLabel,
          date: new Date(),
          status: 'completed',
        },
      },
    }
  );

  const pdfBuffer = await createInvoicePdf({
    invoiceNumber,
    date: new Date().toISOString().split('T')[0],
    customerName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
    amount: numericAmount.toFixed(2),
    currency,
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
        invoiceNumber,
        amount: numericAmount.toFixed(2),
        currency,
      }),
      attachments: [
        {
          filename: `${invoiceNumber}.pdf`,
          content: pdfBuffer,
        },
      ],
    }).catch(() => null);

    return new Response(JSON.stringify({ message: 'Top-up completed successfully. Invoice has been emailed if email delivery is configured.' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Top-up failed:', error);
    return new Response(JSON.stringify({ message: error.message || 'Top-up failed due to a server error.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
