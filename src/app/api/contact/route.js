import { connectToDatabase } from '../../../lib/mongodb';
import { COLLECTIONS } from '../../../config/constants';
import { sendEmail } from '../../../lib/email';

function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || process.env.EMAIL_FROM || 'no-reply@dexeric.ai';

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const { fullName, email, company = '', projectType = '', message } = body;

  if (!fullName || !fullName.trim() || !email || !email.trim() || !message || !message.trim()) {
    return jsonResponse({ message: 'Full name, email and message are required.' }, 400);
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email.trim())) {
    return jsonResponse({ message: 'Please provide a valid email address.' }, 400);
  }

  const { db } = await connectToDatabase();
  const doc = {
    fullName: fullName.trim(),
    email: email.trim(),
    company: company.trim(),
    projectType: projectType.trim(),
    message: message.trim(),
    status: 'new',
    createdAt: new Date(),
  };
  await db.collection(COLLECTIONS.CONTACT_MESSAGES).insertOne(doc);

  // Найкраще зусилля: не блокуємо відповідь, якщо SMTP не налаштований
  try {
    await sendEmail({
      to: SUPPORT_EMAIL,
      subject: `New contact request: ${doc.projectType || 'General inquiry'}`,
      html: `
        <div style="font-family: sans-serif; line-height: 1.5; color: #111;">
          <h2>New contact form submission</h2>
          <p><strong>Name:</strong> ${doc.fullName}</p>
          <p><strong>Email:</strong> ${doc.email}</p>
          <p><strong>Company:</strong> ${doc.company || '—'}</p>
          <p><strong>Project type:</strong> ${doc.projectType || '—'}</p>
          <p><strong>Message:</strong></p>
          <p>${doc.message.replace(/\n/g, '<br/>')}</p>
        </div>
      `,
    });
  } catch (err) {
    console.error('Failed to send contact notification email:', err);
  }

  return jsonResponse({ message: 'Your request has been received. We will be in touch soon.' }, 200);
}
