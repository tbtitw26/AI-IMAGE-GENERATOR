'use client';

import { useEffect, useMemo, useState } from 'react';
import { jsPDF } from 'jspdf';
import styles from './page.module.scss';

// Імпорт компонентів
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';

export default function OrdersPage() {
  const { user, token } = useAuth();
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [rawTransactions, setRawTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    setIsLoading(true);
    fetch('/api/wallet/transactions', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => setRawTransactions(data.transactions || []))
      .finally(() => setIsLoading(false));
  }, [token]);

  // Мапимо реальні транзакції у формат "order/invoice", який очікує решта сторінки
  const orders = useMemo(() => {
    const customerName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email || '';
    return rawTransactions.map((tx) => ({
      id: tx.id,
      description: tx.type === 'top_up' ? `Wallet Top Up (${tx.paymentMethod || 'card'})` : 'AI Image Generation',
      date: new Date(tx.date).toISOString().split('T')[0],
      amount: Math.abs(Number(tx.amount)),
      status: tx.status === 'completed' ? 'paid' : 'pending',
      customer: customerName,
      email: user?.email || '',
      serviceType: tx.type === 'top_up' ? 'Wallet top up' : 'Generation credits',
      dueDate: new Date(tx.date).toISOString().split('T')[0],
      items: [
        { name: tx.type === 'top_up' ? 'Wallet top up' : 'AI image generation', quantity: 1, price: Math.abs(Number(tx.amount)) },
      ],
    }));
  }, [rawTransactions, user]);

  const stats = [
    { label: 'Total Orders', value: String(orders.length) },
    {
      label: 'Total Spent',
      value: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
        orders.filter((o) => o.status === 'paid').reduce((sum, o) => sum + o.amount, 0)
      ),
    },
  ];

  const statusColors = {
    paid: 'tertiary',
    pending: 'surface',
    failed: 'error',
  };

  const statusLabels = {
    paid: 'Paid',
    pending: 'Pending',
    failed: 'Failed',
  };

  const filteredOrders = orders.filter((order) => {
    if (filter !== 'all' && order.status !== filter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        order.id.toLowerCase().includes(query) ||
        order.description.toLowerCase().includes(query) ||
        order.serviceType.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const formatCurrency = (value) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);

  const createInvoicePdf = (order) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFillColor(17, 24, 39);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('AetherFrame AI', 14, 18);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Invoice export', 14, 28);

    doc.setTextColor(33, 37, 41);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(order.id, 14, 56);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(`Invoice for ${order.customer}`, 14, 68);
    doc.text(`Email: ${order.email}`, 14, 76);
    doc.text(`Service: ${order.serviceType}`, 14, 84);
    doc.text(`Issued: ${order.date}`, 14, 92);
    doc.text(`Due: ${order.dueDate}`, 14, 100);

    doc.setDrawColor(200, 200, 200);
    doc.line(14, 112, pageWidth - 14, 112);

    let y = 124;
    order.items.forEach((item) => {
      doc.text(item.name, 14, y);
      doc.text(`${item.quantity} x`, pageWidth - 90, y);
      doc.text(formatCurrency(item.price), pageWidth - 24, y, { align: 'right' });
      y += 10;
    });

    doc.line(14, y + 4, pageWidth - 14, y + 4);
    doc.setFont('helvetica', 'bold');
    doc.text('Total Due', 14, y + 18);
    doc.text(formatCurrency(order.amount), pageWidth - 24, y + 18, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Thank you for choosing AetherFrame AI.', 14, y + 34);

    doc.save(`${order.id}.pdf`);
    setSelectedInvoice(order);
  };

  const downloadStatementPdf = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFillColor(17, 24, 39);
    doc.rect(0, 0, pageWidth, 36, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('AetherFrame AI Billing Statement', 14, 20);

    doc.setTextColor(33, 37, 41);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text('Account: Alexander Wright', 14, 50);
    doc.text('Billing period: October 2024', 14, 58);

    let y = 74;
    filteredOrders.forEach((order) => {
      doc.text(`${order.id} — ${order.description}`, 14, y);
      doc.text(formatCurrency(order.amount), pageWidth - 24, y, { align: 'right' });
      y += 8;
    });

    doc.setFont('helvetica', 'bold');
    doc.text('Total', 14, y + 10);
    doc.text(
      formatCurrency(filteredOrders.reduce((sum, order) => sum + order.amount, 0)),
      pageWidth - 24,
      y + 10,
      { align: 'right' }
    );

    doc.save('aetherframe-statement.pdf');
  };

  return (
    <DashboardLayout>
      <div className={styles.orders}>
        {/* SECTION 1: BILLING CENTER */}
        <section className={styles.billingHeader}>
          <div className={styles.billingHeaderContent}>
            <h1>Orders &amp; Invoices</h1>
            <p>
              Manage your enterprise billing, download detailed PDF invoices, and monitor your AI
              compute usage in real-time.
            </p>
          </div>

          <div className={styles.billingStats}>
            {stats.map((stat, index) => (
              <div key={index} className={styles.statCard}>
                <span className={styles.statLabel}>{stat.label}</span>
                <span className={styles.statValue}>{stat.value}</span>
              </div>
            ))}
            <div className={`${styles.statCard} ${styles.statCardFull}`}>
              <div className={styles.planInfo}>
                <div>
                  <span className={styles.statLabel}>Active Plan</span>
                  <div className={styles.planBadgeWrapper}>
                    <span className={styles.planName}>Professional</span>
                    <span className={styles.planVerified}>Verified</span>
                  </div>
                </div>
                <button className={styles.manageBtn}>
                  Manage
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: ORDER HISTORY */}
        <section className={styles.orderHistory}>
          <div className={styles.orderHeader}>
            <h2>Recent Transactions</h2>
            <div className={styles.orderActions}>
              <button className={styles.downloadStatementBtn} onClick={downloadStatementPdf}>
                <span className="material-symbols-outlined">download</span>
                Download Statement
              </button>
              <button className={styles.filterBtn}>
                <span className="material-symbols-outlined">filter_list</span>
                Filter
              </button>
              <button className={styles.exportBtn}>
                <span className="material-symbols-outlined">download</span>
                Export CSV
              </button>
            </div>
          </div>

          {/* Search & Filter */}
          <div className={styles.searchFilter}>
            <div className={styles.searchWrapper}>
              <span className="material-symbols-outlined">search</span>
              <input
                type="text"
                placeholder="Search orders, invoices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className={styles.filterTabs}>
              <button
                className={`${styles.filterTab} ${filter === 'all' ? styles.active : ''}`}
                onClick={() => setFilter('all')}
              >
                All
              </button>
              <button
                className={`${styles.filterTab} ${filter === 'paid' ? styles.active : ''}`}
                onClick={() => setFilter('paid')}
              >
                Paid
              </button>
              <button
                className={`${styles.filterTab} ${filter === 'pending' ? styles.active : ''}`}
                onClick={() => setFilter('pending')}
              >
                Pending
              </button>
              <button
                className={`${styles.filterTab} ${filter === 'failed' ? styles.active : ''}`}
                onClick={() => setFilter('failed')}
              >
                Failed
              </button>
            </div>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.orderTable}>
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Description</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th className={styles.actionCol}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="6" className={styles.emptyState}>
                      <span className="material-symbols-outlined">receipt_long</span>
                      <p>No orders found</p>
                      <span>Try adjusting your search or filter criteria.</span>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className={styles.orderRow}>
                      <td className={styles.orderId}>{order.id}</td>
                      <td className={styles.orderDescription}>{order.description}</td>
                      <td className={styles.orderDate}>{order.date}</td>
                      <td className={styles.orderAmount}>{formatCurrency(order.amount)}</td>
                      <td>
                        <span className={`${styles.statusBadge} ${styles[`status${statusColors[order.status].charAt(0).toUpperCase() + statusColors[order.status].slice(1)}`]}`}>
                          {statusLabels[order.status]}
                        </span>
                      </td>
                      <td className={styles.actionCol}>
                        <div className={styles.actionButtons}>
                          <button className={styles.pdfBtn} onClick={() => createInvoicePdf(order)}>
                            <span className="material-symbols-outlined">description</span>
                            <span>PDF</span>
                          </button>
                          <button className={styles.downloadBtn}>
                            <span className="material-symbols-outlined">download</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <div className={styles.tableFooter}>
              <button className={styles.viewAllBtn}>View All Transactions</button>
            </div>
          </div>
        </section>

        {/* SECTION 3: PAYMENT ANALYTICS */}
        <section className={styles.analytics}>
          <h2>Compute Usage &amp; Spend</h2>

          <div className={styles.analyticsGrid}>
            <div className={styles.spendChart}>
              <div className={styles.chartHeader}>
                <div>
                  <span className={styles.chartLabel}>Monthly Spend</span>
                  <div className={styles.chartAmount}>$3,450.00</div>
                </div>
                <select className={styles.chartSelect}>
                  <option>Last 30 Days</option>
                  <option>This Quarter</option>
                  <option>This Year</option>
                </select>
              </div>
              <div className={styles.chartPlaceholder}>
                <div className={styles.chartBackground}></div>
              </div>
            </div>

            <div className={styles.analyticsStats}>
              <div className={styles.analyticsCard}>
                <div className={styles.analyticsIconSecondary}>
                  <span className="material-symbols-outlined">generating_tokens</span>
                </div>
                <span className={styles.analyticsLabel}>Tokens Used</span>
                <span className={styles.analyticsValue}>4.2M</span>
                <span className={styles.analyticsTrend}>
                  <span className="material-symbols-outlined">trending_up</span>
                  +12% this month
                </span>
              </div>
              <div className={styles.analyticsCard}>
                <div className={styles.analyticsIconPrimary}>
                  <span className="material-symbols-outlined">timer</span>
                </div>
                <span className={styles.analyticsLabel}>GPU Hours</span>
                <span className={styles.analyticsValue}>184h</span>
                <span className={styles.analyticsSubtext}>Within plan limits</span>
              </div>
            </div>
          </div>
        </section>

        {selectedInvoice && (
          <div style={{ marginTop: '24px', background: 'rgba(22, 22, 30, 0.9)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(178, 197, 255, 0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div>
                <h3 style={{ margin: 0, color: '#f3f4f6' }}>{selectedInvoice.id}</h3>
                <p style={{ margin: '4px 0 0', color: '#c3c6d6' }}>{selectedInvoice.description}</p>
              </div>
              <button onClick={() => setSelectedInvoice(null)} style={{ background: 'transparent', color: '#b2c5ff', border: '1px solid rgba(178, 197, 255, 0.2)', borderRadius: '999px', padding: '8px 12px', cursor: 'pointer' }}>Close</button>
            </div>
            <p style={{ marginTop: '10px', color: '#c3c6d6' }}>Amount: {formatCurrency(selectedInvoice.amount)} • Status: {statusLabels[selectedInvoice.status]}</p>
            <p style={{ marginTop: '6px', color: '#c3c6d6' }}>Service: {selectedInvoice.serviceType} • Due: {selectedInvoice.dueDate}</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}