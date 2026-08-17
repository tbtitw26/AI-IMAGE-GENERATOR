'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.scss';

// Імпорт компонентів
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';

export default function RefundPolicyPage() {
  const canvasRef = useRef(null);
  const articleRef = useRef(null);
  const [progress, setProgress] = useState(0);

  // WebGL Background Shader
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl');
    if (!gl) return;

    const syncSize = () => {
      const w = canvas.clientWidth || 1280;
      const h = canvas.clientHeight || 720;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    };
    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(syncSize).observe(canvas);
    }
    syncSize();

    let mouseX = canvas.width / 2;
    let mouseY = canvas.height / 2;
    window.addEventListener('mousemove', (event) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width && rect.height) {
        const nx = (event.clientX - rect.left) / rect.width;
        const ny = 1.0 - (event.clientY - rect.top) / rect.height;
        mouseX = nx * canvas.width;
        mouseY = ny * canvas.height;
      }
    });

    const vs = `attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

    const fs = `precision highp float;
varying vec2 v_texCoord;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;

float noise(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
    vec2 uv = v_texCoord;
    vec2 p = uv - 0.5;
    p.x *= u_resolution.x / u_resolution.y;
    
    vec2 m = u_mouse / u_resolution - 0.5;
    m.x *= u_resolution.x / u_resolution.y;
    
    float t = u_time * 0.05;
    
    vec3 bg = vec3(0.0157, 0.0196, 0.0392);
    vec3 deep = vec3(0.0392, 0.0627, 0.1255);
    
    vec3 accent1 = vec3(0.357, 0.549, 1.0);
    vec3 accent2 = vec3(0.545, 0.361, 0.965);
    vec3 accent3 = vec3(1.0, 0.8, 0.4);
    
    vec3 color = mix(bg, deep, uv.y + sin(t) * 0.1);
    
    float d1 = length(p - vec2(sin(t * 0.5) * 0.5, cos(t * 0.3) * 0.3));
    float d2 = length(p + vec2(cos(t * 0.4) * 0.6, sin(t * 0.6) * 0.2));
    float dMouse = length(p - m);
    
    color += accent1 * (0.05 / (d1 + 0.8));
    color += accent2 * (0.04 / (d2 + 0.9));
    color += accent3 * (0.03 / (length(p) + 1.2));
    color += accent1 * (0.04 / (dMouse + 0.7)) * (sin(u_time * 1.5) * 0.2 + 0.8);
    
    float n = noise(uv + u_time);
    color += (n - 0.5) * 0.012;
    
    gl_FragColor = vec4(color, 1.0);
}`;

    const compileShader = (type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return shader;
    };

    const prog = gl.createProgram();
    gl.attachShader(prog, compileShader(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, compileShader(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const pos = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRes = gl.getUniformLocation(prog, 'u_resolution');
    const uMouse = gl.getUniformLocation(prog, 'u_mouse');

    const render = (timestamp) => {
      if (typeof ResizeObserver === 'undefined') syncSize();
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (uTime) gl.uniform1f(uTime, timestamp * 0.001);
      if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
      if (uMouse) gl.uniform2f(uMouse, mouseX, mouseY);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      requestAnimationFrame(render);
    };
    requestAnimationFrame(render);

    return () => {
      window.removeEventListener('mousemove', () => {});
    };
  }, []);

  // Reading Progress Bar
  useEffect(() => {
    const handleScroll = () => {
      const article = articleRef.current;
      if (!article) return;

      const rect = article.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const scrollableDistance = rect.height;
      const scrolled = Math.max(0, windowHeight / 2 - rect.top);
      let progressValue = (scrolled / scrollableDistance) * 100;
      progressValue = Math.min(100, Math.max(0, progressValue));
      setProgress(progressValue);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Active TOC State
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            document.querySelectorAll(`.${styles.tocLink}`).forEach((link) => {
              link.classList.remove(styles.tocLinkActive);
              if (link.getAttribute('href') === '#' + entry.target.id) {
                link.classList.add(styles.tocLinkActive);
              }
            });
          }
        });
      },
      { rootMargin: '-20% 0px -80% 0px' }
    );

    document.querySelectorAll(`article > div[id]`).forEach((section) => {
      observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  const quickLinks = [
    { icon: 'info', label: 'Overview', href: '#overview' },
    { icon: 'check_circle', label: 'Eligible Refunds', href: '#eligible' },
    { icon: 'block', label: 'Non-Refundable Services', href: '#non-refundable' },
    { icon: 'account_balance_wallet', label: 'Account Balance', href: '#balance' },
    { icon: 'star', label: 'VIP Services', href: '#vip' },
    { icon: 'error', label: 'Payment Errors', href: '#errors' },
    { icon: 'schedule', label: 'Refund Timeline', href: '#timeline' },
    { icon: 'receipt_long', label: 'Invoice Policy', href: '#invoice' },
    { icon: 'gavel', label: 'Chargebacks', href: '#chargebacks' },
    { icon: 'contact_support', label: 'Contact Billing', href: '#contact' },
  ];

  const tocItems = [
    { number: '01', label: 'Eligible Refunds', href: '#overview' },
    { number: '02', label: 'Non-Refundable Items', href: '#non-refundable-items' },
    { number: '03', label: 'Balance Terms', href: '#balance-terms' },
    { number: '04', label: 'Disputes', href: '#disputes' },
  ];

  const eligibilityItems = [
    {
      icon: 'credit_card_off',
      title: 'Failed Payments',
      description: 'Automatically reversed if the service was not rendered.',
      color: 'primary',
    },
    {
      icon: 'content_copy',
      title: 'Duplicate Charges',
      description: 'Fully refundable upon verification of the duplicate transaction.',
      color: 'primary',
    },
    {
      icon: 'bug_report',
      title: 'Technical Errors',
      description: 'Refunds or credits issued for verified system outages or rendering failures.',
      color: 'primary',
    },
    {
      icon: 'account_balance_wallet',
      title: 'Unused Balance',
      description: 'Refundable within 14 days if completely untouched.',
      color: 'primary',
    },
    {
      icon: 'star',
      title: 'VIP Service Terms',
      description: 'Subject to specific contractual agreements and milestone completions.',
      color: 'primary',
    },
    {
      icon: 'receipt_long',
      title: 'Billing Exceptions',
      description: 'Reviewed on a case-by-case basis by our billing support team.',
      color: 'primary',
    },
  ];

  const billingSteps = [
    { icon: 'payment', label: 'Payment Submitted' },
    { icon: 'check_circle', label: 'Payment Confirmed' },
    { icon: 'receipt', label: 'Invoice Generated' },
    { icon: 'undo', label: 'Refund Requested' },
    { icon: 'rate_review', label: 'Billing Review' },
    { icon: 'task_alt', label: 'Refund Completed' },
  ];

  const vipServices = [
    {
      title: 'Priority Rendering',
      price: '299 USD',
      description: 'Dedicated GPU clusters for rapid generation.',
      variant: 'default',
    },
    {
      title: 'Professional Campaign',
      price: '599 USD',
      description: 'Full suite of marketing assets generated to your specs.',
      variant: 'default',
    },
    {
      title: 'Private AI Creative Director',
      price: '999 USD',
      description: '1-on-1 consultation and bespoke AI model fine-tuning.',
      variant: 'premium',
    },
  ];

  const complianceMarks = [
    { icon: 'smart_toy', label: 'AI Content Moderation' },
    { icon: 'lock', label: 'Encrypted Infrastructure' },
    { icon: 'policy', label: 'GDPR Compliance' },
    { icon: 'credit_card', label: 'PCI DSS' },
    { icon: 'shield', label: 'Account Protection' },
    { icon: 'security', label: 'Fraud Detection' },
    { icon: 'corporate_fare', label: 'Enterprise Security' },
    { icon: 'workspace_premium', label: 'Commercial Licensing' },
  ];

  return (
    <>
      <Header />

      <main className={styles.main}>
        {/* Reading Progress */}
        <div className={styles.readingProgress} style={{ width: `${progress}%` }}></div>

        {/* Background */}
        <canvas ref={canvasRef} className={styles.bgCanvas} />

        {/* SECTION 1: HERO */}
        <section className={styles.hero}>
          <div className={styles.heroGrid}>
            <div className={styles.heroContent}>
              <div className={styles.heroBadge}>
                <span className="material-symbols-outlined">shield</span>
                <span>LEGAL CENTER</span>
              </div>
              <h1 className={styles.heroTitle}>Refund Policy</h1>
              <p className={styles.heroDescription}>
                Understand how refunds, wallet transactions, premium services and billing disputes
                are handled at dexericai.
              </p>
              <div className={styles.heroMeta}>
                <div className={styles.metaItem}>
                  <span className="material-symbols-outlined">update</span>
                  Last Updated: October 24, 2024
                </div>
                <div className={styles.metaDivider}></div>
                <div className={styles.metaItem}>
                  <span className="material-symbols-outlined">timer</span>
                  10 min read
                </div>
              </div>
            </div>

            <div className={styles.heroImage}>
              <div className={styles.heroImageWrapper}>
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuD4b_l_SR9PaLjfep2ThglKE4cLlrzO9RMm3hq6-JZXyjEDVPX_onb7w9yo5QwTXoJrp1lh-aD4FspA5hyfqgF3tRCgrEBxaSWMUzGvj4Y4kOaybt-EY3Ep4pf6NwV4yvxKczDKwmEsnzWDWtlPnJTr_DHz6hnM9xS3DgEOEW1YNEGkTx0XqqqR-O1cUyUnHrP6rT27mOVAhrGIboPe8MzPna42_fscDlZeUynUkAQMkec7J1nc9tEZ2uYQAQnWiG646ORtIOnaKQw"
                  alt="Refund Policy"
                />
                <div className={styles.heroImageOverlay}></div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: QUICK NAVIGATION */}
        <section className={styles.quickNav}>
          <div className={styles.quickNavHeader}>
            <h2>Quick Reference</h2>
            <div className={styles.quickNavLine}></div>
          </div>
          <div className={styles.quickNavGrid}>
            {quickLinks.map((link, index) => (
              <a key={index} href={link.href} className={styles.quickNavCard}>
                <span className="material-symbols-outlined">{link.icon}</span>
                <span>{link.label}</span>
              </a>
            ))}
          </div>
        </section>

        {/* SECTION 3: LEGAL CONTENT */}
        <section className={styles.legalContent}>
          <aside className={styles.toc}>
            <div className={styles.tocContainer}>
              <h3>Contents</h3>
              <ul>
                {tocItems.map((item, index) => (
                  <li key={index}>
                    <a href={item.href} className={styles.tocLink}>
                      <span className={styles.tocNumber}>{item.number}</span>
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          <article ref={articleRef} className={styles.article}>
            {/* Chapter 01 */}
            <div className={styles.chapter} id="overview">
              <div className={styles.chapterHeader}>
                <span className={styles.chapterNumber}>01</span>
                <h2>Eligible Refunds</h2>
              </div>
              <div className={styles.chapterContent}>
                <p>
                  We offer refunds for specific scenarios such as duplicate charges, accidental
                  subscription renewals (within 48 hours), and verifiable technical errors that
                  prevented the delivery of our service.
                </p>
              </div>
            </div>

            {/* Chapter 02 */}
            <div className={styles.chapter} id="non-refundable-items">
              <div className={styles.chapterHeader}>
                <span className={styles.chapterNumber}>02</span>
                <h2>Non-Refundable Items</h2>
              </div>
              <div className={styles.chapterContent}>
                <p>
                  Due to the computational resources required for AI generation, credits that have
                  already been consumed, customized enterprise plans, and specific VIP services are
                  generally non-refundable once initiated.
                </p>
              </div>
            </div>

            {/* Chapter 03 */}
            <div className={styles.chapter} id="wallet-terms">
              <div className={styles.chapterHeader}>
                <span className={styles.chapterNumber}>03</span>
                <h2>Wallet Terms</h2>
              </div>
              <div className={styles.chapterContent}>
                <p>
                  Funds added to your dexericai Wallet can be refunded to the original payment
                  method if requested within 14 days of the deposit, provided the balance remains
                  entirely unused.
                </p>
              </div>
            </div>

            {/* Chapter 04 */}
            <div className={styles.chapter} id="disputes">
              <div className={styles.chapterHeader}>
                <span className={styles.chapterNumber}>04</span>
                <h2>Disputes</h2>
              </div>
              <div className={styles.chapterContent}>
                <p>
                  If you believe there is a billing error, please contact our support team before
                  initiating a chargeback with your bank, as chargebacks may result in immediate
                  account suspension while under investigation.
                </p>
              </div>
            </div>
          </article>
        </section>

        {/* SECTION 4: REFUND ELIGIBILITY GRID */}
        <section className={styles.eligibility} id="eligible">
          <div className={styles.eligibilityHeader}>
            <h2>Refund Eligibility</h2>
            <p>Common scenarios and their refund eligibility status.</p>
          </div>
          <div className={styles.eligibilityGrid}>
            {eligibilityItems.map((item, index) => (
              <div key={index} className={`${styles.eligibilityCard} ${styles[`eligibility${item.color.charAt(0).toUpperCase() + item.color.slice(1)}`]}`}>
                <div className={styles.eligibilityGlow}></div>
                <span className="material-symbols-outlined">{item.icon}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 4.5: BILLING PROCESS */}
        <section className={styles.billingProcess} id="timeline">
          <div className={styles.billingProcessHeader}>
            <h2>Billing &amp; Refund Process</h2>
            <p>How we handle your transactions and requests.</p>
          </div>

          <div className={styles.billingProcessContainer}>
            <svg className={styles.billingLine} viewBox="0 0 100 40" preserveAspectRatio="none">
              <line x1="10" y1="20" x2="90" y2="20" stroke="rgba(178, 197, 255, 0.2)" strokeWidth="2" />
              <line className={styles.billingLineFlow} x1="10" y1="20" x2="90" y2="20" stroke="#b2c5ff" strokeWidth="2" />
            </svg>

            <div className={styles.billingSteps}>
              {billingSteps.map((step, index) => (
                <div key={index} className={styles.billingStep}>
                  <div className={styles.billingIcon}>
                    <span className="material-symbols-outlined">{step.icon}</span>
                  </div>
                  <span className={styles.billingLabel}>{step.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 4.75: VIP SERVICES */}
        <section className={styles.vipServices} id="vip">
          <div className={styles.vipServicesHeader}>
            <h2>VIP Services</h2>
            <p>Premium non-refundable service packages.</p>
          </div>
          <div className={styles.vipServicesGrid}>
            {vipServices.map((service, index) => (
              <div
                key={index}
                className={`${styles.vipCard} ${service.variant === 'premium' ? styles.vipCardPremium : ''}`}
              >
                {service.variant === 'premium' && (
                  <div className={styles.vipBadge}>
                    <span className={styles.vipBadgeText}>Premium</span>
                  </div>
                )}
                <h3>{service.title}</h3>
                <div className={service.variant === 'premium' ? styles.vipPriceGold : styles.vipPrice}>
                  {service.price}
                </div>
                <p>{service.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 5: COMPLIANCE MARKS */}
        <section className={styles.compliance}>
          <div className={styles.complianceContainer}>
            {complianceMarks.map((mark, index) => (
              <div key={index} className={styles.complianceItem}>
                <span className="material-symbols-outlined">{mark.icon}</span>
                <span>{mark.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 6: FINAL CTA */}
        <section className={styles.cta}>
          <div className={styles.ctaContainer}>
            <span className="material-symbols-outlined">health_and_safety</span>
            <h2>Need help with a refund?</h2>
            <p>
              Our Billing Team is available to assist with payment questions, invoices and refund
              requests.
            </p>
            <div className={styles.ctaButtons}>
              <Link href="/contact" className={styles.ctaPrimary}>
                Contact Billing
                <span className="material-symbols-outlined">email</span>
              </Link>
              <Link href="/dashboard/orders" className={styles.ctaSecondary}>
                View Orders
              </Link>
              <Link href="/terms-and-conditions" className={styles.ctaSecondary}>
                Terms &amp; Conditions
              </Link>
              <Link href="/privacy-policy" className={styles.ctaSecondary}>
                Privacy Policy
              </Link>
            </div>
            <div className={styles.ctaMeta}>
              <span className="material-symbols-outlined">schedule</span>
              Average response: 24 Hours
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}