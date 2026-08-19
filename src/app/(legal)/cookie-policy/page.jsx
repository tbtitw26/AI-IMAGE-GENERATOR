'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.scss';

// Component imports
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import { COOKIE_POLICY } from '@/data/legalPoliciesDocument';
import { COMPANY_LEGAL_INFO } from '@/data/legalPolicies';

export default function CookiePolicyPage() {
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

    let animId;
    const render = (timestamp) => {
      if (typeof ResizeObserver === 'undefined') syncSize();
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (uTime) gl.uniform1f(uTime, timestamp * 0.001);
      if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
      if (uMouse) gl.uniform2f(uMouse, mouseX, mouseY);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animId = requestAnimationFrame(render);
    };
    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (animId) cancelAnimationFrame(animId);
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

  return (
    <>
      <Header />

      <main className={styles.main}>
        {/* Reading Progress */}
        <div className={styles.readingProgress} style={{ width: `${progress}%` }}></div>

        {/* Background */}
        <canvas ref={canvasRef} className={styles.bgCanvas} />

        {/* HERO SECTION */}
        <section className={styles.hero}>
          <div className={styles.heroGrid}>
            <div className={styles.heroContent}>
              <div className={styles.heroBadge}>
                <span className="material-symbols-outlined">cookie</span>
                <span>Cookie &amp; Tracking Policy</span>
              </div>
              <h1 className={styles.heroTitle}>{COOKIE_POLICY.title}</h1>
              <p className={styles.heroDescription}>
                This Cookie Policy explains how {COMPANY_LEGAL_INFO.name} uses cookies and similar technologies on the Dexeric AI Website and Service.
              </p>
              <div className={styles.heroMeta}>
                <div className={styles.metaItem}>
                  <span className="material-symbols-outlined">update</span>
                  Effective Date: {COOKIE_POLICY.effectiveDate}
                </div>
                <div className={styles.metaDivider}></div>
                <div className={styles.metaItem}>
                  <span className="material-symbols-outlined">shield</span>
                  {COMPANY_LEGAL_INFO.name}
                </div>
              </div>
            </div>

            <div className={styles.heroImage}>
              <div className={styles.heroImageWrapper}>
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAGWtgtYNVU5ckFte5loMSLRIu0ZAkFvHqwCcY3MnIPsZI5-_hGLpZwyUc9QD4ZAS1f9_gbJgPMmbKX5K53hhWtzns1y1Pjc0kNy28Dhtv4nxofsHrhijR2-joYpUaOI5lhs1qhQWwH7mlqy7Hw-0fompZ6oFSAdpOEw74m9hb7y4_RkC_MCfH2otGuDJ7icT1tOd6dp1yblOt7Q3cmKz1Eh1ah4iApWFcsiHJcZUIjQ_mQl6mSev9s3BkOlKWQ7V2X_dXoIoh5Xm8"
                  alt="Cookie Policy"
                />
                <div className={styles.heroImageOverlay}></div>
              </div>
            </div>
          </div>
        </section>

        {/* LEGAL CONTENT SECTION */}
        <section className={styles.legalContent}>
          <aside className={styles.toc}>
            <div className={styles.tocContainer}>
              <h3>Sections</h3>
              <ul>
                {COOKIE_POLICY.sections.map((sec) => (
                  <li key={sec.number}>
                    <a href={`#sec-${sec.number}`} className={styles.tocLink}>
                      <span className={styles.tocNumber}>
                        {String(sec.number).padStart(2, '0')}
                      </span>
                      {sec.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          <article ref={articleRef} className={styles.article}>
            {COOKIE_POLICY.sections.map((sec) => (
              <div key={sec.number} className={styles.chapter} id={`sec-${sec.number}`}>
                <div className={styles.chapterHeader}>
                  <span className={styles.chapterNumber}>
                    {String(sec.number).padStart(2, '0')}
                  </span>
                  <h2>{sec.fullTitle}</h2>
                </div>
                <div className={styles.chapterContent}>
                  {sec.blocks.map((block, bIdx) => {
                    if (block.type === 'paragraph') {
                      return <p key={bIdx}>{block.text}</p>;
                    }
                    if (block.type === 'list') {
                      return (
                        <ul key={bIdx}>
                          {block.items.map((item, iIdx) => (
                            <li key={iIdx}>{item}</li>
                          ))}
                        </ul>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            ))}
          </article>
        </section>

        {/* CONTACT CTA */}
        <section className={styles.cta}>
          <div className={styles.ctaContainer}>
            <span className="material-symbols-outlined">cookie</span>
            <h2>Cookie Questions or Settings</h2>
            <p>
              For inquiries regarding cookies or tracking technologies, contact info@dexericai.com.
            </p>
            <div className={styles.ctaButtons}>
              <a href="mailto:info@dexericai.com" className={styles.ctaPrimary}>
                Contact Cookie Support
                <span className="material-symbols-outlined">arrow_forward</span>
              </a>
              <Link href="/privacy-policy" className={styles.ctaSecondary}>
                Privacy Policy
              </Link>
            </div>
            <div className={styles.ctaMeta}>
              <span className="material-symbols-outlined">domain</span>
              DEXERIC OÜ (Registry code: 17569201) | Tallinn, Estonia
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}