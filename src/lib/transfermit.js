import crypto from 'crypto';
import { connectToDatabase } from './mongodb';
import { COLLECTIONS } from '../config/constants';
import { convertToBaseEur } from '../config/currency';
import { createInvoicePdf } from './pdf';
import { sendEmail, buildInvoiceEmail } from './email';

const DEFAULT_API_URL = 'https://app.transfermit.com/api/v1/payments';

/**
 * Format phone number according to Transfermit requirements:
 * Must be in the format '123 456' (country code, space, remaining digits), no '+' sign.
 * Returns undefined if no phone or invalid length.
 */
export function formatTransfermitPhone(phone) {
  if (!phone || typeof phone !== 'string') return undefined;
  const digits = phone.replace(/\D/g, '');
  if (!digits || digits.length < 4) return undefined;
  // Format: 2 digits country code + space + rest
  return `${digits.slice(0, 2)} ${digits.slice(2)}`;
}

/**
 * Map internal payment method to Transfermit method code
 */
export function mapPaymentMethod(method) {
  switch (String(method || '').toLowerCase()) {
    case 'bank':
    case 'banktransfer':
    case 'sepa':
      return 'BANKTRANSFER';
    case 'crypto':
      return 'CRYPTO';
    case 'ideal':
      return 'IDEAL';
    case 'sofort':
      return 'SOFORT';
    case 'blik':
      return 'BLIK';
    case 'card':
    case 'visa':
    case 'mastercard':
    case 'basic_card':
    default:
      return 'BASIC_CARD';
  }
}

/**
 * Verify HMAC-SHA256 webhook signature with timing-safe comparison
 */
export function verifyWebhookSignature(rawBody, signatureHeader, secret = process.env.TRANSFERMIT_WEBHOOK_SECRET) {
  if (!secret) {
    console.warn('[Transfermit] TRANSFERMIT_WEBHOOK_SECRET is not configured.');
    return false;
  }
  if (!signatureHeader || !rawBody) {
    return false;
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    const sigBuf = Buffer.from(signatureHeader.trim());
    const expBuf = Buffer.from(expectedSignature);

    if (sigBuf.length !== expBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(sigBuf, expBuf);
  } catch (err) {
    console.error('[Transfermit] Signature verification error:', err);
    return false;
  }
}

/**
 * Create a DEPOSIT payment via Transfermit API
 */
export async function createTransfermitPayment({
  amount,
  currency = 'EUR',
  referenceId,
  customer,
  billingAddress,
  paymentMethod = 'BASIC_CARD',
  returnUrl,
  webhookUrl,
}) {
  const apiKey = process.env.TRANSFERMIT_API_KEY;
  const apiUrl = process.env.TRANSFERMIT_API_URL || DEFAULT_API_URL;

  if (!apiKey) {
    throw new Error('TRANSFERMIT_API_KEY is not configured.');
  }

  const payload = {
    paymentType: 'DEPOSIT',
    amount: Number(amount),
    currency: String(currency).toUpperCase(),
    referenceId,
    paymentMethod: mapPaymentMethod(paymentMethod),
    returnUrl,
    webhookUrl,
    customer: {
      referenceId: customer?.referenceId || referenceId,
      firstName: customer?.firstName?.trim() || 'Customer',
      lastName: customer?.lastName?.trim() || 'Customer',
      email: customer?.email || 'customer@dexericai.com',
      ...(customer?.phone ? { phone: formatTransfermitPhone(customer.phone) } : {}),
      ...(customer?.ip ? { ip: customer.ip } : {}),
    },
    billingAddress: {
      addressLine1: billingAddress?.addressLine1 || billingAddress?.street || 'Pärnu mnt 20',
      addressLine2: billingAddress?.addressLine2 || null,
      city: billingAddress?.city || 'Tallinn',
      countryCode: (billingAddress?.countryCode || billingAddress?.country || 'EE').slice(0, 2).toUpperCase(),
      postalCode: billingAddress?.postalCode || '10141',
      state: billingAddress?.state || null,
    },
  };

  // Clean out undefined phone if normalization failed
  if (payload.customer && payload.customer.phone === undefined) {
    delete payload.customer.phone;
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'User-Agent': 'DexericAI-NextJS/1.0.0',
    },
    body: JSON.stringify(payload),
  });

  const responseText = await response.text();
  let data;
  try {
    data = responseText ? JSON.parse(responseText) : {};
  } catch (e) {
    throw new Error(`Transfermit returned non-JSON response: ${responseText.slice(0, 200)}`);
  }

  if (!response.ok) {
    const errorMsg = data?.message || data?.error || `Payment gateway error (${response.status})`;
    throw new Error(errorMsg);
  }

  const paymentId = data?.result?.id || data?.id;
  const redirectUrl =
    data?.result?.redirectUrl ||
    data?.result?.url ||
    data?.redirectUrl ||
    data?.url;

  return {
    paymentId,
    redirectUrl,
    state: data?.result?.state || data?.state || 'AWAITING_REDIRECT',
    raw: data,
  };
}

/**
 * Fetch payment status by ID from Transfermit API
 */
export async function getTransfermitPayment(paymentId) {
  const apiKey = process.env.TRANSFERMIT_API_KEY;
  const apiUrl = process.env.TRANSFERMIT_API_URL || DEFAULT_API_URL;

  if (!apiKey) {
    throw new Error('TRANSFERMIT_API_KEY is not configured.');
  }

  const cleanUrl = apiUrl.replace(/\/+$/, '');
  const response = await fetch(`${cleanUrl}/${paymentId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
      'User-Agent': 'DexericAI-NextJS/1.0.0',
    },
  });

  const responseText = await response.text();
  let data;
  try {
    data = responseText ? JSON.parse(responseText) : {};
  } catch (e) {
    throw new Error(`Transfermit returned non-JSON response: ${responseText.slice(0, 200)}`);
  }

  if (!response.ok) {
    const errorMsg = data?.message || data?.error || `Payment lookup failed (${response.status})`;
    throw new Error(errorMsg);
  }

  return data?.result || data;
}

/**
 * Atomically complete a pending top-up payment in the database (idempotent).
 * Marks transaction as completed, increments user balance, and delivers invoice.
 */
export async function completePaymentTransaction({
  referenceId,
  paymentId,
  amount,
  currency = 'EUR',
  paymentMethod = 'Credit/Debit Card',
  cardDetails = null,
}) {
  const { db } = await connectToDatabase();

  // 1. Locate the user who owns this transaction
  const query = {
    $or: [
      { 'transactions.id': referenceId },
      ...(paymentId ? [{ 'transactions.providerRef': paymentId }] : []),
    ],
  };

  const user = await db.collection(COLLECTIONS.USER).findOne(query);

  if (!user) {
    return { success: false, error: 'Transaction or user not found', notFound: true };
  }

  const existingTx = (user.transactions || []).find(
    (t) => t.id === referenceId || (paymentId && t.providerRef === paymentId)
  );

  if (!existingTx) {
    return { success: false, error: 'Transaction not found in user record', notFound: true };
  }

  // Idempotency check: If already completed, do not credit again
  if (existingTx.status === 'completed') {
    return { success: true, alreadyCompleted: true, user, transaction: existingTx };
  }

  const finalAmount = Number(amount || existingTx.amount);
  const finalCurrency = currency || existingTx.currency || 'EUR';
  const addedBaseEur = convertToBaseEur(finalAmount, finalCurrency);

  const paymentMethodLabel = cardDetails?.cardBrand
    ? `${cardDetails.cardBrand} •••• ${cardDetails.cardLast4 || ''}`.trim()
    : paymentMethod || existingTx.paymentMethod || 'Credit/Debit Card';

  // 2. Perform atomic update
  const updateResult = await db.collection(COLLECTIONS.USER).updateOne(
    {
      _id: user._id,
      'transactions.id': existingTx.id,
      'transactions.status': { $ne: 'completed' }, // concurrency safeguard
    },
    {
      $inc: {
        balanceEur: addedBaseEur,
        [`balance.${finalCurrency}`]: finalAmount,
      },
      $set: {
        'transactions.$.status': 'completed',
        'transactions.$.completedAt': new Date(),
        'transactions.$.providerRef': paymentId || existingTx.providerRef || null,
        'transactions.$.paymentMethod': paymentMethodLabel,
      },
    }
  );

  if (updateResult.modifiedCount === 0) {
    // Another worker or webhook already completed it
    const refreshedUser = await db.collection(COLLECTIONS.USER).findOne({ _id: user._id });
    return { success: true, alreadyCompleted: true, user: refreshedUser, transaction: existingTx };
  }

  // 3. Generate invoice PDF and send email asynchronously
  const invoiceNumber = existingTx.id;
  try {
    const pdfBuffer = await createInvoicePdf({
      invoiceNumber,
      date: new Date().toISOString().split('T')[0],
      customerName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
      amount: finalAmount.toFixed(2),
      currency: finalCurrency,
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
        amount: finalAmount.toFixed(2),
        currency: finalCurrency,
      }),
      attachments: [
        {
          filename: `${invoiceNumber}.pdf`,
          content: pdfBuffer,
        },
      ],
    }).catch((err) => {
      console.warn('[Transfermit] Failed to send invoice email:', err.message);
    });
  } catch (err) {
    console.warn('[Transfermit] Error generating invoice PDF:', err.message);
  }

  const updatedUser = await db.collection(COLLECTIONS.USER).findOne({ _id: user._id });
  return { success: true, alreadyCompleted: false, user: updatedUser, transaction: existingTx };
}

/**
 * Mark a transaction as failed in the database
 */
export async function failPaymentTransaction({ referenceId, paymentId, reason = 'Payment declined' }) {
  const { db } = await connectToDatabase();
  const query = {
    $or: [
      { 'transactions.id': referenceId },
      ...(paymentId ? [{ 'transactions.providerRef': paymentId }] : []),
    ],
  };

  await db.collection(COLLECTIONS.USER).updateOne(
    {
      ...query,
      'transactions.status': { $in: ['pending', 'awaiting_redirect', 'checkout'] },
    },
    {
      $set: {
        'transactions.$.status': 'failed',
        'transactions.$.failedReason': reason,
        'transactions.$.updatedAt': new Date(),
      },
    }
  );
}
