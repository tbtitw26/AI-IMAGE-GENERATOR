'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.scss';

export default function EmailConfirmedPage() {
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
    
    float t = u_time * 0.04;
    
    vec3 bg = vec3(0.0157, 0.0196, 0.0392);
    vec3 deep = vec3(0.0275, 0.0431, 0.0784);
    vec3 surface = vec3(0.0392, 0.0627, 0.1255);
    
    vec3 accent1 = vec3(0.357, 0.549, 1.0);
    vec3 accent2 = vec3(0.545, 0.361, 0.965);
    
    vec3 color = mix(bg, deep, uv.y + sin(t) * 0.1);
    
    float stream = pow(1.0 - abs(p.y - sin(p.x * 1.2 + t) * 0.15), 30.0);
    color += accent1 * stream * 0.1;
    
    float dMouse = length(p - m);
    color += accent2 * (0.06 / (dMouse + 0.75)) * (sin(u_time * 1.5) * 0.2 + 0.8);
    
    float beam = pow(1.0 - abs(p.x - sin(t * 0.25) * 0.7), 40.0) * (sin(t + uv.y * 2.0) * 0.5 + 0.5);
    color += accent1 * beam * 0.06;
    
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

  return (
    <div className={styles.emailConfirmed}>
      {/* Background Shader */}
      <canvas ref={canvasRef} className={styles.bgCanvas} />

      {/* Main Content */}
      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.heroGrid}>
            {/* LEFT: Floating Cards */}
            <div className={styles.visualScene}>
              <div className={styles.sceneContainer}>
                {/* Base Image */}
                <div className={styles.baseImage}>
                  <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCQSDaTwkMlnJJdPRz4A9dWtzfExnXOFNRzTfErNPvHvJ6mElJO8xxV3PIQVNkpY_9g8Hh7FIb4GMWcZ1xFRm7wXDf0ExCelFRE6jvcKbZ6m-s9MVqDH5zh3RGNv2yJ9Kw2itM6RRIdNMdHnoa_g8MIZjLKZ0Dv10rONMGfO_7RGiXtb7eqZnAkopHTRnxZcu6kIP2pYTLitCitktTgUz5XGsKM-I9B88Uf29VlWcA29_Gqzvw-DMMEo__SihY1zPA3RDNRFY1WUDk"
                    alt="Digital envelope"
                  />
                </div>

                {/* Floating Badge */}
                <div className={`${styles.floatingBadge} ${styles.bounce1}`}>
                  <div className={styles.badgeIcon}>
                    <span className="material-symbols-outlined">verified</span>
                  </div>
                  <div>
                    <p className={styles.badgeLabel}>Identity</p>
                    <p className={styles.badgeValue}>Verified</p>
                  </div>
                </div>

                {/* Floating Feature List */}
                <div className={`${styles.floatingFeatures} ${styles.bounce2}`}>
                  <p className={styles.featuresTitle}>Unlocked Access</p>
                  <div className={styles.featureItem}>
                    <span className="material-symbols-outlined">check_circle</span>
                    <span>Pro Dashboard</span>
                  </div>
                  <div className={styles.featureItem}>
                    <span className="material-symbols-outlined">check_circle</span>
                    <span>AI Generation Engine</span>
                  </div>
                  <div className={styles.featureItem}>
                    <span className="material-symbols-outlined">check_circle</span>
                    <span>Priority Support</span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT: Success Content */}
            <div className={styles.successContent}>
              <div className={styles.successCard}>
                <div className={styles.successGlow}></div>

                <div className={styles.successIcon}>
                  <span className="material-symbols-outlined">mark_email_read</span>
                  <div className={styles.successPing}></div>
                </div>

                <h1 className={styles.successTitle}>Email Verified.</h1>
                <p className={styles.successDescription}>
                  Your dexericai account is fully activated. You now have unrestricted access to
                  our suite of cinematic creation tools.
                </p>

                <div className={styles.successActions}>
                  <Link href="/dashboard" className={styles.primaryBtn}>
                    Go to Dashboard
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </Link>
                  <Link href="/dashboard/generate" className={styles.secondaryBtn}>
                    <span className="material-symbols-outlined">rocket_launch</span>
                    Start Creating
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}