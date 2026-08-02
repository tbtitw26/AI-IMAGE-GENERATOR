'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import styles from './page.module.scss';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const canvasRef = useRef(null);
  const magnetBtnRef = useRef(null);

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
    const handleMouseMove = (event) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width && rect.height) {
        const nx = (event.clientX - rect.left) / rect.width;
        const ny = 1.0 - (event.clientY - rect.top) / rect.height;
        mouseX = nx * canvas.width;
        mouseY = ny * canvas.height;
      }
    };
    window.addEventListener('mousemove', handleMouseMove);

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
    vec3 surface = vec3(0.039, 0.062, 0.125);

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
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const pos = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRes = gl.getUniformLocation(prog, 'u_resolution');
    const uMouse = gl.getUniformLocation(prog, 'u_mouse');

    let rafId;
    const render = (timestamp) => {
      if (typeof ResizeObserver === 'undefined') syncSize();
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (uTime) gl.uniform1f(uTime, timestamp * 0.001);
      if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
      if (uMouse) gl.uniform2f(uMouse, mouseX, mouseY);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      rafId = requestAnimationFrame(render);
    };
    rafId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  // Magnetic button effect
  useEffect(() => {
    const btn = magnetBtnRef.current;
    if (!btn) return;

    const handleMouseMove = (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.1}px, ${y * 0.1}px)`;
    };

    const handleMouseLeave = () => {
      btn.style.transform = 'translate(0px, 0px)';
    };

    btn.addEventListener('mousemove', handleMouseMove);
    btn.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      btn.removeEventListener('mousemove', handleMouseMove);
      btn.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const text = await response.text();
      const data = text ? JSON.parse(text) : {};
      if (!response.ok) {
        throw new Error(data.message || 'Login failed.');
      }

      window.localStorage.setItem('token', data.token);
      window.localStorage.setItem('user', JSON.stringify(data.user));
      window.location.href = '/dashboard';
    } catch (error) {
      console.error(error);
      setError(error.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.loginPage}>
      {/* Background Shader */}
      <canvas ref={canvasRef} className={styles.bgCanvas} />

      <Header />

      {/* Main Content */}
      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.heroGrid}>
            {/* Left: Login Form */}
            <div className={styles.loginForm}>
              <div className={styles.formBadge}>
                <span className="material-symbols-outlined">waving_hand</span>
                <span>Welcome Back</span>
              </div>
              <h1 className={styles.formTitle}>
                Continue creating without limits.
              </h1>
              <p className={styles.formDescription}>
                Sign in to access your AI projects, generated images, wallet, premium services,
                invoices and enterprise tools.
              </p>

              <div className={styles.formCard}>
                <form onSubmit={handleSubmit} className={styles.form}>
                  {/* Email */}
                  <div className={styles.formGroup}>
                    <label htmlFor="email">Email Address</label>
                    <div className={styles.inputWrapper}>
                      <span className="material-symbols-outlined">mail</span>
                      <input
                        id="email"
                        type="email"
                        placeholder="name@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className={styles.formGroup}>
                    <div className={styles.passwordHeader}>
                      <label htmlFor="password">Password</label>
                      <Link href="/forgot-password" className={styles.forgotLink}>
                        Forgot Password?
                      </Link>
                    </div>
                    <div className={styles.inputWrapper}>
                      <span className="material-symbols-outlined">lock</span>
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className={styles.visibilityBtn}
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        <span className="material-symbols-outlined">
                          {showPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Remember Me */}
                  <div className={styles.rememberMe}>
                    <input
                      type="checkbox"
                      id="remember"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <label htmlFor="remember">Remember this device</label>
                  </div>

                  {/* Submit */}
                  <button
                    ref={magnetBtnRef}
                    type="submit"
                    className={styles.submitBtn}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span>Signing In...</span>
                    ) : (
                      <>
                        Sign In
                        <span className="material-symbols-outlined">arrow_forward</span>
                      </>
                    )}
                  </button>

                  {error && <div className={styles.errorMsg}>{error}</div>}
                </form>

                {/* Divider */}
                <div className={styles.divider}>
                  <span>or continue with</span>
                </div>

                {/* Social Logins */}
                <div className={styles.socialButtons}>
                  <button
                    className={styles.socialBtn}
                    type="button"
                    onClick={() => setError('Google sign-in is not available yet. Please use your email and password.')}
                  >
                    <svg className={styles.socialIcon} viewBox="0 0 24 24" fill="none">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    <span>Google</span>
                  </button>
                  <button
                    className={styles.socialBtn}
                    type="button"
                    onClick={() => setError('Microsoft sign-in is not available yet. Please use your email and password.')}
                  >
                    <svg className={styles.socialIcon} viewBox="0 0 21 21" fill="none">
                      <rect fill="#F25022" x="1" y="1" width="9" height="9"/>
                      <rect fill="#7FBA00" x="11" y="1" width="9" height="9"/>
                      <rect fill="#00A4EF" x="1" y="11" width="9" height="9"/>
                      <rect fill="#FFB900" x="11" y="11" width="9" height="9"/>
                    </svg>
                    <span>Microsoft</span>
                  </button>
                </div>
              </div>

              <p className={styles.signupLink}>
                Don&apos;t have an account? <Link href="/register">Create Account</Link>
              </p>
            </div>

            {/* Right: Visual Scene (placeholders, no external images) */}
            <div className={styles.visualScene}>
              <div className={styles.sceneContainer}>
                {/* Main Placeholder */}
                <div className={`${styles.mainImage} ${styles.floatAnimation}`}>
                  <div className={styles.imagePlaceholder}>
                    <span className="material-symbols-outlined">auto_awesome</span>
                  </div>
                  <div className={styles.imageOverlay}>
                    <div className={styles.projectInfo}>
                      <span>Project Alpha</span>
                      <span className="material-symbols-outlined">check_circle</span>
                    </div>
                  </div>
                </div>

                {/* Secondary Placeholder */}
                <div className={`${styles.secondaryImage} ${styles.floatDelayed}`}>
                  <div className={`${styles.imagePlaceholder} ${styles.imagePlaceholderSm}`}>
                    <span className="material-symbols-outlined">hub</span>
                  </div>
                </div>

                {/* Wallet Card */}
                <div className={`${styles.walletCard} ${styles.floatReverse}`}>
                  <div className={styles.walletHeader}>
                    <div className={styles.walletIcon}>
                      <span className="material-symbols-outlined">account_balance_wallet</span>
                    </div>
                    <span>Credits Balance</span>
                  </div>
                  <div className={styles.walletBalance}>2,450</div>
                  <div className={styles.walletChange}>
                    <span className="material-symbols-outlined">arrow_upward</span>
                    +150 today
                  </div>
                </div>

                {/* VIP Badge */}
                <div className={`${styles.vipBadge} ${styles.floatDelayed}`}>
                  <span className="material-symbols-outlined">workspace_premium</span>
                  <span>ENTERPRISE</span>
                </div>

                {/* Status Node */}
                <div className={`${styles.statusNode} ${styles.floatAnimation}`}>
                  <div className={styles.statusHeader}>
                    <div className={styles.statusDot}></div>
                    <span>Status</span>
                  </div>
                  <div className={styles.statusText}>Nodes Active</div>
                  <div className={styles.statusBar}>
                    <div className={styles.statusFill}></div>
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