'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.scss';
import Footer from '@/components/common/Footer';

export default function NotFoundPage() {
  const canvasRef = useRef(null);

  // WebGL Background Shader
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return;

    const resize = () => {
      const w = canvas.clientWidth || 1280;
      const h = canvas.clientHeight || 720;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    };
    window.addEventListener('resize', resize);
    resize();

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
    
    // AetherFrame Dark Palette
    vec3 bg = vec3(0.0157, 0.0196, 0.0392);
    vec3 deep = vec3(0.0392, 0.0627, 0.1255);
    
    // Error/Drift Accents
    vec3 accent1 = vec3(0.357, 0.549, 1.0);
    vec3 accent2 = vec3(0.545, 0.361, 0.965);
    
    vec3 color = mix(bg, deep, uv.y + sin(t) * 0.1);
    
    // Ethereal glow fields
    float d1 = length(p - vec2(sin(t * 0.7) * 0.6, cos(t * 0.4) * 0.3));
    float d2 = length(p + vec2(cos(t * 0.5) * 0.7, sin(t * 0.3) * 0.4));
    float dMouse = length(p - m);
    
    color += accent1 * (0.05 / (d1 + 0.8));
    color += accent2 * (0.04 / (d2 + 0.9));
    color += accent1 * (0.04 / (dMouse + 0.7)) * (sin(u_time * 1.5) * 0.2 + 0.8);
    
    // Film grain
    float n = noise(uv + u_time);
    color += (n - 0.5) * 0.015;
    
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
      resize();
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (uTime) gl.uniform1f(uTime, timestamp * 0.001);
      if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
      if (uMouse) gl.uniform2f(uMouse, mouseX, mouseY);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      requestAnimationFrame(render);
    };
    requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
    };
  }, []);

  const quickLinks = [
    { icon: 'home', label: 'Home', href: '/' },
    { icon: 'auto_awesome', label: 'Generator', href: '/dashboard/generate' },
    { icon: 'photo_library', label: 'Gallery', href: '/gallery' },
    { icon: 'sell', label: 'Pricing', href: '/pricing' },
    { icon: 'dashboard', label: 'Dashboard', href: '/dashboard' },
    { icon: 'mail', label: 'Contact', href: '/contact' },
  ];

  const searchTags = ['AI Generator', 'Pricing', 'Gallery'];

  return (
    <div className={styles.notFound}>
      {/* WebGL Background */}
      <canvas ref={canvasRef} className={styles.bgCanvas} />

      {/* Navigation */}
      <nav className={styles.nav}>
        <div className={styles.navContainer}>
          <div className={styles.navLeft}>
            <Link href="/" className={styles.logo}>AetherFrame AI</Link>
          </div>
          <div className={styles.navCenter}>
            {['Features', 'Gallery', 'Pricing', 'Security', 'FAQ', 'About'].map((item) => (
              <Link key={item} href={`/${item.toLowerCase().replace(' ', '-')}`} className={styles.navLink}>
                {item}
              </Link>
            ))}
          </div>
          <div className={styles.navRight}>
            <button className={styles.langBtn}>
              <span className="material-symbols-outlined">language</span>
            </button>
            <Link href="/login" className={styles.loginBtn}>Login</Link>
            <Link href="/register" className={styles.ctaBtn}>Start Creating</Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.heroContainer}>
            <div className={styles.heroContent}>
              <h1 className={styles.heroTitle}>404</h1>
              <p className={styles.heroSubtitle}>This page drifted out of the creative universe.</p>
              <p className={styles.heroDescription}>
                The path you're looking for seems to have been lost in the void. Let's redirect your focus.
              </p>
              
              {/* Search */}
              <div className={styles.searchContainer}>
                <div className={styles.searchWrapper}>
                  <span className={styles.searchIcon}>search</span>
                  <input 
                    className={styles.searchInput} 
                    placeholder="Search the AetherFrame cosmos..." 
                    type="text"
                  />
                </div>
                <div className={styles.searchTags}>
                  <span className={styles.tagsLabel}>Try:</span>
                  {searchTags.map((tag) => (
                    <button key={tag} className={styles.tagBtn}>{tag}</button>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.heroImage}>
              <Image
                alt="Abstract broken navigation map"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD_bjfZKeshrpjUpjWtejjQYQcy4to2Ce94sQsTdy5pt2dMElPkzWWzvYUDbnk_OdOucMNqAKp1h8nXS93a2W8mWzQNJQTjXHnPWLFZ9gCOzfNAojDE72JHDvCqWYD5yHjuTkM1PxWd9K5xrV62GNuvhn_CZeRVS2IDaQczNs1cl8VeuxILfAjuj4NcoITWf_TeERR-szzYwEiXEURgiYpGGLbbq2hEPT-9tyjVhdyy47bi3EvtkznzTXHQkFtZ5wQAWYIe8Wg6_mU"
                width={600}
                height={600}
                className={styles.image}
              />
            </div>
          </div>
        </section>

        {/* Quick Destinations */}
        <section className={styles.quickDestinations}>
          <div className={styles.quickContainer}>
            <div className={styles.quickHeader}>
              <h2 className={styles.quickTitle}>Quick Destinations</h2>
              <p className={styles.quickDescription}>Get back on track to your creative workflow.</p>
            </div>
            <div className={styles.quickGrid}>
              {quickLinks.map((link) => (
                <Link key={link.href} href={link.href} className={styles.quickCard}>
                  <div className={styles.quickIcon}>
                    <span className="material-symbols-outlined">{link.icon}</span>
                  </div>
                  <span className={styles.quickLabel}>{link.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className={styles.cta}>
          <h3 className={styles.ctaTitle}>Let's get you back to creating.</h3>
          <Link href="/dashboard" className={styles.ctaBtn}>
            Go to Dashboard
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  );
}