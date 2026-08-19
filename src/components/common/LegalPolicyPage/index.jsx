'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import { COMPANY_LEGAL_INFO } from '@/data/legalPolicies';

const HERO_IMAGE = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAGWtgtYNVU5ckFte5loMSLRIu0ZAkFvHqwCcY3MnIPsZI5-_hGLpZwyUc9QD4ZAS1f9_gbJgPMmbKX5K53hhWtzns1y1Pjc0kNy28Dhtv4nxofsHrhijR2-joYpUaOI5lhs1qhQWwH7mlqy7Hw-0fompZ6oFSAdpOEw74m9hb7y4_RkC_MCfH2otGuDJ7icT1tOd6dp1yblOt7Q3cmKz1Eh1ah4iApWFcsiHJcZUIjQ_mQl6mSev9s3BkOlKWQ7V2X_dXoIoh5Xm8';

export default function LegalPolicyPage({ policy, styles, badge = 'Legal & Compliance', icon = 'gavel', description }) {
  const articleRef = useRef(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const article = articleRef.current;
      if (!article) return;
      const rect = article.getBoundingClientRect();
      const value = ((window.innerHeight / 2 - rect.top) / rect.height) * 100;
      setProgress(Math.min(100, Math.max(0, value)));
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <Header />
      <main className={styles.main}>
        <div className={styles.readingProgress} style={{ width: `${progress}%` }} />
        <section className={styles.hero}>
          <div className={styles.heroGrid}>
            <div className={styles.heroContent}>
              <div className={styles.heroBadge}>
                <span className="material-symbols-outlined">{icon}</span>
                <span>{badge}</span>
              </div>
              <h1 className={styles.heroTitle}>{policy.title}</h1>
              <p className={styles.heroDescription}>{description}</p>
              <div className={styles.heroMeta}>
                <div className={styles.metaItem}>
                  <span className="material-symbols-outlined">update</span>
                  Effective Date: {policy.effectiveDate}
                </div>
                <div className={styles.metaDivider} />
                <div className={styles.metaItem}>
                  <span className="material-symbols-outlined">domain</span>
                  {COMPANY_LEGAL_INFO.name}
                </div>
              </div>
            </div>
            <div className={styles.heroImage}>
              <div className={styles.heroImageWrapper}>
                <img src={HERO_IMAGE} alt={policy.title} />
                <div className={styles.heroImageOverlay} />
              </div>
            </div>
          </div>
        </section>

        <section className={styles.legalContent}>
          <aside className={styles.toc}>
            <div className={styles.tocContainer}>
              <h3>Sections</h3>
              <ul>
                {policy.sections.map((section) => (
                  <li key={section.number}>
                    <a href={`#sec-${section.number}`} className={styles.tocLink}>
                      <span className={styles.tocNumber}>{String(section.number).padStart(2, '0')}</span>
                      {section.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
          <article ref={articleRef} className={styles.article}>
            {policy.sections.map((section) => (
              <div key={section.number} className={styles.chapter} id={`sec-${section.number}`}>
                <div className={styles.chapterHeader}>
                  <span className={styles.chapterNumber}>{String(section.number).padStart(2, '0')}</span>
                  <h2>{section.fullTitle}</h2>
                </div>
                <div className={styles.chapterContent}>
                  {section.blocks.map((block, index) => {
                    if (block.type === 'list') {
                      return <ul key={index}>{block.items.map((item) => <li key={item}>{item}</li>)}</ul>;
                    }
                    return <p key={index}>{block.text}</p>;
                  })}
                </div>
              </div>
            ))}
          </article>
        </section>

        <section className={styles.cta}>
          <div className={styles.ctaContainer}>
            <span className="material-symbols-outlined">mark_email_read</span>
            <h2>Questions about this policy?</h2>
            <p>Contact {COMPANY_LEGAL_INFO.name} at {COMPANY_LEGAL_INFO.contact} and include the relevant account or order details.</p>
            <div className={styles.ctaButtons}>
              <a href={`mailto:${COMPANY_LEGAL_INFO.contact}`} className={styles.ctaPrimary}>Contact support <span className="material-symbols-outlined">arrow_forward</span></a>
              <Link href="/terms-and-conditions" className={styles.ctaSecondary}>Terms of Service</Link>
            </div>
            <div className={styles.ctaMeta}><span className="material-symbols-outlined">domain</span>{COMPANY_LEGAL_INFO.office}</div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
