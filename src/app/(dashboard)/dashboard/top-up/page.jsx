'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.scss';

// Імпорт компонентів
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { useCurrency } from '@/context/CurrencyContext';
import { CURRENCIES, convertPrice, formatUserBalance, priceInCurrency } from '@/config/currency';

export default function TopUpPage() {
  const { token, user, refreshUser } = useAuth();
  const { currency } = useCurrency();
  const [selectedAmount, setSelectedAmount] = useState(100);
  const [customAmount, setCustomAmount] = useState('');
  const currencySymbol = CURRENCIES[currency]?.symbol || '€';

  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardholderName, setCardholderName] = useState(
    user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'ALEXANDER WRIGHT'
  );
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const minAmount = convertPrice(10, currency);
  const amountOptions = [10, 25, 50, 100, 250, 500, 1000].map((eur) => convertPrice(eur, currency));

  const handleAmountSelect = (amount) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleCustomAmount = (e) => {
    const value = e.target.value;
    setCustomAmount(value);
    if (value) {
      setSelectedAmount(null);
    }
  };

  const getDisplayAmount = () => {
    if (customAmount) return parseFloat(customAmount).toFixed(2);
    return selectedAmount ? selectedAmount.toFixed(2) : minAmount.toFixed(2);
  };

  const handlePayment = async () => {
    const amount = customAmount ? parseFloat(customAmount) : Number(selectedAmount);
    setError('');
    setSuccessMessage('');

    if (!amount || amount < minAmount) {
      setError(`Please enter an amount of at least ${currencySymbol}${minAmount.toFixed(2)} ${currency}.`);
      return;
    }

    setIsProcessing(true);

    try {
      if (!token) {
        throw new Error('Please sign in again before topping up.');
      }

      const response = await fetch('/api/payments/top-up', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount,
          currency,
          paymentMethod,
        }),
      });

      const text = await response.text();
      const data = text ? JSON.parse(text) : {};
      if (!response.ok) {
        throw new Error(data.message || 'Unable to complete top-up.');
      }

      setSuccessMessage(data.message || 'Top-up completed successfully. Your balance has been updated.');
      await refreshUser(token);
    } catch (err) {
      setError(err.message || 'Unable to complete top-up.');
    } finally {
      setIsProcessing(false);
    }
  };

  const features = [
    {
      icon: 'bolt',
      title: 'Instant Generation',
      description: 'No waiting. Your topped-up balance is instantly available for rendering.',
      color: 'primary',
    },
    {
      icon: 'speed',
      title: 'Priority Processing',
      description: 'Jump the queue. Premium balances guarantee fast GPU processing during peak hours.',
      color: 'secondary',
    },
    {
      icon: 'copyright',
      title: 'Commercial License',
      description: 'Full rights ownership. Every image generated is yours to monetize.',
      color: 'tertiary',
    },
    {
      icon: 'shield',
      title: 'Secure Transactions',
      description: 'Bank-grade security. Your payment data is processed securely and never stored.',
      color: 'emerald',
    },
  ];

  const packages = [
    {
      name: 'Priority Rendering',
      price: priceInCurrency(299, currency),
      period: `/${currency.toLowerCase()}`,
      description: 'Perfect for independent creators with high render demands.',
      features: ['Priority Rendering Queue', 'High-Resolution Presets', 'Commercial Licensing'],
      popular: false,
    },
    {
      name: 'Private Creative Director',
      price: priceInCurrency(999, currency),
      period: `/${currency.toLowerCase()}`,
      description: 'For enterprise agencies & creative studios.',
      features: [
        'Dedicated AI tuning support',
        'Direct consultation sessions',
        'Custom Prompt Engineering',
        'Priority Technical Support',
      ],
      popular: true,
    },
    {
      name: 'Enterprise Campaign',
      price: priceInCurrency(599, currency),
      period: `/${currency.toLowerCase()}`,
      description: 'For growing design teams and branding agencies.',
      features: ['High-Volume Generation Presets', 'Multi-format optimization', 'Commercial Asset Packaging'],
      popular: false,
    },
  ];

  return (
    <DashboardLayout>
      <div className={styles.topUp}>
        {/* SECTION 1: TOP UP YOUR BALANCE */}
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>
              <span className="material-symbols-outlined">security</span>
              <span>Secure Transaction</span>
            </div>
            <h1>Add Funds</h1>
            <p>
              Securely add balance to your dexericai account and instantly continue generating
              premium AI images without interruption.
            </p>
          </div>

          <div className={styles.summaryCard}>
            <div className={styles.summaryGlow}></div>
            <div className={styles.summaryHeader}>
              <span>Current Balance</span>
              <span className="material-symbols-outlined">account_balance_wallet</span>
            </div>
            <div className={styles.balanceAmount}>
              {formatUserBalance(user, currency)} <span className={styles.balanceCurrency}>{currency}</span>
            </div>
            <div className={styles.summaryDetails}>
              <div>
                <span className={styles.detailDotSecondary}></span>
                <span>Plan</span>
                <span className={styles.detailValueSecondary}>{user?.label || 'Free'}</span>
              </div>
              <div>
                <span className={styles.detailDotTertiary}></span>
                <span>License</span>
                <span className={styles.detailValueTertiary}>
                  {user?.limits?.commercialLicense ? 'Commercial' : 'Personal Use'}
                </span>
              </div>
              <div>
                <span className={styles.detailDotEmerald}></span>
                <span>Status</span>
                <span className={styles.detailValueEmerald}>
                  <span className="material-symbols-outlined">verified</span> Verified
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: SELECT AMOUNT */}
        <section className={styles.amountSection}>
          <div className={styles.amountHeader}>
            <h2>Select Amount</h2>
            <span>
              <span className="material-symbols-outlined">info</span> Minimum {currencySymbol}{minAmount.toFixed(2)} {currency}
            </span>
          </div>

          <div className={styles.amountGrid}>
            {amountOptions.map((amount) => (
              <button
                key={amount}
                className={`${styles.amountCard} ${selectedAmount === amount ? styles.active : ''}`}
                onClick={() => handleAmountSelect(amount)}
              >
                {amount === convertPrice(100, currency) && <span className={styles.popularBadge}>Popular</span>}
                <span className={styles.amountValue}>{currencySymbol}{amount}</span>
                <span className={styles.amountCurrency}>{currency}</span>
              </button>
            ))}
          </div>

          <div className={styles.customAmount}>
            <label>Custom Amount:</label>
            <div className={styles.customInputWrapper}>
              <span className={styles.currencySymbol}>{currencySymbol}</span>
              <input
                type="number"
                placeholder={minAmount.toFixed(2)}
                value={customAmount}
                onChange={handleCustomAmount}
                min={minAmount}
                step="1"
              />
              <span className={styles.currencyLabel}>{currency}</span>
            </div>
          </div>
        </section>

        {/* Two Column Layout */}
        <div className={styles.twoColumn}>
          {/* SECTION 3: PAYMENT METHOD (DIRECT CHECKOUT, NO STORED CARDS) */}
          <section className={styles.paymentSection}>
            <h2>Payment Method</h2>

            <div className={styles.cardsGrid}>
              <div
                className={`${styles.cardOption} ${paymentMethod === 'card' ? styles.cardSelected : ''}`}
                onClick={() => setPaymentMethod('card')}
              >
                {paymentMethod === 'card' && <div className={styles.cardSelectedIndicator}></div>}
                <div className={styles.cardInfo}>
                  <div className={styles.cardBrand}>
                    <span>💳</span>
                  </div>
                  <div>
                    <div className={styles.cardNumber}>Credit / Debit Card</div>
                    <div className={styles.cardExpiry}>Visa, Mastercard, Maestro</div>
                  </div>
                </div>
              </div>

              <div
                className={`${styles.cardOption} ${paymentMethod === 'bank' ? styles.cardSelected : ''}`}
                onClick={() => setPaymentMethod('bank')}
              >
                {paymentMethod === 'bank' && <div className={styles.cardSelectedIndicator}></div>}
                <div className={styles.cardInfo}>
                  <div className={styles.cardBrand}>
                    <span>🏦</span>
                  </div>
                  <div>
                    <div className={styles.cardNumber}>Instant Bank Transfer</div>
                    <div className={styles.cardExpiry}>SEPA / Direct Checkout</div>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.billingDetails}>
              <h4>Card Details</h4>
              <div className={styles.billingGrid}>
                <div className={styles.billingField} style={{ gridColumn: '1 / -1' }}>
                  <label>Cardholder Name</label>
                  <input
                    type="text"
                    value={cardholderName}
                    onChange={(e) => setCardholderName(e.target.value)}
                    placeholder="Full name as on card"
                  />
                </div>
                <div className={styles.billingField} style={{ gridColumn: '1 / -1' }}>
                  <label>Card Number</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="•••• •••• •••• ••••"
                    maxLength="19"
                  />
                </div>
                <div className={styles.billingField}>
                  <label>Expiry Date</label>
                  <input
                    type="text"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    placeholder="MM/YY"
                    maxLength="5"
                  />
                </div>
                <div className={styles.billingField}>
                  <label>CVC / CVV</label>
                  <input
                    type="password"
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value)}
                    placeholder="•••"
                    maxLength="4"
                  />
                </div>
              </div>

              <div className={styles.securityBadges}>
                <div>
                  <span className="material-symbols-outlined">lock</span>
                  <span>256-bit SSL Direct Processing</span>
                </div>
                <div>
                  <span className="material-symbols-outlined">verified_user</span>
                  <span>PCI DSS Compliant</span>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 4: ORDER SUMMARY */}
          <section className={styles.summarySection}>
            <div className={styles.orderSummary}>
              <h3>
                Order Summary
                <span className="material-symbols-outlined">receipt_long</span>
              </h3>

              <div className={styles.summaryItems}>
                <div>
                  <span>Selected Amount</span>
                  <span>{currencySymbol}{getDisplayAmount()}</span>
                </div>
                <div>
                  <span>
                    Processing Fee
                    <span className={styles.infoIcon} title="We cover all processing fees for all accounts.">
                      <span className="material-symbols-outlined">info</span>
                    </span>
                  </span>
                  <span className={styles.waived}>Waived ({currencySymbol}0.00)</span>
                </div>
                <div>
                  <span>Payment Security</span>
                  <span>Direct Encrypted</span>
                </div>
              </div>

              <div className={styles.totalRow}>
                <span>Total to Pay</span>
                <div>
                  <div className={styles.totalAmount}>{currencySymbol}{getDisplayAmount()}</div>
                  <div className={styles.totalCurrency}>{currency}</div>
                </div>
              </div>

              <div className={styles.instantBadge}>
                <div className={styles.instantIcon}>
                  <div className={styles.instantPing}></div>
                  <span className="material-symbols-outlined">bolt</span>
                </div>
                <div>
                  <div className={styles.instantTitle}>Instant Availability</div>
                  <div className={styles.instantSub}>Funds will be ready to use immediately.</div>
                </div>
              </div>

              <button
                className={styles.paymentBtn}
                onClick={handlePayment}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Complete Payment'}
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
              {error && <div className={styles.errorMessage}>{error}</div>}
              {successMessage && <div className={styles.successMessage}>{successMessage}</div>}

              <Link href="/dashboard/wallet" className={styles.cancelLink}>
                Cancel and return to Balance
              </Link>
            </div>
          </section>
        </div>

        {/* SECTION 5: WHY TOP UP? */}
        <section className={styles.features}>
          <h2>Power Your Creativity</h2>
          <div className={styles.featuresGrid}>
            {features.map((feature, index) => (
              <div key={index} className={`${styles.featureCard} ${styles[`feature${feature.color.charAt(0).toUpperCase() + feature.color.slice(1)}`]}`}>
                <div className={styles.featureIcon}>
                  <span className="material-symbols-outlined">{feature.icon}</span>
                </div>
                <h4>{feature.title}</h4>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 6: VIP CREATIVE PACKAGES */}
        <section className={styles.packages}>
          <div className={styles.packagesHeader}>
            <span className={styles.packagesBadge}>Enterprise Solutions</span>
            <h2>VIP Creative Packages</h2>
            <p>
              Looking for customized production workflows? Select a specialized package for personalized
              consultation and priority handling.
            </p>
          </div>

          <div className={styles.packagesGrid}>
            {packages.map((pkg, index) => (
              <div
                key={index}
                className={`${styles.packageCard} ${pkg.popular ? styles.packagePopular : ''}`}
              >
                {pkg.popular && (
                  <>
                    <div className={styles.packageShimmer}></div>
                    <span className={styles.popularTag}>Most Popular</span>
                  </>
                )}
                <h3>{pkg.name}</h3>
                <p className={styles.packageDescription}>{pkg.description}</p>
                <div className={styles.packagePrice}>
                  {pkg.price} <span className={styles.packagePeriod}>{pkg.period}</span>
                </div>
                <ul className={styles.packageFeatures}>
                  {pkg.features.map((feature, idx) => (
                    <li key={idx}>
                      <span className="material-symbols-outlined">check</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link href="/contact" className={pkg.popular ? styles.packageBtnPopular : styles.packageBtn}>
                  {pkg.popular ? 'Contact Sales' : 'Select Package'}
                </Link>
              </div>
            ))}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}