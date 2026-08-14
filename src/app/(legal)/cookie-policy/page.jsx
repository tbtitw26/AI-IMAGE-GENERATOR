'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.scss';

// Імпорт компонентів
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';

export default function CookiePolicyPage() {
  const canvasRef = useRef(null);
  const articleRef = useRef(null);
  const [progress, setProgress] = useState(0);

  // Cookie Preferences State
  const [preferences, setPreferences] = useState({
    necessary: true,
    analytics: true,
    performance: true,
    functional: false,
    marketing: false,
  });

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

  // Load any previously saved cookie preferences
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('cookiePreferences');
      if (saved) {
        setPreferences((prev) => ({ ...prev, ...JSON.parse(saved) }));
      }
    } catch {
      // ignore malformed/unavailable storage
    }
  }, []);

  const handlePreferenceChange = (key) => {
    if (key === 'necessary') return; // Necessary cookies are always enabled
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAcceptAll = () => {
    setPreferences({
      necessary: true,
      analytics: true,
      performance: true,
      functional: true,
      marketing: true,
    });
  };

  const handleRejectOptional = () => {
    setPreferences({
      necessary: true,
      analytics: false,
      performance: false,
      functional: false,
      marketing: false,
    });
  };

  const [saveStatus, setSaveStatus] = useState('');

  const handleSavePreferences = () => {
    try {
      window.localStorage.setItem('cookiePreferences', JSON.stringify(preferences));
      setSaveStatus('Preferences saved.');
    } catch {
      setSaveStatus('Could not save preferences on this device.');
    }
    window.setTimeout(() => setSaveStatus(''), 3000);
  };

  const quickLinks = [
    { icon: 'info', label: 'Overview', href: '#ch01' },
    { icon: 'cookie', label: 'What Are Cookies', href: '#ch02' },
    { icon: 'category', label: 'Types of Cookies', href: '#ch03' },
    { icon: 'lock', label: 'Essential Cookies', href: '#essential' },
    { icon: 'speed', label: 'Performance Cookies', href: '#performance' },
    { icon: 'analytics', label: 'Analytics Cookies', href: '#analytics' },
    { icon: 'settings_suggest', label: 'Functional Cookies', href: '#functional' },
    { icon: 'tune', label: 'Managing Cookies', href: '#ch04' },
    { icon: 'handshake', label: 'Third-Party Cookies', href: '#thirdparty' },
    { icon: 'toggle_on', label: 'Cookie Preferences', href: '#preferences' },
    { icon: 'update', label: 'Policy Updates', href: '#ch05' },
  ];

  const tocItems = [
    { number: '01', label: 'Overview', href: '#ch01' },
    { number: '02', label: 'Definition', href: '#ch02' },
    { number: '03', label: 'Categories', href: '#ch03' },
    { number: '04', label: 'Browser Controls', href: '#ch04' },
    { number: '05', label: 'Policy Updates', href: '#ch05' },
  ];

  const cookieCategories = [
    {
      icon: 'lock',
      title: 'Essential',
      description: 'Required for basic site functionality and security.',
      example: 'Authentication tokens, secure session IDs.',
      color: 'primary',
      id: 'essential',
    },
    {
      icon: 'speed',
      title: 'Performance',
      description: 'Helps us understand how users interact with our platform.',
      example: 'Load time metrics, error rate tracking.',
      color: 'secondary',
      id: 'performance',
    },
    {
      icon: 'analytics',
      title: 'Analytics',
      description: 'Used to collect statistical information about site usage.',
      example: 'Page view counts, user journey analysis.',
      color: 'tertiary',
      id: 'analytics',
    },
    {
      icon: 'settings_suggest',
      title: 'Functional',
      description: 'Enables enhanced functionality and personalization.',
      example: 'Remembering language preferences, theme settings.',
      color: 'primary',
      id: 'functional',
    },
    {
      icon: 'security',
      title: 'Security',
      description: 'Protects user data and platform integrity.',
      example: 'CSRF tokens, fraud detection mechanisms.',
      color: 'secondary',
      id: 'security',
    },
    {
      icon: 'tune',
      title: 'Preference',
      description: 'Stores your specific choices regarding cookie usage.',
      example: 'Your saved cookie consent selections.',
      color: 'tertiary',
      id: 'preference',
    },
  ];

  const complianceMarks = [
    { icon: 'policy', label: 'GDPR Ready' },
    { icon: 'lock', label: 'PCI DSS' },
    { icon: 'verified', label: 'Encrypted Sessions' },
    { icon: 'security', label: 'Secure Authentication' },
    { icon: 'visibility', label: 'Cookie Transparency' },
    { icon: 'tune', label: 'Privacy Controls' },
  ];

  const preferenceItems = [
    { key: 'necessary', label: 'Necessary', description: 'Required for basic site functionality.', disabled: true },
    { key: 'analytics', label: 'Analytics', description: 'Help us improve by collecting anonymous usage data.' },
    { key: 'performance', label: 'Performance', description: 'Ensure optimal speed and reliability.' },
    { key: 'functional', label: 'Functional', description: 'Enable advanced features and personalization.' },
    { key: 'marketing', label: 'Marketing', description: 'Used to deliver relevant advertisements.' },
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
                <span>Legal Center</span>
              </div>
              <h1 className={styles.heroTitle}>Cookie Policy</h1>
              <p className={styles.heroDescription}>
                Learn how dexericai uses cookies and similar technologies to improve security,
                personalize your experience and optimize platform performance while respecting your
                privacy.
              </p>
              <div className={styles.heroMeta}>
                <div className={styles.metaItem}>
                  <span className="material-symbols-outlined">update</span>
                  Last Updated: October 24, 2024
                </div>
                <div className={styles.metaDivider}></div>
                <div className={styles.metaItem}>
                  <span className="material-symbols-outlined">timer</span>
                  8 min read
                </div>
              </div>
            </div>

            <div className={styles.heroImage}>
              <div className={styles.heroImageWrapper}>
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuD29YT9KfZBkySoR7umug6UlA449AJeEMt-RD1NFz5ccozdq809QjJJMQCI9Eg8PxatxyvcpmTYlYir7d7wFeNWJ12PHKXyqajzhj845YIN0EZGXYAtO51AWynWe5y1lZ5cgwMDK_JrhA6aUfa_4WJa2yxDBz_QKX8v46mAWX10UPR3Byv32TUBHNXI7bf6G7vHyNIQUUvSqm6R_hm-dBoqlcgV5sQ3qDCoAVIjH0c1a_BaULSTqGqBwD3xyghFnlgsAu04YGaZEdM"
                  alt="Cookie Policy"
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
                <h2>Overview</h2>
              </div>
              <div className={styles.chapterContent}>
                <p>
                  This Cookie Policy explains how dexericai ("we", "us", or "our") uses cookies
                  and similar technologies to recognize you when you visit our platform. It explains
                  what these technologies are and why we use them, as well as your rights to control
                  our use of them.
                </p>
              </div>
            </div>

            {/* Chapter 02 */}
            <div className={styles.chapter} id="ch02">
              <div className={styles.chapterHeader}>
                <span className={styles.chapterNumber}>02</span>
                <h2>Definition</h2>
              </div>
              <div className={styles.chapterContent}>
                <p>
                  Cookies are small data files that are placed on your computer or mobile device
                  when you visit a website. Cookies are widely used by website owners in order to
                  make their websites work, or to work more efficiently, as well as to provide
                  reporting information.
                </p>
              </div>
            </div>

            {/* Chapter 03 */}
            <div className={styles.chapter} id="ch03">
              <div className={styles.chapterHeader}>
                <span className={styles.chapterNumber}>03</span>
                <h2>Categories</h2>
              </div>
              <div className={styles.chapterContent}>
                <p>
                  We use first-party and third-party cookies for several reasons. Some cookies are
                  required for technical reasons in order for our platform to operate, and we refer
                  to these as "essential" or "strictly necessary" cookies. Other cookies also enable
                  us to track and target the interests of our users to enhance the experience on our
                  platform.
                </p>
              </div>
            </div>

            {/* Chapter 04 */}
            <div className={styles.chapter} id="ch04">
              <div className={styles.chapterHeader}>
                <span className={styles.chapterNumber}>04</span>
                <h2>Browser Controls</h2>
              </div>
              <div className={styles.chapterContent}>
                <p>
                  You have the right to decide whether to accept or reject cookies. You can set or
                  amend your web browser controls to accept or refuse cookies. If you choose to
                  reject cookies, you may still use our platform though your access to some
                  functionality and areas may be restricted.
                </p>
              </div>
            </div>

            {/* Chapter 05 */}
            <div className={styles.chapter} id="ch05">
              <div className={styles.chapterHeader}>
                <span className={styles.chapterNumber}>05</span>
                <h2>Policy Updates</h2>
              </div>
              <div className={styles.chapterContent}>
                <p>
                  We may update this Cookie Policy from time to time in order to reflect, for
                  example, changes to the cookies we use or for other operational, legal or
                  regulatory reasons. Please therefore re-visit this Cookie Policy regularly to stay
                  informed about our use of cookies and related technologies.
                </p>
              </div>
            </div>
          </article>
        </section>

        {/* SECTION 4: COOKIE TYPES GRID */}
        <section className={styles.cookieTypes}>
          <div className={styles.cookieTypesHeader}>
            <h2>Cookie Categories</h2>
            <p>Understanding how we classify and use cookies.</p>
          </div>
          <div className={styles.cookieTypesGrid}>
            {cookieCategories.map((category, index) => (
              <div
                key={index}
                id={category.id}
                className={`${styles.cookieCard} ${styles[`cookie${category.color.charAt(0).toUpperCase() + category.color.slice(1)}`]}`}
              >
                <div className={styles.cookieGlow}></div>
                <span className="material-symbols-outlined">{category.icon}</span>
                <h3>{category.title}</h3>
                <p>{category.description}</p>
                <span className={styles.cookieExample}>{category.example}</span>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 4.5: COOKIE PREFERENCE CENTER */}
        <section className={styles.preferences} id="preferences">
          <div className={styles.preferencesHeader}>
            <h2>Cookie Preferences</h2>
            <p>Manage your consent settings.</p>
          </div>

          <div className={styles.preferencesContainer}>
            <div className={styles.preferenceList}>
              {preferenceItems.map((item) => (
                <div key={item.key} className={styles.preferenceItem}>
                  <div>
                    <h4>{item.label}</h4>
                    <p>{item.description}</p>
                  </div>
                  <label className={styles.toggleSwitch}>
                    <input
                      type="checkbox"
                      checked={preferences[item.key]}
                      onChange={() => handlePreferenceChange(item.key)}
                      disabled={item.disabled}
                    />
                    <span className={styles.toggleSlider}></span>
                  </label>
                </div>
              ))}
            </div>

            <div className={styles.preferenceActions}>
              <button className={styles.rejectBtn} onClick={handleRejectOptional}>
                Reject Optional
              </button>
              <button className={styles.acceptBtn} onClick={handleAcceptAll}>
                Accept All
              </button>
              <button className={styles.saveBtn} onClick={handleSavePreferences}>
                Save Preferences
              </button>
            </div>
            {saveStatus && <p style={{ color: '#b2c5ff', marginTop: '12px', fontSize: '14px' }}>{saveStatus}</p>}
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
            <h2>Questions About Cookies?</h2>
            <p>
              Our legal and support teams are available to clarify any terms regarding enterprise
              deployment or custom usage rights.
            </p>
            <div className={styles.ctaButtons}>
              <Link href="/contact" className={styles.ctaPrimary}>
                Contact Support
                <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
              <Link href="/privacy-policy" className={styles.ctaSecondary}>
                Privacy Policy
              </Link>
              <Link href="/terms-and-conditions" className={styles.ctaSecondary}>
                Terms &amp; Conditions
              </Link>
              <button
                className={styles.ctaSecondary}
                onClick={() => document.getElementById('preferences').scrollIntoView({ behavior: 'smooth' })}
              >
                Manage Cookie Preferences
              </button>
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