'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.scss';

// Імпорт компонентів
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { useCurrency } from '@/context/CurrencyContext';
import { CURRENCIES } from '@/config/currency';

export default function TopUpPage() {
  const { token, user, refreshUser } = useAuth();
  const [selectedAmount, setSelectedAmount] = useState(100);
  const [customAmount, setCustomAmount] = useState('');
  const { currency: globalCurrency, setCurrency: setGlobalCurrency } = useCurrency();
  const [selectedCurrency, setSelectedCurrency] = useState(globalCurrency || 'EUR');
  const currencySymbol = CURRENCIES[selectedCurrency]?.symbol || '€';

  const changeCurrency = (code) => {
    setSelectedCurrency(code);
    setGlobalCurrency(code);
  };
  const [selectedCard, setSelectedCard] = useState('visa');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const amountOptions = [10, 25, 50, 100, 250, 500, 1000];

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
    return selectedAmount ? selectedAmount.toFixed(2) : '0.00';
  };

  const handlePayment = async () => {
    const amount = customAmount ? parseFloat(customAmount) : Number(selectedAmount);
    setError('');
    setSuccessMessage('');

    if (!amount || amount < 10) {
      setError('Please enter an amount of at least $10.00 USD.');
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
          currency: selectedCurrency,
          paymentMethod: selectedCard,
        }),
      });

      const text = await response.text();
      const data = text ? JSON.parse(text) : {};
      if (!response.ok) {
        throw new Error(data.message || 'Unable to complete top-up.');
      }

      setSuccessMessage(data.message || 'Top-up completed successfully. Your wallet balance has been updated.');
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
      description: 'No waiting. Your topped-up balance is instantly available for high-res rendering.',
      color: 'primary',
    },
    {
      icon: 'speed',
      title: 'Priority Processing',
      description: 'Jump the queue. Premium balances guarantee priority GPU allocation during peak hours.',
      color: 'secondary',
    },
    {
      icon: 'copyright',
      title: 'Commercial License',
      description: 'Full rights ownership. Every image generated with premium funds is yours to monetize.',
      color: 'tertiary',
    },
    {
      icon: 'shield',
      title: 'Secure Transactions',
      description: 'Bank-grade security. Your payment data is never stored on our servers.',
      color: 'emerald',
    },
  ];

  const packages = [
    {
      name: 'Priority Rendering',
      price: '$299',
      period: '/mo',
      description: 'Perfect for independent creators.',
      features: ['15,000 Generation Credits', 'Tier 2 GPU Access', 'Standard API Access'],
      popular: false,
    },
    {
      name: 'Private AI Director',
      price: '$999',
      period: '/mo',
      description: 'For enterprise agencies & studios.',
      features: [
        'Unlimited Generation Credits',
        'Dedicated H100 GPU Cluster',
        'Custom Model Fine-Tuning',
        '24/7 Slack Support Channel',
      ],
      popular: true,
    },
    {
      name: 'Enterprise Campaign',
      price: '$599',
      period: '/mo',
      description: 'For growing design teams.',
      features: ['50,000 Generation Credits', 'Tier 1 GPU Access', 'Advanced API + Webhooks'],
      popular: false,
    },
  ];

  return (
    <DashboardLayout>
      <div className={styles.topUp}>
        {/* SECTION 1: TOP UP YOUR WALLET */}
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>
              <span className="material-symbols-outlined">security</span>
              <span>Secure Transaction</span>
            </div>
            <h1>Add Funds</h1>
            <p>
              Securely add balance to your dexericai Wallet and instantly continue generating
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
              {currencySymbol}{(user?.balance?.[selectedCurrency] ?? 0).toFixed(2)} <span className={styles.balanceCurrency}>{selectedCurrency}</span>
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
              <span className="material-symbols-outlined">info</span> Minimum {currencySymbol}10.00 {selectedCurrency}
            </span>
          </div>

          <div className={styles.amountGrid}>
            {amountOptions.map((amount) => (
              <button
                key={amount}
                className={`${styles.amountCard} ${selectedAmount === amount ? styles.active : ''}`}
                onClick={() => handleAmountSelect(amount)}
              >
                {amount === 100 && <span className={styles.popularBadge}>Popular</span>}
                <span className={styles.amountValue}>{currencySymbol}{amount}</span>
                <span className={styles.amountCurrency}>{selectedCurrency}</span>
              </button>
            ))}
          </div>

          <div className={styles.customAmount}>
            <label>Custom Amount:</label>
            <div className={styles.customInputWrapper}>
              <span className={styles.currencySymbol}>{currencySymbol}</span>
              <input
                type="number"
                placeholder="0.00"
                value={customAmount}
                onChange={handleCustomAmount}
                min="10"
                step="1"
              />
              <span className={styles.currencyLabel}>{selectedCurrency}</span>
            </div>
          </div>
        </section>

        {/* Two Column Layout */}
        <div className={styles.twoColumn}>
          {/* SECTION 3: PAYMENT METHODS */}
          <section className={styles.paymentSection}>
            <h2>Payment Method</h2>

            <div className={styles.cardsGrid}>
              <div className={`${styles.cardOption} ${styles.cardSelected}`}>
                <div className={styles.cardSelectedIndicator}></div>
                <div className={styles.cardInfo}>
                  <div className={styles.cardBrand}>
                    <span>VISA</span>
                  </div>
                  <div>
                    <div className={styles.cardNumber}>Visa ending in 4242</div>
                    <div className={styles.cardExpiry}>Expires 12/26</div>
                  </div>
                </div>
                <div className={styles.cardCheck}>
                  <span className="material-symbols-outlined">check_circle</span> Selected
                </div>
              </div>

              <div className={styles.cardOption}>
                <div className={styles.cardInfo}>
                  <div className={styles.cardBrand}>
                    <div className={styles.mastercardIcons}>
                      <div className={styles.mastercardRed}></div>
                      <div className={styles.mastercardYellow}></div>
                    </div>
                  </div>
                  <div>
                    <div className={styles.cardNumber}>Mastercard ending in 8899</div>
                    <div className={styles.cardExpiry}>Expires 08/25</div>
                  </div>
                </div>
              </div>
            </div>

            <Link href="/contact" className={styles.addCardBtn}>
              <span className="material-symbols-outlined">add_card</span>
              Add New Payment Method
            </Link>

            <div className={styles.billingDetails}>
              <h4>Billing Details</h4>
              <div className={styles.billingGrid}>
                <div className={styles.billingField}>
                  <label>Name on Card</label>
                  <input type="text" value="ALEXANDER WRIGHT" />
                </div>
                <div className={styles.billingField}>
                  <label>Country/Region</label>
                  <select>
                    <option>United States</option>
                    <option>United Kingdom</option>
                    <option>European Union</option>
                  </select>
                </div>
              </div>
              <div className={styles.securityBadges}>
                <div>
                  <span className="material-symbols-outlined">lock</span>
                  <span>256-bit SSL Encryption</span>
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

              <div className={styles.currencySelector}>
                <button
                  className={`${styles.currencyBtn} ${selectedCurrency === 'EUR' ? styles.active : ''}`}
                  onClick={() => changeCurrency('EUR')}
                >
                  EUR
                </button>
                <button
                  className={`${styles.currencyBtn} ${selectedCurrency === 'USD' ? styles.active : ''}`}
                  onClick={() => changeCurrency('USD')}
                >
                  USD
                </button>
                <button
                  className={`${styles.currencyBtn} ${selectedCurrency === 'GBP' ? styles.active : ''}`}
                  onClick={() => changeCurrency('GBP')}
                >
                  GBP
                </button>
              </div>

              <div className={styles.summaryItems}>
                <div>
                  <span>Selected Amount</span>
                  <span>{currencySymbol}{getDisplayAmount()}</span>
                </div>
                <div>
                  <span>
                    Processing Fee
                    <span className={styles.infoIcon} title="We cover all processing fees for premium accounts.">
                      <span className="material-symbols-outlined">info</span>
                    </span>
                  </span>
                  <span className={styles.waived}>Waived ({currencySymbol}0.00)</span>
                </div>
                <div>
                  <span>Estimated Tax</span>
                  <span>Calculated at checkout</span>
                </div>
              </div>

              <div className={styles.totalRow}>
                <span>Total to Pay</span>
                <div>
                  <div className={styles.totalAmount}>{currencySymbol}{getDisplayAmount()}</div>
                  <div className={styles.totalCurrency}>{selectedCurrency}</div>
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
                Cancel and return to Wallet
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
              Looking for bulk rendering power? Upgrade to a VIP package for dedicated hardware
              access and personalized support.
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