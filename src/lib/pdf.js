import PDFDocument from 'pdfkit';

export function createInvoicePdf({ invoiceNumber, date, customerName, amount, currency, paymentMethod, billingAddress }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(20).text('AetherFrame Invoice', { align: 'left' });
    doc.moveDown();

    doc.fontSize(12).text(`Invoice #: ${invoiceNumber}`);
    doc.text(`Date: ${date}`);
    doc.text(`Paid by: ${paymentMethod}`);
    doc.moveDown();

    doc.fontSize(14).text('Billing Information');
    doc.fontSize(12).text(`${customerName}`);
    if (billingAddress) {
      doc.text(billingAddress.street || '');
      doc.text(`${billingAddress.city || ''} ${billingAddress.postalCode || ''}`);
      doc.text(billingAddress.country || '');
    }
    doc.moveDown();

    doc.fontSize(14).text('Order Summary');
    doc.fontSize(12).text(`Amount: ${currency} ${amount}`);
    doc.moveDown();

    doc.text('Thank you for choosing AetherFrame AI.', { align: 'left' });
    doc.end();
  });
}
