'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import styles from './page.module.scss';
import { COMPANY_INFO } from '@/config/company';

// Імпорт компонентів
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';

function ContactPageContent() {
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    company: '',
    projectType: 'Enterprise Integration',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    const rawService = searchParams.get('service') || searchParams.get('subject') || searchParams.get('plan') || searchParams.get('package');
    if (rawService) {
      const decoded = decodeURIComponent(rawService);
      setFormData((prev) => ({
        ...prev,
        projectType: decoded.toLowerCase().includes('custom') || decoded.toLowerCase().includes('director') || decoded.toLowerCase().includes('vip')
          ? 'Custom Model Training'
          : 'Creative Campaign',
        message: `Hi, I'm interested in booking the "${decoded}" service. Please share more details on availability, customization, and next steps for our team.`,
      }));
    }
  }, [searchParams]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setTimeout(() => setIsSubmitted(false), 3000);
    }, 1500);
  };

  // Parallax effect for floating elements
  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      
      const floatedElements = document.querySelectorAll(`.${styles.floatAnimation}, .${styles.floatAnimationDelayed}`);
      floatedElements.forEach(el => {
        el.style.marginLeft = `${x}px`;
        el.style.marginTop = `${y}px`;
      });
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <>
      <Header />
      
      <main className={styles.main}>
        {/* SECTION 1: HERO */}
        <section className={styles.hero}>
          {/* Background Abstract Elements */}
          <div className={styles.backgroundElements}>
            <div className={`${styles.abstractCard} ${styles.card1} ${styles.floatAnimation}`}>
              <div className={styles.cardImage}></div>
            </div>
            <div className={`${styles.abstractCard} ${styles.card2} ${styles.floatAnimationDelayed}`}>
              <div className={styles.cardImage}></div>
            </div>
          </div>

          <div className={styles.heroContent}>
            <span className={styles.heroBadge}>CONTACT US</span>
            <h1 className={styles.heroTitle}>
              Let's build something extraordinary together.
            </h1>
            <p className={styles.heroDescription}>
              Whether you're an enterprise looking to scale production or a creator pushing boundaries, 
              our team is ready to engineer your vision.
            </p>
            <div className={styles.scrollIndicator}>
              <span className="material-symbols-outlined">keyboard_arrow_down</span>
            </div>
          </div>
        </section>

        {/* SECTION 2: CONTACT EXPERIENCE */}
        <section className={styles.contactSection}>
          <div className={styles.contactGrid}>
            {/* Left: Form */}
            <div className={styles.contactForm}>
              <div className={styles.formHeader}>
                <h2>Initiate Protocol</h2>
                <p>Provide the parameters of your project. Secure transmission.</p>
              </div>

              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Full Name</label>
                    <input
                      type="text"
                      name="fullName"
                      placeholder="Jane Doe"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Business Email</label>
                    <input
                      type="email"
                      name="email"
                      placeholder="jane@enterprise.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Company</label>
                    <input
                      type="text"
                      name="company"
                      placeholder="Global Corp"
                      value={formData.company}
                      onChange={handleChange}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Project Type</label>
                    <select
                      name="projectType"
                      value={formData.projectType}
                      onChange={handleChange}
                    >
                      <option>Enterprise Integration</option>
                      <option>Custom Model Training</option>
                      <option>Creative Campaign</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Project Parameters</label>
                  <textarea
                    name="message"
                    placeholder="Describe the scope, deliverables, and technical requirements..."
                    rows="4"
                    value={formData.message}
                    onChange={handleChange}
                    required
                  ></textarea>
                </div>

                <button 
                  type="submit" 
                  className={styles.submitBtn}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span>Sending...</span>
                  ) : isSubmitted ? (
                    <span>✓ Sent Successfully</span>
                  ) : (
                    <>
                      <span>Transmit Request</span>
                      <span className="material-symbols-outlined">send</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Right: Planning Desk */}
            <div className={styles.planningDesk}>
              <div className={styles.deskImage}></div>
              <div className={styles.deskOverlay}></div>
              
              <div className={styles.deskActions}>
                <div className={`${styles.deskAction} ${styles.floatAnimation}`}>
                  <span className="material-symbols-outlined">view_kanban</span>
                  <span>View Board</span>
                </div>
                <div className={`${styles.deskAction} ${styles.floatAnimationDelayed}`}>
                  <span className="material-symbols-outlined">image_search</span>
                  <span>Inspect Assets</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: COMPANY DETAILS */}
        <section className={styles.companyDetails}>
          <div className={styles.companyContainer}>
            <div className={styles.companyHeader}>
              <h2>Direct Contact</h2>
              <p>Reach out to our team for enterprise partnerships and inquiries.</p>
            </div>
            
            <div className={styles.companyGrid}>
              <div className={styles.contactCard}>
                <span className="material-symbols-outlined">email</span>
                <h3>Business Inquiries</h3>
                <a href={`mailto:${COMPANY_INFO.email.business}`}>
                  {COMPANY_INFO.email.business || 'business@dexeric.ai'}
                </a>
              </div>
              
              <div className={styles.contactCard}>
                <span className="material-symbols-outlined">mail</span>
                <h3>Support</h3>
                <a href={`mailto:${COMPANY_INFO.email.support}`}>
                  {COMPANY_INFO.email.support || 'support@dexeric.ai'}
                </a>
              </div>
              
              <div className={styles.contactCard}>
                <span className="material-symbols-outlined">access_time</span>
                <h3>Response Time</h3>
                <p>Professional: {COMPANY_INFO.support.responseTime.professional}</p>
              </div>

              <div className={styles.contactCard}>
                <span className="material-symbols-outlined">language</span>
                <h3>Available</h3>
                <p>{COMPANY_INFO.support.hours}</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

export default function ContactPage() {
  return (
    <Suspense fallback={null}>
      <ContactPageContent />
    </Suspense>
  );
}