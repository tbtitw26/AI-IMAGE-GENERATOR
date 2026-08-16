'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import styles from './page.module.scss';

// Імпорт компонентів
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';

const VALUES = [
  {
    icon: 'brush',
    title: 'Creative Freedom',
    description: 'Unbound potential with tools designed to interpret nuance.',
  },
  {
    icon: 'verified',
    title: 'Professional Quality',
    description: 'Cinematic outputs that meet the highest industry standards.',
  },
  {
    icon: 'corporate_fare',
    title: 'Enterprise Reliability',
    description: 'Secure, scalable infrastructure for mission-critical workflows.',
  },
  {
    icon: 'psychology',
    title: 'Human-centered AI',
    description: "Augmenting the artist's touch, never overwriting their intent.",
  },
];

const COMMUNITY = [
  {
    icon: 'campaign',
    title: 'Creative Agencies',
    description: 'Scaling high-end campaign visuals at the speed of thought.',
  },
  {
    icon: 'checkroom',
    title: 'Fashion Brands',
    description: 'Virtual lookbooks and conceptual runway designs.',
  },
  {
    icon: 'apartment',
    title: 'Architectural Studios',
    description: 'Photorealistic environmental renders in seconds.',
  },
  {
    icon: 'sports_esports',
    title: 'Game Developers',
    description: 'Concept art and asset generation for immersive worlds.',
  },
];

const PROCESS_STEPS = [
  { number: '01', title: 'Idea' },
  { number: '02', title: 'Prompt' },
  { number: '03', title: 'AI Generation' },
  { number: '04', title: 'Refinement' },
  { number: '05', title: 'Export' },
];

const STATS = [
  { value: '99.99%', label: 'Uptime SLA' },
  { value: '<0.5s', label: 'Average Latency' },
  { value: '24/7', label: 'Priority Support' },
  { value: 'Global', label: 'Cloud Infrastructure' },
];

const TRUST_BADGES = [
  { icon: 'verified_user', label: 'Commercial Licensing' },
  { icon: 'cloud_done', label: 'Enterprise Ready' },
  { icon: 'gavel', label: 'GDPR Compliance' },
  { icon: 'payments', label: 'PCI DSS' },
  { icon: 'speed', label: 'High Availability' },
  { icon: 'support_agent', label: 'Pro Support' },
];

export default function AboutPage() {
  const canvasRef = useRef(null);

  // Intersection Observer for scroll reveal animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.isVisible);
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll(`.${styles.revealOnScroll}`).forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // WebGL ambient background shader
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
    const handleMouseMove = (event) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width && rect.height) {
        const nx = (event.clientX - rect.left) / rect.width;
        const ny = 1.0 - (event.clientY - rect.top) / rect.height;
        mouseX = nx * canvas.width;
        mouseY = ny * canvas.height;
      }
    };
    window.addEventListener('mousemove', handleMouseMove);

    const vs = `attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

    const fs = `precision highp float;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
varying vec2 v_texCoord;

vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 a0 = x - floor(x + 0.5);
  float m0 = 1.0 / (a0.x * a0.x + h.x * h.x);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
  vec2 uv = v_texCoord;
  vec2 m = u_mouse / u_resolution;

  float n1 = snoise(uv * 1.5 + u_time * 0.05);
  float n2 = snoise(uv * 2.0 - u_time * 0.03 + n1 * 0.2);

  vec3 color1 = vec3(0.015, 0.02, 0.04);
  vec3 color2 = vec3(0.04, 0.06, 0.12);
  vec3 color3 = vec3(0.06, 0.04, 0.1);

  vec3 finalColor = mix(color1, color2, n1 * 0.5 + 0.5);
  finalColor = mix(finalColor, color3, n2 * 0.4 + 0.6);

  float dist = distance(uv, m);
  float glow = smoothstep(0.4, 0.0, dist) * 0.12;
  finalColor += vec3(0.35, 0.55, 1.0) * glow;

  float vignette = 1.0 - smoothstep(0.5, 1.5, length(uv - 0.5));
  finalColor *= vignette;

  gl_FragColor = vec4(finalColor, 1.0);
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
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const pos = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRes = gl.getUniformLocation(prog, 'u_resolution');
    const uMouse = gl.getUniformLocation(prog, 'u_mouse');

    let animationFrame;
    const render = (timestamp) => {
      if (typeof ResizeObserver === 'undefined') syncSize();
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (uTime) gl.uniform1f(uTime, timestamp * 0.001);
      if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
      if (uMouse) gl.uniform2f(uMouse, mouseX, mouseY);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationFrame = requestAnimationFrame(render);
    };
    animationFrame = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <>
      <Header />

      <main className={styles.main}>
        <canvas ref={canvasRef} className={styles.bgCanvas} />

        {/* HERO */}
        <section className={`${styles.hero} ${styles.revealOnScroll} ${styles.isVisible}`}>
          <div className={styles.heroGrid}>
            <div className={styles.heroContent}>
              <div className={styles.heroBadge}>
                <span className={styles.pulseDot} />
                <span>About dexericai</span>
              </div>
              <h1 className={styles.heroTitle}>Creating the future of visual creativity.</h1>
              <p className={styles.heroDescription}>
                dexericai was born from a singular vision: to equip professional creators, studios, and
                enterprise teams with uncompromised generative power. We build cinematic-grade models that
                respect artistic intent while accelerating workflows, ensuring every pixel aligns with your
                creative direction.
              </p>
            </div>
            <div className={styles.heroVisual}>
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCnpyo0BL-mxp77QHohVR8MGefG9EDBthuMjxCNHGxUDkyIg--dC7AKGJ456H4-F0fNViea1zlbLC4QMuv9v-iE5rUUERbbq51a_Rnx7n__lUC--x3734bsykYKAbVzmWZj_2Yn46YfdyTjBsqYM5vNRfgBty2a-AK1eW_ZM0-s27OYezfT6kKzkUO577V7pJsvOJIoPLHN2xoEwUaCoqoKoxQZwdo7YJlhhaTe2UNt6imJmnLEFh2MdJEl11FCul_6KEnRYxlqLW4"
                alt="Cinematic layered artwork composition"
              />
            </div>
          </div>
        </section>

        {/* VALUES */}
        <section className={`${styles.values} ${styles.revealOnScroll}`}>
          <div className={styles.valuesGrid}>
            <div className={styles.valuesIntro}>
              <h2 className={styles.sectionTitle}>Technology should amplify creativity, not replace it.</h2>
            </div>
            <div className={styles.cardsGrid}>
              {VALUES.map((item, i) => (
                <div key={item.title} className={`${styles.glassCard} ${i % 2 === 1 ? styles.cardOffset : ''}`}>
                  <span className="material-symbols-outlined">{item.icon}</span>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* COMMUNITY */}
        <section className={`${styles.community} ${styles.revealOnScroll}`}>
          <div className={styles.communityHeader}>
            <h2 className={styles.sectionTitle}>Our Global Community</h2>
            <p>Empowering the world&apos;s most ambitious creative teams across every industry.</p>
          </div>
          <div className={styles.communityGrid}>
            {COMMUNITY.map((item, i) => (
              <div key={item.title} className={`${styles.glassCard} ${i % 2 === 1 ? styles.cardOffset : ''}`}>
                <span className="material-symbols-outlined">{item.icon}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* PROCESS */}
        <section className={`${styles.process} ${styles.revealOnScroll}`}>
          <h2 className={styles.sectionTitleCenter}>Our Creative Process</h2>
          <div className={styles.processTrack}>
            <div className={styles.processLine} />
            {PROCESS_STEPS.map((step) => (
              <div key={step.number} className={styles.processStep}>
                <div className={styles.processNumber}>{step.number}</div>
                <h4>{step.title}</h4>
              </div>
            ))}
          </div>
        </section>

        {/* STATS */}
        <section className={`${styles.stats} ${styles.revealOnScroll}`}>
          <div className={styles.statsGrid}>
            {STATS.map((stat) => (
              <div key={stat.label} className={styles.statItem}>
                <span className={styles.statValue}>{stat.value}</span>
                <span className={styles.statLabel}>{stat.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* TRUST */}
        <section className={`${styles.trust} ${styles.revealOnScroll}`}>
          <h2 className={styles.sectionTitleCenter}>Enterprise-Grade Trust</h2>
          <div className={styles.trustGrid}>
            {TRUST_BADGES.map((badge) => (
              <div key={badge.label} className={styles.trustBadge}>
                <span className="material-symbols-outlined">{badge.icon}</span>
                <span>{badge.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* FINAL CTA */}
        <section className={`${styles.cta} ${styles.revealOnScroll}`}>
          <div className={styles.ctaBackground}>
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDqZfKX0aP8kPE_MtGXRQPec5vbcVhQqDVqeJoFPwkhcRvyZwf18Zc_k-z7aUFaxPeZV6ZaWUiX5l5okR6NtAKLwYkZuOkWfna__HvBivBSXRFai9mgVeh7vw-O9EPHzTXj22ILtTI0JnqRRayfWPKbqjLi6o2rP5A0Jy9L1RthcW7gIjZLnJYFJXBkOXgkrJUSGWxedRa-5TFIiCg4tuuhDOL8wdB7YTqTsRVFaVWoHcxrA4TjbqwkBQ"
              alt="Abstract energetic cinematic background"
            />
          </div>
          <div className={styles.ctaCard}>
            <h2>Join the future of visual creativity.</h2>
            <div className={styles.ctaButtons}>
              <Link href="/register" className={styles.ctaPrimary}>
                Start Creating
              </Link>
              <Link href="/pricing" className={styles.ctaSecondary}>
                Explore Pricing
              </Link>
            </div>
            <p className={styles.ctaSubtext}>
              <span className="material-symbols-outlined">verified</span>
              Trusted by creators in over 40 countries.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
