'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/common/Header';
import styles from './page.module.scss';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [token, setToken] = useState('');
  const [message, setMessage] = useState('');
  const canvasRef = useRef(null);

  // Password strength
  const [strength, setStrength] = useState(0);
  const [strengthLabel, setStrengthLabel] = useState('Weak');
  const [strengthColor, setStrengthColor] = useState('error');

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
    
    vec3 color = mix(bg, deep, uv.y + sin(t * 0.5) * 0.1);
    
    float stream = pow(1.0 - abs(p.y - sin(p.x * 1.5 + t) * 0.2), 40.0);
    color += accent1 * stream * 0.07;
    
    float dMouse = length(p - m);
    color += accent2 * (0.06 / (dMouse + 0.75)) * (sin(u_time * 1.2) * 0.2 + 0.8);
    
    float beam = pow(1.0 - abs(p.x - sin(t * 0.2) * 0.9), 50.0) * (sin(t + uv.y * 3.0) * 0.5 + 0.5);
    color += accent1 * beam * 0.05;
    
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

  // Password strength checker
  useEffect(() => {
    const searchToken = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('token') : null;
    if (searchToken) {
      setToken(searchToken);
      setError('');
    } else {
      setError('Reset token is missing. Please use the link from your email.');
    }
  }, []);

  useEffect(() => {
    if (!password) {
      setStrength(0);
      setStrengthLabel('Weak');
      setStrengthColor('error');
      return;
    }

    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    setStrength(score);
    if (score <= 1) {
      setStrengthLabel('Weak');
      setStrengthColor('error');
    } else if (score === 2) {
      setStrengthLabel('Fair');
      setStrengthColor('warning');
    } else if (score === 3) {
      setStrengthLabel('Good');
      setStrengthColor('tertiary');
    } else {
      setStrengthLabel('Strong');
      setStrengthColor('primary');
    }
  }, [password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!token) {
      setError('Reset token is missing.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Unable to reset password.');
      }

      setIsSuccess(true);
      setMessage(data.message || 'Your password has been updated successfully.');
    } catch (err) {
      setError(err.message || 'Unable to reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  const requirements = [
    { label: 'Minimum 8 characters', met: password.length >= 8 },
    { label: 'Uppercase & Lowercase', met: /[a-z]/.test(password) && /[A-Z]/.test(password) },
    { label: 'Number', met: /\d/.test(password) },
    { label: 'Special Character', met: /[^a-zA-Z0-9]/.test(password) },
  ];

  return (
    <div className={styles.resetPassword}>
      {/* Background Shader */}
      <canvas ref={canvasRef} className={styles.bgCanvas} />

      <Header />

      {/* Main Content */}
      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.heroGrid}>
            {/* Left: Security Workspace */}
            <div className={styles.workspace}>
              <div className={`${styles.floatingCard} ${styles.cardProtocol} ${styles.floatSlow}`}>
                <div className={styles.cardProtocolHeader}>
                  <div className={styles.cardProtocolIcon}>
                    <span className="material-symbols-outlined">shield_locked</span>
                  </div>
                  <div>
                    <div className={styles.cardProtocolLabel}>Protocol Active</div>
                    <div className={styles.cardProtocolLevel}>Security Level 4</div>
                  </div>
                </div>
                <div className={styles.cardProtocolBar}>
                  <div className={styles.cardProtocolFill}></div>
                </div>
              </div>

              <div className={`${styles.floatingCard} ${styles.cardVerified} ${styles.floatMedium}`}>
                <div className={styles.cardVerifiedContent}>
                  <span className="material-symbols-outlined">check_circle</span>
                  <div className={styles.cardVerifiedTitle}>Identity Verified</div>
                  <div className={styles.cardVerifiedSub}>2FA Completed</div>
                </div>
              </div>

              <div className={`${styles.floatingCard} ${styles.cardDevice} ${styles.floatSlow}`}>
                <div className={styles.cardDeviceContent}>
                  <div className={styles.cardDeviceIcon}>
                    <span className="material-symbols-outlined">laptop_mac</span>
                  </div>
                  <div>
                    <div className={styles.cardDeviceTitle}>Trusted Device</div>
                    <div className={styles.cardDeviceStatus}>
                      <span className={styles.statusDotActive}></span>
                      Active Connection
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Form Console */}
            <div className={styles.formConsole}>
              <div className={styles.formCard}>
                <div className={styles.formCardGlow}></div>

                <div className={styles.formHeader}>
                  <h1>Create New Password</h1>
                  <p>Your identity has been verified. Choose a strong password to secure your account.</p>
                </div>

                {isSuccess ? (
                  <div className={styles.successMessage}>
                    <span className="material-symbols-outlined">check_circle</span>
                    <h3>Password Updated Successfully</h3>
                    <p>{message || 'Your password has been reset. You can now sign in with your new credentials.'}</p>
                    <Link href="/login" className={styles.successBtn}>
                      Sign In Now
                    </Link>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className={styles.form}>
                    {/* New Password */}
                    <div className={styles.formGroup}>
                      <label>New Password</label>
                      <div className={styles.inputWrapper}>
                        <input
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

                      {/* Strength Meter */}
                      {password && (
                        <>
                          <div className={styles.strengthMeter}>
                            <div className={`${styles.strengthBar} ${styles[`strength${strength}`]}`}></div>
                          </div>
                          <span className={`${styles.strengthLabel} ${styles[`strengthLabel${strengthColor.charAt(0).toUpperCase() + strengthColor.slice(1)}`]}`}>
                            {strengthLabel}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div className={styles.formGroup}>
                      <label>Confirm Password</label>
                      <div className={styles.inputWrapper}>
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                        />
                        <button
                          type="button"
                          className={styles.visibilityBtn}
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          <span className="material-symbols-outlined">
                            {showConfirmPassword ? 'visibility_off' : 'visibility'}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Requirements Checklist */}
                    <div className={styles.checklist}>
                      {requirements.map((req, index) => (
                        <div key={index} className={`${styles.checklistItem} ${req.met ? styles.met : ''}`}>
                          <span className="material-symbols-outlined">
                            {req.met ? 'check' : 'close'}
                          </span>
                          {req.label}
                        </div>
                      ))}
                    </div>

                    {error && <div className={styles.errorMsg}>{error}</div>}

                    <button type="submit" className={styles.submitBtn} disabled={isLoading || !token}>
                      {isLoading ? (
                        <span>Updating...</span>
                      ) : (
                        'Update Password'
                      )}
                    </button>

                    <Link href="/login" className={styles.backLink}>
                      <span className="material-symbols-outlined">arrow_back</span>
                      Back to Sign In
                    </Link>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}