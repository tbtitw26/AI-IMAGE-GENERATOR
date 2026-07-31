'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.scss';
import Footer from '@/components/common/Footer';

export default function OrderFailedPage() {
  const canvasRef = useRef(null);

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
    vec3 accent3 = vec3(1.0, 0.7, 0.2);
    
    vec3 color = mix(bg, deep, uv.y + sin(t) * 0.1);
    
    float d1 = length(p - vec2(sin(t * 0.7) * 0.4, cos(t * 0.4) * 0.2));
    float d2 = length(p + vec2(cos(t * 0.5) * 0.5, sin(t * 0.3) * 0.3));
    float d3 = length(p - vec2(sin(t * 1.1) * 0.6, cos(t * 0.8) * 0.4));
    float dMouse = length(p - m);
    
    color += accent1 * (0.06 / (d1 + 0.8));
    color += accent2 * (0.05 / (d2 + 0.9));
    color += accent3 * (0.04 / (d3 + 1.2));
    color += accent1 * (0.05 / (dMouse + 0.7)) * (sin(u_time * 2.0) * 0.2 + 0.8);
    
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

  const statusCards = [
    {
      label: 'Status',
      value: 'Failed',
      icon: 'cancel',
      color: 'error',
      highlight: true,
    },
    {
      label: 'Order Ref',
      value: '#AF-8921-XQ',
      icon: null,
      color: 'surface',
    },
    {
      label: 'Amount',
      value: '$249.00 USD',
      icon: null,
      color: 'surface',
    },
    {
      label: 'Secure Checkout',
      value: '256-bit Encrypted',
      icon: 'lock',
      color: 'primary',
      gradient: true,
    },
  ];

  const reasons = [
    {
      icon: 'credit_card_off',
      title: 'Card Declined',
      description: 'Your bank actively refused the charge. Verify details or contact them.',
      color: 'error',
    },
    {
      icon: 'account_balance_wallet',
      title: 'Insufficient Funds',
      description: 'The linked account does not have enough balance to cover the transaction.',
      color: 'secondary',
    },
    {
      icon: 'verified_user',
      title: 'Verification Required',
      description: 'Your bank requires additional 3D Secure or SMS verification to proceed.',
      color: 'tertiary',
    },
    {
      icon: 'wifi_off',
      title: 'Network Timeout',
      description: 'A temporary communication error occurred between our gateway and your bank.',
      color: 'outline',
    },
  ];

  return (
    <div className={styles.orderFailed}>
      {/* Background Shader */}
      <canvas ref={canvasRef} className={styles.bgCanvas} />
      <div className={styles.bgOverlay}></div>

      {/* Navigation */}
      <nav className={styles.nav}>
        <div className={styles.navContainer}>
          <span className={styles.logo}>AetherFrame AI</span>
          <div className={styles.navRight}>
            <Link href="/support" className={styles.supportLink}>Support</Link>
            <Link href="/dashboard/wallet" className={styles.walletLink}>
              Go to Wallet
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className={styles.main}>
        {/* SECTION 1: HERO */}
        <section className={styles.hero}>
          <div className={styles.heroImage}>
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuB3Npj5_lCAiL1QZ85H0VvmprG4CzVztEhFE9FGVZ_XIuUNfWxdAyBHfN9hbLhETC0tpUWQQl1uYOJBqUfIk9ltLh48ErmJSfHB-pn4F_cvkslzaQNsFJaDsBZw6crFSTEqOQvz4-4AJZsxDk_e-UM_sQQhAotYY2AFHToDiN6GjDE1eS1ZsR1p-1WhC7Ps66YGcgq3y1PdPx6NhiuaLPQdIKCXZowDTQKClq9BzKWOrid7Pa0RdTtSfRuyNXEmFBL6tKOqPiPRhJI"
              alt="Payment Failed Illustration"
            />
          </div>

          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>
              <span className="material-symbols-outlined">error</span>
              Transaction Incomplete
            </div>
            <h1 className={styles.heroTitle}>Your payment wasn't completed.</h1>
            <p className={styles.heroDescription}>
              We encountered an issue while processing your request. No funds have been charged to
              your account. Please review your details or try an alternative payment method.
            </p>
          </div>

          {/* Status Cards */}
          <div className={styles.statusCards}>
            {statusCards.map((card, index) => (
              <div
                key={index}
                className={`${styles.statusCard} ${card.highlight ? styles.statusCardHighlight : ''} ${card.gradient ? styles.statusCardGradient : ''} ${styles[`statusCard${card.color.charAt(0).toUpperCase() + card.color.slice(1)}`]}`}
              >
                {card.gradient && (
                  <div className={styles.statusCardGlow}></div>
                )}
                <span className={styles.statusLabel}>{card.label}</span>
                <span className={`${styles.statusValue} ${card.color === 'error' ? styles.statusValueError : ''} ${card.color === 'primary' ? styles.statusValuePrimary : ''}`}>
                  {card.icon && (
                    <span className="material-symbols-outlined">{card.icon}</span>
                  )}
                  {card.value}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 2: POSSIBLE REASONS */}
        <section className={styles.reasons}>
          <h2 className={styles.reasonsTitle}>Possible Reasons</h2>
          <div className={styles.reasonsGrid}>
            {reasons.map((reason, index) => (
              <div key={index} className={`${styles.reasonCard} ${styles[`reason${reason.color.charAt(0).toUpperCase() + reason.color.slice(1)}`]}`}>
                <div className={styles.reasonIcon}>
                  <span className="material-symbols-outlined">{reason.icon}</span>
                </div>
                <div>
                  <h3>{reason.title}</h3>
                  <p>{reason.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 3: FINAL CTA */}
        <section className={styles.cta}>
          <div className={styles.ctaGlow}></div>
          <div className={styles.ctaContent}>
            <h2>You're only one step away from creating again.</h2>
            <p>Update your payment method to unlock your high-performance AI workspace instantly.</p>
            <div className={styles.ctaButtons}>
              <button className={styles.ctaPrimary}>
                <span className="material-symbols-outlined">refresh</span>
                Try Again
              </button>
              <Link href="/dashboard/wallet" className={styles.ctaSecondary}>
                <span className="material-symbols-outlined">wallet</span>
                Go to Wallet
              </Link>
            </div>
            <div className={styles.ctaFooter}>
              <Link href="/support" className={styles.ctaSupport}>
                Contact Support
              </Link>
              <div className={styles.ctaDivider}></div>
              <span className={styles.ctaSecure}>
                <span className="material-symbols-outlined">shield</span>
                PCI DSS Compliant
              </span>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}