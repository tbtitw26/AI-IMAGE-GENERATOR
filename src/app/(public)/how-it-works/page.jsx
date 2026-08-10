'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import styles from './page.module.scss';

// Імпорт компонентів
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';

// Ті самі моделі, іконки та кольорові варіанти, що й на реальній сторінці
// /dashboard/generate — щоб маркетингові макети виглядали ідентично продукту.
const STUDIO_MODELS = [
  { name: 'Aether Ultra', icon: 'diamond', description: 'Premium quality, balanced for everything', variant: 'ultra' },
  { name: 'Cinema 4K', icon: 'movie', description: 'Cinematic color & depth of field', variant: 'cinema' },
  { name: 'Product Studio', icon: 'photo_camera', description: 'Clean studio lighting for products', variant: 'studio' },
  { name: 'Character Gen', icon: 'person', description: 'Consistent character design', variant: 'character' },
];

const STUDIO_ASPECT_RATIOS = ['16:9', '1:1', '9:16', '4:3', '3:4'];

function getAspectDims(ratio) {
  const [w, h] = ratio.split(':').map(Number);
  const maxDim = 20;
  return w >= h
    ? { width: maxDim, height: Math.max(6, Math.round((h / w) * maxDim)) }
    : { width: Math.max(6, Math.round((w / h) * maxDim)), height: maxDim };
}

export default function HowItWorksPage() {
  const [typingText, setTypingText] = useState('');
  const [mockModel, setMockModel] = useState('Aether Ultra');
  const [mockImageCount, setMockImageCount] = useState(4);
  const [mockAspectRatio, setMockAspectRatio] = useState('16:9');
  const canvasRef = useRef(null);
  const threeContainerRef = useRef(null);
  const typingElementRef = useRef(null);
  const processScrollRef = useRef(null);

  const scrollProcess = (direction) => {
    const el = processScrollRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * 340, behavior: 'smooth' });
  };

  const textToType = "A hyper-realistic 8k render of a glowing glass terrarium containing a miniature futuristic city, cinematic lighting, deep space background --ar 16:9";

  // Typing effect
  useEffect(() => {
    let i = 0;
    let intervalId;

    const typeWriter = () => {
      if (i < textToType.length) {
        setTypingText((prev) => prev + textToType.charAt(i));
        i++;
        intervalId = setTimeout(typeWriter, 40);
      }
    };

    setTimeout(typeWriter, 1000);

    return () => clearTimeout(intervalId);
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
    vec3 magenta = vec3(0.965, 0.361, 0.722);
    
    vec3 color = mix(bg, deep, uv.y + sin(t * 0.5) * 0.1);
    
    float beam = pow(1.0 - abs(p.x - sin(t * 0.8) * 0.4), 12.0) * (sin(t + uv.y * 3.0) * 0.5 + 0.5);
    color += accent1 * beam * 0.12;
    
    float particles = 0.0;
    for(float i = 0.0; i < 6.0; i++) {
        vec2 pPos = vec2(sin(t * (0.15 + i * 0.1) + i * 1.5), cos(t * (0.25 + i * 0.08) + i * 2.5)) * 0.45;
        particles += 0.0008 / length(p - pPos);
    }
    color += accent2 * particles;
    
    float dMouse = length(p - m);
    color += accent1 * (0.05 / (dMouse + 0.7)) * (sin(u_time * 1.8) * 0.2 + 0.8);
    
    float n = noise(uv + u_time);
    color += (n - 0.5) * 0.018;
    
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

  // Three.js Neural Core
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
      renderer.setPixelRatio(window.devicePixelRatio || 1);
      container.appendChild(renderer.domElement);

      const group = new THREE.Group();
      scene.add(group);

      // Neural Core Orb
      const coreGeom = new THREE.SphereGeometry(2.0, 64, 64);
      const coreMat = new THREE.MeshPhongMaterial({
        color: 0xb2c5ff,
        transparent: true,
        opacity: 0.1,
        shininess: 100,
        emissive: 0x5b8cff,
        emissiveIntensity: 0.6,
      });
      const core = new THREE.Mesh(coreGeom, coreMat);
      group.add(core);

      // Intelligence Nodes
      const nodes = [
        { name: "Intent", pos: [-6, 3, 0], color: "#b2c5ff" },
        { name: "Objects", pos: [5, 4, -2], color: "#2fd9f4" },
        { name: "Lighting", pos: [-4, -5, 1], color: "#d0bcff" },
        { name: "Composition", pos: [7, -1, 2], color: "#b2c5ff" },
        { name: "Perspective", pos: [-6, -2, -3], color: "#2fd9f4" },
        { name: "Materials", pos: [2, 6, 3], color: "#ff5ce0" },
        { name: "Textures", pos: [1, -7, -1], color: "#d0bcff" },
        { name: "Atmosphere", pos: [-8, 0, 2], color: "#b2c5ff" },
      ];

      const nodeMeshes = [];
      nodes.forEach((n) => {
        const geom = new THREE.SphereGeometry(0.18, 32, 32);
        const mat = new THREE.MeshBasicMaterial({ color: n.color });
        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(...n.pos);
        group.add(mesh);
        nodeMeshes.push(mesh);

        // Dynamic Filaments
        const points = [new THREE.Vector3(0, 0, 0), mesh.position];
        const lineGeom = new THREE.BufferGeometry().setFromPoints(points);
        const lineMat = new THREE.LineBasicMaterial({
          color: n.color,
          transparent: true,
          opacity: 0.25,
        });
        const line = new THREE.Line(lineGeom, lineMat);
        group.add(line);
      });

      // Lights
      const pLight = new THREE.PointLight(0x2fd9f4, 2.5, 25);
      pLight.position.set(5, 5, 5);
      scene.add(pLight);
      scene.add(new THREE.AmbientLight(0xffffff, 0.4));

      const animate = () => {
        requestAnimationFrame(animate);
        const time = Date.now() * 0.001;
        group.rotation.y += 0.0015;
        group.rotation.x += 0.0004;
        core.scale.setScalar(1 + Math.sin(time * 1.6) * 0.06);

        nodeMeshes.forEach((m, i) => {
          m.position.y += Math.sin(time + i) * 0.006;
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

  const steps = [
    {
      number: '01',
      title: 'Prompt Analysis',
      description:
        'The prompt is interpreted into visual concepts, objects, relationships and creative intent.',
      icon: 'psychology',
      variant: 'ultra',
    },
    {
      number: '02',
      title: 'Composition Planning',
      description:
        'The AI plans camera position, framing, perspective and overall scene balance.',
      icon: 'grid_view',
      variant: 'cinema',
    },
    {
      number: '03',
      title: 'Visual Synthesis',
      description:
        'Millions of learned visual patterns are combined into a completely new original composition.',
      icon: 'auto_awesome',
      variant: 'studio',
    },
    {
      number: '04',
      title: 'Detail Enhancement',
      description:
        'Textures, reflections, materials, lighting and small imperfections are refined for realism.',
      icon: 'texture',
      variant: 'character',
    },
    {
      number: '05',
      title: 'Final Output',
      description:
        'The finished image is optimized for commercial use and exported in high resolution.',
      icon: 'download_done',
      variant: 'ultra',
      isFinal: true,
    },
  ];

  const exportFormats = [
    { icon: 'image', label: 'PNG', color: 'primary' },
    { icon: 'photo', label: 'JPG', color: 'primary' },
    { icon: 'web', label: 'WEBP', color: 'primary' },
    { icon: 'hd', label: '8K Ultra', color: 'tertiary' },
    { icon: 'copyright', label: 'Commercial License', color: 'secondary' },
    { icon: 'print', label: 'High Quality Print', color: 'secondary' },
    { icon: 'share', label: 'Social Media Ready', color: 'tertiary' },
  ];

  return (
    <>
      <Header />
      
      <main className={styles.main}>
        {/* WebGL Background */}
        <canvas ref={canvasRef} className={styles.bgCanvas} />

        {/* CHAPTER 1: INTRODUCTION */}
        <section className={styles.intro}>
          <div className={styles.introGrid}>
            <div className={styles.introContent}>
              <div className={styles.badge}>
                <span className="material-symbols-outlined">bolt</span>
                <span>HOW IT WORKS</span>
              </div>
              <h1 className={styles.introTitle}>
                Every masterpiece starts with <span className={styles.textGradient}>one idea.</span>
              </h1>
              <p className={styles.introDescription}>
                AetherFrame AI transforms natural language into professional visual content through
                multiple intelligent stages. Every prompt is analyzed for meaning, artistic intent,
                lighting, composition and visual storytelling before the first image is generated.
                The result is a creative workflow that feels fast, intuitive and remarkably human.
              </p>

              {/* Interactive Prompt Input */}
              <div className={styles.promptContainer}>
                <div className={styles.promptWrapper}>
                  <span className="material-symbols-outlined">auto_awesome</span>
                  <div className={styles.promptDisplay}>
                    <span ref={typingElementRef} className={styles.typingText}>
                      {typingText}
                      <span className={styles.cursor}></span>
                    </span>
                  </div>
                  <Link href="/register" className={styles.sendBtn}>
                    <span className="material-symbols-outlined">send</span>
                  </Link>
                </div>
              </div>

              <div className={styles.features}>
                <div className={styles.feature}>
                  <span className="material-symbols-outlined">timer</span>
                  <span>Average generation under 10 seconds</span>
                </div>
                <div className={styles.feature}>
                  <span className="material-symbols-outlined">workspace_premium</span>
                  <span>Commercial-ready results</span>
                </div>
                <div className={styles.feature}>
                  <span className="material-symbols-outlined">download_done</span>
                  <span>Professional quality exports</span>
                </div>
              </div>
            </div>

            <div className={styles.introVisual}>
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCvLeUVUIw7iEUI55oMncZvYinpSdkVako-VEt7F9YKuHhTN8ig1ZyJ0yxHmcIkEwybQGljrVz9lecpWAcdDx_luShkZJKwBIYs5PG7lpIEfoPP8k7nmrf9OYwysm9eeKNWiWSf9FebM2KrZl-rRZgHQRWLP3QFuETFd1y4zVHKOe_zQC38BmshF2sjWRe3UOo5pV8_0oUQ2fQRewS0Ju7d44BQYFyHG6AcOg9etJ0yW_Wi12-WtUMCurbm08dACVtgRWrhIa1SE2A"
                alt="Futuristic AI engine core"
              />
            </div>
          </div>
        </section>

        {/* CHAPTER 2: UNDERSTANDING YOUR PROMPT */}
        <section className={styles.understanding}>
          <div className={styles.understandingContainer}>
            <div className={styles.understandingHeader}>
              <div>
                <span className={styles.phaseBadge}>Phase 01</span>
                <h2>Understanding Your Prompt</h2>
              </div>
            </div>

            <div ref={threeContainerRef} className={styles.neuralCore}></div>

            <div className={styles.floatingCards}>
              <div className={`${styles.floatingCard} ${styles.cardLighting}`}>
                <h4>
                  <span className="material-symbols-outlined">lightbulb</span>Lighting
                </h4>
                <p>The AI identifies natural and artificial light sources to build realistic shadows, reflections and atmosphere.</p>
              </div>
              <div className={`${styles.floatingCard} ${styles.cardComposition}`}>
                <h4>
                  <span className="material-symbols-outlined">grid_on</span>Composition
                </h4>
                <p>The system arranges visual balance, subject placement and framing before rendering begins.</p>
              </div>
              <div className={`${styles.floatingCard} ${styles.cardStyle}`}>
                <h4>
                  <span className="material-symbols-outlined">brush</span>Style
                </h4>
                <p>Artistic references, mood and visual identity are interpreted before image generation.</p>
              </div>
              <div className={`${styles.floatingCard} ${styles.cardMore}`}>
                <h4>
                  <span className="material-symbols-outlined">add</span>More Parameters
                </h4>
                <p>Materials, Textures, Perspective, Camera Angle, Scene Planning.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CHAPTER 3: THE GENERATION PROCESS */}
        <section className={styles.process}>
          <div className={styles.processHeader}>
            <div className={styles.processBadge}>
              <span>Phase 02</span>
            </div>
            <h2>The Generation Process</h2>
          </div>

          <div className={styles.processCarousel}>
            <button
              className={`${styles.processArrow} ${styles.processArrowLeft}`}
              onClick={() => scrollProcess(-1)}
              aria-label="Scroll left"
              type="button"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>

            <div className={styles.processSteps} ref={processScrollRef}>
              {steps.map((step, index) => (
                <div key={index} className={`${styles.processStep} ${step.isFinal ? styles.finalStep : ''}`}>
                  <div className={styles.stepVisual} data-variant={step.variant} style={{ animationDelay: `${index * 0.15}s` }}>
                    <span className={styles.stepVisualGrid} />
                    <span className={styles.stepVisualGlow} />
                    <span className={styles.stepVisualIcon}>
                      <span className="material-symbols-outlined">{step.icon}</span>
                    </span>
                    <span className={styles.stepVisualNumber}>{step.number}</span>
                    {step.isFinal && <div className={styles.finalBadge}>Final Output</div>}
                  </div>
                  <div>
                    <h3>{step.number}. {step.title}</h3>
                    <p>{step.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.processFade} />

            <button
              className={`${styles.processArrow} ${styles.processArrowRight}`}
              onClick={() => scrollProcess(1)}
              aria-label="Scroll right"
              type="button"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </section>

        {/* CHAPTER 4: CREATIVE REFINEMENT */}
        <section className={styles.refinement}>
          <div className={styles.refinementHeader}>
            <h2>Creative Refinement</h2>
            <p>
              Experience a refined human-AI collaboration. Take full control over the generation process
              with our professional studio interface, designed to give you precision over every aspect
              of your creative vision.
            </p>
          </div>

          <div className={styles.studioPanel}>
            {/* Control Panel — mirrors /dashboard/generate exactly */}
            <div className={styles.controlPanel}>
              <div className={styles.promptSection}>
                <div className={styles.promptHeader}>
                  <label>
                    <span className={styles.sectionIcon}>
                      <span className="material-symbols-outlined">edit_note</span>
                    </span>
                    Master Prompt
                  </label>
                  <div className={styles.promptActions}>
                    <button className={styles.actionBtn} type="button">
                      <span className="material-symbols-outlined">auto_fix_high</span>
                      Enhance
                    </button>
                    <button className={styles.actionBtn} type="button">
                      <span className="material-symbols-outlined">shuffle</span>
                      Random
                    </button>
                    <button className={styles.actionBtn} type="button" disabled>
                      <span className="material-symbols-outlined">history</span>
                      History
                    </button>
                  </div>
                </div>
                <div className={styles.promptInputWrap}>
                  <textarea
                    className={styles.promptInput}
                    rows="4"
                    readOnly
                    value="A cinematic close-up of a designer sketching a concept car, dramatic studio lighting, ultra-detailed, 8k resolution."
                  />
                  <span className={styles.charCount}>115</span>
                </div>
              </div>

              <div className={styles.negativeSection}>
                <label>
                  <span className={styles.sectionIcon}>
                    <span className="material-symbols-outlined">block</span>
                  </span>
                  Negative Prompt
                </label>
                <textarea className={styles.negativeInput} rows="2" readOnly value="blurry, low quality, distorted, watermark, text" />
              </div>

              <div className={styles.modelSection}>
                <label>
                  <span className={styles.sectionIcon}>
                    <span className="material-symbols-outlined">auto_awesome_mosaic</span>
                  </span>
                  Model Engine
                </label>
                <div className={styles.mockModelGrid}>
                  {STUDIO_MODELS.map((model) => (
                    <button
                      key={model.name}
                      className={`${styles.mockModelBtn} ${mockModel === model.name ? styles.active : ''}`}
                      data-variant={model.variant}
                      onClick={() => setMockModel(model.name)}
                    >
                      <span className={styles.mockModelIcon}>
                        <span className="material-symbols-outlined">{model.icon}</span>
                      </span>
                      <span className={styles.mockModelText}>
                        <span className={styles.mockModelName}>{model.name}</span>
                        <span className={styles.mockModelDesc}>{model.description}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.modelSection}>
                <label>
                  <span className={styles.sectionIcon}>
                    <span className="material-symbols-outlined">folder_open</span>
                  </span>
                  Save to Project (optional)
                </label>
                <select className={styles.projectSelect} disabled defaultValue="">
                  <option value="">No project — gallery only</option>
                </select>
              </div>

              <div className={styles.settingsRow}>
                <div className={styles.settingGroup}>
                  <label>Aspect Ratio</label>
                  <div className={styles.aspectGrid}>
                    {STUDIO_ASPECT_RATIOS.map((ratio) => (
                      <button
                        key={ratio}
                        className={`${styles.aspectBtn} ${mockAspectRatio === ratio ? styles.active : ''}`}
                        onClick={() => setMockAspectRatio(ratio)}
                      >
                        <span className={styles.aspectShape} style={getAspectDims(ratio)} />
                        <span>{ratio}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className={styles.settingGroup}>
                  <label>Image Count</label>
                  <div className={styles.mockCountBtns}>
                    {[1, 2, 4, 8].map((n) => (
                      <button
                        key={n}
                        className={`${styles.mockCountBtn} ${mockImageCount === n ? styles.active : ''}`}
                        onClick={() => setMockImageCount(n)}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <Link href="/register" className={styles.generateBtnFull}>
                <span className={styles.generateBtnShine} />
                <span className="material-symbols-outlined">bolt</span>
                Generate Now ({mockImageCount} Credits)
              </Link>
            </div>

            {/* Preview */}
            <div className={styles.studioMain}>
              <div className={styles.outputViewport}>
                <div className={styles.outputImage}>
                  <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAybpdSztHlfv8mfh2xzYwAfVG67IrkGSl7ZF5BPGK7Svkz8_drxh0LrH9oE4oubKrJkCWfXPlyztxLKsBimoNllidqrqHmQ_E7FjAH08IJpj0F_RKbQSwRncyIOlFEKqeCPwPSVfbV5MV70FHkBhblmWHUcYMIN5t4i0AlsWWKQ-Woi5JoAuksOveZqtY9pETQvb8Sp5vp0T7nYZyqDEiGgc9fCO6xhB_u53tuavInShCSpik-1ybEFo_Q7zPGddBKokjCbxeqAQk"
                    alt="Studio output preview"
                  />
                  <div className={styles.outputOverlay}>
                    <div>
                      <div className={styles.seedInfo}>Seed: 47201855</div>
                      <div className={styles.stepsInfo}>Model: {mockModel} | Ratio: {mockAspectRatio}</div>
                    </div>
                    <div className={styles.outputActions}>
                      <Link href="/register"><span className="material-symbols-outlined">download</span></Link>
                      <Link href="/register"><span className="material-symbols-outlined">hd</span></Link>
                      <Link href="/register"><span className="material-symbols-outlined">tune</span></Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CHAPTER 5: FINAL RESULT */}
        <section className={styles.finalResult}>
          <div className={styles.finalResultHeader}>
            <h2>Ready for the real world.</h2>
            <p>
              Every generated image can be enhanced, reviewed and exported in multiple professional formats.
              Whether the project is created for advertising, product photography, architecture, social media
              or print, AetherFrame AI delivers production-ready visual assets with exceptional quality.
            </p>
          </div>

          <div className={styles.exportGrid}>
            {exportFormats.map((format, index) => (
              <div key={index} className={`${styles.exportCard} ${styles[`export${format.color.charAt(0).toUpperCase() + format.color.slice(1)}`]}`}>
                <span className="material-symbols-outlined">{format.icon}</span>
                <span>{format.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* CHAPTER 6: FINAL CTA */}
        <section className={styles.cta}>
          <div className={styles.ctaBackground}>
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBHvOhiCgd-wBnxdrdQY81_gPg0z0vbkdIKQsGxUZ4-ZXCHmsi-aXpIyxcu2Gb-FSupOs4_oaUYoxwSadb5r-qXz4YzopKjMp4tGUHIHHkLEm6a8b5O1D2pV8OpP3fXQ5PxCjqbSUdHIELsekBroMLdJDkIExeAOasdIZLNI6uu3thBPvSIoOjKrQKq1SBBUGsr2xtHUJZlyYdJDEQsSIpatsbXQLQRzhAH-m1v4CgESfP4OpBa72aUKhYgr0Hju1L3hse-DDxSLnw"
              alt="Digital artworks cloud"
            />
            <div className={styles.ctaOverlay}></div>
          </div>

          <div className={styles.ctaContent}>
            <span className="material-symbols-outlined">add_photo_alternate</span>
            <h2>
              Your next image starts with <span>one idea.</span>
            </h2>
            <p>
              Join thousands of creators, designers and studios using AetherFrame AI to transform
              imagination into professional visual content in just a few seconds.
            </p>
            <div className={styles.ctaButtons}>
              <Link href="/register" className={styles.ctaPrimary}>
                Start Creating Now
              </Link>
              <Link href="/features" className={styles.ctaSecondary}>
                Explore Features
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}