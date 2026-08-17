'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { jsPDF } from 'jspdf';
import styles from './page.module.scss';
import Footer from '@/components/common/Footer';

export default function OrderSuccessPage() {
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
    vec3 deep = vec3(0.0275, 0.0431, 0.0784);
    
    vec3 accent1 = vec3(0.357, 0.549, 1.0);
    vec3 accent2 = vec3(0.545, 0.361, 0.965);
    
    vec3 color = mix(bg, deep, uv.y + sin(t) * 0.1);
    
    float d1 = length(p - vec2(sin(t * 0.7) * 0.4, cos(t * 0.4) * 0.2));
    float d2 = length(p + vec2(cos(t * 0.5) * 0.5, sin(t * 0.3) * 0.3));
    float dMouse = length(p - m);
    
    color += accent1 * (0.05 / (d1 + 0.7));
    color += accent2 * (0.04 / (d2 + 0.8));
    color += accent1 * (0.03 / (dMouse + 0.6)) * (sin(u_time * 2.0) * 0.15 + 0.85);
    
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

  const statusCards = [
    {
      icon: 'check_circle',
      label: 'Payment Status',
      value: 'Completed',
      color: 'tertiary',
    },
    {
      icon: 'account_balance_wallet',
      label: 'Balance Updated',
      value: '+ Credits',
      color: 'primary',
    },
    {
      icon: 'receipt_long',
      label: 'Invoice Ready',
      value: 'Downloadable',
      color: 'secondary',
    },
    {
      icon: 'verified',
      label: 'Commercial License',
      value: 'Active',
      color: 'tertiary-fixed',
    },
  ];

  const orderDetails = [
    { label: 'Order #', value: 'AF-9842' },
    { label: 'Invoice #', value: 'INV-2026-001' },
    { label: 'Purchase Date', value: 'Aug 17, 2026' },
    { label: 'Method', value: 'Credit/Debit Card', icon: 'credit_card' },
    { label: 'Currency', value: 'EUR' },
    { label: 'Amount', value: '€999.00', highlight: true },
    { label: 'Balance', value: '€2,450.00' },
    { label: 'License Type', value: 'Enterprise' },
  ];

  const downloadInvoicePdf = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFillColor(17, 24, 39);
    doc.rect(0, 0, pageWidth, 36, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('dexericai', 14, 18);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Invoice', 14, 28);

    doc.setTextColor(33, 37, 41);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    let y = 54;
    orderDetails.forEach((detail) => {
      doc.setFont('helvetica', detail.highlight ? 'bold' : 'normal');
      doc.text(detail.label, 14, y);
      doc.text(String(detail.value), pageWidth - 24, y, { align: 'right' });
      y += 10;
    });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Thank you for choosing dexericai.', 14, y + 12);

    doc.save('dexericai-invoice.pdf');
  };

  return (
    <div className={styles.orderSuccess}>
      {/* Background Shader */}
      <canvas ref={canvasRef} className={styles.bgCanvas} />
      <div className={styles.bgOverlay}></div>

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContainer}>
          <span className={styles.logo}>dexericai</span>
          <nav className={styles.nav}>
            <Link href="/dashboard" className={styles.navLink}>Dashboard</Link>
            <Link href="/dashboard/gallery" className={styles.navLink}>Gallery</Link>
            <Link href="/dashboard/generate" className={styles.navLink}>Models</Link>
            <Link href="/dashboard/wallet" className={`${styles.navLink} ${styles.navLinkActive}`}>
              Billing
            </Link>
          </nav>
          <div className={styles.headerActions}>
            <span className="material-symbols-outlined">notifications</span>
            <span className="material-symbols-outlined">account_circle</span>
            <Link href="/dashboard" className={styles.workspaceBtn}>
              Go to Workspace
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        {/* SECTION 1: PAYMENT SUCCESS HERO */}
        <section className={styles.hero}>
          <div className={styles.heroImage}>
            <div className={styles.heroGlow}></div>
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDm1a-OZQZ03GGfDhpfxvHHXPUH5oeikqHxsG5ZMewvzlIYpswCMLULJRdCCyRVKMofk_wbaCnkZdgA9JSrLqNH4TbVDFWzKQC-l61M9jOFvj4ermN3eBD4oC-mgINzDHV3mWIbhG7AfcGqtViuUXkdN_or4Vjh-OQmSTkBHpJDJEowqOaOVJUEzDAHtOAliTkpb5VW2K-olDwwOFA8Xiq_fxBwUlfJ34uWiZWls-EAL_QGzbaZDqtuJNGKUstukS96YO4yVYy7v3s"
              alt="Payment Success"
            />
          </div>
          <h1 className={styles.heroTitle}>Payment completed successfully.</h1>
          <p className={styles.heroDescription}>
            Your payment has been securely processed. Your balance has been updated, your order is
            confirmed and your PDF invoice is now available.
          </p>

          <div className={styles.statusGrid}>
            {statusCards.map((card, index) => (
              <div key={index} className={`${styles.statusCard} ${styles[`status${card.color.charAt(0).toUpperCase() + card.color.slice(1)}`]}`}>
                <div className={styles.statusGlow}></div>
                <span className="material-symbols-outlined">{card.icon}</span>
                <span className={styles.statusLabel}>{card.label}</span>
                <span className={styles.statusValue}>{card.value}</span>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 2: ORDER SUMMARY */}
        <section className={styles.orderSummary}>
          <div className={styles.summaryCard}>
            <div className={styles.summaryGlow}></div>
            <div className={styles.summaryHeader}>
              <h2>Order Summary</h2>
              <div className={styles.summaryBadges}>
                <span className={styles.badgePaid}>Paid</span>
                <span className={styles.badgeVerified}>Verified</span>
                <span className={styles.badgeCompleted}>Completed</span>
              </div>
            </div>

            <div className={styles.detailsGrid}>
              {orderDetails.map((detail, index) => (
                <div key={index} className={styles.detailItem}>
                  <span className={styles.detailLabel}>{detail.label}</span>
                  <span className={`${styles.detailValue} ${detail.highlight ? styles.detailHighlight : ''}`}>
                    {detail.icon && (
                      <span className="material-symbols-outlined">{detail.icon}</span>
                    )}
                    {detail.value}
                  </span>
                </div>
              ))}
            </div>

            <div className={styles.summaryActions}>
              <button className={styles.downloadBtn} onClick={downloadInvoicePdf}>
                <span className="material-symbols-outlined">download</span>
                Download PDF Invoice
              </button>
              <Link href="/dashboard/orders" className={styles.actionBtn}>
                <span className="material-symbols-outlined">receipt</span>
                View Orders
              </Link>
              <Link href="/dashboard/wallet" className={styles.actionBtn}>
                <span className="material-symbols-outlined">account_balance_wallet</span>
                Go to Balance
              </Link>
            </div>
          </div>
        </section>

        {/* SECTION 3: FINAL CTA */}
        <section className={styles.cta}>
          <div className={styles.ctaGlow}></div>
          <h2>Everything is ready.</h2>
          <div className={styles.ctaButtons}>
            <Link href="/dashboard/generate" className={styles.ctaPrimary}>
              Start Creating
            </Link>
            <Link href="/dashboard" className={styles.ctaSecondary}>
              Open Dashboard
            </Link>
          </div>
          <div className={styles.ctaMeta}>
            <span className="material-symbols-outlined">lock</span>
            Secure Payment
            <span className={styles.ctaDivider}>•</span>
            <span className="material-symbols-outlined">description</span>
            PDF Invoice Delivered
            <span className={styles.ctaDivider}>•</span>
            <span className="material-symbols-outlined">key</span>
            Commercial License Enabled
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}