"use client";

import Link from 'next/link';
import Logo from '@/components/common/Logo';
import styles from './Footer.module.scss';

const Footer = () => {
  const footerSections = [
    {
      title: 'Explore',
      links: [
        { label: 'Features', href: '/features' },
        { label: 'How it works', href: '/how-it-works' },
        { label: 'Pricing', href: '/pricing' },
        { label: 'FAQ', href: '/faq' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About', href: '/about' },
        { label: 'Contact', href: '/contact' },
        { label: 'Security', href: '/security' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacy Policy', href: '/privacy-policy' },
        { label: 'Terms & Conditions', href: '/terms-and-conditions' },
        { label: 'Cookie Policy', href: '/cookie-policy' },
        { label: 'Acceptable Use', href: '/acceptable-use-policy' },
        { label: 'AI Output & IP', href: '/ai-output-and-intellectual-property-policy' },
        { label: 'Legal Notice & Complaints', href: '/legal-notice-and-complaints' },
        { label: 'Refund Policy', href: '/refund-policy' },
      ],
    },
  ];

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.grid}>
          <div className={styles.brandColumn}>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <Logo />
            </Link>
            <p className={styles.description}>
              Create cinematic AI visuals faster with a polished workflow for teams and solo creators.
            </p>
            <div className={styles.paymentIcons}>
              <div className={styles.paymentCard} title="Visa">
                <img
                  src="/images/icons/visa-logo.svg"
                  alt="Visa"
                  className={styles.paymentLogo}
                />
              </div>
              <div className={styles.paymentCard} title="Mastercard">
                <img
                  src="/images/icons/mastercard-logo.svg"
                  alt="Mastercard"
                  className={styles.paymentLogo}
                />
              </div>
              <div className={styles.paymentCard} title="PCI DSS Compliant">
                <img
                  src="/images/icons/pci-dss-logo.svg"
                  alt="PCI DSS"
                  className={styles.paymentLogo}
                />
              </div>
            </div>
          </div>

          <div className={styles.navColumns}>
            {footerSections.map((section) => (
              <div key={section.title} className={styles.navColumn}>
                <h4 className={styles.columnTitle}>{section.title}</h4>
                {section.links.map((link) => (
                  <Link key={link.href} href={link.href} className={styles.navLink}>
                    {link.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className={styles.bottomBar}>
          <div className={styles.registration}>
            <span className={styles.companyName}>DEXERIC OÜ</span>
            <span className={styles.companyDetails}>Registry code: 17569201</span>
            <span className={styles.companyDetails}>Pärnu mnt 20, Kesklinna linnaosa, 10141 Tallinn, Harju maakond</span>
          </div>
          <div className={styles.copyright}>
            © 2026 dexericai. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
