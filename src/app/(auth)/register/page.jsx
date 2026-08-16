'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import styles from './page.module.scss';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    dob: '',
    streetAddress: '',
    city: '',
    country: '',
    postalCode: '',
    agreeTerms: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
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
    
    vec3 bg = vec3(0.0157, 0.0196, 0.0392);
    vec3 deep = vec3(0.0275, 0.0431, 0.0784);
    vec3 surface = vec3(0.0392, 0.0627, 0.1255);
    
    vec3 accent1 = vec3(0.357, 0.549, 1.0);
    vec3 accent2 = vec3(0.545, 0.361, 0.965);
    
    vec3 color = mix(bg, deep, uv.y + sin(t) * 0.1);
    
    float d1 = length(p - vec2(sin(t * 0.7) * 0.4, cos(t * 0.4) * 0.2));
    float d2 = length(p + vec2(cos(t * 0.5) * 0.5, sin(t * 0.3) * 0.3));
    float dMouse = length(p - m);
    
    color += accent1 * (0.08 / (d1 + 0.8));
    color += accent2 * (0.07 / (d2 + 0.9));
    color += accent1 * (0.05 / (dMouse + 0.7)) * (sin(u_time * 2.0) * 0.2 + 0.8);
    
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

    let animId;
    const render = (timestamp) => {
      if (typeof ResizeObserver === 'undefined') syncSize();
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (uTime) gl.uniform1f(uTime, timestamp * 0.001);
      if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
      if (uMouse) gl.uniform2f(uMouse, mouseX, mouseY);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animId = requestAnimationFrame(render);
    };
    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (animId) cancelAnimationFrame(animId);
    };
  }, []);

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSubmitMessage('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const text = await response.text();
      const data = text ? JSON.parse(text) : {};
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed.');
      }

      // Check if email verification is required
      if (data.requiresVerification) {
        setSubmitMessage(data.message || 'Registration successful. Please check your email to verify your account.');
        setIsSubmitted(true);
        // Redirect to verify-email page with email parameter after 2 seconds
        setTimeout(() => {
          window.location.href = `/verify-email?email=${encodeURIComponent(formData.email)}`;
        }, 2000);
      } else {
        // Email verification not required, proceed with login
        const loginResponse = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        });

        const loginText = await loginResponse.text();
        const loginData = loginText ? JSON.parse(loginText) : {};
        if (!loginResponse.ok) {
          throw new Error(loginData.message || 'Login failed after registration.');
        }

        window.localStorage.setItem('token', loginData.token);
        window.localStorage.setItem('user', JSON.stringify(loginData.user));
        window.dispatchEvent(new Event('auth-state-changed'));
        window.location.href = '/dashboard';
      }
    } catch (error) {
      console.error(error);
      setError(error.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: 'lock',
      title: 'Private Projects',
      description: 'Isolated instances for complete IP protection. Your data never trains public models.',
      color: 'primary',
    },
    {
      icon: 'verified',
      title: 'Commercial License',
      description: 'Full rights to all generated assets for broadcast, print, and digital commercial use.',
      color: 'tertiary',
    },
    {
      icon: 'receipt_long',
      title: 'Wallet & PDF Invoices',
      description: 'Centralized billing management with detailed VAT-compliant PDF invoicing.',
      color: 'primary-container',
    },
    {
      icon: 'workspace_premium',
      title: 'VIP Services',
      description: 'Dedicated account manager and priority GPU queue for high-demand rendering.',
      color: 'secondary',
    },
  ];

  // Excluded 19 restricted countries
  const excludedCodes = new Set([
    'SD', // Sudan
    'CD', // Dem. Rep. of the Congo
    'IR', // Iran
    'ML', // Mali
    'MM', // Myanmar (Burma)
    'KP', // North Korea
    'SS', // South Sudan
    'SY', // Syria
    'YE', // Yemen
    'AF', // Afghanistan
    'BY', // Belarus
    'CF', // Central African Republic
    'CU', // Cuba
    'HT', // Haiti
    'IQ', // Iraq
    'RU', // Russia
    'SO', // Somalia
    'VE', // Venezuela
    'ZW', // Zimbabwe
  ]);

  const rawCountries = [
    { value: 'AF', label: 'Afghanistan' },
    { value: 'AL', label: 'Albania' },
    { value: 'DZ', label: 'Algeria' },
    { value: 'AD', label: 'Andorra' },
    { value: 'AO', label: 'Angola' },
    { value: 'AG', label: 'Antigua and Barbuda' },
    { value: 'AR', label: 'Argentina' },
    { value: 'AM', label: 'Armenia' },
    { value: 'AU', label: 'Australia' },
    { value: 'AT', label: 'Austria' },
    { value: 'AZ', label: 'Azerbaijan' },
    { value: 'BS', label: 'Bahamas' },
    { value: 'BH', label: 'Bahrain' },
    { value: 'BD', label: 'Bangladesh' },
    { value: 'BB', label: 'Barbados' },
    { value: 'BY', label: 'Belarus' },
    { value: 'BE', label: 'Belgium' },
    { value: 'BZ', label: 'Belize' },
    { value: 'BJ', label: 'Benin' },
    { value: 'BT', label: 'Bhutan' },
    { value: 'BO', label: 'Bolivia' },
    { value: 'BA', label: 'Bosnia and Herzegovina' },
    { value: 'BW', label: 'Botswana' },
    { value: 'BR', label: 'Brazil' },
    { value: 'BN', label: 'Brunei' },
    { value: 'BG', label: 'Bulgaria' },
    { value: 'BF', label: 'Burkina Faso' },
    { value: 'BI', label: 'Burundi' },
    { value: 'CV', label: 'Cabo Verde' },
    { value: 'KH', label: 'Cambodia' },
    { value: 'CM', label: 'Cameroon' },
    { value: 'CA', label: 'Canada' },
    { value: 'CF', label: 'Central African Republic' },
    { value: 'TD', label: 'Chad' },
    { value: 'CL', label: 'Chile' },
    { value: 'CN', label: 'China' },
    { value: 'CO', label: 'Colombia' },
    { value: 'KM', label: 'Comoros' },
    { value: 'CG', label: 'Congo' },
    { value: 'CD', label: 'Dem. Rep. of the Congo' },
    { value: 'CR', label: 'Costa Rica' },
    { value: 'HR', label: 'Croatia' },
    { value: 'CU', label: 'Cuba' },
    { value: 'CY', label: 'Cyprus' },
    { value: 'CZ', label: 'Czech Republic' },
    { value: 'DK', label: 'Denmark' },
    { value: 'DJ', label: 'Djibouti' },
    { value: 'DM', label: 'Dominica' },
    { value: 'DO', label: 'Dominican Republic' },
    { value: 'EC', label: 'Ecuador' },
    { value: 'EG', label: 'Egypt' },
    { value: 'SV', label: 'El Salvador' },
    { value: 'GQ', label: 'Equatorial Guinea' },
    { value: 'ER', label: 'Eritrea' },
    { value: 'EE', label: 'Estonia' },
    { value: 'SZ', label: 'Eswatini' },
    { value: 'ET', label: 'Ethiopia' },
    { value: 'FJ', label: 'Fiji' },
    { value: 'FI', label: 'Finland' },
    { value: 'FR', label: 'France' },
    { value: 'GA', label: 'Gabon' },
    { value: 'GM', label: 'Gambia' },
    { value: 'GE', label: 'Georgia' },
    { value: 'DE', label: 'Germany' },
    { value: 'GH', label: 'Ghana' },
    { value: 'GR', label: 'Greece' },
    { value: 'GD', label: 'Grenada' },
    { value: 'GT', label: 'Guatemala' },
    { value: 'GN', label: 'Guinea' },
    { value: 'GW', label: 'Guinea-Bissau' },
    { value: 'GY', label: 'Guyana' },
    { value: 'HT', label: 'Haiti' },
    { value: 'HN', label: 'Honduras' },
    { value: 'HU', label: 'Hungary' },
    { value: 'IS', label: 'Iceland' },
    { value: 'IN', label: 'India' },
    { value: 'ID', label: 'Indonesia' },
    { value: 'IR', label: 'Iran' },
    { value: 'IQ', label: 'Iraq' },
    { value: 'IE', label: 'Ireland' },
    { value: 'IL', label: 'Israel' },
    { value: 'IT', label: 'Italy' },
    { value: 'JM', label: 'Jamaica' },
    { value: 'JP', label: 'Japan' },
    { value: 'JO', label: 'Jordan' },
    { value: 'KZ', label: 'Kazakhstan' },
    { value: 'KE', label: 'Kenya' },
    { value: 'KI', label: 'Kiribati' },
    { value: 'KP', label: 'North Korea' },
    { value: 'KR', label: 'South Korea' },
    { value: 'KW', label: 'Kuwait' },
    { value: 'KG', label: 'Kyrgyzstan' },
    { value: 'LA', label: 'Laos' },
    { value: 'LV', label: 'Latvia' },
    { value: 'LB', label: 'Lebanon' },
    { value: 'LS', label: 'Lesotho' },
    { value: 'LR', label: 'Liberia' },
    { value: 'LY', label: 'Libya' },
    { value: 'LI', label: 'Liechtenstein' },
    { value: 'LT', label: 'Lithuania' },
    { value: 'LU', label: 'Luxembourg' },
    { value: 'MG', label: 'Madagascar' },
    { value: 'MW', label: 'Malawi' },
    { value: 'MY', label: 'Malaysia' },
    { value: 'MV', label: 'Maldives' },
    { value: 'ML', label: 'Mali' },
    { value: 'MT', label: 'Malta' },
    { value: 'MH', label: 'Marshall Islands' },
    { value: 'MR', label: 'Mauritania' },
    { value: 'MU', label: 'Mauritius' },
    { value: 'MX', label: 'Mexico' },
    { value: 'FM', label: 'Micronesia' },
    { value: 'MD', label: 'Moldova' },
    { value: 'MC', label: 'Monaco' },
    { value: 'MN', label: 'Mongolia' },
    { value: 'ME', label: 'Montenegro' },
    { value: 'MA', label: 'Morocco' },
    { value: 'MZ', label: 'Mozambique' },
    { value: 'MM', label: 'Myanmar (Burma)' },
    { value: 'NA', label: 'Namibia' },
    { value: 'NR', label: 'Nauru' },
    { value: 'NP', label: 'Nepal' },
    { value: 'NL', label: 'Netherlands' },
    { value: 'NZ', label: 'New Zealand' },
    { value: 'NI', label: 'Nicaragua' },
    { value: 'NE', label: 'Niger' },
    { value: 'NG', label: 'Nigeria' },
    { value: 'NO', label: 'Norway' },
    { value: 'OM', label: 'Oman' },
    { value: 'PK', label: 'Pakistan' },
    { value: 'PW', label: 'Palau' },
    { value: 'PA', label: 'Panama' },
    { value: 'PG', label: 'Papua New Guinea' },
    { value: 'PY', label: 'Paraguay' },
    { value: 'PE', label: 'Peru' },
    { value: 'PH', label: 'Philippines' },
    { value: 'PL', label: 'Poland' },
    { value: 'PT', label: 'Portugal' },
    { value: 'QA', label: 'Qatar' },
    { value: 'RO', label: 'Romania' },
    { value: 'RU', label: 'Russia' },
    { value: 'RW', label: 'Rwanda' },
    { value: 'KN', label: 'Saint Kitts and Nevis' },
    { value: 'LC', label: 'Saint Lucia' },
    { value: 'VC', label: 'Saint Vincent and the Grenadines' },
    { value: 'WS', label: 'Samoa' },
    { value: 'SM', label: 'San Marino' },
    { value: 'ST', label: 'Sao Tome and Principe' },
    { value: 'SA', label: 'Saudi Arabia' },
    { value: 'SN', label: 'Senegal' },
    { value: 'RS', label: 'Serbia' },
    { value: 'SC', label: 'Seychelles' },
    { value: 'SL', label: 'Sierra Leone' },
    { value: 'SG', label: 'Singapore' },
    { value: 'SK', label: 'Slovakia' },
    { value: 'SI', label: 'Slovenia' },
    { value: 'SB', label: 'Solomon Islands' },
    { value: 'SO', label: 'Somalia' },
    { value: 'ZA', label: 'South Africa' },
    { value: 'SS', label: 'South Sudan' },
    { value: 'ES', label: 'Spain' },
    { value: 'LK', label: 'Sri Lanka' },
    { value: 'SD', label: 'Sudan' },
    { value: 'SE', label: 'Sweden' },
    { value: 'CH', label: 'Switzerland' },
    { value: 'SY', label: 'Syria' },
    { value: 'TJ', label: 'Tajikistan' },
    { value: 'TZ', label: 'Tanzania' },
    { value: 'TH', label: 'Thailand' },
    { value: 'TL', label: 'Timor-Leste' },
    { value: 'TG', label: 'Togo' },
    { value: 'TO', label: 'Tonga' },
    { value: 'TT', label: 'Trinidad and Tobago' },
    { value: 'TN', label: 'Tunisia' },
    { value: 'TR', label: 'Turkey' },
    { value: 'TM', label: 'Turkmenistan' },
    { value: 'TV', label: 'Tuvalu' },
    { value: 'UG', label: 'Uganda' },
    { value: 'UA', label: 'Ukraine' },
    { value: 'AE', label: 'United Arab Emirates' },
    { value: 'GB', label: 'United Kingdom' },
    { value: 'US', label: 'United States' },
    { value: 'UY', label: 'Uruguay' },
    { value: 'UZ', label: 'Uzbekistan' },
    { value: 'VU', label: 'Vanuatu' },
    { value: 'VA', label: 'Vatican City' },
    { value: 'VE', label: 'Venezuela' },
    { value: 'VN', label: 'Vietnam' },
    { value: 'YE', label: 'Yemen' },
    { value: 'ZM', label: 'Zambia' },
    { value: 'ZW', label: 'Zimbabwe' },
  ];

  const countries = rawCountries
    .filter((c) => !excludedCodes.has(c.value))
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <div className={styles.registerPage}>
      {/* Background Shader */}
      <canvas ref={canvasRef} className={styles.bgCanvas} />

      <Header />

      {/* Main Content */}
      <main className={styles.main}>
        <section className={styles.hero}>
          {/* Left: Visual Scene with Gray Backdrop Container */}
          <div className={styles.visualScene}>
            <div className={styles.sceneContainer}>
              <div className={styles.sceneGlow}></div>

              <div className={`${styles.floatingCard} ${styles.card1}`}>
                <img
                  src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80"
                  alt="Editorial Portrait"
                />
                <div className={styles.cardContent}>
                  <h3>Editorial Portrait</h3>
                  <div>
                    <span className={styles.cardBadge}>High-Res</span>
                    <span>Rendered</span>
                  </div>
                </div>
              </div>

              <div className={`${styles.floatingCard} ${styles.card2}`}>
                <img
                  src="https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=600&q=80"
                  alt="Character Asset"
                />
                <div className={styles.cardContent}>
                  <h3>Character Asset</h3>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: '75%' }}></div>
                  </div>
                  <span className={styles.progressLabel}>75% Complete</span>
                </div>
              </div>

              <div className={`${styles.floatingCard} ${styles.card3}`}>
                <img
                  src="https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=600&q=80"
                  alt="Video Asset"
                />
                <div className={styles.playOverlay}>
                  <span className="material-symbols-outlined">play_circle</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Registration Form */}
          <div className={styles.registerForm}>
            <div className={styles.formCard}>
              <div className={styles.formHeader}>
                <h1>Create Account</h1>
                <p>Join the premiere cinematic AI platform for enterprise creators.</p>
              </div>

              <form onSubmit={handleSubmit} className={styles.form}>

                {/* Name & Surname */}
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      placeholder="Jane"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      placeholder="Doe"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div className={styles.formGroup}>
                  <label>Email Address</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="jane@enterprise.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Password */}
                <div className={styles.formGroup}>
                  <label>Password</label>
                  <input
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Phone Number & Date of Birth */}
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      placeholder="+1 (555) 000-0000"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Date of Birth</label>
                    <input
                      type="date"
                      name="dob"
                      value={formData.dob}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                {/* Address Section */}
                <div className={styles.sectionTitle}>Billing Address</div>

                {/* Street Address */}
                <div className={styles.formGroup}>
                  <label>Street Address</label>
                  <input
                    type="text"
                    name="streetAddress"
                    placeholder="123 Creator Lane"
                    value={formData.streetAddress}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* City & Post Code */}
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>City</label>
                    <input
                      type="text"
                      name="city"
                      placeholder="Metropolis"
                      value={formData.city}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Post Code</label>
                    <input
                      type="text"
                      name="postalCode"
                      placeholder="90210"
                      value={formData.postalCode}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                {/* Country */}
                <div className={styles.formGroup}>
                  <label>Country</label>
                  <div className={styles.selectWrapper}>
                    <select
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      required
                    >
                      <option value="" disabled>
                        Select a country
                      </option>
                      {countries.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined">expand_more</span>
                  </div>
                </div>

                {/* Checkbox with Terms & Conditions and Privacy Policy links */}
                <label className={styles.checkboxGroup}>
                  <input
                    type="checkbox"
                    name="agreeTerms"
                    checked={formData.agreeTerms}
                    onChange={handleChange}
                    required
                  />
                  <span>
                    I agree to the{' '}
                    <Link href="/terms-and-conditions" target="_blank">
                      Terms &amp; Conditions
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy-policy" target="_blank">
                      Privacy Policy
                    </Link>.
                  </span>
                </label>

                <div className={styles.formFooter}>
                  {isSubmitted ? (
                    <div className={styles.successMessage}>
                      <span className="material-symbols-outlined">check_circle</span>
                      <h3>Account Created</h3>
                      <p>{submitMessage}</p>
                      <Link href="/login" className={styles.successBtn}>
                        Back to Login
                      </Link>
                    </div>
                  ) : (
                    <>
                      <button
                        type="submit"
                        className={styles.submitBtn}
                        disabled={isLoading || !formData.agreeTerms}
                      >
                        {isLoading ? 'Creating Account...' : 'Initialize Workspace'}
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </button>
                      <p className={styles.termsText}>
                        By registering, you agree to our{' '}
                        <Link href="/terms-and-conditions">Terms of Service</Link> and{' '}
                        <Link href="/privacy-policy">Privacy Policy</Link>. Fiat payments only.
                      </p>
                    </>
                  )}
                </div>
              </form>
              {error && <div className={styles.errorMsg}>{error}</div>}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className={styles.features}>
          <h2>Enterprise-Grade Features</h2>
          <div className={styles.featuresGrid}>
            {features.map((feature, index) => (
              <div key={index} className={`${styles.featureCard} ${styles[`feature${feature.color.charAt(0).toUpperCase() + feature.color.slice(1)}`]}`}>
                <div className={styles.featureIcon}>
                  <span className="material-symbols-outlined">{feature.icon}</span>
                </div>
                <div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className={styles.cta}>
          <div className={styles.ctaBackground}>
            <div className={styles.ctaOverlay}></div>
            <div className={styles.ctaThumbnails}>
              <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80" alt="" />
              <img src="https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=600&q=80" alt="" />
              <img src="https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=600&q=80" alt="" />
              <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80" alt="" />
            </div>
          </div>
          <div className={styles.ctaContent}>
            <h2>Ready to Create?</h2>
            <p>Join thousands of professionals building the future of cinematic AI. Your personalized studio environment awaits.</p>
            <a href="#top" className={styles.ctaBtn}>Scroll up to Register</a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}