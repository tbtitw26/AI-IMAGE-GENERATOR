"use client";

import Link from 'next/link';
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
        { label: 'Refund Policy', href: '/refund-policy' },
      ],
    },
  ];

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.grid}>
          <div className={styles.brandColumn}>
            <div className={styles.logo}>
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB8poQwyCUOoCBWHWcQHb-t6X0sHGwYW0V0sh79Z9BVwQ2sSr0HJ49VfKXJe6GZu_RvRYPnh3Rx58e_mTN_I1TJ6KWpRyziU6xZa_bbnEojXKhAVcZ73VCQl2jHfmk6o6-9CZrLqp4CeQqT3ch2MJTYqZAG89n5kGBeE-bmfCrCuoWWXEM_dxew8I92pGP4WXyiemaMzytfySKdapwtFvB176ndytuiZMJeCZu9TPY7drSMS7pkMxGZcQ"
                alt="AetherFrame Logo"
                className={styles.logoImage}
              />
              <span className={styles.logoText}>AetherFrame</span>
            </div>
            <p className={styles.description}>
              Create cinematic AI visuals faster with a polished workflow for teams and solo creators.
            </p>
            <div className={styles.paymentIcons}>
              <img
                src="/images/icons/visa-logo.svg"
                alt="Visa"
                className={styles.paymentLogo}
              />
              <img
                src="/images/icons/mastercard-logo.svg"
                alt="Mastercard"
                className={styles.paymentLogo}
              />
              <img
                src="/images/icons/pci-dss-logo.svg"
                alt="PCI DSS"
                className={styles.paymentLogo}
              />
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
            <span>VAT: GB 123 4567 89</span>
            <span>Company No: 01234567</span>
            <span>San Francisco, CA 94103</span>
          </div>
          <div className={styles.copyright}>
            © 2024 AetherFrame AI. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;