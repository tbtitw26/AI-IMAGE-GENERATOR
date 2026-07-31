'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import styles from './page.module.scss';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
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
    vec3 surface = vec3(0.0392, 0.0627, 0.1255);
    
    vec3 accent1 = vec3(0.357, 0.549, 1.0);
    vec3 accent2 = vec3(0.545, 0.361, 0.965);
    
    vec3 color = mix(bg, deep, uv.y + sin(t * 0.5) * 0.1);
    
    float stream = pow(1.0 - abs(p.y - sin(p.x * 1.5 + t) * 0.25), 30.0);
    color += accent1 * stream * 0.08;
    
    float dMouse = length(p - m);
    color += accent2 * (0.05 / (dMouse + 0.65)) * (sin(u_time * 1.2) * 0.2 + 0.8);
    
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

  // Magnetic button effect
  useEffect(() => {
    document.querySelectorAll(`.${styles.magneticBtn}`).forEach((btn) => {
      const handleMouseMove = (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${x * 0.1}px, ${y * 0.1}px) scale(1.05)`;
      };

      const handleMouseLeave = () => {
        btn.style.transform = 'translate(0px, 0px) scale(1)';
      };

      btn.addEventListener('mousemove', handleMouseMove);
      btn.addEventListener('mouseleave', handleMouseLeave);

      return () => {
        btn.removeEventListener('mousemove', handleMouseMove);
        btn.removeEventListener('mouseleave', handleMouseLeave);
      };
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const text = await response.text();
      const data = text ? JSON.parse(text) : {};
      if (!response.ok) {
        throw new Error(data.message || 'Unable to send recovery email.');
      }

      setIsSubmitted(true);
    } catch (error) {
      setError(error.message || 'Unable to send recovery email.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.forgotPassword}>
      {/* Background Shader */}
      <canvas ref={canvasRef} className={styles.bgCanvas} />

      {/* Background Glow */}
      <div className={styles.bgGlowTop}></div>
      <div className={styles.bgGlowBottom}></div>

      <Header />

      {/* Main Content */}
      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.heroGrid}>
            {/* Left: Visual Scene */}
            <div className={styles.visualScene}>
              {/* Floating Card 1: Security Shield */}
              <div className={`${styles.floatingCard} ${styles.cardShield} ${styles.floatAnimation}`}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardIcon}>
                    <span className="material-symbols-outlined">shield</span>
                  </div>
                  <div>
                    <div className={styles.cardTitle}>Secure Protocol</div>
                    <div className={styles.cardSubtitle}>Active</div>
                  </div>
                </div>
                <div className={styles.cardProgress}>
                  <div className={styles.cardProgressFill}></div>
                </div>
              </div>

              {/* Floating Card 2: Email Preview */}
              <div className={`${styles.floatingCard} ${styles.cardEmail} ${styles.floatAnimationDelay1}`}>
                <div className={styles.emailHeader}>
                  <span>Incoming Mail</span>
                  <span className="material-symbols-outlined">mail</span>
                </div>
                <div className={styles.emailSubject}>Password Reset Request</div>
                <div className={styles.emailBody}>Click the link below to securely reset your credentials.</div>
                <button className={styles.emailBtn} disabled>
                  Reset Password
                  <span className="material-symbols-outlined">open_in_new</span>
                </button>
              </div>

              {/* Floating Card 3: Verified Badge */}
              <div className={`${styles.floatingCard} ${styles.cardVerified} ${styles.floatAnimationDelay2}`}>
                <div className={styles.verifiedIcon}>
                  <span className="material-symbols-outlined">verified</span>
                </div>
                <div className={styles.verifiedTitle}>End-to-End</div>
                <div className={styles.verifiedSub}>Encrypted</div>
              </div>
            </div>

            {/* Right: Recovery Console */}
            <div className={styles.recoveryConsole}>
              <div className={styles.formCard}>
                <div className={styles.formContent}>
                  <div className={styles.formIcon}>
                    <span className="material-symbols-outlined">key</span>
                  </div>
                  <h1 className={styles.formTitle}>Forgot your password?</h1>
                  <p className={styles.formDescription}>
                    Enter your registered email address, and we'll send you a secure link to reset
                    your credentials.
                  </p>

                  {isSubmitted ? (
                    <div className={styles.successMessage}>
                      <span className="material-symbols-outlined">check_circle</span>
                      <h3>Check your inbox</h3>
                      <p>
                        We've sent a password reset link to <strong>{email}</strong>. Please check
                        your email and follow the instructions.
                      </p>
                      <Link href="/login" className={styles.successBtn}>
                        Return to Login
                      </Link>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className={styles.form}>
                      <div className={styles.inputGroup}>
                        <input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          autoComplete="email"
                        />
                        <label htmlFor="email">Enterprise Email Address</label>
                      </div>

                      {error && <div className={styles.errorMsg}>{error}</div>}

                      <button
                        type="submit"
                        className={`${styles.submitBtn} ${styles.magneticBtn}`}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <span>Sending...</span>
                        ) : (
                          <>
                            Send Recovery Link
                            <span className="material-symbols-outlined">arrow_forward</span>
                          </>
                        )}
                      </button>
                    </form>
                  )}

                  <div className={styles.formFooter}>
                    <p>
                      Remember your password?{' '}
                      <Link href="/login" className={styles.loginLink}>
                        Return to Login
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}