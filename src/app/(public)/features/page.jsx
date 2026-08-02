'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.scss';

// Імпорт компонентів
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';

export default function FeaturesPage() {
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
    
    float t = u_time * 0.05;
    
    vec3 bg = vec3(0.0157, 0.0196, 0.0392);
    vec3 deep = vec3(0.0275, 0.0431, 0.0784);
    vec3 surface = vec3(0.0392, 0.0627, 0.1255);
    
    vec3 accent1 = vec3(0.357, 0.549, 1.0);
    vec3 accent2 = vec3(0.545, 0.361, 0.965);
    
    vec3 color = mix(bg, deep, uv.y + sin(t) * 0.1);
    
    float d1 = length(p - vec2(sin(t * 0.7) * 0.4, cos(t * 0.4) * 0.2));
    float d2 = length(p + vec2(cos(t * 0.5) * 0.5, sin(t * 0.3) * 0.3));
    float dMouse = length(p - m);
    
    color += accent1 * (0.09 / (d1 + 0.7));
    color += accent2 * (0.08 / (d2 + 0.8));
    color += accent1 * (0.06 / (dMouse + 0.6)) * (sin(u_time * 2.0) * 0.15 + 0.85);
    
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

  // Three.js Neural Constellation
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const container = threeContainerRef.current;
    if (!container) return;

    const initThree = async () => {
      const THREE = await import('three');

      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
      camera.position.z = 10;

      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(window.devicePixelRatio);
      container.appendChild(renderer.domElement);

      const group = new THREE.Group();
      scene.add(group);

      const nodes = [
        { name: "Photorealism", pos: [0, 0, 0], color: "#b2c5ff" },
        { name: "Character Sync", pos: [4, 2, -2], color: "#2fd9f4" },
        { name: "Product Studio", pos: [-3, -3, 1], color: "#d0bcff" },
        { name: "8K Upscale", pos: [5, -1, 3], color: "#b2c5ff" },
        { name: "Inpainting", pos: [-5, 2, 2], color: "#2fd9f4" },
        { name: "Style Transfer", pos: [2, -4, -1], color: "#d0bcff" },
        { name: "API Gateway", pos: [-4, 0, -3], color: "#b2c5ff" },
        { name: "Brand Training", pos: [1, 4, 1], color: "#2fd9f4" },
        { name: "Batch Compute", pos: [3, 3, 4], color: "#b2c5ff" },
        { name: "Neural Anchor", pos: [-2, 5, -1], color: "#d0bcff" },
      ];

      const nodeMeshes = [];
      nodes.forEach((n) => {
        const geom = new THREE.SphereGeometry(0.22, 32, 32);
        const mat = new THREE.MeshBasicMaterial({
          color: n.color,
          transparent: true,
          opacity: 0.9,
        });
        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(...n.pos);
        group.add(mesh);
        nodeMeshes.push(mesh);

        // Outer Glow
        const glowGeom = new THREE.SphereGeometry(0.45, 32, 32);
        const glowMat = new THREE.MeshBasicMaterial({
          color: n.color,
          transparent: true,
          opacity: 0.18,
        });
        const glow = new THREE.Mesh(glowGeom, glowMat);
        mesh.add(glow);
      });

      // Neural Connections
      const lineMat = new THREE.LineBasicMaterial({
        color: "#ffffff",
        transparent: true,
        opacity: 0.12,
      });
      for (let i = 0; i < nodeMeshes.length; i++) {
        for (let j = i + 1; j < nodeMeshes.length; j++) {
          if (Math.random() > 0.6) {
            const points = [nodeMeshes[i].position, nodeMeshes[j].position];
            const lineGeom = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(lineGeom, lineMat);
            group.add(line);
          }
        }
      }

      const animate = () => {
        requestAnimationFrame(animate);
        group.rotation.y += 0.001;
        group.rotation.x += 0.0005;

        const time = Date.now() * 0.001;
        nodeMeshes.forEach((m, i) => {
          m.position.y += Math.sin(time + i) * 0.004;
          m.scale.setScalar(1 + Math.sin(time * 1.5 + i) * 0.06);
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

  const floatingImages = [
    {
      src: 'https://lh3.googleusercontent.com/aida/AP1WRLsorMKOBB1a9sNgxAR4W9Mr7rnzGiUqUZC5Ib7ec6ksD9bFDOPEaDeKybHKb6czVP4QWPA8isE7WB_OSqhL72K917IoD7L1iwBk6Wk6-Y7znD6abhP-h7LCx4U0wlIlXpZevty0w9LNK9DNTWO3bKh80ZlKWJxYyf_yPhB6rmCu1IpZKyNp_NakGIbQRYWFl3q2xAphhAjAuhpcbWEcf_p007jU8uYJb-yUeTpcUDKz5dJTPhe5QuK2U-c',
      alt: 'Fashion',
      className: styles.img1,
      animation: styles.animateFloat,
    },
    {
      src: 'https://lh3.googleusercontent.com/aida/AP1WRLulhoTGM4aYSgW2y4N8z8NNHtF5bQKPLoYreN8exO0tGmy4ME4R07N2Ny7v89GwjIB9Cqh9rjvoK7OhdUpefZDda4F4fmOyqcinI6-2AsdDWJgMGbjgnt8_OxJZux0gELHmLY0U74mFvvcscK-cKLQi57a8Sm_gcARl7J3Mc3ngd0tvsRJighiIxGcc3SQEaJTRW9IN5jIE_No3HUDggS8P_q-OMWCAzE9y6hyr06DpXAcbIFF_JqcPK5k',
      alt: 'Watch Perfume',
      className: styles.img2,
      animation: styles.animateFloatDelayed,
    },
    {
      src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD6sqz5oN8uG1G9HBvr6JghbT_oiTmr_xz4wiX2tIVAZ6OBq-jIPWYOd4mnj1XhXdouXrfilc2JlItPODXH7doVD8hyz2k5zsdu9CZbKqo-VWoMGk1AG3fBZOHpGGU8ATzyEJzgJuamwOm6e2eWoBboWIGLM3KHSSSBLJXH1Nyj4R63WucKmG8uMmsBIRE0kTuyW8SyXQ0dYZxglzYxc2RBwPbu44QY81jlb283Kmjxq7XYyDw5cK1ei8uu4AAiSSP58M8OMOPPsLE',
      alt: 'Automotive',
      className: styles.img3,
      animation: styles.animateFloatSlow,
    },
    {
      src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDAhPbAAW08xtf6Ck_K3nZMNX7fb6vDZiBObU4uJlf0zf3ICxFw1lBrgNF5WbaLq2GzMVaH54ej60MRvg8G7GGO5VgPOR3JXZbCC6dRIXqYn6qi7N0DnxctaVc9RtH5IW_af_ryo7_b_r-KIWgP3bnzuToEz8_46R9uncLR2Yxb12gITZ0LuHXJndAegJEuk6KEVWGSQI2YIRiquvpv1R6k6c5jfYSp-uBDRYrGC0HzX2xn_bZqAgbTAS72N1cXhNrp1IrLoM5tnM0',
      alt: 'Jewelry',
      className: styles.img4,
      animation: styles.animateFloat,
    },
    {
      src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCgNNVmlQJrSmzHJFumhvSk-3AztLeB3kfYALyMJh83dkQMwmC9gSLuy1EJHIC-QnROl6yreNIn2rsLYJhWKczZuQcXZMAqQ44bdtzY4j8kVlRiWFA2BNrQeh4wxsvcDsAoVYQ-JI8ydklpawjYqo6F7ef7a0olLDeAulj8b_DlY7ppz6v1Vq4Bo4PMWwXruKKrgliBBEDN5qjBDRy8opF05nORHaLCkkVkfNF832Vh9j31nf1CvM4iVwqt_KjOYpIdD47cW0HsWEo',
      alt: 'Architecture',
      className: styles.img5,
      animation: styles.animateFloatSlow,
    },
    {
      src: 'https://lh3.googleusercontent.com/aida/AP1WRLtsdsYXrQCXDyo_YHtq-79fGzQHxQtr9IzPve4JEF2-p7ecDHLh_Lf-W5xy5STC8hxmckjpSqostXoL0nygsKfGmYBUmbSDdnOBhOljyrCBglm_UrmCWsj0o_UdcIV0mAIuTHpU9Ny72Kn4hAihjAz71eTRldhAKtidRntw-lCl5vGxdzThx_KgLiC2BgE0IjwpkLqC12SyvlOJKn8dPHBfimLQpJZTj9u3RzKLhojVN6-hD61yGKbm4oM',
      alt: 'Anime',
      className: styles.img6,
      animation: styles.animateFloatDelayed,
    },
    {
      src: 'https://lh3.googleusercontent.com/aida/AP1WRLubgKtR7CzxX4EY8j5DSqRLBXtPO5PC3h75t5hd2wJlN8-s0Iqwq_i5pwykjZLG2DkaWz3aOBpXy5GjoBxDCHWQ2q98XFhzMokxFPcqxpzY-31jQSRrup1AyayucavfvS4bQDSfXn39XxN-v2YyUwFbB-hS43e8il6tMYILslecr5XdgHYixeC1ONFfoYqp15MNeJT95C1DYZgDAkpR8YTmVHRYsMjz4I09B_kcQMQYcCFMk5HgVQtBaqs',
      alt: 'Landscape',
      className: styles.img7,
      animation: styles.animateFloat,
    },
  ];

  const corePanels = [
    {
      title: 'Absolute Photorealism',
      description: 'Emulate complex camera physics, true light scattering, and micro-textures.',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDAhPbAAW08xtf6Ck_K3nZMNX7fb6vDZiBObU4uJlf0zf3ICxFw1lBrgNF5WbaLq2GzMVaH54ej60MRvg8G7GGO5VgPOR3JXZbCC6dRIXqYn6qi7N0DnxctaVc9RtH5IW_af_ryo7_b_r-KIWgP3bnzuToEz8_46R9uncLR2Yxb12gITZ0LuHXJndAegJEuk6KEVWGSQI2YIRiquvpv1R6k6c5jfYSp-uBDRYrGC0HzX2xn_bZqAgbTAS72N1cXhNrp1IrLoM5tnM0',
      color: 'primary',
      position: 'topLeft',
    },
    {
      title: 'Identity Sync',
      description: 'Lock facial geometry and style logic across thousands of generations.',
      image: 'https://lh3.googleusercontent.com/aida/AP1WRLsorMKOBB1a9sNgxAR4W9Mr7rnzGiUqUZC5Ib7ec6ksD9bFDOPEaDeKybHKb6czVP4QWPA8isE7WB_OSqhL72K917IoD7L1iwBk6Wk6-Y7znD6abhP-h7LCx4U0wlIlXpZevty0w9LNK9DNTWO3bKh80ZlKWJxYyf_yPhB6rmCu1IpZKyNp_NakGIbQRYWFl3q2xAphhAjAuhpcbWEcf_p007jU8uYJb-yUeTpcUDKz5dJTPhe5QuK2U-c',
      color: 'tertiary',
      position: 'bottomRight',
    },
    {
      title: 'Spatial Context',
      description: 'Seamlessly integrate subjects into physically accurate environments.',
      image: null,
      color: 'secondary',
      position: 'topRight',
    },
    {
      title: 'Art Direction Engine',
      description: 'Granular control over composition, lighting weights, and stylistic blending.',
      image: null,
      color: 'primaryFixed',
      position: 'bottomLeft',
    },
  ];

  const workflows = [
    {
      title: 'Fashion & Editorial',
      icon: 'styler',
      iconColor: 'primary',
      steps: ['Concept', 'Generation', 'Retouch'],
      image: 'https://lh3.googleusercontent.com/aida/AP1WRLsorMKOBB1a9sNgxAR4W9Mr7rnzGiUqUZC5Ib7ec6ksD9bFDOPEaDeKybHKb6czVP4QWPA8isE7WB_OSqhL72K917IoD7L1iwBk6Wk6-Y7znD6abhP-h7LCx4U0wlIlXpZevty0w9LNK9DNTWO3bKh80ZlKWJxYyf_yPhB6rmCu1IpZKyNp_NakGIbQRYWFl3q2xAphhAjAuhpcbWEcf_p007jU8uYJb-yUeTpcUDKz5dJTPhe5QuK2U-c',
      description: 'Magazine-ready garments and styling.',
    },
    {
      title: 'Product & Macro',
      icon: 'camera_macro',
      iconColor: 'tertiary',
      steps: ['Upload Base', 'Context Build', 'Render'],
      image: 'https://lh3.googleusercontent.com/aida/AP1WRLulhoTGM4aYSgW2y4N8z8NNHtF5bQKPLoYreN8exO0tGmy4ME4R07N2Ny7v89GwjIB9Cqh9rjvoK7OhdUpefZDda4F4fmOyqcinI6-2AsdDWJgMGbjgnt8_OxJZux0gELHmLY0U74mFvvcscK-cKLQi57a8Sm_gcARl7J3Mc3ngd0tvsRJighiIxGcc3SQEaJTRW9IN5jIE_No3HUDggS8P_q-OMWCAzE9y6hyr06DpXAcbIFF_JqcPK5k',
      description: 'Flawless material reflection and studio lighting.',
    },
    {
      title: 'Architecture & Spatial',
      icon: 'architecture',
      iconColor: 'secondary',
      steps: ['Sketch', 'Volume Gen', 'Environment'],
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCgNNVmlQJrSmzHJFumhvSk-3AztLeB3kfYALyMJh83dkQMwmC9gSLuy1EJHIC-QnROl6yreNIn2rsLYJhWKczZuQcXZMAqQ44bdtzY4j8kVlRiWFA2BNrQeh4wxsvcDsAoVYQ-JI8ydklpawjYqo6F7ef7a0olLDeAulj8b_DlY7ppz6v1Vq4Bo4PMWwXruKKrgliBBEDN5qjBDRy8opF05nORHaLCkkVkfNF832Vh9j31nf1CvM4iVwqt_KjOYpIdD47cW0HsWEo',
      description: 'Precise structural rendering and mood lighting.',
    },
    {
      title: 'Marketing Campaigns',
      icon: 'campaign',
      iconColor: 'primaryFixed',
      steps: ['Brand Guide', 'Batch Gen', 'Export Set'],
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD6sqz5oN8uG1G9HBvr6JghbT_oiTmr_xz4wiX2tIVAZ6OBq-jIPWYOd4mnj1XhXdouXrfilc2JlItPODXH7doVD8hyz2k5zsdu9CZbKqo-VWoMGk1AG3fBZOHpGGU8ATzyEJzgJuamwOm6e2eWoBboWIGLM3KHSSSBLJXH1Nyj4R63WucKmG8uMmsBIRE0kTuyW8SyXQ0dYZxglzYxc2RBwPbu44QY81jlb283Kmjxq7XYyDw5cK1ei8uu4AAiSSP58M8OMOPPsLE',
      description: 'Consistent visual identity at scale.',
    },
  ];

  const plans = [
    {
      name: 'Creative Campaign',
      description: 'For boutique agencies and independent studios.',
      features: ['Unlimited 4K Generations', 'Shared Team Workspace', 'Commercial License'],
      button: 'Contact Sales',
      variant: 'default',
    },
    {
      name: 'VIP Creative Director',
      description: 'For enterprise creative departments and global brands.',
      features: [
        'Dedicated GPU Cluster',
        'Custom Model Training',
        'Priority API Access',
        'Dedicated Account Manager',
      ],
      button: 'Upgrade to VIP',
      variant: 'vip',
      recommended: true,
    },
    {
      name: 'Brand Identity',
      description: 'Custom implementation for strict brand guidelines.',
      features: ['Style Guide Lock-in', 'Enterprise SSO', 'Legal Indemnification'],
      button: 'Contact Sales',
      variant: 'default',
    },
  ];

  return (
    <>
      <Header />

      <main className={styles.main}>
        {/* Background */}
        <canvas ref={canvasRef} className={styles.bgCanvas} />
        <div ref={threeContainerRef} className={styles.threeBackground}></div>

        {/* CHAPTER 1: HERO */}
        <section className={styles.hero}>
          <div className={styles.heroGrid}>
            <div className={styles.heroContent}>
              <div className={styles.heroBadge}>
                <span className={styles.pulseDot}></span>
                <span>AetherFrame V5 is Live</span>
              </div>
              <h1 className={styles.heroTitle}>
                Infinite <span className={styles.textGradient}>Visual</span> Intelligence.
              </h1>
              <p className={styles.heroDescription}>
                The ultimate creative engine for photorealistic renders, global fashion campaigns,
                visionary architecture, and cinematic concepts.
              </p>

              <div className={styles.promptBar}>
                <div className={styles.promptIcon}>
                  <span className="material-symbols-outlined">magic_button</span>
                </div>
                <input
                  type="text"
                  className={styles.promptInput}
                  value="/imagine a cinematic macro shot of a luxury watch, 85mm lens, shallow depth of field..."
                  readOnly
                />
                <Link href="/register" className={styles.generateBtn}>
                  Generate
                  <span className="material-symbols-outlined">arrow_forward</span>
                </Link>
              </div>

              <div className={styles.trustSection}>
                <span>Trusted By</span>
                <div className={styles.trustIcons}>
                  <span className="material-symbols-outlined">diamond</span>
                  <span className="material-symbols-outlined">architecture</span>
                  <span className="material-symbols-outlined">directions_car</span>
                </div>
              </div>
            </div>

            <div className={styles.heroVisual}>
              {floatingImages.map((img, index) => (
                <div
                  key={index}
                  className={`${styles.floatingCard} ${img.className} ${img.animation}`}
                >
                  <img src={img.src} alt={img.alt} />
                </div>
              ))}
              <div className={`${styles.floatingCard} ${styles.img8} ${styles.animateFloatSlow}`}>
                <span className="material-symbols-outlined">auto_awesome</span>
              </div>
            </div>
          </div>
        </section>

        {/* CHAPTER 2: INTELLIGENCE ARCHITECTURE */}
        <section className={styles.architecture}>
          <div className={styles.architectureHeader}>
            <h2>Intelligence Architecture</h2>
            <p>A unified neural foundation engineered for uncompromising precision.</p>
          </div>

          <div className={styles.coreContainer}>
            <div className={styles.coreGlow}></div>
            <div className={styles.coreRing}></div>
            <div className={styles.coreCenter}>
              <span className="material-symbols-outlined">psychology</span>
              <span>Aether Core</span>
            </div>

            {corePanels.map((panel, index) => (
              <div
                key={index}
                className={`${styles.corePanel} ${styles[panel.position]} ${styles[`panel${panel.color.charAt(0).toUpperCase() + panel.color.slice(1)}`]}`}
              >
                <div className={styles.panelBar}></div>
                <h3>{panel.title}</h3>
                <p>{panel.description}</p>
                {panel.image && (
                  <div className={styles.panelImage}>
                    <img src={panel.image} alt={panel.title} />
                  </div>
                )}
              </div>
            ))}

            <svg className={styles.coreLines} viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M 30 20 Q 50 40 70 40" fill="none" stroke="#b2c5ff" strokeDasharray="4 4" strokeWidth="2" />
              <path d="M 90 60 Q 70 40 70 40" fill="none" stroke="#2fd9f4" strokeDasharray="4 4" strokeWidth="2" />
              <path d="M 85 25 Q 75 40 70 40" fill="none" stroke="#d0bcff" strokeDasharray="4 4" strokeWidth="2" />
              <path d="M 15 60 Q 35 40 70 40" fill="none" stroke="#dae2ff" strokeDasharray="4 4" strokeWidth="2" />
            </svg>
          </div>
        </section>

        {/* CHAPTER 3: PROFESSIONAL CANVAS */}
        <section className={styles.canvas}>
          <div className={styles.canvasHeader}>
            <h2>The Professional Canvas</h2>
            <p>A luxury desktop-grade interface built for iterative perfection.</p>
          </div>

          <div className={styles.canvasContainer}>
            <div className={styles.canvasHeaderBar}>
              <div className={styles.windowDots}>
                <div className={styles.dotRed}></div>
                <div className={styles.dotYellow}></div>
                <div className={styles.dotGreen}></div>
              </div>
              <div className={styles.workspaceLabel}>
                <span className={styles.statusDotSmall}></span>
                Workspace: Campaign AW24
              </div>
              <div className={styles.headerActions}>
                <span className="material-symbols-outlined">history</span>
                <span className="material-symbols-outlined">file_download</span>
                <Link href="/register" className={styles.exportBtn}>Export 8K</Link>
              </div>
            </div>

            <div className={styles.canvasBody}>
              <div className={styles.toolbar}>
                <div className={styles.toolActive}>
                  <span className="material-symbols-outlined">edit</span>
                </div>
                <div className={styles.toolIcon}>
                  <span className="material-symbols-outlined">brush</span>
                </div>
                <div className={styles.toolIcon}>
                  <span className="material-symbols-outlined">layers</span>
                </div>
                <div className={styles.toolIcon}>
                  <span className="material-symbols-outlined">tune</span>
                </div>
                <div className={`${styles.toolIcon} ${styles.toolBottom}`}>
                  <span className="material-symbols-outlined">settings</span>
                </div>
              </div>

              <div className={styles.canvasMain}>
                <div className={styles.promptPanel}>
                  <div className={styles.promptHeader}>
                    <span className="material-symbols-outlined">edit_document</span>
                    <span>Prompt</span>
                  </div>
                  <p className={styles.promptText}>
                    Vogue-style high-fashion editorial, model wearing iridescent avant-garde gown,
                    architectural concrete background with dramatic god rays, cinematic lighting, 8k
                    resolution, Hasselblad X1D...
                  </p>
                  <div className={styles.negativePrompt}>
                    <span className="material-symbols-outlined">block</span>
                    <span>Negative Prompt</span>
                    <span className={styles.negativeText}>
                      ugly, deformed, bad anatomy, noisy, low resolution...
                    </span>
                  </div>
                </div>

                <div className={styles.canvasImage}>
                  <img
                    src="https://lh3.googleusercontent.com/aida/AP1WRLsorMKOBB1a9sNgxAR4W9Mr7rnzGiUqUZC5Ib7ec6ksD9bFDOPEaDeKybHKb6czVP4QWPA8isE7WB_OSqhL72K917IoD7L1iwBk6Wk6-Y7znD6abhP-h7LCx4U0wlIlXpZevty0w9LNK9DNTWO3bKh80ZlKWJxYyf_yPhB6rmCu1IpZKyNp_NakGIbQRYWFl3q2xAphhAjAuhpcbWEcf_p007jU8uYJb-yUeTpcUDKz5dJTPhe5QuK2U-c"
                    alt="Editor Canvas"
                  />
                  <div className={styles.canvasInfo}>
                    <span>Seed: 84920155</span>
                    <span>Size: 1376x768</span>
                    <span>Steps: 40</span>
                  </div>
                </div>
              </div>

              <div className={styles.propertiesPanel}>
                <div className={styles.propSection}>
                  <div className={styles.propHeader}>
                    <h4>Model Engine</h4>
                    <span className="material-symbols-outlined">info</span>
                  </div>
                  <div className={styles.modelSelect}>
                    <div className={styles.modelDot}></div>
                    <span>AetherV5 Photoreal</span>
                    <span className="material-symbols-outlined">expand_more</span>
                  </div>
                </div>

                <div className={styles.propSection}>
                  <h4>Camera &amp; Lighting</h4>
                  <div className={styles.sliderGroup}>
                    <div className={styles.sliderRow}>
                      <span>Focal Length</span>
                      <span>85mm</span>
                    </div>
                    <div className={styles.sliderTrack}>
                      <div className={`${styles.sliderFill} ${styles.sliderTertiary}`} style={{ width: '60%' }}></div>
                    </div>
                    <div className={styles.sliderRow}>
                      <span>Depth of Field (f-stop)</span>
                      <span>f/1.4</span>
                    </div>
                    <div className={styles.sliderTrack}>
                      <div className={`${styles.sliderFill} ${styles.sliderTertiary}`} style={{ width: '15%' }}></div>
                    </div>
                    <div className={styles.sliderRow}>
                      <span>Lighting Drama</span>
                      <span>High</span>
                    </div>
                    <div className={styles.sliderTrack}>
                      <div className={`${styles.sliderFill} ${styles.sliderPrimary}`} style={{ width: '85%' }}></div>
                    </div>
                  </div>
                </div>

                <div className={styles.propSection}>
                  <h4>Style Weights</h4>
                  <div className={styles.weightList}>
                    <div className={styles.weightItem}>
                      <span>Cinematic</span>
                      <span className={styles.weightValue}>1.2</span>
                    </div>
                    <div className={styles.weightItem}>
                      <span>Avant-Garde</span>
                      <span className={styles.weightValueSecondary}>0.85</span>
                    </div>
                  </div>
                </div>

                <Link href="/register" className={styles.generateCanvasBtn}>
                  <span className="material-symbols-outlined">auto_awesome</span>
                  Generate
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* CHAPTER 4: PROFESSIONAL WORKFLOWS */}
        <section className={styles.workflows}>
          <div className={styles.workflowsHeader}>
            <h2>Professional Workflows</h2>
            <p>Tailored generation pipelines designed for specific industry standards.</p>
          </div>

          <div className={styles.workflowsGrid}>
            {workflows.map((workflow, index) => (
              <div key={index} className={`${styles.workflowCard} ${styles[`workflow${workflow.iconColor.charAt(0).toUpperCase() + workflow.iconColor.slice(1)}`]}`}>
                <div className={styles.workflowHeader}>
                  <h3>{workflow.title}</h3>
                  <span className={`material-symbols-outlined ${styles.workflowIcon}`}>
                    {workflow.icon}
                  </span>
                </div>
                <div className={styles.workflowSteps}>
                  {workflow.steps.map((step, idx) => (
                    <span key={idx}>
                      {step}
                      {idx < workflow.steps.length - 1 && (
                        <span className={styles.stepArrow}>→</span>
                      )}
                    </span>
                  ))}
                </div>
                <div className={styles.workflowImage}>
                  <img src={workflow.image} alt={workflow.title} />
                  <div className={styles.workflowOverlay}>
                    <p>{workflow.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CHAPTER 5: ENTERPRISE PLATFORM */}
        <section className={styles.enterprise}>
          <div className={styles.enterpriseHeader}>
            <span className={styles.enterpriseBadge}>Enterprise Platform</span>
            <h2>Built for creators, agencies and global brands.</h2>
            <p>Scale your creative output with enterprise-grade security, team collaboration, and dedicated compute clusters.</p>
          </div>

          <div className={styles.enterpriseGrid}>
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`${styles.enterpriseCard} ${plan.variant === 'vip' ? styles.enterpriseVIP : ''}`}
              >
                {plan.recommended && (
                  <div className={styles.recommendedBadge}>RECOMMENDED</div>
                )}
                <h3>{plan.name}</h3>
                <p className={styles.planDescription}>{plan.description}</p>
                <ul className={styles.planFeatures}>
                  {plan.features.map((feature, idx) => (
                    <li key={idx}>
                      <span className="material-symbols-outlined">check_circle</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link href="/contact" className={`${styles.planButton} ${plan.variant === 'vip' ? styles.planButtonVIP : ''}`}>
                  {plan.button}
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* CHAPTER 6: FINAL CTA */}
        <section className={styles.cta}>
          <div className={styles.ctaBackground}>
            <div className={styles.ctaFog}></div>
            <div className={styles.ctaGradient}></div>
            <div className={styles.ctaRadial}></div>
          </div>

          <div className={styles.ctaContent}>
            <h2>Create visuals without limits.</h2>
            <p>Join the world's most demanding creative professionals.</p>
            <div className={styles.ctaActions}>
              <Link href="/register" className={styles.ctaPrimary}>
                Start Creating Free
              </Link>
              <Link href="/contact" className={styles.ctaSecondary}>
                Book a Demo
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}