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
    { icon: 'handshake', label: 'About These Terms', href: '#ch01' },
    { icon: 'manage_accounts', label: 'Accounts', href: '#ch06' },
    { icon: 'credit_card', label: 'Credits & Payments', href: '#ch07' },
    { icon: 'store', label: 'Outputs & Ownership', href: '#ch11' },
    { icon: 'currency_exchange', label: 'Consumer Rights', href: '#ch18' },
    { icon: 'visibility_off', label: 'Privacy of Generations', href: '#ch12' },
    { icon: 'shield_lock', label: 'Acceptable Use', href: '#ch13' },
    { icon: 'copyright', label: 'Limitation of Liability', href: '#ch20' },
    { icon: 'block', label: 'Suspension & Termination', href: '#ch16' },
    { icon: 'support_agent', label: 'Contact', href: '#ch25' },
  ];

  const tocItems = [
    { number: '01', label: 'About These Terms', href: '#ch01' },
    { number: '02', label: 'Definitions', href: '#ch02' },
    { number: '03', label: 'Eligibility and Age Requirement', href: '#ch03' },
    { number: '04', label: 'Geographic Availability', href: '#ch04' },
    { number: '05', label: 'The Service', href: '#ch05' },
    { number: '06', label: 'Accounts', href: '#ch06' },
    { number: '07', label: 'Credits and Purchases', href: '#ch07' },
    { number: '08', label: 'Prices, Taxes and Payment', href: '#ch08' },
    { number: '09', label: 'Inputs and User Responsibilities', href: '#ch09' },
    { number: '10', label: 'Licence to Process Inputs', href: '#ch10' },
    { number: '11', label: 'Outputs and Ownership', href: '#ch11' },
    { number: '12', label: 'Privacy of Generations', href: '#ch12' },
    { number: '13', label: 'Acceptable Use', href: '#ch13' },
    { number: '14', label: 'Third-Party Technology', href: '#ch14' },
    { number: '15', label: 'Service Changes and Availability', href: '#ch15' },
    { number: '16', label: 'Suspension and Termination', href: '#ch16' },
    { number: '17', label: 'Account Closure', href: '#ch17' },
    { number: '18', label: 'Consumer Rights and Digital Performance', href: '#ch18' },
    { number: '19', label: 'Disclaimers', href: '#ch19' },
    { number: '20', label: 'Limitation of Liability', href: '#ch20' },
    { number: '21', label: 'Business User Indemnity', href: '#ch21' },
    { number: '22', label: 'Governing Law and Disputes', href: '#ch22' },
    { number: '23', label: 'Changes to These Terms', href: '#ch23' },
    { number: '24', label: 'General Provisions', href: '#ch24' },
    { number: '25', label: 'Contact', href: '#ch25' },
  ];

  const rightsCards = [
    {
      icon: 'storefront',
      title: 'Commercial Usage',
      description:
        'You may use your Outputs for personal or commercial purposes, subject to applicable law, third-party rights and these Terms.',
      color: 'primary',
    },
    {
      icon: 'visibility_off',
      title: 'Private by Default',
      description:
        'Your Inputs and Outputs are private by default. dexericai does not run a public gallery or make your generations publicly visible.',
      color: 'secondary',
    },
    {
      icon: 'image',
      title: 'Ownership of Outputs',
      description:
        'dexericai does not claim ownership of your Outputs and assigns any right it acquires in them to you to the fullest extent permitted by law.',
      color: 'tertiary',
    },
    {
      icon: 'shield',
      title: 'One-Time Credits',
      description:
        'Credits are purchased once, do not expire while your Account is active, and are never auto-renewed or billed on a recurring basis.',
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
                These Terms of Service govern access to and use of the Dexeric AI Website, the
                AI-powered image generation service, user accounts, credit-purchase functionality
                and all related features made available by DEXERIC OÜ.
              </p>
              <div className={styles.heroMeta}>
                <div className={styles.metaItem}>
                  <span className="material-symbols-outlined">update</span>
                  Effective date: 17 August 2026
                </div>
                <div className={styles.metaDivider}></div>
                <div className={styles.metaItem}>
                  <span className="material-symbols-outlined">timer</span>
                  18 min read
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
                <h2>About These Terms</h2>
              </div>
              <div className={styles.chapterContent}>
                <p>
                  These Terms of Service (the &quot;Terms&quot;) govern access to and use of the{' '}
                  <a href="https://www.dexericai.com/">Dexeric AI Website</a>, the AI-powered image
                  generation service, user accounts, credit-purchase functionality and all related
                  features made available by DEXERIC OÜ (collectively, the &quot;Service&quot;).
                </p>
                <p>
                  DEXERIC OÜ is an Estonian private limited company with registry code 17569201 and
                  registered office at Pärnu mnt 20, Kesklinna linnaosa, 10141 Tallinn, Harju maakond,
                  Estonia (&quot;Dexeric&quot;, &quot;we&quot;, &quot;us&quot; or &quot;our&quot;).
                </p>
                <p>
                  By creating an account, purchasing Credits, clicking an acceptance button or
                  otherwise accessing or using the Service, you agree to these Terms. If you use the
                  Service on behalf of a company or other organisation, you represent that you have
                  authority to bind that organisation, and &quot;you&quot; includes that organisation.
                </p>
                <p>These Terms incorporate the following policies by reference:</p>
                <ul>
                  <li>Payment, Credits, Digital Delivery and Refund Policy;</li>
                  <li>Privacy Policy;</li>
                  <li>Cookie Policy;</li>
                  <li>Acceptable Use Policy;</li>
                  <li>AI Output and Intellectual Property Policy; and</li>
                  <li>Legal Notice and Complaints Procedure.</li>
                </ul>
                <p>If you do not agree to these Terms, you must not access or use the Service.</p>
              </div>
            </div>

            {/* Chapter 02 */}
            <div className={styles.chapter} id="ch02">
              <div className={styles.chapterHeader}>
                <span className={styles.chapterNumber}>02</span>
                <h2>Definitions</h2>
              </div>
              <div className={styles.chapterContent}>
                <p>For the purposes of these Terms:</p>
                <ul>
                  <li><strong>&quot;Account&quot;</strong> means a registered user account used to access the Service.</li>
                  <li><strong>&quot;Credits&quot;</strong> means prepaid digital units purchased from Dexeric and used to request eligible image generations through the Service. Credits are not money, electronic money, cryptocurrency or a stored-value payment instrument.</li>
                  <li><strong>&quot;Input&quot;</strong> means a text prompt or other text instruction submitted by a user to the Service.</li>
                  <li><strong>&quot;Output&quot;</strong> means an image or other visual content generated by the Service in response to an Input.</li>
                  <li><strong>&quot;Policies&quot;</strong> means the policies incorporated into these Terms.</li>
                  <li><strong>&quot;User Content&quot;</strong> means Inputs and Outputs associated with a user.</li>
                  <li><strong>&quot;Website&quot;</strong> means the Dexeric AI Website and its related pages.</li>
                </ul>
              </div>
            </div>

            {/* Chapter 03 */}
            <div className={styles.chapter} id="ch03">
              <div className={styles.chapterHeader}>
                <span className={styles.chapterNumber}>03</span>
                <h2>Eligibility and Age Requirement</h2>
              </div>
              <div className={styles.chapterContent}>
                <p>
                  You may use the Service only if you are at least 18 years old and have the legal
                  capacity to enter into a binding contract. By using the Service, you represent and
                  warrant that you satisfy these requirements.
                </p>
                <p>
                  The Service is intended for both consumers and business users. Additional mandatory
                  rights may apply to consumers. Nothing in these Terms excludes or limits a right
                  that cannot lawfully be excluded or limited.
                </p>
              </div>
            </div>

            {/* Chapter 04 */}
            <div className={styles.chapter} id="ch04">
              <div className={styles.chapterHeader}>
                <span className={styles.chapterNumber}>04</span>
                <h2>Geographic Availability</h2>
              </div>
              <div className={styles.chapterContent}>
                <p>
                  The Service is not offered to persons who are located, resident, established or
                  ordinarily based in any of the following jurisdictions:
                </p>
                <ul>
                  <li>Afghanistan;</li>
                  <li>Belarus;</li>
                  <li>Central African Republic;</li>
                  <li>Cuba;</li>
                  <li>Democratic Republic of the Congo;</li>
                  <li>Haiti;</li>
                  <li>Iran;</li>
                  <li>Iraq;</li>
                  <li>Mali;</li>
                  <li>Myanmar (Burma);</li>
                  <li>North Korea;</li>
                  <li>Russia;</li>
                  <li>Somalia;</li>
                  <li>South Sudan;</li>
                  <li>Sudan;</li>
                  <li>Syria;</li>
                  <li>Venezuela;</li>
                  <li>Yemen; and</li>
                  <li>Zimbabwe.</li>
                </ul>
                <p>
                  The Service is also unavailable where access, use, supply or payment would violate
                  applicable law, trade restrictions, sanctions, export controls or the requirements
                  of a payment or infrastructure provider.
                </p>
                <p>
                  You must not conceal your location, use false information, use another person&apos;s
                  payment method, or employ a virtual private network, proxy or other mechanism for
                  the purpose of circumventing these restrictions. Dexeric may request reasonable
                  information to verify eligibility and may refuse, suspend or terminate access where
                  eligibility cannot be verified.
                </p>
              </div>
            </div>

            {/* Chapter 05 */}
            <div className={styles.chapter} id="ch05">
              <div className={styles.chapterHeader}>
                <span className={styles.chapterNumber}>05</span>
                <h2>The Service</h2>
              </div>
              <div className={styles.chapterContent}>
                <p>
                  Dexeric provides a web-based tool that uses artificial intelligence models to
                  generate images from text prompts. The Service does not currently accept
                  user-uploaded source images.
                </p>
                <p>
                  AI generation is probabilistic. The same or similar Input may produce different
                  Outputs, and different users may receive identical or similar Outputs. Outputs may
                  be inaccurate, incomplete, unexpected, unsuitable for a particular purpose or
                  similar to existing material.
                </p>
                <p>
                  The Service is a creative technology tool and does not provide legal, financial,
                  medical or other professional advice. You remain responsible for reviewing every
                  Output and deciding whether and how it may lawfully and appropriately be used.
                </p>
              </div>
            </div>

            {/* Chapter 06 */}
            <div className={styles.chapter} id="ch06">
              <div className={styles.chapterHeader}>
                <span className={styles.chapterNumber}>06</span>
                <h2>Accounts</h2>
              </div>
              <div className={styles.chapterContent}>
                <p>
                  You must provide accurate, current and complete information when creating and
                  maintaining an Account. You must keep your login credentials confidential and must
                  not share, sell, lease or transfer your Account.
                </p>
                <p>
                  You are responsible for activity conducted through your Account unless the activity
                  results directly from a security failure for which Dexeric is responsible. You must
                  promptly notify us at info@dexericai.com if you suspect unauthorised access, loss of
                  credentials or other compromise.
                </p>
                <p>
                  We may require you to verify your email address or complete reasonable
                  fraud-prevention or eligibility checks. You may not create multiple Accounts to
                  evade restrictions, obtain promotional benefits improperly or avoid enforcement
                  action.
                </p>
              </div>
            </div>

            {/* Chapter 07 */}
            <div className={styles.chapter} id="ch07">
              <div className={styles.chapterHeader}>
                <span className={styles.chapterNumber}>07</span>
                <h2>Credits and Purchases</h2>
              </div>
              <div className={styles.chapterContent}>
                <p>
                  The Service is offered through one-time purchases of Credit packages. Dexeric does
                  not currently offer recurring subscriptions or automatic renewals.
                </p>
                <p>Credits:</p>
                <ul>
                  <li>are delivered digitally to the Account associated with the completed purchase;</li>
                  <li>do not expire while the Account remains active;</li>
                  <li>may be used only within the Service;</li>
                  <li>have no cash value and cannot be redeemed for money;</li>
                  <li>may not be sold, transferred, exchanged or used as a payment instrument;</li>
                  <li>are deducted only when an eligible generation is completed successfully; and</li>
                  <li>are not deducted, or are restored, when a generation fails because of a verified technical error in the Service.</li>
                </ul>
                <p>
                  The number of Credits required for a generation may vary depending on the selected
                  model, output settings, processing requirements or feature. The applicable Credit
                  cost must be shown before the user confirms the generation request.
                </p>
                <p>
                  Purchases are governed by the Payment, Credits, Digital Delivery and Refund Policy.
                </p>
              </div>
            </div>

            {/* Chapter 08 */}
            <div className={styles.chapter} id="ch08">
              <div className={styles.chapterHeader}>
                <span className={styles.chapterNumber}>08</span>
                <h2>Prices, Taxes and Payment</h2>
              </div>
              <div className={styles.chapterContent}>
                <p>
                  Credit packages may be offered in euros (EUR), pounds sterling (GBP) and United
                  States dollars (USD). Available currencies may depend on location or checkout
                  configuration.
                </p>
                <p>
                  Displayed prices are inclusive of all applicable taxes, including value added tax
                  where applicable, unless the checkout clearly states otherwise. The final price and
                  currency are displayed before the user submits an order.
                </p>
                <p>
                  Payments may be made using Visa or Mastercard through a third-party payment service
                  provider. Dexeric does not receive or store complete payment-card numbers or card
                  security codes. Your payment may also be governed by the terms of your card issuer
                  and the payment service provider.
                </p>
                <p>
                  You authorise the applicable purchase amount to be charged to the payment method
                  selected at checkout. You represent that you are authorised to use that payment
                  method.
                </p>
              </div>
            </div>

            {/* Chapter 09 */}
            <div className={styles.chapter} id="ch09">
              <div className={styles.chapterHeader}>
                <span className={styles.chapterNumber}>09</span>
                <h2>Inputs and User Responsibilities</h2>
              </div>
              <div className={styles.chapterContent}>
                <p>
                  You retain any rights you hold in your Inputs. You are solely responsible for each
                  Input you submit and for ensuring that it complies with these Terms, the Acceptable
                  Use Policy and applicable law.
                </p>
                <p>You represent and warrant that your Inputs, instructions and intended use of Outputs:</p>
                <ul>
                  <li>do not infringe copyright, trademark, privacy, publicity, personality or other rights;</li>
                  <li>do not contain unlawful personal data or confidential information that you are not authorised to disclose;</li>
                  <li>do not request prohibited, deceptive, abusive or harmful content; and</li>
                  <li>do not violate a contractual, fiduciary or other legal obligation.</li>
                </ul>
                <p>
                  You should not include sensitive personal data, payment information, passwords,
                  authentication credentials, confidential business information or other information
                  that is not necessary for image generation.
                </p>
              </div>
            </div>

            {/* Chapter 10 */}
            <div className={styles.chapter} id="ch10">
              <div className={styles.chapterHeader}>
                <span className={styles.chapterNumber}>10</span>
                <h2>Licence to Process Inputs</h2>
              </div>
              <div className={styles.chapterContent}>
                <p>
                  You grant Dexeric a limited, worldwide, non-exclusive, royalty-free licence to host,
                  reproduce, transmit and technically process an Input solely to provide, secure,
                  maintain and support the Service, generate the requested Output, prevent abuse and
                  comply with law.
                </p>
                <p>
                  This licence does not permit Dexeric to sell your Input or use it to train
                  general-purpose AI models. Dexeric does not use Inputs or Outputs to train its own
                  models or third-party general-purpose AI models.
                </p>
                <p>
                  The licence ends when the relevant data is deleted from active systems, except to
                  the limited extent that retention is required by law, necessary to resolve a
                  dispute, needed for security or fraud prevention, or temporarily persists in
                  protected backups.
                </p>
              </div>
            </div>

            {/* Chapter 11 */}
            <div className={styles.chapter} id="ch11">
              <div className={styles.chapterHeader}>
                <span className={styles.chapterNumber}>11</span>
                <h2>Outputs and Ownership</h2>
              </div>
              <div className={styles.chapterContent}>
                <p>
                  As between you and Dexeric, Dexeric does not claim ownership of your Outputs. To the
                  extent Dexeric acquires any right, title or interest in an Output, Dexeric assigns
                  that right, title and interest to you to the fullest extent permitted by applicable
                  law, subject to your compliance with these Terms.
                </p>
                <p>
                  You may use Outputs for personal or commercial purposes, subject to applicable law,
                  third-party rights and these Terms. Dexeric does not require attribution for an
                  Output unless a specific feature clearly states otherwise before use.
                </p>
                <p>Because Outputs are generated by artificial intelligence:</p>
                <ul>
                  <li>copyright or other exclusive rights may not arise in every jurisdiction;</li>
                  <li>an Output may not be unique;</li>
                  <li>another user may independently receive the same or a similar Output;</li>
                  <li>an Output may resemble existing works, brands, persons or protected material; and</li>
                  <li>Dexeric cannot guarantee that an Output is eligible for registration, exclusive ownership or unrestricted commercial use.</li>
                </ul>
                <p>
                  The allocation of rights between you and Dexeric does not override the rights of
                  third parties. You are responsible for conducting any clearance, legal review or
                  permissions process appropriate to your intended use.
                </p>
                <p>Further provisions are contained in the AI Output and Intellectual Property Policy.</p>
              </div>
            </div>

            {/* Chapter 12 */}
            <div className={styles.chapter} id="ch12">
              <div className={styles.chapterHeader}>
                <span className={styles.chapterNumber}>12</span>
                <h2>Privacy of Generations</h2>
              </div>
              <div className={styles.chapterContent}>
                <p>
                  Inputs and Outputs are private by default. Dexeric does not provide a public gallery
                  or make a user&apos;s generations publicly available through the Service.
                </p>
                <p>
                  Dexeric and its contracted service providers may access or process User Content only
                  to operate and secure the Service, provide support, investigate suspected abuse,
                  comply with law or enforce these Terms. Privacy does not prevent legally required
                  disclosure or limited review where reasonably necessary for safety, security or
                  compliance.
                </p>
              </div>
            </div>

            {/* Chapter 13 */}
            <div className={styles.chapter} id="ch13">
              <div className={styles.chapterHeader}>
                <span className={styles.chapterNumber}>13</span>
                <h2>Acceptable Use</h2>
              </div>
              <div className={styles.chapterContent}>
                <p>
                  You must comply with the Acceptable Use Policy. Prohibited conduct includes illegal
                  use, infringement of third-party rights, sexual exploitation, non-consensual
                  intimate content, harmful deception, abusive impersonation, fraud, circumvention of
                  safety controls and attempts to compromise the Service.
                </p>
                <p>
                  Dexeric may use automated filters and human review to detect suspected violations. A
                  filter decision does not guarantee that content is lawful, safe or permitted. You
                  remain responsible for all Inputs and Outputs.
                </p>
              </div>
            </div>

            {/* Chapter 14 */}
            <div className={styles.chapter} id="ch14">
              <div className={styles.chapterHeader}>
                <span className={styles.chapterNumber}>14</span>
                <h2>Third-Party Technology</h2>
              </div>
              <div className={styles.chapterContent}>
                <p>
                  The Service uses third-party infrastructure and AI models, including models supplied
                  by OpenAI. Third-party components may be updated, interrupted, restricted or
                  discontinued and may produce errors or delays outside Dexeric&apos;s direct control.
                </p>
                <p>
                  Dexeric may replace or add model and infrastructure providers, provided that
                  material changes to personal-data processing are reflected in the Privacy Policy as
                  required by law.
                </p>
                <p>
                  The Service may contain links to third-party websites. Dexeric does not control and
                  is not responsible for third-party websites, content, security or practices.
                </p>
              </div>
            </div>

            {/* Chapter 15 */}
            <div className={styles.chapter} id="ch15">
              <div className={styles.chapterHeader}>
                <span className={styles.chapterNumber}>15</span>
                <h2>Service Changes and Availability</h2>
              </div>
              <div className={styles.chapterContent}>
                <p>
                  Dexeric may improve, modify, add, remove or discontinue features where reasonably
                  necessary for technical, security, legal or commercial reasons. We will not
                  intentionally invalidate lawfully purchased, unused Credits solely because a feature
                  changes. Where a material discontinuation prevents Credits from being used, we will
                  provide an appropriate remedy as required by applicable law.
                </p>
                <p>
                  We do not guarantee uninterrupted or error-free availability. Maintenance, demand,
                  model-provider capacity, network conditions, security incidents and events outside
                  reasonable control may affect performance.
                </p>
                <p>
                  Dexeric may impose reasonable rate limits, generation limits or technical
                  restrictions to protect the Service and users.
                </p>
              </div>
            </div>

            {/* Chapter 16 */}
            <div className={styles.chapter} id="ch16">
              <div className={styles.chapterHeader}>
                <span className={styles.chapterNumber}>16</span>
                <h2>Suspension and Termination</h2>
              </div>
              <div className={styles.chapterContent}>
                <p>
                  Dexeric may restrict, suspend or terminate an Account or generation request where
                  reasonably necessary to:
                </p>
                <ul>
                  <li>address a breach of these Terms or the Policies;</li>
                  <li>prevent fraud, abuse, security threats or unlawful conduct;</li>
                  <li>comply with law, a court order or a binding request from a competent authority;</li>
                  <li>comply with geographic or payment restrictions;</li>
                  <li>protect Dexeric, users, service providers or third parties; or</li>
                  <li>investigate a credible complaint.</li>
                </ul>
                <p>
                  Where appropriate and legally permitted, we will provide notice and a reasonable
                  opportunity to respond. Immediate action may be taken where delay could create
                  legal, safety, security or financial risk.
                </p>
                <p>
                  If an Account is terminated for a material violation, unused Credits may be
                  cancelled to the extent permitted by law. Mandatory consumer rights remain
                  unaffected. A user may request review through the contact details in the Legal
                  Notice and Complaints Procedure.
                </p>
              </div>
            </div>

            {/* Chapter 17 */}
            <div className={styles.chapter} id="ch17">
              <div className={styles.chapterHeader}>
                <span className={styles.chapterNumber}>17</span>
                <h2>Account Closure</h2>
              </div>
              <div className={styles.chapterContent}>
                <p>
                  You may request Account closure through the Website or by contacting
                  info@dexericai.com. Account closure is permanent after any applicable confirmation
                  period.
                </p>
                <p>
                  Because Credits are linked to the Account and are not transferable or redeemable for
                  cash, unused Credits will be permanently lost when an Account is deleted at the
                  user&apos;s request, except where a refund or other remedy is required by mandatory
                  law. Before completing deletion, Dexeric should present a clear warning about the
                  remaining Credit balance.
                </p>
                <p>
                  Provisions that by their nature should survive termination remain in effect,
                  including provisions concerning accrued payment obligations, ownership, third-party
                  rights, disclaimers, liability, disputes and enforcement.
                </p>
              </div>
            </div>

            {/* Chapter 18 */}
            <div className={styles.chapter} id="ch18">
              <div className={styles.chapterHeader}>
                <span className={styles.chapterNumber}>18</span>
                <h2>Consumer Rights and Digital Performance</h2>
              </div>
              <div className={styles.chapterContent}>
                <p>
                  Consumers may have statutory rights concerning digital services, conformity,
                  remedies and withdrawal. Nothing in these Terms restricts those rights.
                </p>
                <p>
                  Where legally required, checkout will ask a consumer to request immediate delivery
                  of Credits and immediate access to the digital Service during a statutory withdrawal
                  period. Where applicable, the consumer will also be asked to acknowledge that
                  beginning or completing digital performance may affect or end the right of
                  withdrawal.
                </p>
                <p>
                  The effect of activation or use depends on the law applicable to the consumer.
                  Details are provided in the Payment, Credits, Digital Delivery and Refund Policy.
                </p>
              </div>
            </div>

            {/* Chapter 19 */}
            <div className={styles.chapter} id="ch19">
              <div className={styles.chapterHeader}>
                <span className={styles.chapterNumber}>19</span>
                <h2>Disclaimers</h2>
              </div>
              <div className={styles.chapterContent}>
                <p>
                  To the maximum extent permitted by law, the Service is provided on an &quot;as
                  is&quot; and &quot;as available&quot; basis. Dexeric does not warrant that:
                </p>
                <ul>
                  <li>every Input will be accepted or generate an Output;</li>
                  <li>an Output will be accurate, unique, original, non-infringing or fit for a particular purpose;</li>
                  <li>an Output will satisfy legal, professional, platform or advertising requirements;</li>
                  <li>the Service will always be available, secure or error-free; or</li>
                  <li>defects or interruptions will always be corrected immediately.</li>
                </ul>
                <p>
                  You must use independent judgment and obtain professional advice where appropriate.
                  No statement in these Terms excludes warranties or remedies that cannot lawfully be
                  excluded.
                </p>
              </div>
            </div>

            {/* Chapter 20 */}
            <div className={styles.chapter} id="ch20">
              <div className={styles.chapterHeader}>
                <span className={styles.chapterNumber}>20</span>
                <h2>Limitation of Liability</h2>
              </div>
              <div className={styles.chapterContent}>
                <p>
                  Nothing in these Terms excludes or limits liability for fraud, fraudulent
                  misrepresentation, death or personal injury caused by negligence, intentional
                  misconduct, or any liability that cannot lawfully be excluded or limited.
                </p>
                <p>
                  For consumers, Dexeric remains responsible for losses that are a foreseeable result
                  of Dexeric&apos;s breach of these Terms or failure to use reasonable care, subject to
                  mandatory consumer law. Dexeric is not responsible for losses caused by the user, an
                  unauthorised or unlawful use, or circumstances outside Dexeric&apos;s reasonable
                  control.
                </p>
                <p>For business users, to the maximum extent permitted by law:</p>
                <ul>
                  <li>Dexeric is not liable for loss of profit, revenue, business, contracts, anticipated savings, goodwill, data or opportunity, or for indirect or consequential loss; and</li>
                  <li>Dexeric&apos;s aggregate liability arising from the Service during any twelve-month period is limited to the greater of EUR 100 and the total amount paid by the business user to Dexeric during that period.</li>
                </ul>
                <p>
                  These limitations apply regardless of the legal basis of the claim, but only to the
                  extent permitted by applicable law.
                </p>
              </div>
            </div>

            {/* Chapter 21 */}
            <div className={styles.chapter} id="ch21">
              <div className={styles.chapterHeader}>
                <span className={styles.chapterNumber}>21</span>
                <h2>Business User Indemnity</h2>
              </div>
              <div className={styles.chapterContent}>
                <p>
                  If you use the Service for or on behalf of a business, you will indemnify Dexeric
                  against third-party claims, damages, liabilities and reasonable costs arising from
                  your unlawful Inputs, your unlawful or infringing use of Outputs, or your material
                  breach of these Terms, except to the extent the claim results from Dexeric&apos;s own
                  breach, negligence or intentional misconduct.
                </p>
                <p>
                  This section does not apply to consumers acting wholly outside their trade,
                  business, craft or profession.
                </p>
              </div>
            </div>

            {/* Chapter 22 */}
            <div className={styles.chapter} id="ch22">
              <div className={styles.chapterHeader}>
                <span className={styles.chapterNumber}>22</span>
                <h2>Governing Law and Disputes</h2>
              </div>
              <div className={styles.chapterContent}>
                <p>
                  These Terms are governed by the laws of Estonia, without prejudice to mandatory
                  consumer protections that apply in the country where a consumer habitually resides.
                </p>
                <p>
                  Before starting formal proceedings, you should contact Dexeric and provide a
                  reasonable opportunity to resolve the dispute. Dexeric will handle consumer
                  complaints in accordance with the Legal Notice and Complaints Procedure.
                </p>
                <p>
                  Business disputes are subject to the exclusive jurisdiction of the competent courts
                  of Estonia. Consumers may bring claims before any court available under mandatory
                  consumer-protection and jurisdiction rules.
                </p>
                <p>
                  An eligible consumer may also apply to the Consumer Disputes Committee operating at
                  the Estonian Consumer Protection and Technical Regulatory Authority after first
                  submitting a complaint to Dexeric.
                </p>
              </div>
            </div>

            {/* Chapter 23 */}
            <div className={styles.chapter} id="ch23">
              <div className={styles.chapterHeader}>
                <span className={styles.chapterNumber}>23</span>
                <h2>Changes to These Terms</h2>
              </div>
              <div className={styles.chapterContent}>
                <p>
                  Dexeric may update these Terms to reflect changes in the Service, law, security
                  requirements or business practices. The updated Terms will display a revised
                  &quot;Last updated&quot; date.
                </p>
                <p>
                  If a change materially affects existing rights or obligations, Dexeric will provide
                  reasonable advance notice through the Website, Account or email where required.
                  Changes will not retroactively remove purchased Credits or rights already accrued
                  unless required by law.
                </p>
                <p>
                  Continued use after the effective date of updated Terms constitutes acceptance where
                  permitted by law. If mandatory law requires express consent, Dexeric will request
                  it.
                </p>
              </div>
            </div>

            {/* Chapter 24 */}
            <div className={styles.chapter} id="ch24">
              <div className={styles.chapterHeader}>
                <span className={styles.chapterNumber}>24</span>
                <h2>General Provisions</h2>
              </div>
              <div className={styles.chapterContent}>
                <p>
                  If any provision is found invalid or unenforceable, the remaining provisions remain
                  in effect, and the affected provision will be applied to the maximum extent
                  permitted by law.
                </p>
                <p>
                  Dexeric&apos;s failure to enforce a provision is not a waiver. You may not assign
                  your Account or rights under these Terms without Dexeric&apos;s prior written
                  consent. Dexeric may assign these Terms as part of a merger, reorganisation, sale of
                  business or transfer of the Service, subject to applicable law.
                </p>
                <p>
                  These Terms and the incorporated Policies constitute the entire agreement concerning
                  the Service, except for any separate written agreement signed by Dexeric.
                </p>
              </div>
            </div>

            {/* Chapter 25 */}
            <div className={styles.chapter} id="ch25">
              <div className={styles.chapterHeader}>
                <span className={styles.chapterNumber}>25</span>
                <h2>Contact</h2>
              </div>
              <div className={styles.chapterContent}>
                <p>
                  Questions about these Terms may be submitted through the contact form on the Website
                  or by email to info@dexericai.com.
                </p>
                <p>
                  Legal entity: DEXERIC OÜ
                  <br />
                  Registry code: 17569201
                  <br />
                  Registered office: Pärnu mnt 20, Kesklinna linnaosa, 10141 Tallinn, Harju maakond,
                  Estonia
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