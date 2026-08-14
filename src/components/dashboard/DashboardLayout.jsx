"use client";

import { useState } from 'react';
import Footer from '@/components/common/Footer';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import styles from './DashboardLayout.module.scss';

export default function DashboardLayout({ children }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navItems = [
    { icon: 'dashboard', label: 'Overview', href: '/dashboard' },
    { icon: 'auto_awesome', label: 'Generate', href: '/dashboard/generate' },
    { icon: 'folder_open', label: 'Projects', href: '/dashboard/projects' },
    { icon: 'photo_library', label: 'Gallery', href: '/dashboard/gallery' },
    { icon: 'receipt_long', label: 'Orders', href: '/dashboard/orders' },
    { icon: 'account_balance_wallet', label: 'Wallet', href: '/dashboard/wallet' },
    { icon: 'credit_card', label: 'Top Up', href: '/dashboard/top-up' },
    { icon: 'person', label: 'Profile', href: '/dashboard/profile' },
    { icon: 'security', label: 'Security', href: '/dashboard/security' },
    { icon: 'settings', label: 'Settings', href: '/dashboard/settings' },
  ];

  const bottomNavItems = [
    { icon: 'help', label: 'Help', href: '/faq' },
    { icon: 'contact_support', label: 'Support', href: '/contact' },
  ];

  const isActiveItem = (href) => pathname === href || (href !== '/dashboard' && pathname.startsWith(href));

  return (
    <div className={styles.dashboardLayout}>
      {/* Side Navigation */}
      <nav className={styles.sideNav}>
        <Link href="/" className={styles.sideNavBrand}>
          <div className={styles.brandIcon}>
            <span className="material-symbols-outlined">temp_preferences_custom</span>
          </div>
          <div>
            <h1>dexericai</h1>
            <p>Creative Workspace</p>
          </div>
        </Link>

        <Link href="/dashboard/generate" className={styles.newProjectBtn}>
          <span className="material-symbols-outlined">add</span>
          New Project
        </Link>

        <div className={styles.sideNavMain}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navLink} ${isActiveItem(item.href) ? styles.active : ''}`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>

        <div className={styles.sideNavBottom}>
          {bottomNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={styles.navLink}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className={styles.mainContent}>
        {/* Top App Bar */}
        <header className={styles.topBar}>
          <div className={styles.topBarLeft}>
            <button
              className={styles.mobileMenuBtn}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <Link href="/" className={styles.homeBtn} title="Back to homepage">
              <span className="material-symbols-outlined">home</span>
            </Link>
            <div className={styles.searchWrapper}>
              <span className="material-symbols-outlined">search</span>
              <input
                type="text"
                placeholder="Search projects, prompts..."
                className={styles.searchInput}
              />
            </div>
          </div>

          <div className={styles.topBarRight}>
            <Link href="/dashboard/wallet" className={styles.walletBalance}>
              <span className="material-symbols-outlined">account_balance_wallet</span>
              <span>${(user?.balance?.USD ?? 0).toFixed(2)} USD</span>
            </Link>
            <button className={styles.notificationBtn}>
              <span className="material-symbols-outlined">notifications</span>
              <span className={styles.notificationDot}></span>
            </button>
            <div className={styles.profileAvatar} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen((v) => !v)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: 'inherit' }}
              >
                {user?.photo ? (
                  <div
                    className={styles.avatarImage}
                    style={{ backgroundImage: `url(${user.photo})` }}
                  ></div>
                ) : (
                  <div className={styles.avatarInitials}>
                    {(user?.firstName?.[0] || user?.email?.[0] || '?').toUpperCase()}
                  </div>
                )}
                <span style={{ fontSize: 14 }}>{user?.firstName || user?.email || ''}</span>
              </button>
              {isProfileMenuOpen && (
                <div
                  style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, minWidth: 160, zIndex: 50, overflow: 'hidden' }}
                  onMouseLeave={() => setIsProfileMenuOpen(false)}
                >
                  <Link href="/dashboard/profile" style={{ display: 'block', padding: '10px 14px', color: 'inherit', textDecoration: 'none' }}>Profile</Link>
                  <Link href="/dashboard/settings" style={{ display: 'block', padding: '10px 14px', color: 'inherit', textDecoration: 'none' }}>Settings</Link>
                  <button
                    type="button"
                    onClick={logout}
                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer' }}
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className={styles.pageContent}>
          {children}
        </div>

        <Footer />
      </main>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className={styles.mobileOverlay} onClick={() => setIsMobileMenuOpen(false)}>
          <div className={styles.mobileMenu} onClick={(e) => e.stopPropagation()}>
            <div className={styles.mobileMenuHeader}>
              <div className={styles.brandIcon}>
                <span className="material-symbols-outlined">temp_preferences_custom</span>
              </div>
              <div>
                <h1>dexericai</h1>
                <p>Creative Workspace</p>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className={styles.mobileNavLinks}>
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${styles.mobileNavLink} ${isActiveItem(item.href) ? styles.active : ''}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="material-symbols-outlined">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}