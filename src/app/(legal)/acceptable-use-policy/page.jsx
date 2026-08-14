'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.scss';

// Імпорт компонентів
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';

export default function AcceptableUsePolicyPage() {
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
    { icon: 'check_circle', label: 'Permitted Use', href: '#permitted' },
    { icon: 'block', label: 'Prohibited Content', href: '#prohibited' },
    { icon: 'storefront', label: 'Commercial Usage', href: '#commercial' },
    { icon: 'copyright', label: 'Intellectual Property', href: '#ip' },
    { icon: 'smart_toy', label: 'AI Responsibility', href: '#ai' },
    { icon: 'gavel', label: 'Account Restrictions', href: '#restrictions' },
    { icon: 'security', label: 'Platform Security', href: '#security' },
    { icon: 'report', label: 'Reporting Abuse', href: '#reporting' },
    { icon: 'policy', label: 'Policy Enforcement', href: '#enforcement' },
    { icon: 'contact_support', label: 'Contact', href: '#contact' },
  ];

  const tocItems = [
    { number: '01', label: 'Service Overview', href: '#overview' },
    { number: '02', label: 'Permitted Use', href: '#permitted-content' },
    { number: '03', label: 'Prohibited Content', href: '#prohibited-content' },
    { number: '04', label: 'Intellectual Property', href: '#ip' },
    { number: '05', label: 'Data & Safety', href: '#safety' },
  ];

  const permittedUses = [
    {
      icon: 'image',
      title: 'Commercial Image Creation',
      description: 'Generate high-quality assets for your business needs.',
    },
    {
      icon: 'campaign',
      title: 'Marketing Content',
      description: 'Create compelling visuals for campaigns and promotions.',
    },
    {
      icon: 'palette',
      title: 'Creative Projects',
      description: 'Explore artistic ideas and develop unique visual concepts.',
    },
    {
      icon: 'group_work',
      title: 'Professional Team Collaboration',
      description: 'Work seamlessly with colleagues on shared creative initiatives.',
    },
  ];

  const prohibitedContent = [
    {
      icon: 'gavel',
      title: 'Illegal Content',
      description: 'Content that violates local, national, or international laws.',
    },
    {
      icon: 'warning',
      title: 'Violence & Harmful Content',
      description: 'Depictions of graphic violence, self-harm, or endangerment.',
    },
    {
      icon: 'block',
      title: 'Hate Speech',
      description: 'Content promoting discrimination, hatred, or violence against groups.',
    },
    {
      icon: 'money_off',
      title: 'Fraud & Deceptive Content',
      description: 'Misinformation, scams, deepfakes designed to mislead, or financial fraud.',
    },
    {
      icon: 'copyright',
      title: 'Copyright Infringement',
      description: 'Unauthorized use of protected intellectual property or trademarks.',
    },
    {
      icon: 'report_problem',
      title: 'Platform Abuse',
      description: 'Automated scraping, API abuse, or attempts to circumvent security.',
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
              <h1 className={styles.heroTitle}>Acceptable Use Policy</h1>
              <p className={styles.heroDescription}>
                This policy explains how dexericai should be used responsibly to ensure a safe,
                secure and professional creative environment for every customer.
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
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCKKRNr54hWzmLsP6d9WEhHNgfhTxzMvGIq-cK23VXX-YeqN48ZZZCwz7gllXTuLC3sourwlhpWBPkoMgfPRMhm4OIP-GOzpaBC8VLVqsLPPIaYQULv9KD9fgUiUZhAf-g7YlnsNoREKWvvATQPFw6a6J23o1OZxLECxipgzYhGCarrP_sINeaPyuWEK1U_ORYzjYBXTudtPhKw7BVdmhVn4xbj4XZ7mdzFfBptU_7G2AGo7k_uDM5KdUlhSZylmEICEJwqD0Q1xgM"
                  alt="AI Safety Dashboard"
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
                <h2>Service Overview</h2>
              </div>
              <div className={styles.chapterContent}>
                <p>
                  This Acceptable Use Policy outlines the guidelines and rules for using dexericai
                  AI's services. We are committed to fostering a safe, respectful, and legally
                  compliant environment for all users.
                </p>
              </div>
            </div>

            {/* Chapter 02 */}
            <div className={styles.chapter} id="permitted-content">
              <div className={styles.chapterHeader}>
                <span className={styles.chapterNumber}>02</span>
                <h2>Permitted Use</h2>
              </div>
              <div className={styles.chapterContent}>
                <p>
                  Users are encouraged to utilize dexericai for creative, professional, and
                  commercial endeavors that comply with this policy and applicable laws.
                </p>
              </div>
            </div>

            {/* Chapter 03 */}
            <div className={styles.chapter} id="prohibited-content">
              <div className={styles.chapterHeader}>
                <span className={styles.chapterNumber}>03</span>
                <h2>Prohibited Content</h2>
              </div>
              <div className={styles.chapterContent}>
                <p>
                  We strictly prohibit the generation, sharing, or promotion of illegal, harmful,
                  hateful, fraudulent, or infringing content. Any violation may result in immediate
                  account suspension or termination.
                </p>
              </div>
            </div>

            {/* Chapter 04 */}
            <div className={styles.chapter} id="ip">
              <div className={styles.chapterHeader}>
                <span className={styles.chapterNumber}>04</span>
                <h2>Intellectual Property</h2>
              </div>
              <div className={styles.chapterContent}>
                <p>
                  Users must respect intellectual property rights. Do not use dexericai to
                  generate content that infringes upon copyrights, trademarks, or other proprietary
                  rights of third parties.
                </p>
              </div>
            </div>

            {/* Chapter 05 */}
            <div className={styles.chapter} id="safety">
              <div className={styles.chapterHeader}>
                <span className={styles.chapterNumber}>05</span>
                <h2>Data &amp; Safety</h2>
              </div>
              <div className={styles.chapterContent}>
                <p>
                  We employ robust security measures to protect user data and platform integrity.
                  Users must not attempt to compromise our systems, bypass security controls, or
                  exploit vulnerabilities.
                </p>
              </div>
            </div>
          </article>
        </section>

        {/* SECTION 4: PERMITTED USE GRID */}
        <section className={styles.permitted} id="permitted">
          <div className={styles.permittedHeader}>
            <h2>Permitted Use</h2>
            <p>Examples of how you can utilize our platform responsibly.</p>
          </div>
          <div className={styles.permittedGrid}>
            {permittedUses.map((item, index) => (
              <div key={index} className={styles.permittedCard}>
                <div className={styles.permittedGlow}></div>
                <span className="material-symbols-outlined">{item.icon}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 4.5: PROHIBITED CONTENT GRID */}
        <section className={styles.prohibited} id="prohibited">
          <div className={styles.prohibitedHeader}>
            <h2>Prohibited Content</h2>
            <p>Content types that are strictly forbidden on our platform.</p>
          </div>
          <div className={styles.prohibitedGrid}>
            {prohibitedContent.map((item, index) => (
              <div key={index} className={styles.prohibitedCard}>
                <div className={styles.prohibitedGlow}></div>
                <span className="material-symbols-outlined">{item.icon}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
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
            <h2>Help Keep dexericai Safe</h2>
            <p>
              Report violations, appeal moderation decisions or contact our Trust &amp; Safety team
              for additional guidance.
            </p>
            <div className={styles.ctaButtons}>
              <Link href="/contact" className={styles.ctaPrimary}>
                Report Abuse
                <span className="material-symbols-outlined">flag</span>
              </Link>
              <Link href="/contact" className={styles.ctaSecondary}>
                Contact Trust &amp; Safety
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