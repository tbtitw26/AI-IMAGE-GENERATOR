'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
    { label: 'Contact', href: '/contact' },
  ];

  const userNavItems = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Generate', href: '/dashboard/generate' },
    { label: 'Projects', href: '/dashboard/projects' },
    { label: 'Orders', href: '/dashboard/orders' },
    { label: 'Wallet', href: '/dashboard/wallet' },
  ];

  const navItems = isAuthenticated ? userNavItems : guestNavItems;
  const secondaryHref = isAuthenticated ? '/dashboard' : '/login';
  const secondaryLabel = isAuthenticated ? 'Dashboard' : 'Log In';
  const ctaHref = isAuthenticated ? '/dashboard/generate' : '/register';
  const ctaLabel = isAuthenticated ? 'Open Studio' : 'Start Creating';

  const formatBalance = (balance) => {
    if (!balance) return '$0.00';

    const currency = Object.keys(balance).find((key) => balance[key] != null) || 'USD';
    const amount = Number(balance[currency] ?? 0);

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
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
          <Link href="/" className={styles.logo}>
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuB8poQwyCUOoCBWHWcQHb-t6X0sHGwYW0V0sh79Z9BVwQ2sSr0HJ49VfKXJe6GZu_RvRYPnh3Rx58e_mTN_I1TJ6KWpRyziU6xZa_bbnEojXKhAVcZ73VCQl2jHfmk6o6-9CZrLqp4CeQqT3ch2MJTYqZAG89n5kGBeE-bmfCrCuoWWXEM_dxew8I92pGP4WXyiemaMzytfySKdapwtFvB176ndytuiZMJeCZu9TPY7drSMS7pkMxGZcQ"
              alt="AetherFrame Logo"
              className={styles.logoImage}
            />
            <span className={styles.logoText}>AetherFrame AI</span>
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
              <Link href={secondaryHref} className={styles.loginBtn}>
                {secondaryLabel}
              </Link>
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
                <Link href={secondaryHref} className={styles.mobileLogin}>
                  {secondaryLabel}
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