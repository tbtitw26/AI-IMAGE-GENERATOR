'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.scss';

// Імпорт компонентів
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';

export default function TermsPage() {
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
    { icon: 'handshake', label: 'Acceptance', href: '#acceptance' },
    { icon: 'manage_accounts', label: 'Accounts', href: '#accounts' },
    { icon: 'credit_card', label: 'Payments', href: '#payments' },
    { icon: 'store', label: 'Commercial Use', href: '#commercial' },
    { icon: 'currency_exchange', label: 'Refunds', href: '#refunds' },
    { icon: 'visibility_off', label: 'Privacy', href: '#privacy' },
    { icon: 'shield_lock', label: 'Security', href: '#security' },
    { icon: 'copyright', label: 'Intellectual Prop.', href: '#ip' },
    { icon: 'block', label: 'Termination', href: '#termination' },
    { icon: 'support_agent', label: 'Contact', href: '#contact' },
  ];

  const tocItems = [
    { number: '01', label: 'Service Scope', href: '#ch01' },
    { number: '02', label: 'User Responsibilities', href: '#ch02' },
    { number: '03', label: 'Financial Governance', href: '#ch03' },
    { number: '04', label: 'Intellectual Property', href: '#ch04' },
    { number: '05', label: 'Data Sovereignty', href: '#ch05' },
  ];

  const rightsCards = [
    {
      icon: 'storefront',
      title: 'Commercial Usage',
      description:
        'Pro and Enterprise users retain full commercial rights to monetize, distribute, and reproduce generated imagery without royalties.',
      color: 'primary',
    },
    {
      icon: 'manage_accounts',
      title: 'Account Ownership',
      description:
        'Your prompt history, custom presets, and generated assets remain firmly attached to your account and are strictly private.',
      color: 'secondary',
    },
    {
      icon: 'image',
      title: 'Generated Images',
      description:
        'You own the output. We do not claim copyright over the specific pixel arrangements produced by your unique prompts.',
      color: 'tertiary',
    },
    {
      icon: 'shield',
      title: 'Billing Protection',
      description:
        'Transparent billing cycles with no hidden fees. Cancel anytime with prorated credit for remaining annual balances.',
      color: 'error',
    },
  ];

  const complianceMarks = [
    { icon: 'policy', label: 'GDPR Compliant' },
    { icon: 'lock', label: 'PCI DSS Secure' },
    { icon: 'verified', label: 'Commercial License' },
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
                <span className="material-symbols-outlined">gavel</span>
                <span>Legal Center</span>
              </div>
              <h1 className={styles.heroTitle}>Terms &amp; Conditions</h1>
              <p className={styles.heroDescription}>
                Please read these Terms &amp; Conditions carefully before using AetherFrame AI. They
                explain your rights, responsibilities and how our services operate within a secure,
                compliant ecosystem.
              </p>
              <div className={styles.heroMeta}>
                <div className={styles.metaItem}>
                  <span className="material-symbols-outlined">update</span>
                  Last Updated: October 24, 2024
                </div>
                <div className={styles.metaDivider}></div>
                <div className={styles.metaItem}>
                  <span className="material-symbols-outlined">timer</span>
                  12 min read
                </div>
              </div>
            </div>

            <div className={styles.heroImage}>
              <div className={styles.heroImageWrapper}>
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAGWtgtYNVU5ckFte5loMSLRIu0ZAkFvHqwCcY3MnIPsZI5-_hGLpZwyUc9QD4ZAS1f9_gbJgPMmbKX5K53hhWtzns1y1Pjc0kNy28Dhtv4nxofsHrhijR2-joYpUaOI5lhs1qhQWwH7mlqy7Hw-0fompZ6oFSAdpOEw74m9hb7y4_RkC_MCfH2otGuDJ7icT1tOd6dp1yblOt7Q3cmKz1Eh1ah4iApWFcsiHJcZUIjQ_mQl6mSev9s3BkOlKWQ7V2X_dXoIoh5Xm8"
                  alt="Legal Terms"
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
            <div className={styles.chapter} id="ch01">
              <div className={styles.chapterHeader}>
                <span className={styles.chapterNumber}>01</span>
                <h2>Service Scope</h2>
              </div>
              <div className={styles.chapterContent}>
                <p>
                  AetherFrame AI provides an advanced computational platform for generating,
                  modifying, and managing digital visual assets through artificial intelligence
                  models. The "Service" encompasses the web interface, API access, underlying
                  generative models, and associated cloud infrastructure.
                </p>
                <p>
                  We reserve the right to modify, suspend, or discontinue any aspect of the Service
                  at any time, including the availability of specific AI models or rendering
                  capabilities, with or without notice. However, we strive to provide minimal
                  disruption to Enterprise and Pro tier subscribers.
                </p>
              </div>
            </div>

            {/* Chapter 02 */}
            <div className={styles.chapter} id="ch02">
              <div className={styles.chapterHeader}>
                <span className={styles.chapterNumber}>02</span>
                <h2>User Responsibilities</h2>
              </div>
              <div className={styles.chapterContent}>
                <p>
                  You agree not to use the Service to generate content that is unlawful,
                  defamatory, harassing, abusive, fraudulent, or obscene. You are solely
                  responsible for the text prompts, images, or other data you input into the
                  Service ("Input Data").
                </p>
                <ul>
                  <li>Do not attempt to reverse engineer the AI models.</li>
                  <li>Do not use the platform for automated bulk generation without API authorization.</li>
                  <li>Maintain the confidentiality of your account credentials.</li>
                </ul>
              </div>
            </div>

            {/* Chapter 03 */}
            <div className={styles.chapter} id="ch03">
              <div className={styles.chapterHeader}>
                <span className={styles.chapterNumber}>03</span>
                <h2>Financial Governance</h2>
              </div>
              <div className={styles.chapterContent}>
                <p>
                  Subscription fees are billed in advance on a recurring basis. All fees are
                  non-refundable unless explicitly stated in our Refund Policy or required by local
                  law. AetherFrame AI utilizes secure, PCI-DSS compliant third-party payment
                  processors.
                </p>
                <p>
                  Failure to settle outstanding balances within 7 days of the billing cycle may
                  result in temporary suspension of generation capabilities.
                </p>
              </div>
            </div>

            {/* Chapter 04 */}
            <div className={styles.chapter} id="ch04">
              <div className={styles.chapterHeader}>
                <span className={styles.chapterNumber}>04</span>
                <h2>Intellectual Property</h2>
              </div>
              <div className={styles.chapterContent}>
                <p>
                  Subject to your compliance with these Terms and the applicable subscription tier,
                  AetherFrame AI assigns to you all its right, title, and interest in and to the
                  output generated and returned by the Services based on your Input Data ("Generated
                  Output").
                </p>
                <p>
                  You may use the Generated Output for commercial purposes, provided your
                  subscription tier explicitly grants Commercial Licensing rights.
                </p>
              </div>
            </div>

            {/* Chapter 05 */}
            <div className={styles.chapter} id="ch05">
              <div className={styles.chapterHeader}>
                <span className={styles.chapterNumber}>05</span>
                <h2>Data Sovereignty</h2>
              </div>
              <div className={styles.chapterContent}>
                <p>
                  All data processed through the AetherFrame AI platform remains the property of the
                  user. We do not use your prompts or generated outputs to train our foundational
                  models.
                </p>
                <p>
                  Data is encrypted at rest and in transit using AES-256 encryption standards. Your
                  data is stored in compliance with GDPR and CCPA regulations.
                </p>
              </div>
            </div>
          </article>
        </section>

        {/* SECTION 4: YOUR RIGHTS */}
        <section className={styles.rights}>
          <div className={styles.rightsHeader}>
            <h2>Understanding Your Rights</h2>
            <p>Key takeaways from our legal framework.</p>
          </div>
          <div className={styles.rightsGrid}>
            {rightsCards.map((card, index) => (
              <div key={index} className={`${styles.rightsCard} ${styles[`rights${card.color.charAt(0).toUpperCase() + card.color.slice(1)}`]}`}>
                <div className={styles.rightsGlow}></div>
                <span className="material-symbols-outlined">{card.icon}</span>
                <h3>{card.title}</h3>
                <p>{card.description}</p>
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
            <span className="material-symbols-outlined">contact_support</span>
            <h2>Need legal clarification?</h2>
            <p>Our legal and support teams are available to clarify any terms regarding enterprise deployment or custom usage rights.</p>
            <div className={styles.ctaButtons}>
              <Link href="/contact" className={styles.ctaPrimary}>
                Contact Legal Team
                <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
              <Link href="/privacy-policy" className={styles.ctaSecondary}>
                Privacy Policy
              </Link>
              <Link href="/refund-policy" className={styles.ctaSecondary}>
                Refund Policy
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