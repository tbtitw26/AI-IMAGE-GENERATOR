'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Logo from '@/components/common/Logo';
import { useCurrency } from '@/context/CurrencyContext';
import { CURRENCIES, getCurrencyCodes, formatUserBalance } from '@/config/currency';
import styles from './Header.module.scss';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState(null);
  const { currency, setCurrency } = useCurrency();
  const currencyMenuRef = useRef(null);
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
        setUserData(null);
        return;
      }

      try {
        const parsedUser = JSON.parse(storedUser);
        setUserData(parsedUser);
      } catch {
        setUserData(null);
      }
    };

    handleScroll();
    syncAuthState();

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('storage', syncAuthState);
    window.addEventListener('auth-state-changed', syncAuthState);

    const handleClickOutside = (e) => {
      if (currencyMenuRef.current && !currencyMenuRef.current.contains(e.target)) {
        setIsCurrencyOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('storage', syncAuthState);
      window.removeEventListener('auth-state-changed', syncAuthState);
      document.removeEventListener('mousedown', handleClickOutside);
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

  const navItems = guestNavItems;
  const secondaryHref = '/login';
  const secondaryLabel = 'Log In';
  const ctaHref = isAuthenticated ? '/dashboard/generate' : '/register';
  const ctaLabel = isAuthenticated ? 'Open Studio' : 'Start Creating';

  const handleLogout = () => {
    if (typeof window === 'undefined') return;

    window.localStorage.removeItem('token');
    window.localStorage.removeItem('authToken');
    window.localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUserData(null);
    window.dispatchEvent(new Event('auth-state-changed'));
    router.push('/');
  };

  const handleSelectCurrency = (code) => {
    setCurrency(code);
    setIsCurrencyOpen(false);
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
          {/* Currency Selector */}
          <div className={styles.currencySelector} ref={currencyMenuRef}>
            <button
              type="button"
              className={styles.currencyBtn}
              onClick={() => setIsCurrencyOpen((prev) => !prev)}
              aria-label="Select currency"
            >
              <span>{currency}</span>
              <span>{CURRENCIES[currency]?.symbol}</span>
              <span className="material-symbols-outlined" style={{ transform: isCurrencyOpen ? 'rotate(180deg)' : 'none' }}>
                expand_more
              </span>
            </button>
            {isCurrencyOpen && (
              <div className={styles.currencyMenu}>
                {getCurrencyCodes().map((code) => (
                  <button
                    key={code}
                    type="button"
                    className={`${styles.currencyOption} ${currency === code ? styles.activeOption : ''}`}
                    onClick={() => handleSelectCurrency(code)}
                  >
                    <span>{code}</span>
                    <span>{CURRENCIES[code]?.symbol}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {isAuthenticated ? (
            <>
              <div className={styles.balancePill} title="Your Balance">
                <span className="material-symbols-outlined">account_balance_wallet</span>
                <span>{formatUserBalance(userData, currency)}</span>
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
                  <span>{formatUserBalance(userData, currency)}</span>
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