'use client';

import { useEffect, useState } from 'react';
import styles from './page.module.scss';

// Імпорт компонентів
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';

const DEVICE_ICONS = {
  mobile: 'smartphone',
  tablet: 'tablet_mac',
  desktop: 'desktop_windows',
};

const guessDevice = (userAgent = '') => {
  const ua = userAgent.toLowerCase();
  if (/iphone|android.*mobile/.test(ua)) return { icon: 'smartphone', label: 'Mobile device' };
  if (/ipad|tablet/.test(ua)) return { icon: 'tablet_mac', label: 'Tablet' };
  if (/macintosh|mac os/.test(ua)) return { icon: 'laptop_mac', label: 'Mac' };
  if (/windows/.test(ua)) return { icon: 'desktop_windows', label: 'Windows PC' };
  if (/linux/.test(ua)) return { icon: 'computer', label: 'Linux' };
  return { icon: 'devices_other', label: 'Unknown device' };
};

export default function SecurityPage() {
  const { token, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [devices, setDevices] = useState([]);
  const [isLoadingDevices, setIsLoadingDevices] = useState(true);
  const [deviceMessage, setDeviceMessage] = useState('');

  const loadDevices = () => {
    if (!token) return;
    setIsLoadingDevices(true);
    fetch('/api/security/sessions', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => setDevices(data.sessions || []))
      .catch(() => setDeviceMessage('Failed to load devices.'))
      .finally(() => setIsLoadingDevices(false));
  };

  useEffect(() => {
    loadDevices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleDeviceAction = async (session) => {
    setDeviceMessage('');
    try {
      const response = await fetch('/api/security/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'revoke', sessionId: session.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to sign out device.');
      if (data.wasCurrent) {
        logout();
        return;
      }
      setDevices((prev) => prev.filter((d) => d.id !== session.id));
    } catch (err) {
      setDeviceMessage(err.message || 'Failed to sign out device.');
    }
  };

  // Password strength
  const getPasswordStrength = () => {
    if (!newPassword) return 0;
    let score = 0;
    if (newPassword.length >= 8) score++;
    if (/[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword)) score++;
    if (/\d/.test(newPassword)) score++;
    if (/[^a-zA-Z0-9]/.test(newPassword)) score++;
    return score;
  };

  const strength = getPasswordStrength();
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['', 'error', 'warning', 'tertiary', 'primary'];

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setMessage('');
    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setMessage('New password must be at least 8 characters.');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to update password.');

      setMessage('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setMessage(err.message || 'Failed to update password.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className={styles.securityPage}>
        {/* SECTION 1: SECURITY HERO */}
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <h1>Security Center</h1>
            <p>Protect your account, creative assets and billing information with enterprise-grade security tools.</p>
          </div>

          <div className={styles.securityScore}>
            <div className={styles.scoreGlow}></div>
            <div className={styles.scoreContent}>
              <div className={styles.scoreRing}>
                <svg viewBox="0 0 100 100">
                  <circle
                    className={styles.scoreRingBg}
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <circle
                    className={styles.scoreRingFill}
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeDasharray="283"
                    strokeDashoffset="6"
                  />
                </svg>
                <span className={styles.scoreNumber}>98</span>
              </div>
              <div>
                <h3>Security Overview</h3>
                <p className={styles.scoreStatus}>Excellent Standing</p>
              </div>
            </div>
            <ul className={styles.scoreList}>
              <li>
                <span>
                  <span className="material-symbols-outlined">check_circle</span>
                  Verified Email
                </span>
                <span>Active</span>
              </li>
              <li>
                <span>
                  <span className="material-symbols-outlined">key</span>
                  Password Status
                </span>
                <span>Strong</span>
              </li>
              <li>
                <span>
                  <span className="material-symbols-outlined">phonelink_lock</span>
                  2FA
                </span>
                <span>Active</span>
              </li>
              <li>
                <span>
                  <span className="material-symbols-outlined">devices</span>
                  Trusted Devices
                </span>
                <span>4</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Grid Layout for core settings */}
        <div className={styles.settingsGrid}>
          {/* SECTION 2: CHANGE PASSWORD */}
          <section className={styles.changePassword}>
            <div className={styles.sectionHeader}>
              <span className="material-symbols-outlined">password</span>
              <h3>Change Password</h3>
            </div>
            <form onSubmit={handleUpdatePassword} className={styles.passwordForm}>
              <div className={styles.formGroup}>
                <label>Current Password</label>
                <div className={styles.passwordInput}>
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className={styles.visibilityBtn}
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    <span className="material-symbols-outlined">
                      {showCurrentPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>New Password</label>
                <div className={styles.passwordInput}>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className={styles.visibilityBtn}
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    <span className="material-symbols-outlined">
                      {showNewPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
                {newPassword && (
                  <div className={styles.strengthMeter}>
                    <div className={styles.strengthBars}>
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`${styles.strengthBar} ${
                            i <= strength ? styles[`strength${strengthColors[strength]}`] : ''
                          }`}
                        />
                      ))}
                    </div>
                    <span className={styles.strengthLabel}>
                      {strengthLabels[strength]}
                    </span>
                  </div>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>Confirm Password</label>
                <div className={styles.passwordInput}>
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

              {message && (
                <p style={{ color: message.includes('successfully') ? '#4ade80' : '#f87171', marginBottom: '8px' }}>{message}</p>
              )}

              <button type="submit" className={styles.updateBtn} disabled={isSaving}>
                {isSaving ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </section>

          {/* SECTION 3: TWO-FACTOR AUTHENTICATION */}
          <section className={styles.twoFactor}>
            <div className={styles.twoFactorBg}>
              <span className="material-symbols-outlined">shield_lock</span>
            </div>
            <div className={styles.twoFactorContent}>
              <div className={styles.sectionHeader}>
                <span className="material-symbols-outlined">security</span>
                <h3>Two-Factor Authentication</h3>
              </div>
              <div className={styles.twoFactorStatus}>
                <span className={styles.statusDot}></span>
                <span>Authentication Active</span>
              </div>
              <div className={styles.twoFactorMethods}>
                <div className={styles.methodItem}>
                  <div>
                    <p>Authenticator App</p>
                    <p>Primary method</p>
                  </div>
                  <span className={styles.methodActive}>Active</span>
                </div>
                <div className={styles.methodItem}>
                  <div>
                    <p>Backup Codes</p>
                    <p>10 remaining</p>
                  </div>
                  <span className="material-symbols-outlined">check_circle</span>
                </div>
              </div>
              <div className={styles.twoFactorActions}>
                <button className={styles.twoFactorBtn} onClick={() => alert('2FA QR code ready for setup')}>
                  <span className="material-symbols-outlined">qr_code_scanner</span>
                  View QR
                </button>
                <button className={styles.twoFactorBtn} onClick={() => alert('Backup codes regenerated')}>
                  <span className="material-symbols-outlined">refresh</span>
                  Regenerate
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* SECTION 4: TRUSTED DEVICES */}
        <section className={styles.trustedDevices}>
          <div className={styles.devicesHeader}>
            <span className="material-symbols-outlined">important_devices</span>
            <h3>Trusted Devices <span>({devices.length})</span></h3>
          </div>

          {deviceMessage && (
            <p style={{ color: '#f87171', marginBottom: '8px' }}>{deviceMessage}</p>
          )}

          {isLoadingDevices ? (
            <p style={{ color: '#94a3b8' }}>Loading devices...</p>
          ) : devices.length === 0 ? (
            <p style={{ color: '#94a3b8' }}>No active sessions found.</p>
          ) : (
            <div className={styles.devicesGrid}>
              {devices.map((device) => {
                const info = guessDevice(device.userAgent);
                return (
                  <div key={device.id} className={styles.deviceCard}>
                    <div className={styles.deviceHeader}>
                      <div className={styles.deviceIcon}>
                        <span className="material-symbols-outlined">{DEVICE_ICONS[info.icon] || info.icon}</span>
                      </div>
                      {device.isCurrent && (
                        <span className={styles.deviceCurrent}>Current</span>
                      )}
                    </div>
                    <h4>{info.label}</h4>
                    <p className={styles.deviceInfo}>
                      {device.userAgent}<br />
                      {device.ip || 'Unknown location'}
                    </p>
                    <p className={styles.deviceStatus}>
                      Last active {new Date(device.lastActiveAt).toLocaleString()}
                    </p>
                    <button
                      className={device.isCurrent ? styles.deviceRevoke : styles.deviceRemove}
                      onClick={() => handleDeviceAction(device)}
                    >
                      {device.isCurrent ? 'Sign Out' : 'Remove Device'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}