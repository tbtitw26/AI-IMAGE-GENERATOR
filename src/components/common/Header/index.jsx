'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Logo from '@/components/common/Logo';
import { CURRENCIES } from '@/config/currency';
import styles from './Header.module.scss';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userBalance, setUserBalance] = useState(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    const syncAuthState = () => {
      if (typeof window === 'undefined') return;

      const storedUser = window.localStorage.getItem('user');
      const storedToken = window.localStorage.getItem('token') || window.localStorage.getItem('authToken');
      const hasAuth = Boolean(storedToken || storedUser);

      setIsAuthenticated(hasAuth);

      if (!storedUser) {
        setUserBalance(null);
        return;
      }

      try {
        const parsedUser = JSON.parse(storedUser);
        setUserBalance(parsedUser?.balance || null);
      } catch {
        setUserBalance(null);
      }
    };

    handleScroll();
    syncAuthState();

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('storage', syncAuthState);
    window.addEventListener('auth-state-changed', syncAuthState);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('storage', syncAuthState);
      window.removeEventListener('auth-state-changed', syncAuthState);
    };
  }, []);

  const guestNavItems = [
    { label: 'Features', href: '/features' },
    { label: 'How it works', href: '/how-it-works' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'FAQ', href: '/faq' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ];

  // Signed-in users keep every public page reachable in the nav; getting into
  // the workspace itself is handled by the single "Open Studio" CTA below,
  // so we don't duplicate that with a separate "Dashboard" nav link.
  const navItems = guestNavItems;
  const secondaryHref = '/login';
  const secondaryLabel = 'Log In';
  const ctaHref = isAuthenticated ? '/dashboard/generate' : '/register';
  const ctaLabel = isAuthenticated ? 'Open Studio' : 'Start Creating';

  const formatBalance = (balance) => {
    if (!balance) return '€0.00';

    // Always honour the user's selected currency (stored in localStorage by CurrencyContext).
    // Fall back to EUR if nothing is saved — EUR is our base currency.
    const savedCurrency =
      typeof window !== 'undefined'
        ? localStorage.getItem('selectedCurrency') || 'EUR'
        : 'EUR';

    const currency = CURRENCIES[savedCurrency] ? savedCurrency : 'EUR';
    const amount = Number(balance[currency] ?? 0);
    const symbol = CURRENCIES[currency]?.symbol || '€';

    return `${symbol}${amount.toFixed(2)}`;
  };

  const handleLogout = () => {
    if (typeof window === 'undefined') return;

    window.localStorage.removeItem('token');
    window.localStorage.removeItem('authToken');
    window.localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUserBalance(null);
    window.dispatchEvent(new Event('auth-state-changed'));
    router.push('/');
  };

  return (
    <header className={`${styles.header} ${isScrolled ? styles.scrolled : ''}`}>
      <div className={styles.container}>
        <div className={styles.leftSection}>
          <Link href="/" className={styles.logo} style={{ textDecoration: 'none' }}>
            <Logo />
          </Link>

          <nav className={styles.nav}>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navLink} ${pathname === item.href ? styles.active : ''}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className={styles.rightSection}>
          {isAuthenticated ? (
            <>
              <div className={styles.balancePill}>
                <span className="material-symbols-outlined">account_balance_wallet</span>
                <span>{formatBalance(userBalance)}</span>
              </div>
              <Link href={ctaHref} className={styles.ctaBtn}>
                {ctaLabel}
              </Link>
              <button type="button" className={styles.logoutBtn} onClick={handleLogout}>
                Log Out
              </button>
            </>
          ) : (
            <>
              <Link href={secondaryHref} className={styles.loginBtn}>
                {secondaryLabel}
              </Link>
              <Link href={ctaHref} className={styles.ctaBtn}>
                {ctaLabel}
              </Link>
            </>
          )}

          <button
            className={styles.mobileToggle}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span className={styles.hamburger}></span>
          </button>
        </div>
      </div>

      <div className={`${styles.mobileMenu} ${isMobileMenuOpen ? styles.open : ''}`}>
        <nav className={styles.mobileNav}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={styles.mobileNavLink}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <div className={styles.mobileActions}>
            {isAuthenticated ? (
              <>
                <div className={styles.mobileBalance}>
                  <span className="material-symbols-outlined">account_balance_wallet</span>
                  <span>{formatBalance(userBalance)}</span>
                </div>
                <Link href={ctaHref} className={styles.mobileCta}>
                  {ctaLabel}
                </Link>
                <button type="button" className={styles.mobileLogout} onClick={handleLogout}>
                  Log Out
                </button>
              </>
            ) : (
              <>
                <Link href={secondaryHref} className={styles.mobileLogin}>
                  {secondaryLabel}
                </Link>
                <Link href={ctaHref} className={styles.mobileCta}>
                  {ctaLabel}
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;