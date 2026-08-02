'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.scss';

// Імпорт компонентів
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';

export default function FAQPage() {
  const [activeIndex, setActiveIndex] = useState(null);
  const canvasRef = useRef(null);
  const threeContainerRef = useRef(null);
  const particlesContainerRef = useRef(null);

  const faqItems = [
    {
      question: '1. How do I generate my first AI image?',
      answer:
        "Navigate to the 'Studio' section from your dashboard. In the prompter bar at the bottom, enter a detailed description of your desired image. Select your preferred model (e.g., DALL-E 3) and aspect ratio, then hit 'Generate'. Our high-performance cluster will render your image in seconds, utilizing cinematic lighting algorithms by default.",
    },
    {
      question: '2. Can I use generated images commercially?',
      answer:
        'Yes. All images generated under our Pro and Enterprise tiers come with full commercial usage rights globally. You may use them in marketing materials, products for sale, and digital media without attribution. Standard tier users retain personal usage rights only.',
    },
    {
      question: '3. Who owns the copyright?',
      answer:
        'The current legal landscape regarding AI-generated art copyright is evolving. While AetherFrame AI does not claim copyright over the images you create, we provide a broad license for you to use them. Please consult local intellectual property laws for registering specific works.',
    },
    {
      question: '4. How does the wallet system work?',
      answer:
        'AetherFrame operates on a credit-based Wallet system designed for high-frequency rendering. You purchase compute credits (AetherCoins) which are deducted per generation based on model complexity and resolution. Your wallet balance is always visible in the top navigation bar.',
    },
    {
      question: '5. How do I receive PDF invoices?',
      answer:
        "Invoices are generated automatically for every transaction. Navigate to Settings > Billing > Invoice History. From there, you can download detailed PDF invoices compliant with international B2B standards. You can also add custom tax IDs to your billing profile.",
    },
    {
      question: '6. Can I request a refund?',
      answer:
        'Unused compute credits can be refunded within 14 days of purchase, provided no more than 10% of the purchased batch has been consumed. Subscription plans can be cancelled anytime, preventing future billing, but current periods are non-refundable. Contact support for assistance.',
    },
  ];

  const toggleAccordion = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

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
    
    vec3 color = mix(bg, deep, uv.y + sin(t * 0.5) * 0.1);
    
    float stream = pow(1.0 - abs(p.y - sin(p.x * 1.5 + t) * 0.15), 30.0);
    color += accent1 * stream * 0.12;
    
    float dMouse = length(p - m);
    color += accent2 * (0.05 / (dMouse + 0.65)) * (sin(u_time * 1.5) * 0.2 + 0.8);
    
    float beam = pow(1.0 - abs(p.x - sin(t * 0.3) * 0.7), 40.0) * (sin(t + uv.y * 2.0) * 0.5 + 0.5);
    color += accent1 * beam * 0.08;
    
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

  // Three.js Knowledge Core
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
      camera.position.z = 10;

      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);

      const masterGroup = new THREE.Group();
      scene.add(masterGroup);

      const colors = {
        primary: 0xb2c5ff,
        secondary: 0xd0bcff,
        cyan: 0x2fd9f4,
        white: 0xffffff,
      };

      // Knowledge Core
      const coreGroup = new THREE.Group();
      masterGroup.add(coreGroup);

      // Inner Sphere
      const coreGeom = new THREE.SphereGeometry(1.5, 64, 64);
      const coreMat = new THREE.MeshPhongMaterial({
        color: colors.primary,
        transparent: true,
        opacity: 0.15,
        shininess: 100,
        emissive: colors.primary,
        emissiveIntensity: 1.2,
      });
      const core = new THREE.Mesh(coreGeom, coreMat);
      coreGroup.add(core);

      // Holographic Wireframe
      const wireGeom = new THREE.IcosahedronGeometry(2.2, 2);
      const wireMat = new THREE.MeshBasicMaterial({
        color: colors.cyan,
        wireframe: true,
        transparent: true,
        opacity: 0.25,
      });
      const wireframe = new THREE.Mesh(wireGeom, wireMat);
      coreGroup.add(wireframe);

      // Rotating Rings
      const rings = [];
      const ringConfigs = [
        { r: 2.8, color: colors.primary, axis: 'x', speed: 0.005 },
        { r: 3.2, color: colors.secondary, axis: 'y', speed: -0.003 },
        { r: 2.5, color: colors.cyan, axis: 'z', speed: 0.007 },
      ];

      ringConfigs.forEach((p) => {
        const ringGeom = new THREE.TorusGeometry(p.r, 0.015, 16, 100);
        const ringMat = new THREE.MeshBasicMaterial({
          color: p.color,
          transparent: true,
          opacity: 0.4,
        });
        const ring = new THREE.Mesh(ringGeom, ringMat);
        ring.rotation[p.axis] = Math.random() * Math.PI;
        coreGroup.add(ring);
        rings.push({ mesh: ring, speed: p.speed, axis: p.axis });
      });

      // Floating Question Nodes
      const nodeCount = 8;
      const nodes = [];
      for (let i = 0; i < nodeCount; i++) {
        const nodeGeom = new THREE.PlaneGeometry(0.4, 0.25);
        const nodeMat = new THREE.MeshBasicMaterial({
          color: colors.white,
          transparent: true,
          opacity: 0.6,
          side: THREE.DoubleSide,
        });
        const node = new THREE.Mesh(nodeGeom, nodeMat);
        const angle = (i / nodeCount) * Math.PI * 2;
        const radius = 5 + Math.random();
        node.position.set(Math.cos(angle) * radius, (Math.random() - 0.5) * 6, Math.sin(angle) * radius);
        masterGroup.add(node);
        nodes.push({ mesh: node, angle, radius, ySpeed: 0.01 + Math.random() * 0.02 });

        // Connection to Core
        const lineMat = new THREE.LineBasicMaterial({
          color: colors.primary,
          transparent: true,
          opacity: 0.1,
        });
        const linePoints = [new THREE.Vector3(0, 0, 0), node.position];
        const lineGeom = new THREE.BufferGeometry().setFromPoints(linePoints);
        const line = new THREE.Line(lineGeom, lineMat);
        scene.add(line);
        nodes[i].line = line;
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
        wireframe.rotation.z += 0.005;
        core.scale.setScalar(1 + Math.sin(time * 2) * 0.05);

        rings.forEach((r) => {
          r.mesh.rotation[r.axis] += r.speed;
        });

        nodes.forEach((n) => {
          n.angle += 0.001;
          n.mesh.position.x = Math.cos(n.angle) * n.radius;
          n.mesh.position.z = Math.sin(n.angle) * n.radius;
          n.mesh.position.y += Math.sin(time + n.angle) * 0.01;
          n.mesh.lookAt(camera.position);

          // Update line
          const positions = n.line.geometry.attributes.position.array;
          positions[3] = n.mesh.position.x;
          positions[4] = n.mesh.position.y;
          positions[5] = n.mesh.position.z;
          n.line.geometry.attributes.position.needsUpdate = true;
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

  // Particles
  useEffect(() => {
    const container = particlesContainerRef.current;
    if (!container) return;

    const createParticle = () => {
      const particle = document.createElement('div');
      particle.className = styles.particle;

      const size = Math.random() * 3 + 1;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.left = `${Math.random() * 100}vw`;
      particle.style.top = `${Math.random() * 100}vh`;

      const duration = Math.random() * 20 + 10;
      particle.style.transition = `transform ${duration}s linear, opacity ${duration / 2}s ease-in-out`;

      container.appendChild(particle);

      setTimeout(() => {
        particle.style.transform = `translateY(-100vh) translateX(${Math.random() * 100 - 50}px)`;
        particle.style.opacity = '0';
      }, 100);

      setTimeout(() => {
        particle.remove();
        createParticle();
      }, duration * 1000);
    };

    for (let i = 0; i < 50; i++) {
      setTimeout(() => createParticle(), i * 100);
    }

    return () => {
      container.innerHTML = '';
    };
  }, []);

  const enterpriseCards = [
    {
      icon: 'business_center',
      title: 'Business Licensing',
      description:
        'Custom SLA agreements, multi-seat team management, and volume discounts on compute credits.',
      color: 'primary',
      link: '#',
    },
    {
      icon: 'copyright',
      title: 'Commercial Usage',
      description:
        'Worldwide, perpetual commercial rights for all generated assets, backed by indemnification clauses.',
      color: 'secondary',
      link: '#',
    },
    {
      icon: 'security',
      title: 'Enterprise Security',
      description:
        'SOC2 compliance, private model instances, and end-to-end encryption for prompt data and generated outputs.',
      color: 'tertiary',
      link: '#',
    },
  ];

  const enterpriseFeatures = [
    'Enterprise Clients',
    'Priority Support',
    'Dedicated Account Managers',
    'Custom Agreements',
    'Worldwide Commercial Rights',
  ];

  const floatingQuestions = [
    { text: 'How do I generate images?', color: 'primary', delay: '0s' },
    { text: 'Can I use images commercially?', color: 'secondary', delay: '1.5s' },
    { text: 'How do wallet payments work?', color: 'tertiary', delay: '0.7s' },
    { text: 'How do I download invoices?', color: 'surface', delay: '2.2s' },
  ];

  return (
    <>
      <Header />

      <main className={styles.main}>
        {/* Background */}
        <canvas ref={canvasRef} className={styles.bgCanvas} />
        <div className={styles.gradientTop}></div>
        <div className={styles.gradientBottom}></div>
        <div ref={particlesContainerRef} className={styles.particlesContainer}></div>

        {/* SECTION 1: HERO */}
        <section className={styles.hero}>
          <div className={styles.heroGrid}>
            <div className={styles.heroContent}>
              <h1 className={styles.heroTitle}>
                Questions?<br />We've already answered them.
              </h1>
              <p className={styles.heroDescription}>
                Find answers about image generation, commercial licensing, wallet payments, invoices,
                security, accounts and enterprise services.
              </p>
              <div className={styles.searchContainer}>
                <div className={styles.searchWrapper}>
                  <span className="material-symbols-outlined">search</span>
                  <input
                    type="text"
                    className={styles.searchInput}
                    placeholder="Search the knowledge base..."
                  />
                </div>
              </div>
            </div>

            <div className={styles.heroVisual}>
              <div ref={threeContainerRef} className={styles.threeContainer}></div>
              <div className={styles.floatingBubbles}>
                {floatingQuestions.map((item, index) => (
                  <div
                    key={index}
                    className={`${styles.bubble} ${styles[`bubble${item.color.charAt(0).toUpperCase() + item.color.slice(1)}`]}`}
                    style={{ animationDelay: item.delay }}
                  >
                    {item.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: POPULAR QUESTIONS */}
        <section className={styles.faqSection}>
          <h2 className={styles.faqTitle}>Popular Inquiries</h2>
          <div className={styles.faqContainer}>
            {faqItems.map((item, index) => (
              <div
                key={index}
                className={`${styles.faqItem} ${activeIndex === index ? styles.active : ''}`}
              >
                <div
                  className={styles.faqTrigger}
                  onClick={() => toggleAccordion(index)}
                >
                  <h3>{item.question}</h3>
                  <span className={`material-symbols-outlined ${styles.expandIcon}`}>
                    expand_more
                  </span>
                </div>
                <div className={styles.faqContent}>
                  <p>{item.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 3: ENTERPRISE SUPPORT */}
        <section className={styles.enterprise}>
          <h2 className={styles.enterpriseTitle}>Enterprise Solutions</h2>
          <p className={styles.enterpriseDescription}>
            Tailored infrastructure and dedicated support for organizations operating at scale.
          </p>

          <div className={styles.enterpriseGrid}>
            {enterpriseCards.map((card, index) => (
              <div key={index} className={`${styles.enterpriseCard} ${styles[`card${card.color.charAt(0).toUpperCase() + card.color.slice(1)}`]}`}>
                <div className={styles.cardIcon}>
                  <span className="material-symbols-outlined">{card.icon}</span>
                </div>
                <h3>{card.title}</h3>
                <p>{card.description}</p>
                <Link href={card.link} className={styles.cardLink}>
                  Learn More <span className="material-symbols-outlined">arrow_forward</span>
                </Link>
              </div>
            ))}
          </div>

          <div className={styles.enterpriseStrip}>
            {enterpriseFeatures.map((feature, index) => (
              <div key={index} className={styles.stripItem}>
                <span className="material-symbols-outlined">check_circle</span>
                {feature}
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 4: STILL NEED HELP */}
        <section className={styles.help}>
          <div className={styles.helpContainer}>
            <div className={styles.helpGlow}></div>
            <div className={styles.helpGrid}>
              <div className={styles.helpContent}>
                <h2>Still need assistance?</h2>
                <p>
                  Our specialized support team is ready to help you resolve complex technical issues
                  or discuss enterprise deployments.
                </p>
                <div className={styles.helpButtons}>
                  <Link href="/contact" className={styles.helpPrimary}>
                    <span className="material-symbols-outlined">support_agent</span>
                    Live Support
                  </Link>
                  <Link href="/contact" className={styles.helpSecondary}>
                    <span className="material-symbols-outlined">mail</span>
                    Business Inquiries
                  </Link>
                </div>
              </div>

              <div className={styles.helpFlow}>
                <div className={styles.flowLine}></div>
                <div className={styles.flowNodes}>
                  <div className={styles.flowNode}>
                    <div className={styles.nodeIcon}>
                      <span className="material-symbols-outlined">person</span>
                    </div>
                    <span>Customer</span>
                  </div>
                  <div className={`${styles.flowNode} ${styles.nodeSupport}`}>
                    <div className={styles.nodeIcon}>
                      <span className="material-symbols-outlined">support</span>
                    </div>
                    <span>Support</span>
                  </div>
                  <div className={`${styles.flowNode} ${styles.nodeSpecialist}`}>
                    <div className={styles.nodeIcon}>
                      <span className="material-symbols-outlined">psychology</span>
                    </div>
                    <span>Specialist</span>
                  </div>
                  <div className={`${styles.flowNode} ${styles.nodeSolution}`}>
                    <div className={styles.nodeIcon}>
                      <span className="material-symbols-outlined">task_alt</span>
                    </div>
                    <span>Solution</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5: FINAL CTA */}
        <section className={styles.cta}>
          <div className={styles.ctaGlow}></div>
          <div className={styles.ctaContent}>
            <h2>Your creativity should never wait.</h2>
            <div className={styles.ctaButtons}>
              <Link href="/contact" className={styles.ctaSecondary}>Contact Support</Link>
              <Link href="/register" className={styles.ctaPrimary}>Start Creating</Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}