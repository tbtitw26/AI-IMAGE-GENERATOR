'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.scss';

// Імпорт компонентів
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import { useCurrency } from '@/context/CurrencyContext';
import { priceInCurrency } from '@/config/currency';

export default function PricingPage() {
  const canvasRef = useRef(null);
  const threeContainerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const { currency } = useCurrency();
  // Всі базові ціни нижче задані в EUR (базова валюта) і конвертуються
  // у вибрану користувачем валюту.
  const priceIn = (eurAmount, options) => priceInCurrency(eurAmount, currency, options);

  // Intersection Observer for scroll animations
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
    
    float t = u_time * 0.04;
    
    vec3 bg = vec3(0.015, 0.019, 0.039);
    vec3 deep = vec3(0.027, 0.043, 0.078);
    
    vec3 accent1 = vec3(0.357, 0.549, 1.0);
    vec3 accent2 = vec3(0.545, 0.361, 0.965);
    vec3 gold = vec3(0.835, 0.694, 0.451);
    
    vec3 color = mix(bg, deep, uv.y + sin(t * 0.5) * 0.1);
    
    float beam = pow(1.0 - abs(p.x - sin(t * 0.3) * 0.6), 15.0) * (sin(t + uv.y * 2.0) * 0.5 + 0.5);
    color += accent1 * beam * 0.12;
    
    float dMouse = length(p - m);
    color += accent2 * (0.05 / (dMouse + 0.7)) * (sin(u_time * 1.5) * 0.2 + 0.8);
    
    float goldFilament = pow(1.0 - abs(p.y - cos(t * 0.2) * 0.4), 40.0);
    color += gold * goldFilament * 0.03;
    
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

  // Three.js Wallet Card
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const container = threeContainerRef.current;
    if (!container) return;

    const initThree = async () => {
      const THREE = await import('three');

      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000);
      camera.position.z = 12;

      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);

      const masterGroup = new THREE.Group();
      scene.add(masterGroup);

      const colors = {
        primary: 0xb2c5ff,
        secondary: 0xd0bcff,
        gold: 0xd4b173,
        white: 0xffffff,
      };

      // Financial Energy Sphere
      const coreGroup = new THREE.Group();
      masterGroup.add(coreGroup);

      // Main Orb
      const orbGeom = new THREE.SphereGeometry(2.5, 64, 64);
      const orbMat = new THREE.MeshPhongMaterial({
        color: colors.primary,
        transparent: true,
        opacity: 0.1,
        shininess: 100,
        emissive: colors.primary,
        emissiveIntensity: 0.5,
      });
      const orb = new THREE.Mesh(orbGeom, orbMat);
      coreGroup.add(orb);

      // Rings
      const rings = [];
      for (let i = 0; i < 3; i++) {
        const ringGeom = new THREE.TorusGeometry(3.5 + i * 0.8, 0.015, 16, 100);
        const ringMat = new THREE.MeshBasicMaterial({
          color: i === 2 ? colors.gold : colors.primary,
          transparent: true,
          opacity: 0.3,
        });
        const ring = new THREE.Mesh(ringGeom, ringMat);
        ring.rotation.x = Math.random() * Math.PI;
        ring.rotation.y = Math.random() * Math.PI;
        coreGroup.add(ring);
        rings.push({ mesh: ring, speed: 0.002 + Math.random() * 0.005 });
      }

      // Floating Nodes
      const nodeGeom = new THREE.SphereGeometry(0.1, 16, 16);
      const nodeMat = new THREE.MeshBasicMaterial({ color: colors.white });
      const nodes = [];
      for (let i = 0; i < 20; i++) {
        const node = new THREE.Mesh(nodeGeom, nodeMat);
        const angle = Math.random() * Math.PI * 2;
        const radius = 5 + Math.random() * 3;
        node.position.set(Math.cos(angle) * radius, (Math.random() - 0.5) * 10, Math.sin(angle) * radius);
        masterGroup.add(node);
        nodes.push({ mesh: node, angle, radius, ySpeed: 0.01 + Math.random() * 0.02 });
      }

      // Lighting
      const pLight = new THREE.PointLight(colors.primary, 5, 20);
      pLight.position.set(5, 5, 5);
      scene.add(pLight);
      scene.add(new THREE.AmbientLight(0xffffff, 0.5));

      const animate = () => {
        requestAnimationFrame(animate);
        const time = Date.now() * 0.001;

        coreGroup.rotation.y += 0.002;
        rings.forEach((r) => {
          r.mesh.rotation.z += r.speed;
        });

        nodes.forEach((n) => {
          n.angle += 0.001;
          n.mesh.position.x = Math.cos(n.angle) * n.radius;
          n.mesh.position.z = Math.sin(n.angle) * n.radius;
          n.mesh.position.y += Math.sin(time + n.angle) * 0.01;
        });

        renderer.render(scene, camera);
      };

      const handleResize = () => {
        const w = container.clientWidth || window.innerWidth;
        const h = container.clientHeight || window.innerHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };

      window.addEventListener('resize', handleResize);
      animate();

      return () => {
        window.removeEventListener('resize', handleResize);
        renderer.dispose();
      };
    };

    initThree();
  }, []);

  const plans = [
    {
      name: 'Creator',
      price: priceIn(29),
      period: '/ deposit min',
      description: 'Perfect for individual artists exploring high-fidelity generation.',
      features: ['Up to 4 images per generation', 'Access to base Aether models', 'Commercial usage rights'],
      buttonText: 'Select Creator',
      highlighted: false,
    },
    {
      name: 'Studio',
      price: priceIn(79),
      period: '/ deposit min',
      description: 'Built for professional workflows requiring speed and precision.',
      features: [
        'Up to 8 images per generation',
        'Access to Aether Cinematic v4 model',
        'Advanced 2x upscaling',
        'Commercial usage rights',
      ],
      buttonText: 'Select Studio',
      highlighted: true,
      popular: true,
    },
    {
      name: 'Professional',
      price: priceIn(199),
      period: '/ deposit min',
      description: 'For studios and agencies with demanding production needs.',
      features: [
        'Up to 12 images per generation',
        'Access to all Aether models',
        'Advanced upscaling & optimization',
        'Priority processing queue',
        'Commercial usage rights',
      ],
      buttonText: 'Select Professional',
      highlighted: false,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'Dedicated infrastructure for large agencies and production houses.',
      features: [
        'Dedicated GPU clusters',
        'Custom model fine-tuning',
        'API Access & SLA',
        'Dedicated Account Manager',
      ],
      buttonText: 'Contact Sales',
      highlighted: false,
    },
  ];

  const services = [
    {
      title: 'Luxury Product Campaign',
      price: priceIn(299),
      description: 'Professional AI-generated campaign visuals for premium consumer products.',
      features: ['20 commercial images', 'Studio lighting & retouch', 'Campaign PDF'],
      delivery: '2 Business Days',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCnpyo0BL-mxp77QHohVR8MGefG9EDBthuMjxCNHGxUDkyIg--dC7AKGJ456H4-F0fNViea1zlbLC4QMuv9v-iE5rUUERbbq51a_Rnx7n__lUC--x3734bsykYKAbVzmWZj_2Yn46YfdyTjBsqYM5vNRfgBty2a-AK1eW_ZM0-s27OYezfT6kKzkUO577V7pJsvOJIoPLHN2xoEwUaCoqoKoxQZwdo7YJlhhaTe2UNt6imJmnLEFh2MdJEl11FCul_6KEnRYxlqLW4',
    },
    {
      title: 'Fashion Editorial Collection',
      price: priceIn(499),
      description: 'Luxury editorial image collection suitable for magazines and fashion brands.',
      features: ['50 editorial images', 'Creative direction', 'Editorial PDF'],
      delivery: '3 Business Days',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBHvOhiCgd-wBnxdrdQY81_gPg0z0vbkdIKQsGxUZ4-ZXCHmsi-aXpIyxcu2Gb-FSupOs4_oaUYoxwSadb5r-qXz4YzopKjMp4tGUHIHHkLEm6a8b5O1D2pV8OpP3fXQ5PxCjqbSUdHIELsekBroMLdJDkIExeAOasdIZLNI6uu3thBPvSIoOjKrQKq1SBBUGsr2xtHUJZlyYdJDEQsSIpatsbXQLQRzhAH-m1v4CgESfP4OpBa72aUKhYgr0Hju1L3hse-DDxSLnw',
    },
    {
      title: 'Brand Identity Visual System',
      price: priceIn(699),
      description: 'Complete AI-powered visual identity package for brand refreshes.',
      features: ['Brand moodboards', 'Marketing assets', 'Guideline PDF'],
      delivery: '5 Business Days',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuC14nd-Pg80ZC7YaLHfmB6wQQtl0ZWzvR26OI7yVC_ExFaJ9VHJdt1k_vdwFfkLJU6hfXlnhxyffdnRIIWm0GyBwqyqWTS2qpQr6lJvJH-ss5iIZmZQL2qQCKIoGzWHC0lCIBpAjmhTtnE8ZukjrJgomY2NDW6gDogXDWmJHkaD4lghNiPDYfJR7mKsSqd7QuqiwJFEs1-WLejUlP-ZGS3BImEZZCHs56iLffkTFU-VWhl52zMNoppJCUCcU5geIlzKCCz7ebFdTAI',
    },
    {
      title: 'Global Advertising Campaign',
      price: priceIn(899),
      description: 'Professional visual assets for large-scale marketing campaigns.',
      features: ['Billboard graphics', 'Print-ready artwork', 'Presentation PDF'],
      delivery: '5 Business Days',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuALfkIlzUGpiifDpBkGWKXjxkCyE2bEfT1P2OJ64f2CBvL3_DF4uPHKeVualbAxeLYU-uDdfo8J8mkgONbfWon_6R4prv5vvbBF-O3dgNtBACE0aFX6tmCQOUYY_XA-J3WNMZ9DiE9j6s4V3SOBoUUb6awdgJNp6ixP_8iNBPJHaVK34JHdHK-6TwxIkSC_NWomogz7kGAGzCPVZOVoAFa9E_5JF_i1NLpsqqQ18QdcXtPTKddx4yg7PVhjO3Utr42yyDGaJSba5Zg',
    },
  ];

  const comparisonFeatures = [
    { icon: 'verified', label: 'Commercial Rights' },
    { icon: 'picture_as_pdf', label: 'PDF Deliverables' },
    { icon: 'speed', label: 'Priority Rendering' },
    { icon: 'support_agent', label: 'Dedicated Support' },
    { icon: 'business', label: 'Enterprise Ready' },
    { icon: 'public', label: 'Worldwide Licensing' },
  ];

  return (
    <>
      <Header />

      <main className={styles.main}>
        {/* Background */}
        <canvas ref={canvasRef} className={styles.bgCanvas} />
        <div className={styles.gridPattern}></div>

        {/* 1. HERO SECTION */}
        <section className={`${styles.hero} ${styles.revealOnScroll} ${styles.isVisible}`}>
          <div className={styles.heroGrid}>
            <div className={styles.heroContent}>
              <div className={styles.heroBadge}>
                <span className={styles.pulseDot}></span>
                Enterprise Grade Billing
              </div>
              <h1 className={styles.heroTitle}>
                Simple pricing.<br />Professional creativity.
              </h1>
              <p className={styles.heroDescription}>
                dexericai uses a flexible wallet system designed for creators, agencies and
                enterprise teams. Add funds whenever you need them, pay only for the work you generate
                and access premium creative services without subscriptions.
              </p>
              <div className={styles.heroFeatures}>
                <div className={styles.heroFeature}>
                  <span className="material-symbols-outlined">lock</span>
                  Secure Payments
                </div>
                <div className={styles.heroFeature}>
                  <span className="material-symbols-outlined">bolt</span>
                  Instant Wallet Top-Up
                </div>
                <div className={styles.heroFeature}>
                  <span className="material-symbols-outlined">receipt_long</span>
                  Professional PDF Invoices
                </div>
              </div>
            </div>

            <div className={styles.heroWallet}>
              <div className={styles.walletGlow}></div>
              <div className={styles.walletCard}>
                <div ref={threeContainerRef} className={styles.wallet3D}></div>
                <div className={styles.walletContent}>
                  <div className={styles.walletHeader}>
                    <div>
                      <span className={styles.walletLabel}>dexericai Balance</span>
                      <div className={styles.walletBalance}>
                        <span>{priceIn(742.80, { decimals: 2 }).replace(/^[^\d]+/, '')}</span>
                        <span>{currency}</span>
                      </div>
                    </div>
                    <div className={styles.walletIcon}>
                      <span className="material-symbols-outlined">account_balance_wallet</span>
                    </div>
                  </div>
                  <div className={styles.walletDivider}></div>
                  <div className={styles.walletFooter}>
                    <div>
                      <span className={styles.walletLabel}>Last added</span>
                      <span className={styles.walletDate}>May 14, 2024</span>
                    </div>
                    <Link href="/register" className={styles.walletAddBtn}>
                      <span className="material-symbols-outlined">add</span>
                      Add Funds
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. CREATOR PLANS */}
        <section className={`${styles.plans} ${styles.revealOnScroll}`}>
          <div className={styles.plansHeader}>
            <h2>Designed for Scale</h2>
            <p>
              Access powerful AI models with a pricing structure that scales with your creative
              ambitions. No hidden fees, just pure generation power.
            </p>
          </div>

          <div className={styles.plansGrid}>
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`${styles.planCard} ${plan.highlighted ? styles.planHighlighted : ''}`}
              >
                {plan.popular && <div className={styles.popularBadge}>MOST POPULAR</div>}
                <div className={styles.planHeader}>
                  <span className={`${styles.planName} ${plan.highlighted ? styles.planNameHighlighted : ''}`}>
                    {plan.name}
                  </span>
                  <div className={styles.planPrice}>
                    <span>{plan.price}</span>
                    <span>{plan.period}</span>
                  </div>
                  <p className={styles.planDescription}>{plan.description}</p>
                </div>
                <ul className={styles.planFeatures}>
                  {plan.features.map((feature, idx) => (
                    <li key={idx}>
                      <span className="material-symbols-outlined">check_circle</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.buttonText === 'Contact Sales' ? '/contact' : '/register'}
                  className={`${styles.planBtn} ${plan.highlighted ? styles.planBtnPrimary : ''}`}
                >
                  {plan.buttonText}
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* 3. PREMIUM CREATIVE SERVICES */}
        <section className={`${styles.services} ${styles.revealOnScroll}`}>
          <div className={styles.servicesHeader}>
            <h2>Premium Creative Services</h2>
            <p>
              Beyond AI image generation, dexericai offers exclusive creative production services
              for businesses, agencies and enterprise clients. Every service includes professional
              deliverables, commercial licensing and downloadable PDF documentation.
            </p>
          </div>

          <div className={styles.servicesGrid}>
            {services.map((service, index) => (
              <Link
                key={index}
                href={`/contact?service=${encodeURIComponent(service.title)}`}
                className={styles.serviceCard}
              >
                <div className={styles.serviceImage}>
                  <img src={service.image} alt={service.title} />
                  <div className={styles.servicePrice}>{service.price}</div>
                </div>
                <div className={styles.serviceContent}>
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                  <ul>
                    {service.features.map((feature, idx) => (
                      <li key={idx}>
                        <span className="material-symbols-outlined">check</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <div className={styles.serviceFooter}>
                    <span className={styles.serviceDelivery}>{service.delivery}</span>
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </div>
                </div>
              </Link>
            ))}

            {/* Featured Service */}
            <div className={styles.serviceFeatured}>
              <div className={styles.serviceFeaturedImage}>
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBTO7oQK4QyChMnvrv4eke65ps5pL2mY39n3XzjMgDwxYRDz0MCrbsbGfR11KcPFr8g-kHlw8r2yqevUwzNAztGCfAQgNTavdpKLYjcbMPZT-MenV2-uEDfLawBCO0-M3S94NvdzhH4Ys_EkVxGR4t7tqE4QCylfOcTg-xIlMBt267BEJhRj-xnHb4k_FzcxDpbCQroiumvX_leJ64g1jXaeQubEt1RIlEobFbN2LlZe9uPmTqpuaGjh-ssvExbrk1IgjZx04RWCZw"
                  alt="VIP Creative Director Session"
                />
                <div className={styles.serviceFeaturedOverlay}></div>
              </div>
              <div className={styles.serviceFeaturedContent}>
                <div className={styles.serviceFeaturedHeader}>
                  <div>
                    <span className={styles.featuredBadge}>Featured Service</span>
                    <h3>VIP Creative Director Session</h3>
                  </div>
                  <div className={styles.featuredPrice}>{priceIn(999)}</div>
                </div>
                <p className={styles.featuredDescription}>
                  Work directly with a dedicated AI Creative Director for fully customized visuals.
                  This premium session includes unlimited revisions and a private production queue.
                </p>
                <div className={styles.featuredFeatures}>
                  <ul>
                    <li>
                      <span className="material-symbols-outlined">star</span> Unlimited revisions
                    </li>
                    <li>
                      <span className="material-symbols-outlined">star</span> Personal consultant
                    </li>
                    <li>
                      <span className="material-symbols-outlined">star</span> Strategy document
                    </li>
                  </ul>
                  <ul>
                    <li>
                      <span className="material-symbols-outlined">star</span> Custom prompt engineering
                    </li>
                    <li>
                      <span className="material-symbols-outlined">star</span> Priority support
                    </li>
                    <li>
                      <span className="material-symbols-outlined">star</span> Project PDF
                    </li>
                  </ul>
                </div>
                <div className={styles.featuredFooter}>
                  <div className={styles.featuredTurnaround}>
                    <span className="material-symbols-outlined">bolt</span>
                    24-hour Turnaround
                  </div>
                  <Link href="/contact?service=VIP%20Creative%20Director%20Session" className={styles.featuredBtn}>Book Session</Link>
                </div>
              </div>
            </div>
          </div>

          {/* Comparison Strip */}
          <div className={styles.comparisonStrip}>
            {comparisonFeatures.map((feature, index) => (
              <div key={index} className={styles.comparisonItem}>
                <span className="material-symbols-outlined">{feature.icon}</span>
                {feature.label}
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}