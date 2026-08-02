'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.scss';

// Імпорт компонентів
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';

export default function PrivacyPolicyPage() {
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
    { icon: 'info', label: 'Introduction', href: '#ch01' },
    { icon: 'inventory_2', label: 'Information We Collect', href: '#ch02' },
    { icon: 'analytics', label: 'How We Use Data', href: '#ch03' },
    { icon: 'cookie', label: 'Cookies', href: '#cookies' },
    { icon: 'security', label: 'Data Security', href: '#ch04' },
    { icon: 'public', label: 'International Transfers', href: '#international' },
    { icon: 'gavel', label: 'User Rights', href: '#ch05' },
    { icon: 'handshake', label: 'Third Parties', href: '#thirdparties' },
    { icon: 'history', label: 'Data Retention', href: '#retention' },
    { icon: 'support_agent', label: 'Contact', href: '#contact' },
  ];

  const tocItems = [
    { number: '01', label: 'Introduction', href: '#ch01' },
    { number: '02', label: 'Information We Collect', href: '#ch02' },
    { number: '03', label: 'How We Use Data', href: '#ch03' },
    { number: '04', label: 'Data Security', href: '#ch04' },
    { number: '05', label: 'User Rights', href: '#ch05' },
  ];

  const rightsCards = [
    {
      icon: 'visibility',
      title: 'Access Your Data',
      description: 'Review all the personal data and usage history associated with your AetherFrame AI account.',
      color: 'primary',
    },
    {
      icon: 'download',
      title: 'Download Your Data',
      description: 'Export your personal data and generation history in a standard, machine-readable format.',
      color: 'secondary',
    },
    {
      icon: 'delete',
      title: 'Request Data Deletion',
      description: 'Permanently remove your account and all associated personal data from our active systems.',
      color: 'tertiary',
    },
    {
      icon: 'settings',
      title: 'Manage Communication Preferences',
      description: 'Control the types of emails and notifications you receive from our platform.',
      color: 'error',
    },
  ];

  const complianceMarks = [
    { icon: 'policy', label: 'GDPR' },
    { icon: 'lock', label: 'PCI DSS' },
    { icon: 'verified', label: 'Encrypted Storage' },
    { icon: 'security', label: 'Secure Authentication' },
    { icon: 'mark_email_read', label: 'Email Verification' },
    { icon: 'business', label: 'Enterprise Privacy' },
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
                <span>Privacy Center</span>
              </div>
              <h1 className={styles.heroTitle}>Privacy Policy</h1>
              <p className={styles.heroDescription}>
                Learn how AetherFrame AI collects, stores, processes and protects your personal
                information while using our platform.
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
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBlGcXIQKarLdpI2vPxKIRJmjb2BsZVF3e1si3swWwJeJ1GIGduyHrgF8H9l7XjE0Vw_gGnwuU0qi_jy0B7xDzTBGqpHj2LLZLhDiVOORHxcig4WbEBnSbPHt4xfgrfBPCQEWmicMsOfw5waQt2HfJQVakqFhZGJod3vI6N-r742x2nxv8O53l619kzjhXHww2aqIwUon8nRvo7_UpRub5QxHNzvkzrQlEmS26wtUo4ffCtwWxOHQgWCvSWv5ieGoxcHTAuS2kSZXQ"
                  alt="Privacy Shield"
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
                <h2>Introduction</h2>
              </div>
              <div className={styles.chapterContent}>
                <p>
                  This Privacy Policy outlines the scope of data protection at AetherFrame AI. It
                  explains how we collect, use, and protect your personal data when you use our
                  services.
                </p>
              </div>
            </div>

            {/* Chapter 02 */}
            <div className={styles.chapter} id="ch02">
              <div className={styles.chapterHeader}>
                <span className={styles.chapterNumber}>02</span>
                <h2>Information We Collect</h2>
              </div>
              <div className={styles.chapterContent}>
                <p>
                  We collect registration data, usage logs, and AI prompts to provide and improve our
                  services. This includes information you provide directly and data collected
                  automatically as you interact with our platform.
                </p>
              </div>
            </div>

            {/* Chapter 03 */}
            <div className={styles.chapter} id="ch03">
              <div className={styles.chapterHeader}>
                <span className={styles.chapterNumber}>03</span>
                <h2>How We Use Data</h2>
              </div>
              <div className={styles.chapterContent}>
                <p>
                  Your data is used for service optimization, security, and billing purposes. We
                  analyze usage patterns to enhance our AI models and ensure a secure, reliable
                  experience for all users.
                </p>
              </div>
            </div>

            {/* Chapter 04 */}
            <div className={styles.chapter} id="ch04">
              <div className={styles.chapterHeader}>
                <span className={styles.chapterNumber}>04</span>
                <h2>Data Security</h2>
              </div>
              <div className={styles.chapterContent}>
                <p>
                  We employ encryption standards (AES-256) and adhere to SOC2 protocols to protect
                  your personal information against unauthorized access, alteration, or destruction.
                </p>
              </div>
            </div>

            {/* Chapter 05 */}
            <div className={styles.chapter} id="ch05">
              <div className={styles.chapterHeader}>
                <span className={styles.chapterNumber}>05</span>
                <h2>User Rights</h2>
              </div>
              <div className={styles.chapterContent}>
                <p>
                  You have the right to access, deletion, and portability of your personal data. We
                  are committed to empowering you with control over the information you share with us.
                </p>
              </div>
            </div>
          </article>
        </section>

        {/* SECTION 4: YOUR RIGHTS */}
        <section className={styles.rights}>
          <div className={styles.rightsHeader}>
            <h2>Your Privacy Rights</h2>
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
            <h2>Privacy Questions?</h2>
            <p>
              Our legal and support teams are available to clarify any terms regarding enterprise
              deployment or custom usage rights.
            </p>
            <div className={styles.ctaButtons}>
              <Link href="/contact" className={styles.ctaPrimary}>
                Contact Privacy Team
                <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
              <Link href="/terms-and-conditions" className={styles.ctaSecondary}>
                Terms &amp; Conditions
              </Link>
              <Link href="/cookie-policy" className={styles.ctaSecondary}>
                Cookie Policy
              </Link>
              <Link href="/contact" className={styles.ctaSecondary}>
                Support Center
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