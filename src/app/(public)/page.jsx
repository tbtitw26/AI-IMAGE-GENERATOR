'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import styles from './page.module.scss';

// Імпорт компонентів
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';

export default function HomePage() {
  const [promptText, setPromptText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const heroRef = useRef(null);
  const canvasRef = useRef(null);
  const threeContainerRef = useRef(null);
  const commandBarRef = useRef(null);
  const shimmerRef = useRef(null);
  const btnRef = useRef(null);

  const prompts = [
    "A cinematic wide shot of a futuristic metropolis bathed in neon rain",
    "Luxury jewelry photography with dramatic studio lighting",
    "Editorial fashion portrait, 85mm lens, shallow depth of field",
    "Ultra realistic product render on a dark reflective surface",
    "Anime heroine standing in a cyberpunk alley at night",
    "Architectural visualization of a minimalist glass villa at sunset"
  ];

  // Typing effect
  useEffect(() => {
    let timeoutId;
    let currentText = '';
    let charIndex = 0;

    const typeWriter = () => {
      const targetText = prompts[currentPromptIndex];
      
      if (isTyping) {
        if (charIndex < targetText.length) {
          currentText += targetText.charAt(charIndex);
          setPromptText(currentText);
          charIndex++;
          
          if (charIndex % 5 === 0 && shimmerRef.current) {
            shimmerRef.current.style.transform = `translateX(${Math.random() * 100}%) skewX(-15deg)`;
          }

          timeoutId = setTimeout(typeWriter, 40 + Math.random() * 40);
        } else {
          setIsTyping(false);
          
          if (btnRef.current) {
            btnRef.current.style.animation = 'pulse-btn 1s ease-in-out';
            setTimeout(() => { 
              if (btnRef.current) btnRef.current.style.animation = ''; 
            }, 1000);
          }
          
          timeoutId = setTimeout(typeWriter, 1500);
        }
      } else {
        if (currentText.length > 0) {
          currentText = currentText.substring(0, currentText.length - 1);
          setPromptText(currentText);
          timeoutId = setTimeout(typeWriter, 15);
        } else {
          setIsTyping(true);
          charIndex = 0;
          setCurrentPromptIndex((prev) => (prev + 1) % prompts.length);
          timeoutId = setTimeout(typeWriter, 300);
        }
      }
    };

    timeoutId = setTimeout(typeWriter, 500);

    return () => clearTimeout(timeoutId);
  }, [currentPromptIndex, isTyping]);

  // WebGL Background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl');
    if (!gl) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    window.addEventListener('resize', resize);
    resize();

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = canvas.height - e.clientY;
    });

    const vsSource = `
      attribute vec4 a_position;
      varying vec2 v_texCoord;
      void main() {
        gl_Position = a_position;
        v_texCoord = a_position.xy * 0.5 + 0.5;
      }
    `;

    const fsSource = `
      precision highp float;
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
        
        vec3 base0 = vec3(0.0157, 0.0196, 0.0392);
        vec3 base1 = vec3(0.0275, 0.0431, 0.0784);
        vec3 base2 = vec3(0.0392, 0.0627, 0.1255);
        
        vec3 blue = vec3(0.357, 0.549, 1.0);
        vec3 violet = vec3(0.545, 0.361, 0.965);
        vec3 cyan = vec3(0.184, 0.851, 0.957);
        vec3 magenta = vec3(1.0, 0.3, 0.7);
        
        vec3 color = mix(base0, base1, uv.y + sin(t * 0.2) * 0.1);
        color = mix(color, base2, length(p) * 0.5);
        
        float fog1 = smoothstep(0.8, 0.0, length(p - vec2(-0.6, 0.6) + sin(t * 0.3) * 0.1));
        float fog2 = smoothstep(0.7, 0.0, length(p - vec2(0.6, 0.2) + cos(t * 0.2) * 0.15));
        float fog3 = smoothstep(0.9, 0.0, length(p - vec2(-0.4, -0.6)));
        float fog4 = smoothstep(0.6, 0.0, length(p - vec2(0.3, -0.2)));
        
        color += blue * fog1 * 0.12;
        color += violet * fog2 * 0.1;
        color += cyan * fog3 * 0.08;
        color += magenta * fog4 * 0.05;
        
        float beam = smoothstep(0.02, 0.0, abs(p.x - p.y * 1.5 + sin(t * 0.5) * 2.0));
        color += cyan * beam * 0.05;
        
        float mouseGlow = 0.05 / (length(p - m) + 0.5);
        color += blue * mouseGlow * (sin(u_time * 2.0) * 0.1 + 0.9);
        
        vec2 gridUV = uv * 40.0;
        float dist = length(p - m);
        gridUV += p * (0.05 / (dist + 0.2));
        float grid = (step(0.98, fract(gridUV.x)) + step(0.98, fract(gridUV.y))) * 0.05;
        color += blue * grid * smoothstep(0.5, 0.0, dist);
        
        float n = noise(uv + u_time);
        color += (n - 0.5) * 0.015;
        
        gl_FragColor = vec4(color, 1.0);
      }
    `;

    const compileShader = (type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShader = compileShader(gl.VERTEX_SHADER, vsSource);
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fsSource);

    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
      return;
    }

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = [
      -1.0, -1.0,
       1.0, -1.0,
      -1.0,  1.0,
      -1.0,  1.0,
       1.0, -1.0,
       1.0,  1.0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const timeLocation = gl.getUniformLocation(program, "u_time");
    const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    const mouseLocation = gl.getUniformLocation(program, "u_mouse");

    let startTime = performance.now();
    const render = (now) => {
      gl.useProgram(program);
      gl.uniform1f(timeLocation, (now - startTime) * 0.001);
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.uniform2f(mouseLocation, mouseX, mouseY);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      requestAnimationFrame(render);
    };
    requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
    };
  }, []);

  // Three.js 3D Lens
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
      camera.position.z = 8;

      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(window.devicePixelRatio);
      container.appendChild(renderer.domElement);

      const primaryColor = new THREE.Color('#b2c5ff');
      const secondaryColor = new THREE.Color('#d0bcff');
      const tertiaryColor = new THREE.Color('#2fd9f4');

      const lensGroup = new THREE.Group();
      scene.add(lensGroup);

      const createRing = (radius, tube, color, opacity, speed) => {
        const geom = new THREE.TorusGeometry(radius, tube, 16, 100);
        const mat = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: opacity });
        const ring = new THREE.Mesh(geom, mat);
        ring.userData.speed = speed;
        return ring;
      };

      const ring1 = createRing(3.0, 0.02, primaryColor, 0.4, 0.005);
      const ring2 = createRing(3.2, 0.01, tertiaryColor, 0.3, -0.008);
      const ring3 = createRing(2.8, 0.005, secondaryColor, 0.2, 0.012);
      
      ring1.rotation.x = Math.PI / 2;
      ring2.rotation.x = Math.PI / 3;
      ring3.rotation.y = Math.PI / 4;

      lensGroup.add(ring1, ring2, ring3);

      const particleCount = 100;
      const pGeom = new THREE.BufferGeometry();
      const pPos = new Float32Array(particleCount * 3);
      for(let i = 0; i < particleCount; i++) {
        pPos[i*3] = (Math.random() - 0.5) * 15;
        pPos[i*3+1] = (Math.random() - 0.5) * 15;
        pPos[i*3+2] = (Math.random() - 0.5) * 10;
      }
      pGeom.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
      const pMat = new THREE.PointsMaterial({ color: '#fff', size: 0.05, transparent: true, opacity: 0.4 });
      const particles = new THREE.Points(pGeom, pMat);
      scene.add(particles);

      scene.add(new THREE.AmbientLight(0xffffff, 1.5));

      let time = 0;
      const animate = () => {
        requestAnimationFrame(animate);
        time += 0.01;

        lensGroup.children.forEach(ring => {
          ring.rotation.z += ring.userData.speed;
        });

        lensGroup.position.y = Math.sin(time * 0.5) * 0.1;
        particles.rotation.y += 0.001;

        renderer.render(scene, camera);
      };

      const handleMouseMove = (e) => {
        const x = (e.clientX / window.innerWidth) - 0.5;
        const y = (e.clientY / window.innerHeight) - 0.5;
        lensGroup.rotation.y = x * 0.2;
        lensGroup.rotation.x = y * 0.2;
      };

      window.addEventListener('mousemove', handleMouseMove);

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
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('resize', handleResize);
        renderer.dispose();
      };
    };

    initThree();

  }, []);

  // Parallax effect
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    const cards = hero.querySelectorAll(`.${styles.parallaxCard}`);
    if (!cards.length) return;

    const handleMouseMove = (e) => {
      const x = (window.innerWidth / 2 - e.pageX) / 60;
      const y = (window.innerHeight / 2 - e.pageY) / 60;

      cards.forEach((card, index) => {
        const speed = (index % 5 + 1) * 0.5;
        const transform = card.style.transform || '';
        const match = transform.match(/rotate\(([^)]+)\)/);
        const rotation = match ? match[0] : 'rotate(0deg)';
        card.style.transform = `translate(${x * speed}px, ${y * speed}px) ${rotation}`;
      });
    };

    const handleMouseLeave = () => {
      cards.forEach((card) => {
        const transform = card.style.transform || '';
        const match = transform.match(/rotate\(([^)]+)\)/);
        const rotation = match ? match[0] : 'rotate(0deg)';
        card.style.transform = rotation;
      });
    };

    hero.addEventListener('mousemove', handleMouseMove);
    hero.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      hero.removeEventListener('mousemove', handleMouseMove);
      hero.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  // Command bar mouse glow
  useEffect(() => {
    const commandBar = commandBarRef.current;
    if (!commandBar) return;

    const handleMouseMove = (e) => {
      const rect = commandBar.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      commandBar.style.setProperty('--mouse-x', `${x}px`);
      commandBar.style.setProperty('--mouse-y', `${y}px`);
    };

    commandBar.addEventListener('mousemove', handleMouseMove);
    commandBar.style.setProperty('--mouse-x', '50%');
    commandBar.style.setProperty('--mouse-y', '50%');

    return () => {
      commandBar.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const images = [
    { src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDqZfKX0aP8kPE_MtGXRQPec5vbcVhQqDVqeJoFPwkhcRvyZwf18Zc_k-z7aUFaxPeZV6ZaWUiX5l5okR6NtAKLwYkZuOkWfna__HvBivBSXRFai9mgVeh7vw-O9EPHzTXj22ILtTI0JnqRRayfWPKbqjLi6o2rP5A0Jy9L1RthcW7gIjZLnJYFJXBkOXgkrJUSGWxedRa-5TFIiCg4tuuhDOL8wdB7YTqTsRVFaVWoHcxrA4TjbqwkBQ', alt: 'Cyberpunk City', className: styles.img1 },
    { src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCuOadBGN1vPQiW3DRRu1JwDJe7A-1mVI5br9NnKgAeKFYnWVLkXxzwLkcOOj0j85tuMOEpjqhz5LJ2eFN8N1HV68D2NquM5VacdrMsazDTqMJCWUBPZo8tEytjC5-uLLibho2IA6NDKA-RxzgBX-vp5MUA3lTW06D6T-FqsFaY8ygKjXWkIUe6U6FC_xH2PDOuQehPwh3W6IWm5eYRfDlmQsldgtBnrGhqZIAW47ctep2WquGSHEWcsA', alt: 'Luxury Watch', className: styles.img2 },
    { src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBs0LPQKrtWAIPN9_UNrs2gzS66AGYPS0Nc2Pm0cRUKlLnvlPIoET71J_Ftf1s4BDXFn7yU3kpMRbxpT8-Y7kKvUDWKEiQluXqkNIcaQAaSwEkWGJ5WcXxk_eQuKwM555qCueX741qIxGJQrs6BX0zOoX34Odkht2wnuPDiNXfGgOz_3sl1qTaiEobcYkYisPA1dQBwQhU-XfSH3LtO00Z7kohouWbyOOHU2Xo-3-H2IstYI2g4CvmYFg', alt: 'Fashion Portrait', className: styles.img3 },
    { src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC7MxJEOwJWOFK15iYS5pw84XJWw10CNwPZwar8YPwtdXFFpBePPteOSqbuxVu79PLPhGWI9DeN2RPBtMREU0mDoZ5Kn2UdLVR45awXOmovpHnpjDDlHlnq4oiJOwNSWikVClaLYRRLDYBnYAYqHYkZEbnhHHISPeiV3Kxwm9duhTe7ri-Zg0o2kcljhAhYh2wCpR5f-B0Ayx2v-Cs3WDBeyTohLiFOgn7qgPgDZ0Qjnk84BcuNyq68LA', alt: 'Fantasy Landscape', className: styles.img4 },
    { src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDDkI7zR3yHMGKFU_9a5FUQ31qkuRwGKa3zhabkSchzO0blyrUtsswvxTg6oxRJ8xStXmo4M9fUU1YT3LOds2ePKfc6LWSik1k5sjcsP3H-kG3jxRF28vhh8Ib6-gdlc4WnBpvGik2xPHlRUmT63n5TC2NVJKP2pgnMNT6bInnrdd0qn-LYfTpW1wZ-80Nwa0ZW2R57PYBuPZei7PyicFgk_69Uin6pvR6e4UdY_qk4ysLM6R47p4swUA', alt: 'Anime Heroine', className: styles.img5 },
    { src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCuOadBGN1vPQiW3DRRu1JwDJe7A-1mVI5br9NnKgAeKFYnWVLkXxzwLkcOOj0j85tuMOEpjqhz5LJ2eFN8N1HV68D2NquM5VacdrMsazDTqMJCWUBPZo8tEytjC5-uLLibho2IA6NDKA-RxzgBX-vp5MUA3lTW06D6T-FqsFaY8ygKjXWkIUe6U6FC_xH2PDOuQehPwh3W6IWm5eYRfDlmQsldgtBnrGhqZIAW47ctep2WquGSHEWcsA', alt: 'Jewelry', className: styles.img6 },
    { src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCU3SjI03MwrXllGICxRP6o5NKooU9g4pPfc4TnnT23SExATt6BSbWOppMnT9a7wZtW0pEaKNMSr8GNdfdKcYJynh3zL22wuXEBQInFK8UhEAL74xZ_5xeAKeIexe1QdMSsXLWMp6Q4jpNeKZ712mRx8ycyZqS1OUL8PTOV-FGYVAbdKHqYeCrcHVtEqi1_5L11cTmcq_ZWeTgylsJu0u_trYLSMxbxng7_pqfrP-1fubvVn80wMcDyWQ', alt: 'Product', className: styles.img7 },
    { src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDbTKECaSSwBEhDSCGOpLU-c6kY-zpkGbaOHn81_l2dqY8ttH4pXmGkr8rjWx8Atk1ojyxff4THBBx5Hs25oDskYsRWiVTVpqs1SflZ3oXvg2RdyUZ2wX2n6HNsDyiK3kxSBMStyQAfSlLfvUfqKFCKrTzwm4iWHlnP5F06rUinKmhlFobJkuoMJTfK9CEA0x8JPe8eamfHNqvBUBMdxHzLmpgmT31yAX2xPPf4xISqyJA6S8Ku_WX6DA', alt: 'Architecture', className: styles.img8 },
    { src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBFmOmcyVjd0fzev9R2IH5HL_6WZW78YrMFcPx1QA4c3NGufEPfs09IOl0LlDlNhC_eIVkur7rfxLCBOT05NsdtVPjt2USLFc4EQ64G_ZmeP1N-4U-3P-MAD1gm7QqnVtNT91heiPuNRoMsyOuvqd1oewmHidZJ32zPh5-B05-Ffv9sGhJchPyeJ2-xYXsaw-qoSvoaJRGjmfFujpvLYDpkJJArR5aOndsukmcCk-38GC5GtVs4I7LR6w', alt: 'Automotive', className: styles.img9 },
  ];

  return (
    <>
      <Header />
      
      <main className={styles.main}>
        {/* WebGL Background */}
        <canvas ref={canvasRef} className={styles.bgCanvas} />

        {/* Announcement Bar */}
        <div className={styles.announcement}>
          <span className={styles.pulseDot}></span>
          <span>AetherEngine v4.2 is now live.</span>
          <Link href="/changelog" className={styles.announcementLink}>
            Read the changelog <span className="material-symbols-outlined">arrow_forward</span>
          </Link>
          <span className={styles.uptime}>
            <span className={styles.uptimeDot}></span> 99.99% Uptime
          </span>
        </div>

        {/* Hero Section */}
        <section ref={heroRef} className={styles.hero} id="hero-section">
          {/* 3D Lens Container */}
          <div ref={threeContainerRef} className={styles.threeContainer}></div>
          
          {/* Constellation Cards */}
          <div className={styles.constellation}>
            {images.map((img, index) => (
              <div
                key={index}
                className={`${styles.constellationCard} ${img.className} ${styles.parallaxCard}`}
                style={{ zIndex: 20 - index }}
              >
                <img
                  src={img.src}
                  alt={img.alt}
                  className={styles.constellationImage}
                />
              </div>
            ))}
          </div>

          {/* Hero Content */}
          <div className={styles.heroContent}>
            <div className={styles.badge}>
              <span className={styles.badgeDot}></span>
              <span>NOW GENERATING IN 4K</span>
            </div>

            <h1 className={styles.heroTitle}>
              Turn any idea into<br />
              <span className={styles.heroTitleGradient}>stunning images</span> in seconds
            </h1>

            <p className={styles.heroDescription}>
              Experience the pinnacle of AI image generation. AetherFrame brings unprecedented 
              clarity, detail, and artistic control to transform your prompts into production-ready 
              art, renders, scenes, and visuals instantly.
            </p>

            <div className={styles.heroActions}>
              <Link href="/register" className={styles.primaryBtn}>
                Start Creating
              </Link>
              <Link href="/gallery" className={styles.secondaryBtn}>
                View Gallery
              </Link>
            </div>

            <div className={styles.trustItems}>
              <div className={styles.trustItem}>
                <span className="material-symbols-outlined">water_drop</span>
                No watermark
              </div>
              <div className={styles.trustItem}>
                <span className="material-symbols-outlined">bolt</span>
                Fast generation
              </div>
              <div className={styles.trustItem}>
                <span className="material-symbols-outlined">lock</span>
                Secure payments
              </div>
            </div>
          </div>

          {/* Command Bar */}
          <div ref={commandBarRef} className={styles.commandBar} id="command-bar">
            <div className={styles.commandBarGlow}></div>
            
            <div className={styles.commandTags}>
              <span className={styles.tag}>Realistic</span>
              <span className={styles.tag}>Anime</span>
              <span className={styles.tag}>3D Render</span>
              <span className={styles.tag}>Fashion</span>
              <span className={styles.tag}>Product</span>
              <span className={styles.tag}>Cinematic</span>
            </div>

            <div className={styles.commandStatus}>
              <span className={styles.statusChip}>
                <span className="material-symbols-outlined">high_quality</span>
                8K Ultra
              </span>
              <span className={styles.statusChip}>
                <span className={styles.statusDot}></span>
                Generating... 92%
              </span>
            </div>

            <div className={styles.commandInput}>
              <span className={styles.commandIcon}>✨</span>
              <div className={styles.commandPrompt}>
                <span className={styles.commandPrefix}>/imagine</span>
                <span className={styles.commandText}>
                  {promptText}
                  <span className={styles.cursor}></span>
                </span>
              </div>
              <button ref={btnRef} className={styles.generateBtn} id="generate-btn">
                <span>Generate</span>
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          </div>

          {/* Transition Gradient */}
          <div className={styles.transitionGradient}></div>
        </section>

        {/* Ecosystem Section */}
        <section className={styles.ecosystem}>
          <h2 className={styles.sectionTitle}>Powering the World's Leading Studios</h2>
          
          <div className={styles.studioIcons}>
            {['movie_creation', 'architecture', 'diamond', 'domain', 'memory', 'design_services', 
              'perm_media', 'sports_esports', 'storefront', 'directions_car', 'checkroom', 'apartment'].map((icon, i) => (
              <span key={i} className={`material-symbols-outlined ${styles.studioIcon}`}>
                {icon}
              </span>
            ))}
          </div>

          <div className={styles.stats}>
            <div className={styles.stat}>
              <div className={styles.statNumber}>1.2B+</div>
              <div className={styles.statLabel}>Images Generated</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statNumber}>99.99%</div>
              <div className={styles.statLabel}>Uptime SLA</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statNumber}>&lt;0.5s</div>
              <div className={styles.statLabel}>Avg Latency</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statNumber}>SOC2</div>
              <div className={styles.statLabel}>Certified</div>
            </div>
          </div>
        </section>

        {/* Studio UI Section */}
        <section className={styles.studioUI}>
          <div className={styles.studioHeader}>
            <h2 className={styles.studioTitle}>Precision Control Console</h2>
            <p className={styles.studioDescription}>Granular control over every parameter. Designed for professional workflows where precision is paramount.</p>
          </div>
          
          <div className={styles.studioPanel}>
            {/* Sidebar */}
            <div className={styles.studioSidebar}>
              <div className={styles.sidebarHeader}>
                <h3>Generation Settings</h3>
              </div>
              <div className={styles.sidebarContent}>
                <div className={styles.formGroup}>
                  <label>Model</label>
                  <select className={styles.select}>
                    <option>AetherEngine v4.2 Ultra</option>
                    <option>AetherEngine v4.2 Cinema</option>
                    <option>AetherEngine v3.0 Base</option>
                  </select>
                </div>
                
                <div className={styles.sliderGroup}>
                  <div>
                    <div className={styles.sliderHeader}>
                      <span>Style Weight</span>
                      <span>0.85</span>
                    </div>
                    <input type="range" defaultValue="85" className={styles.rangeSlider} />
                  </div>
                  <div>
                    <div className={styles.sliderHeader}>
                      <span>Structural Integrity</span>
                      <span>0.92</span>
                    </div>
                    <input type="range" defaultValue="92" className={styles.rangeSlider} />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Aspect Ratio</label>
                  <div className={styles.aspectGrid}>
                    <button className={styles.aspectBtn}>
                      <div className={styles.aspectBox1x1}></div>
                      <span>1:1</span>
                    </button>
                    <button className={`${styles.aspectBtn} ${styles.active}`}>
                      <div className={styles.aspectBox16x9}></div>
                      <span>16:9</span>
                    </button>
                    <button className={styles.aspectBtn}>
                      <div className={styles.aspectBox9x16}></div>
                      <span>9:16</span>
                    </button>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Active Modifiers</label>
                  <div className={styles.modifiers}>
                    <span className={styles.modifier}>
                      35mm Lens <button className={styles.modifierClose}>✕</button>
                    </span>
                    <span className={styles.modifier}>
                      Cinematic Lighting <button className={styles.modifierClose}>✕</button>
                    </span>
                    <span className={`${styles.modifier} ${styles.addModifier}`}>
                      <span className="material-symbols-outlined">add</span> Add
                    </span>
                  </div>
                </div>
              </div>
              <div className={styles.sidebarFooter}>
                <button className={styles.generateBtnFull}>Generate (15 credits)</button>
              </div>
            </div>

            {/* Main Area */}
            <div className={styles.studioMain}>
              <div className={styles.promptArea}>
                <div>
                  <label>Prompt</label>
                  <textarea className={styles.promptInput} rows="3" defaultValue="A cinematic wide shot of a sleek futuristic sports car driving through a neon-lit cyberpunk city in the rain, ultra-realistic 8k resolution, cinematic lighting, reflections on wet asphalt, hyper-detailed, deep charcoal and electric blue color palette." />
                </div>
                <div>
                  <label>Negative Prompt</label>
                  <textarea className={styles.negativePrompt} rows="1" defaultValue="blurry, low quality, distorted, watermark, text, signature" />
                </div>
              </div>

              <div className={styles.outputViewport}>
                <div className={styles.outputImage}>
                  <img 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBQ6cNrW7r0D1KyzmPdKYJngTw8ziiYYjoOlsOI7QD_KkDC999N8iFzPwp9DEHB-7AtkuH3Pz7ymBYQaCJ2vu2hqtihhFw7MCmjY6-GokrCpmv3kTtShtRdyPE56oL9MQ3WIhRllMJVsuUCf-Pjb8csOwlP7JEsxxrNbxYn-rTqrj3dZU8yKKnY3Ng9zalvnt7SKpvRSE0va4RCYfcRXl6rx-fOkh4Wk3UgavEm8VygibtS5imYDryrEw" 
                    alt="Generated Output" 
                  />
                  <div className={styles.outputOverlay}>
                    <div>
                      <div className={styles.seedInfo}>Seed: 84920104</div>
                      <div className={styles.stepsInfo}>Steps: 40 | Sampler: DPM++ 2M Karras | CFG: 7.5</div>
                    </div>
                    <div className={styles.outputActions}>
                      <button><span className="material-symbols-outlined">download</span></button>
                      <button><span className="material-symbols-outlined">hd</span></button>
                      <button><span className="material-symbols-outlined">tune</span></button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Model Comparison */}
        <section className={styles.modelComparison}>
          <div className={styles.modelHeader}>
            <h2 className={styles.modelTitle}>Purpose-Built Models</h2>
            <p className={styles.modelDescription}>Choose the right engine for your specific production needs.</p>
          </div>
          
          <div className={styles.modelTable}>
            <table>
              <thead>
                <tr>
                  <th></th>
                  <th>
                    <div className={styles.modelName}>Ultra</div>
                    <div className={styles.modelSub}>Maximum fidelity, complex scenes.</div>
                  </th>
                  <th>
                    <div className={styles.modelName}>Cinema</div>
                    <div className={styles.modelSub}>Optimized for motion and continuity.</div>
                  </th>
                  <th>
                    <div className={styles.modelName}>Fast</div>
                    <div className={styles.modelSub}>Rapid iteration, lower cost.</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Base Resolution</td>
                  <td>2048x2048</td>
                  <td>1920x1080</td>
                  <td>1024x1024</td>
                </tr>
                <tr>
                  <td>Generation Time</td>
                  <td>~4.5s</td>
                  <td>~3.2s</td>
                  <td className={styles.fastTime}>&lt;0.8s</td>
                </tr>
                <tr>
                  <td>Prompt Adherence</td>
                  <td className={styles.highest}>Highest</td>
                  <td>High</td>
                  <td>Standard</td>
                </tr>
                <tr>
                  <td>Cost per Megapixel</td>
                  <td>$0.004</td>
                  <td>$0.003</td>
                  <td>$0.001</td>
                </tr>
                <tr>
                  <td>ControlNet Support</td>
                  <td className={styles.check}><span className="material-symbols-outlined">check_circle</span></td>
                  <td className={styles.check}><span className="material-symbols-outlined">check_circle</span></td>
                  <td className={styles.cancel}><span className="material-symbols-outlined">cancel</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* White-Glove AI Studio */}
        <section className={styles.whiteGlove}>
          <div className={styles.whiteGloveHeader}>
            <h2>White-Glove AI Studio</h2>
            <p>Bespoke intelligence for elite creative workflows. We elevate your vision beyond the prompt.</p>
          </div>
          
          <div className={styles.whiteGloveGrid}>
            <div className={styles.whiteGloveMain}>
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB8poQwyCUOoCBWHWcQHb-t6X0sHGwYW0V0sh79Z9BVwQ2sSr0HJ49VfKXJe6GZu_RvRYPnh3Rx58e_mTN_I1TJ6KWpRyziU6xZa_bbnEojXKhAVcZ73VCQl2jHfmk6o6-9CZrLqp4CeQqT3ch2MJTYqZAG89n5kGBeE-bmfCrCuoWWXEM_dxew8I92pGP4WXyiemaMzytfySKdapwtFvB176ndytuiZMJeCZu9TPY7drSMS7pkMxGZcQ" 
                alt="Editorial Fashion" 
              />
              <div className={styles.whiteGloveOverlay}>
                <span className={styles.exclusiveBadge}>Exclusive</span>
                <h3>White-Glove Production</h3>
                <p>End-to-end concierge service. Our elite engineers craft the perfect prompts, tune models to your brand, and deliver production-ready assets.</p>
                <Link href="#" className={styles.discoverLink}>
                  Discover Production <span className="material-symbols-outlined">arrow_forward</span>
                </Link>
              </div>
            </div>
            
            <div className={styles.whiteGloveSide}>
              <div className={styles.whiteGloveCard}>
                <span className="material-symbols-outlined">workspace_premium</span>
                <h4>VIP Priority Rendering</h4>
                <p>Jump the queue. Dedicated GPU clusters ensure your campaigns render instantly, even during peak global load.</p>
              </div>
              <div className={styles.whiteGloveCard}>
                <span className="material-symbols-outlined">model_training</span>
                <h4>Enterprise Brand Training</h4>
                <p>We fine-tune private models exclusively on your brand's IP, ensuring absolute aesthetic consistency.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className={styles.socialProof}>
          <div className={styles.socialProofContainer}>
            <h2>Used by luxury brands, film studios,<br/>and global creative teams</h2>
            
            <div className={styles.socialProofGrid}>
              <div className={styles.socialProofMain}>
                <img 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCuOadBGN1vPQiW3DRRu1JwDJe7A-1mVI5br9NnKgAeKFYnWVLkXxzwLkcOOj0j85tuMOEpjqhz5LJ2eFN8N1HV68D2NquM5VacdrMsazDTqMJCWUBPZo8tEytjC5-uLLibho2IA6NDKA-RxzgBX-vp5MUA3lTW06D6T-FqsFaY8ygKjXWkIUe6U6FC_xH2PDOuQehPwh3W6IWm5eYRfDlmQsldgtBnrGhqZIAW47ctep2WquGSHEWcsA" 
                  alt="High-end Mockup" 
                />
                <div className={styles.socialProofOverlay}>
                  <div className={styles.campaignLabel}>CAMPAIGN: NEO-HORIZON</div>
                  <div>Generated entirely in AetherFrame</div>
                </div>
              </div>
              
              <div className={styles.socialProofStats}>
                <div>
                  <div className={styles.statLarge}>3.2M</div>
                  <div>Commercial Assets Delivered</div>
                </div>
                <div>
                  <div className={styles.statLarge}>870+</div>
                  <div>Global Agency Projects</div>
                </div>
                <div>
                  <div className={styles.statLarge}>Zero</div>
                  <div>Copyright Infringements</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Wallet & Pricing */}
        <section className={styles.walletPricing}>
          <div className={styles.walletHeader}>
            <h2>Luxury AI Services &amp;<br/>Wallet Experience</h2>
            <p>Seamless institutional-grade treasury management for high-ticket creative productions.</p>
          </div>
          
          <div className={styles.walletGrid}>
            <div className={styles.walletCard}>
              <div className={styles.walletBalance}>
                <div className={styles.walletHeaderRow}>
                  <span>Available Treasury</span>
                  <span className="material-symbols-outlined">account_balance</span>
                </div>
                <div className={styles.balanceAmount}>
                  $12,450<span className={styles.balanceCents}>.00</span>
                </div>
                <div className={styles.currencyButtons}>
                  <button className={styles.activeCurrency}>USD</button>
                  <button>EUR</button>
                  <button>GBP</button>
                </div>
                <button className={styles.addFundsBtn}>
                  <span className="material-symbols-outlined">add</span> Add Production Funds
                </button>
              </div>
              
              <div className={styles.invoicePreview}>
                <div className={styles.invoiceHeader}>
                  <span>Recent Invoices</span>
                  <span>AUG 2024</span>
                </div>
                <div className={styles.invoiceList}>
                  <div><span>Cinematic Campaign</span><span>$499.00</span></div>
                  <div><span>VIP Session</span><span>$999.00</span></div>
                  <div><span>Product Suite</span><span>$299.00</span></div>
                </div>
              </div>
            </div>
            
            <div className={styles.pricingCards}>
              <div className={styles.pricingCard}>
                <div>
                  <h3>Cinematic Campaign</h3>
                  <span>$499</span>
                </div>
                <p>Full suite of ultra-high resolution assets optimized for print and billboard campaigns.</p>
                <button>Book Service</button>
              </div>
              <div className={styles.pricingCard}>
                <div>
                  <h3>Luxury Product Suite</h3>
                  <span>$299</span>
                </div>
                <p>Studio-grade lighting simulations for high-end jewelry, watches, and apparel.</p>
                <button>Book Service</button>
              </div>
              <div className={styles.pricingCard}>
                <div>
                  <h3>Brand Identity System</h3>
                  <span>$799</span>
                </div>
                <p>Comprehensive visual language generation including custom textures, palettes, and structural forms.</p>
                <button>Book Service</button>
              </div>
              <div className={`${styles.pricingCard} ${styles.featured}`}>
                <span className={styles.directorBadge}>Director's Tier</span>
                <div>
                  <h3>VIP Creative Session</h3>
                  <span>$999</span>
                </div>
                <p>1-on-1 session with our elite prompt engineers to realize your most ambitious cinematic concepts in real-time.</p>
                <button>Request Session</button>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className={styles.finalCta}>
          <div className={styles.finalCtaContent}>
            <div className={styles.finalCtaBadge}>VIP Tier from 999 USD</div>
            <h2>Enter the new era of<br/>visual intelligence.</h2>
            <p>Exclusive access for high-end creative studios.</p>
            <Link href="/register" className={styles.finalCtaBtn}>
              Apply for Access
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}