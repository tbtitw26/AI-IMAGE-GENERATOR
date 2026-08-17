'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './page.module.scss';

// Імпорт компонентів
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { useCurrency } from '@/context/CurrencyContext';
import { CURRENCIES, priceInCurrency, formatUserBalance, getUserBalance } from '@/config/currency';

const TX_ICONS = {
  top_up: 'add_circle',
  generation: 'auto_awesome',
};

export default function WalletPage() {
  const { user, token, refreshUser } = useAuth();
  const { currency } = useCurrency();
  const [showStatements, setShowStatements] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    let isMounted = true;
    fetch('/api/wallet/transactions', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        if (isMounted) setTransactions(data.transactions || []);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    refreshUser();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Будуємо реальний спарклайн для кожної валюти на основі фактичної історії
  // транзакцій (замість статичної/фейкової лінії).
  const buildSparkline = (curCode) => {
    const currencyTx = transactions
      .filter((tx) => tx.status === 'completed')
      .slice()
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (currencyTx.length === 0) {
      return { path: 'M0,25 L100,25', trend: 'neutral' };
    }

    const currentBalance = getUserBalance(user, curCode);
    let running = currentBalance;
    const points = [running];
    for (let i = currencyTx.length - 1; i >= 0; i -= 1) {
      running -= Number(currencyTx[i].amount);
      points.unshift(running);
    }

    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;

    const coords = points.map((value, index) => {
      const x = (index / (points.length - 1)) * 100;
      const y = 28 - ((value - min) / range) * 26;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    const path = `M${coords.join(' L')}`;
    const trend = points[points.length - 1] >= points[0] ? 'up' : 'down';

    return { path, trend };
  };

  const balances = [
    { currency: 'EUR', amount: formatUserBalance(user, 'EUR'), icon: 'euro', ...buildSparkline('EUR') },
    { currency: 'USD', amount: formatUserBalance(user, 'USD'), icon: 'payments', ...buildSparkline('USD') },
    { currency: 'GBP', amount: formatUserBalance(user, 'GBP'), icon: 'currency_pound', ...buildSparkline('GBP') },
  ];

  const vipServices = [
    {
      name: 'Priority Rendering',
      price: priceInCurrency(299, currency),
      period: `/${currency.toLowerCase()}`,
      description: 'Skip the queue for 30 days. Perfect for tight deadlines.',
      popular: false,
    },
    {
      name: 'Private Creative Director',
      price: priceInCurrency(999, currency),
      period: `/${currency.toLowerCase()}`,
      description: 'Dedicated AI tuning, private models, and 1-on-1 strategy sessions.',
      popular: true,
    },
    {
      name: 'Enterprise Campaign',
      price: priceInCurrency(599, currency),
      period: `/${currency.toLowerCase()}`,
      description: 'Bulk generation credits with specialized agency-grade presets.',
      popular: false,
    },
  ];

  const securityFeatures = [
    {
      icon: 'enhanced_encryption',
      title: 'Encrypted Ledger',
      description: 'All transactions are secured with military-grade AES-256 encryption.',
      color: 'tertiary',
    },
    {
      icon: 'receipt_long',
      title: 'Auto Invoices',
      description: 'PDF receipts automatically generated and emailed post-transaction.',
      color: 'primary',
    },
    {
      icon: 'support_agent',
      title: 'Billing Support',
      description: 'Priority routing for all payment and balance inquiries.',
      color: 'secondary',
    },
    {
      icon: 'settings_account_box',
      title: 'Team Allocation',
      description: 'Distribute balance across workspace members automatically.',
      color: 'outline',
    },
  ];

  return (
    <DashboardLayout>
      <div className={styles.wallet}>
        {/* SECTION 1: BALANCE OVERVIEW */}
        <section className={styles.overview}>
          <div className={styles.overviewContent}>
            <h1>Balance</h1>
            <p>Manage your creative credits, payments, invoices and premium services from one secure workspace.</p>
            <div className={styles.overviewActions}>
              <Link href="/dashboard/top-up" className={styles.primaryBtn}>
                Top Up Balance
              </Link>
              <button className={styles.secondaryBtn} onClick={() => setShowStatements((prev) => !prev)}>View Statements</button>
            </div>
          </div>

          <div className={styles.balanceCard}>
            <div className={styles.balanceCardBg}></div>
            <div className={styles.balanceCardContent}>
              <div className={styles.balanceHeader}>
                <div>
                  <span className={styles.balanceLabel}>Total Available</span>
                  <div className={styles.balanceAmount}>
                    <span>{formatUserBalance(user, currency)}</span>
                    <span className={styles.balanceCurrency}>{currency}</span>
                  </div>
                </div>
                <div className={styles.balanceIcon}>
                  <span className="material-symbols-outlined">account_balance_wallet</span>
                </div>
              </div>
              <div className={styles.balanceDivider}></div>
              <div className={styles.balanceFooter}>
                <div className={styles.verifiedBadge} style={{ marginLeft: 0 }}>
                  <span className="material-symbols-outlined">verified_user</span>
                  <span>Unified Multi-Currency Balance</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {showStatements && (
          <section style={{ marginBottom: '24px', background: 'rgba(22, 22, 30, 0.8)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(178, 197, 255, 0.2)' }}>
            <h2 style={{ marginTop: 0, color: '#f3f4f6' }}>Latest statements</h2>
            <ul style={{ paddingLeft: '18px', color: '#c3c6d6', lineHeight: 1.7 }}>
              <li>Oct 24, 2024 — Top up completed successfully</li>
              <li>Oct 23, 2024 — Batch generation charge applied</li>
              <li>Oct 20, 2024 — VIP package invoice generated</li>
            </ul>
          </section>
        )}

        {/* SECTION 2: BALANCE CARDS */}
        <section className={styles.balances}>
          {balances.map((balance, index) => (
            <div key={index} className={styles.balanceCardSmall}>
              <div className={styles.balanceCardSmallHeader}>
                <div className={styles.balanceCardSmallIcon}>
                  <span className="material-symbols-outlined">{balance.icon}</span>
                </div>
                <span className={styles.balanceCardSmallCurrency}>{balance.currency} Balance</span>
                <span className="material-symbols-outlined">arrow_outward</span>
              </div>
              <div className={styles.balanceCardSmallBody}>
                <h3>{balance.amount}</h3>
              </div>
              <div className={styles.balanceCardSmallChart}>
                <svg viewBox="0 0 100 30" preserveAspectRatio="none">
                  <path
                    className={
                      balance.trend === 'up'
                        ? styles.sparklineUp
                        : balance.trend === 'down'
                        ? styles.sparklineDown
                        : styles.sparklineNeutral
                    }
                    d={balance.path}
                  />
                </svg>
              </div>
            </div>
          ))}
        </section>

        {/* SECTION 3: RECENT TRANSACTIONS */}
        <section className={styles.transactions}>
          <div className={styles.transactionsHeader}>
            <h2>Recent Transactions</h2>
            <Link href="/dashboard/orders" className={styles.viewAllBtn}>
              View All <span className="material-symbols-outlined">chevron_right</span>
            </Link>
          </div>

          <div className={styles.transactionsList}>
            {isLoading ? (
              <p style={{ color: '#94a3b8' }}>Loading transactions...</p>
            ) : transactions.length === 0 ? (
              <p style={{ color: '#94a3b8' }}>No transactions yet.</p>
            ) : (
              transactions.slice(0, 10).map((tx) => (
                <div key={tx.id} className={styles.transactionItem}>
                  <div className={styles.transactionLeft}>
                    <div className={styles.transactionIcon}>
                      <span className="material-symbols-outlined">{TX_ICONS[tx.type] || 'receipt_long'}</span>
                    </div>
                    <div>
                      <p className={styles.transactionTitle}>{tx.type === 'top_up' ? 'Account Top Up' : 'Image Generation'}</p>
                      <p className={styles.transactionDate}>{new Date(tx.date).toLocaleString()}{tx.paymentMethod ? ` • ${tx.paymentMethod}` : ''}</p>
                    </div>
                  </div>
                  <div className={styles.transactionRight}>
                    <p className={styles.transactionAmount}>{tx.amount > 0 ? '+' : ''}{Number(tx.amount).toFixed(2)} {tx.currency}</p>
                    <span className={`${styles.transactionStatus} ${styles.statusTertiary}`}>
                      {tx.status === 'completed' ? 'Completed' : tx.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* SECTION 4: VIP CREATIVE SERVICES */}
        <section className={styles.vipServices}>
          <div className={styles.vipHeader}>
            <h2>VIP Creative Services</h2>
            <p>Elevate your production with priority access and dedicated resources.</p>
          </div>

          <div className={styles.vipGrid}>
            {vipServices.map((service, index) => (
              <div
                key={index}
                className={`${styles.vipCard} ${service.popular ? styles.vipCardPopular : ''}`}
              >
                {service.popular && (
                  <>
                    <div className={styles.vipCardGlow}></div>
                    <div className={styles.vipCardBg}></div>
                    <div className={styles.vipCardContent}>
                      <span className={styles.vipBadge}>Most Popular</span>
                      <h4>{service.name}</h4>
                      <p>{service.description}</p>
                      <div className={styles.vipPrice}>
                        {service.price} <span>{service.period}</span>
                      </div>
                      <Link href="/contact" className={service.popular ? styles.vipBtnPopular : styles.vipBtn}>
                        {service.popular ? 'Upgrade to Private' : 'Select Tier'}
                      </Link>
                    </div>
                  </>
                )}
                {!service.popular && (
                  <>
                    <h4>{service.name}</h4>
                    <p>{service.description}</p>
                    <div className={styles.vipPrice}>
                      {service.price} <span>{service.period}</span>
                    </div>
                    <Link href="/contact" className={styles.vipBtn}>Select Tier</Link>
                  </>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 5: PAYMENT METHODS */}
        <section className={styles.paymentMethods}>
          <div className={styles.paymentHeader}>
            <h2>Payment Methods</h2>
            <span className={styles.paymentSecure}>
              <span className="material-symbols-outlined">lock</span> PCI DSS Compliant
            </span>
          </div>

          <div className={styles.paymentGrid}>
            <div className={styles.paymentCard}>
              <div className={styles.paymentCardGlow}></div>
              <div className={styles.paymentCardHeader}>
                <span className={styles.paymentPrimary}>Primary</span>
                <span className="material-symbols-outlined">credit_card</span>
              </div>
              <div className={styles.paymentCardBody}>
                <p className={styles.cardNumber}>•••• •••• •••• 4242</p>
                <div className={styles.cardDetails}>
                  <span>Expires 12/25</span>
                  <span className={styles.cardBrand}>Visa</span>
                </div>
              </div>
            </div>

            <div className={styles.addCard}>
              <div className={styles.addCardIcon}>
                <span className="material-symbols-outlined">add</span>
              </div>
              <p>Add New Card</p>
            </div>
          </div>
        </section>

        {/* SECTION 6: SECURITY & BILLING */}
        <section className={styles.security}>
          {securityFeatures.map((feature, index) => (
            <div key={index} className={styles.securityCard}>
              <span className={`material-symbols-outlined ${styles[`securityIcon${feature.color.charAt(0).toUpperCase() + feature.color.slice(1)}`]}`}>
                {feature.icon}
              </span>
              <h4>{feature.title}</h4>
              <p>{feature.description}</p>
            </div>
          ))}
        </section>

        {/* SECTION 7: FINAL CTA */}
        <section className={styles.cta}>
          <div className={styles.ctaIcon}>
            <span className="material-symbols-outlined">verified</span>
          </div>
          <h2>Workspace ready.</h2>
          <p>Everything you need to manage your creative workspace securely and efficiently.</p>
          <div className={styles.ctaActions}>
            <Link href="/dashboard/top-up" className={styles.ctaPrimary}>
              Add Funds
            </Link>
            <Link href="/dashboard/orders" className={styles.ctaSecondary}>
              View Past Orders
            </Link>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}