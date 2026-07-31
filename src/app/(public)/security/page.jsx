'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.scss';

// Імпорт компонентів
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';

export default function SecurityPage() {
  const canvasRef = useRef(null);
  const threeContainerRef = useRef(null);

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
    
    float t = u_time * 0.03;
    
    vec3 bg = vec3(0.015, 0.019, 0.039);
    vec3 deep = vec3(0.027, 0.043, 0.078);
    
    vec3 accent1 = vec3(0.357, 0.549, 1.0);
    vec3 accent2 = vec3(0.545, 0.361, 0.965);
    
    vec3 color = mix(bg, deep, uv.y + sin(t * 0.5) * 0.1);
    
    float stream = pow(1.0 - abs(p.y - sin(p.x * 2.0 + t) * 0.1 - 0.2), 40.0);
    color += accent1 * stream * 0.15;
    
    float beam = pow(1.0 - abs(p.x - sin(t * 0.4) * 0.8), 30.0) * (sin(t + uv.y * 3.0) * 0.5 + 0.5);
    color += accent2 * beam * 0.1;
    
    float dMouse = length(p - m);
    color += accent1 * (0.06 / (dMouse + 0.7)) * (sin(u_time * 1.5) * 0.2 + 0.8);
    
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

  // Three.js Security Core
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

      // Security Core
      const coreGroup = new THREE.Group();
      masterGroup.add(coreGroup);

      // Inner AI Intelligence
      const coreGeom = new THREE.SphereGeometry(1.8, 64, 64);
      const coreMat = new THREE.MeshPhongMaterial({
        color: colors.primary,
        transparent: true,
        opacity: 0.15,
        shininess: 100,
        emissive: colors.primary,
        emissiveIntensity: 0.8,
      });
      const core = new THREE.Mesh(coreGeom, coreMat);
      coreGroup.add(core);

      // Encrypted Wireframe (The Shield)
      const wireGeom = new THREE.IcosahedronGeometry(2.5, 2);
      const wireMat = new THREE.MeshBasicMaterial({
        color: colors.cyan,
        wireframe: true,
        transparent: true,
        opacity: 0.3,
      });
      const shield = new THREE.Mesh(wireGeom, wireMat);
      coreGroup.add(shield);

      // Holographic Rings
      const rings = [];
      const ringParams = [
        { r: 3.2, color: colors.primary, speed: 0.005, axis: 'x' },
        { r: 3.8, color: colors.secondary, speed: -0.003, axis: 'y' },
        { r: 4.5, color: colors.cyan, speed: 0.007, axis: 'z' },
      ];

      ringParams.forEach((p) => {
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

      // Floating Lock Nodes
      const nodes = [];
      for (let i = 0; i < 12; i++) {
        const nodeGeom = new THREE.BoxGeometry(0.15, 0.15, 0.15);
        const nodeMat = new THREE.MeshBasicMaterial({ color: colors.white });
        const node = new THREE.Mesh(nodeGeom, nodeMat);
        const angle = (i / 12) * Math.PI * 2;
        const radius = 6 + Math.random() * 2;
        node.position.set(Math.cos(angle) * radius, (Math.random() - 0.5) * 8, Math.sin(angle) * radius);
        masterGroup.add(node);
        nodes.push({ mesh: node, angle, radius, ySpeed: 0.01 + Math.random() * 0.02 });

        // Connection lines to core
        const lineMat = new THREE.LineBasicMaterial({
          color: colors.cyan,
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
      const pLight = new THREE.PointLight(colors.cyan, 5, 20);
      pLight.position.set(5, 5, 5);
      scene.add(pLight);
      scene.add(new THREE.AmbientLight(0xffffff, 0.5));

      const animate = () => {
        requestAnimationFrame(animate);
        const time = Date.now() * 0.001;

        coreGroup.rotation.y += 0.002;
        shield.rotation.z += 0.005;
        shield.rotation.x += 0.002;

        core.scale.setScalar(1 + Math.sin(time * 2) * 0.05);

        rings.forEach((r) => {
          r.mesh.rotation[r.axis] += r.speed;
        });

        nodes.forEach((n) => {
          n.angle += 0.001;
          n.mesh.position.x = Math.cos(n.angle) * n.radius;
          n.mesh.position.z = Math.sin(n.angle) * n.radius;
          n.mesh.position.y += Math.sin(time + n.angle) * 0.01;

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

  const complianceBadges = [
    { icon: 'verified', label: 'PCI DSS' },
    { icon: 'policy', label: 'GDPR' },
    { icon: 'vpn_key', label: 'SSL Encryption' },
    { icon: 'enhanced_encryption', label: 'AES-256' },
  ];

  const securityFeatures = [
    {
      icon: 'phonelink_lock',
      title: 'Two-Factor Authentication',
      description: 'App-based or hardware key required.',
      enabled: true,
    },
    {
      icon: 'password',
      title: 'Password Recovery Protocol',
      description: 'Multi-step cold storage verification.',
      enabled: false,
    },
    {
      icon: 'devices',
      title: 'Session Management',
      description: 'Monitor and revoke active devices remotely.',
      enabled: false,
    },
    {
      icon: 'notifications_active',
      title: 'Security Notifications',
      description: 'Real-time alerts for suspicious activity.',
      enabled: true,
    },
  ];

  const paymentSteps = [
    { icon: 'account_balance_wallet', label: 'Wallet' },
    { icon: 'credit_card', label: 'Secure Payment', active: true },
    { icon: 'fact_check', label: 'Verification' },
    { icon: 'receipt_long', label: 'Invoice Generated' },
    { icon: 'mail_lock', label: 'Encrypted Delivery' },
    { icon: 'task_alt', label: 'Completed', complete: true },
  ];

  const orbitalNodes = [
    { icon: 'account_circle', label: 'User Account', top: '15%', left: '15%' },
    { icon: 'terminal', label: 'Prompt', top: '15%', right: '15%' },
    { icon: 'image', label: 'Generated Images', top: '45%', left: '5%' },
    { icon: 'database', label: 'Encrypted Storage', top: '45%', right: '5%' },
    { icon: 'cloud', label: 'Private Cloud', bottom: '15%', left: '25%' },
    { icon: 'security_update_good', label: 'Secure Delivery', bottom: '15%', right: '25%' },
  ];

  return (
    <>
      <Header />

      <main className={styles.main}>
        {/* Background */}
        <canvas ref={canvasRef} className={styles.bgCanvas} />

        {/* CHAPTER 1: HERO */}
        <section className={styles.hero}>
          <div className={styles.heroGrid}>
            <div className={styles.heroContent}>
              <div className={styles.heroBadge}>
                <span className="material-symbols-outlined">shield</span>
                <span>Enterprise Security</span>
              </div>
              <h1 className={styles.heroTitle}>
                Built with security.<br />Designed for trust.
              </h1>
              <p className={styles.heroDescription}>
                AetherFrame AI protects every project, every payment and every account using
                enterprise-grade security, encrypted infrastructure and industry-standard compliance.
              </p>

              <div className={styles.heroActions}>
                <button className={styles.primaryBtn}>
                  Explore Architecture
                </button>
                <button className={styles.secondaryBtn}>
                  View Compliance Reports
                </button>
              </div>

              <div className={styles.heroStats}>
                <div className={styles.statItem}>
                  <span className="material-symbols-outlined">verified_user</span>
                  <span>Enterprise Security</span>
                </div>
                <div className={styles.statItem}>
                  <span className="material-symbols-outlined">lock</span>
                  <span>Encrypted Infrastructure</span>
                </div>
                <div className={styles.statItem}>
                  <span className="material-symbols-outlined">public</span>
                  <span>Trusted Worldwide</span>
                </div>
              </div>
            </div>

            <div className={styles.heroVisual}>
              <div className={styles.heroVisualGlow}></div>
              <div ref={threeContainerRef} className={styles.threeContainer}></div>
              <div className={styles.statusOverlay}>
                <div className={styles.statusLabel}>Core Status</div>
                <div className={styles.statusIndicator}>
                  <div className={styles.statusDot}></div>
                  <span>AES-256 Active</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CHAPTER 2: DATA PROTECTION */}
        <section className={styles.dataProtection}>
          <div className={styles.dataProtectionHeader}>
            <h2>Data Protection Architecture</h2>
            <p>
              Your data is isolated and encrypted at rest and in transit. We never use your private
              data or generations to train our foundational models.
            </p>
          </div>

          <div className={styles.orbitalGrid}>
            <div className={styles.orbitalBackground}></div>

            <svg className={styles.orbitalSvg} viewBox="0 0 100 100" preserveAspectRatio="none">
              <circle cx="50" cy="50" r="30" fill="none" stroke="#b2c5ff" strokeWidth="1" strokeDasharray="4 8" />
              <circle cx="50" cy="50" r="45" fill="none" stroke="#5516be" strokeWidth="1" strokeDasharray="2 10" />
              <line className={styles.pathFlow} x1="50" y1="50" x2="20" y2="20" stroke="#b2c5ff" strokeWidth="1.5" />
              <line className={styles.pathFlow} x1="50" y1="50" x2="80" y2="20" stroke="#b2c5ff" strokeWidth="1.5" />
              <line className={styles.pathFlow} x1="50" y1="50" x2="15" y2="50" stroke="#b2c5ff" strokeWidth="1.5" />
              <line className={styles.pathFlow} x1="50" y1="50" x2="85" y2="50" stroke="#b2c5ff" strokeWidth="1.5" />
              <line className={styles.pathFlow} x1="50" y1="50" x2="30" y2="80" stroke="#b2c5ff" strokeWidth="1.5" />
              <line className={styles.pathFlow} x1="50" y1="50" x2="70" y2="80" stroke="#b2c5ff" strokeWidth="1.5" />
            </svg>

            <div className={styles.orbitalCenter}>
              <div className={styles.orbitalCore}>
                <span className="material-symbols-outlined">lock_person</span>
              </div>
              <div className={styles.orbitalLabel}>
                Encrypted<br />AI Core
              </div>
            </div>

            {orbitalNodes.map((node, index) => (
              <div
                key={index}
                className={styles.orbitalNode}
                style={{
                  top: node.top || 'auto',
                  bottom: node.bottom || 'auto',
                  left: node.left || 'auto',
                  right: node.right || 'auto',
                }}
              >
                <span className="material-symbols-outlined">{node.icon}</span>
                <span>{node.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* CHAPTER 3: COMPLIANCE & TRUST */}
        <section className={styles.compliance}>
          <div className={styles.complianceGrid}>
            <div className={styles.complianceLeft}>
              <h2>Global Compliance Standard</h2>
              <p>
                We adhere to the strictest international frameworks, ensuring your enterprise is
                protected against evolving threats while maintaining operational agility.
              </p>
              <div className={styles.complianceStats}>
                <div>
                  <div className={styles.statNumber}>99.9%</div>
                  <div className={styles.statLabel}>Protected Accounts</div>
                </div>
                <div>
                  <div className={styles.statNumber}>100M+</div>
                  <div className={styles.statLabel}>Successful Secure Payments</div>
                </div>
                <div>
                  <div className={styles.statNumber}>Top 500</div>
                  <div className={styles.statLabel}>Enterprise Clients</div>
                </div>
              </div>
            </div>

            <div className={styles.complianceRight}>
              <div className={styles.badgesGrid}>
                {complianceBadges.map((badge, index) => (
                  <div key={index} className={styles.badgeCard}>
                    <span className="material-symbols-outlined">{badge.icon}</span>
                    <span>{badge.label}</span>
                  </div>
                ))}
                <div className={`${styles.badgeCard} ${styles.badgeLarge}`}>
                  <span className="material-symbols-outlined">fingerprint</span>
                  <h3>Secure Authentication</h3>
                  <p>Multi-layered identity verification ensuring only authorized personnel access the core framework.</p>
                </div>
                <div className={styles.badgeCard}>
                  <span className="material-symbols-outlined">monitoring</span>
                  <span>Fraud Monitoring</span>
                </div>
                <div className={styles.badgeCard}>
                  <span className="material-symbols-outlined">manage_search</span>
                  <span>Audit Logs</span>
                </div>
                <div className={`${styles.badgeCard} ${styles.badgeFull}`}>
                  <span className="material-symbols-outlined">group_add</span>
                  <span>Role-Based Access Control</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CHAPTER 4: SECURE PAYMENTS */}
        <section className={styles.payments}>
          <div className={styles.paymentsHeader}>
            <h2>Frictionless. Bulletproof.</h2>
            <p>Enterprise transactions processed through heavily fortified, PCI-compliant gateways.</p>
          </div>

          <div className={styles.paymentsFlow}>
            <div className={styles.flowLine}></div>
            <div className={styles.flowSteps}>
              {paymentSteps.map((step, index) => (
                <div key={index} className={`${styles.flowStep} ${step.active ? styles.active : ''} ${step.complete ? styles.complete : ''}`}>
                  <div className={styles.stepIcon}>
                    <span className="material-symbols-outlined">{step.icon}</span>
                    {step.active && <div className={styles.stepPing}></div>}
                  </div>
                  <span>{step.label}</span>
                </div>
              ))}
            </div>

            <div className={styles.paymentLogos}>
              <span>VISA</span>
              <span>mastercard</span>
              <span className={styles.secureBadge}>3D SECURE</span>
            </div>
          </div>
        </section>

        {/* CHAPTER 5: PRIVACY & ACCOUNT PROTECTION */}
        <section className={styles.privacy}>
          <div className={styles.privacyGrid}>
            <div className={styles.privacyLeft}>
              <h2>Absolute Identity Control</h2>
              <div className={styles.privacyList}>
                {securityFeatures.map((feature, index) => (
                  <div key={index} className={styles.privacyItem}>
                    <div className={styles.privacyItemLeft}>
                      <span className="material-symbols-outlined">{feature.icon}</span>
                      <div>
                        <h4>{feature.title}</h4>
                        <p>{feature.description}</p>
                      </div>
                    </div>
                    <div className={`${styles.toggle} ${feature.enabled ? styles.toggleOn : ''}`}>
                      <div className={styles.toggleKnob}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.privacyRight}>
              <div className={styles.vaultContainer}>
                <div className={styles.vaultBackground}></div>
                <div className={styles.vaultOverlay}></div>
                <div className={styles.vaultContent}>
                  <span className="material-symbols-outlined">lock_outline</span>
                  <div className={styles.vaultBadge}>Vault Secured</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CHAPTER 6: FINAL CTA */}
        <section className={styles.cta}>
          <div className={styles.ctaContainer}>
            <div className={styles.ctaBackground}></div>
            <div className={styles.ctaContent}>
              <span className="material-symbols-outlined">security</span>
              <h2>Create with confidence.<br />Protected by design.</h2>
              <p>Join the enterprises trusting AetherFrame AI for secure, compliant, high-performance generation.</p>
              <div className={styles.ctaActions}>
                <Link href="/register" className={styles.ctaPrimary}>
                  Start Creating
                </Link>
                <Link href="/pricing" className={styles.ctaSecondary}>
                  View Pricing
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}