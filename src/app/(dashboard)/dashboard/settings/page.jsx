'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import styles from './page.module.scss';

// Імпорт компонентів
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';

const DEFAULT_SETTINGS = {
  language: 'English (United States)',
  region: 'United States',
  timezone: 'Pacific Time (UTC-8)',
  dateFormat: 'DD/MM/YYYY',
  currency: 'USD ($)',
  theme: 'Dark Mode',
  defaultModel: 'Aether Ultra',
  notifications: true,
  cloudSync: true,
  twoFactorEnabled: false,
};

export default function SettingsPage() {
  const { token, user, logout } = useAuth();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    if (!token) return;
    fetch('/api/settings', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        if (data.settings && Object.keys(data.settings).length > 0) {
          setSettings({ ...DEFAULT_SETTINGS, ...data.settings });
        }
      })
      .finally(() => setIsLoading(false));
  }, [token]);

  const [activeTab, setActiveTab] = useState('general');

  // ===== Security: change password =====
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

  // ===== Security: two-factor toggle =====
  const [isSavingTwoFactor, setIsSavingTwoFactor] = useState(false);

  // ===== Security: active sessions =====
  const [sessions, setSessions] = useState([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [sessionMessage, setSessionMessage] = useState('');

  // ===== Security: login history =====
  const [loginHistory, setLoginHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const loadSessions = useCallback(() => {
    if (!token) return;
    setIsLoadingSessions(true);
    fetch('/api/security/sessions', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => setSessions(data.sessions || []))
      .catch(() => setSessionMessage('Failed to load sessions.'))
      .finally(() => setIsLoadingSessions(false));
  }, [token]);

  const loadLoginHistory = useCallback(() => {
    if (!token) return;
    setIsLoadingHistory(true);
    fetch('/api/security/login-history', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => setLoginHistory(data.history || []))
      .finally(() => setIsLoadingHistory(false));
  }, [token]);

  useEffect(() => {
    if (activeTab === 'security' && token) {
      loadSessions();
      loadLoginHistory();
    }
  }, [activeTab, token, loadSessions, loadLoginHistory]);

  const handlePasswordFieldChange = (key, value) => {
    setPasswordForm((prev) => ({ ...prev, [key]: value }));
    setPasswordMessage({ type: '', text: '' });
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    setIsChangingPassword(true);
    setPasswordMessage({ type: '', text: '' });
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to update password.');
      setPasswordMessage({ type: 'success', text: 'Password updated successfully.' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setShowPasswordForm(false), 1200);
    } catch (err) {
      setPasswordMessage({ type: 'error', text: err.message || 'Failed to update password.' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleToggleTwoFactor = async () => {
    const next = { ...settings, twoFactorEnabled: !settings.twoFactorEnabled };
    setSettings(next);
    setIsSavingTwoFactor(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ settings: next }),
      });
      if (!response.ok) throw new Error('Failed to update.');
    } catch {
      // revert on failure
      setSettings(settings);
    } finally {
      setIsSavingTwoFactor(false);
    }
  };

  const handleRevokeSession = async (sessionId) => {
    setSessionMessage('');
    try {
      const response = await fetch('/api/security/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'revoke', sessionId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to sign out session.');
      if (data.wasCurrent) {
        logout();
        return;
      }
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      loadLoginHistory();
    } catch (err) {
      setSessionMessage(err.message || 'Failed to sign out session.');
    }
  };

  const handleRevokeOtherSessions = async () => {
    setSessionMessage('');
    try {
      const response = await fetch('/api/security/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'revoke_others' }),
      });
      if (!response.ok) throw new Error('Failed to sign out other devices.');
      setSessionMessage('Signed out of all other devices.');
      loadSessions();
      loadLoginHistory();
    } catch (err) {
      setSessionMessage(err.message || 'Failed to sign out other devices.');
    }
  };

  const handleChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleToggle = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setSaveMessage('');
    try {
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ settings }),
      });
      if (!response.ok) throw new Error('Failed to save settings.');
      setSaveMessage('Settings saved successfully.');
    } catch (err) {
      setSaveMessage(err.message || 'Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const languages = ['English (United States)', 'Spanish (Spain)', 'French (France)', 'Japanese (Japan)'];
  const regions = ['United States', 'Europe', 'Asia Pacific'];
  const timezones = ['Pacific Time (UTC-8)', 'Eastern Time (UTC-5)', 'Central European Time (UTC+1)'];
  const dateFormats = ['DD/MM/YYYY', 'MM/DD/YYYY'];
  const currencies = ['USD ($)', 'EUR (€)', 'GBP (£)'];
  const models = ['Aether Ultra', 'Cinema 4K', 'Product Studio', 'Character Gen'];

  const tabs = [
    { id: 'general', label: 'General', icon: 'settings' },
    { id: 'profile', label: 'Profile', icon: 'person' },
    { id: 'security', label: 'Security', icon: 'security' },
    { id: 'billing', label: 'Billing', icon: 'payment' },
  ];

  return (
    <DashboardLayout>
      <div className={styles.settings}>
        {/* SECTION 1: CONTROL CENTER HERO */}
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <h1>Settings &amp; Preferences</h1>
            <p>Customize your creative workspace, language, notifications and generation preferences from one elegant control center.</p>
          </div>

          <div className={styles.statusCard}>
            <div className={styles.statusHeader}>
              <span>Account Status</span>
              <span className={styles.statusBadge}>Professional Plan</span>
            </div>
            <div className={styles.statusList}>
              <div>
                <span>Language</span>
                <span>{settings.language}</span>
              </div>
              <div>
                <span>Theme</span>
                <span>{settings.theme}</span>
              </div>
              <div>
                <span>Default Model</span>
                <span className={styles.statusValueSecondary}>{settings.defaultModel}</span>
              </div>
              <div>
                <span>Notifications</span>
                <span className={styles.statusValueTertiary}>{settings.notifications ? 'Active' : 'Inactive'}</span>
              </div>
              <div>
                <span>Cloud Sync</span>
                <span className={styles.statusValueTertiary}>{settings.cloudSync ? 'On' : 'Off'}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Tabs */}
        <div className={styles.tabs}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="material-symbols-outlined">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* SECTION 2: LANGUAGE & REGION */}
        {activeTab === 'general' && (
          <section className={styles.section}>
            <h3>Language &amp; Region</h3>
            <div className={styles.sectionGrid}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Display Language</label>
                  <div className={styles.selectWrapper}>
                    <select
                      value={settings.language}
                      onChange={(e) => handleChange('language', e.target.value)}
                    >
                      {languages.map((lang) => (
                        <option key={lang} value={lang}>{lang}</option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined">expand_more</span>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Region</label>
                  <div className={styles.selectWrapper}>
                    <select
                      value={settings.region}
                      onChange={(e) => handleChange('region', e.target.value)}
                    >
                      {regions.map((region) => (
                        <option key={region} value={region}>{region}</option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined">expand_more</span>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Time Zone</label>
                  <div className={styles.selectWrapper}>
                    <select
                      value={settings.timezone}
                      onChange={(e) => handleChange('timezone', e.target.value)}
                    >
                      {timezones.map((tz) => (
                        <option key={tz} value={tz}>{tz}</option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined">expand_more</span>
                  </div>
                </div>

                <div className={styles.formGroupRow}>
                  <div className={styles.formGroup}>
                    <label>Date Format</label>
                    <div className={styles.selectWrapper}>
                      <select
                        value={settings.dateFormat}
                        onChange={(e) => handleChange('dateFormat', e.target.value)}
                      >
                        {dateFormats.map((format) => (
                          <option key={format} value={format}>{format}</option>
                        ))}
                      </select>
                      <span className="material-symbols-outlined">expand_more</span>
                    </div>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Currency</label>
                    <div className={styles.selectWrapper}>
                      <select
                        value={settings.currency}
                        onChange={(e) => handleChange('currency', e.target.value)}
                      >
                        {currencies.map((curr) => (
                          <option key={curr} value={curr}>{curr}</option>
                        ))}
                      </select>
                      <span className="material-symbols-outlined">expand_more</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.previewCard}>
                <span>Interface Preview</span>
                <div className={styles.previewBox}>
                  <div className={styles.previewLine}></div>
                  <div className={styles.previewLine}></div>
                  <div className={styles.previewFooter}>
                    <span className={styles.previewTextPrimary}>Generar</span>
                    <span className={styles.previewTextSecondary}>$12.50</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* SECTION: PROFILE */}
        {activeTab === 'profile' && (
          <section className={styles.section}>
            <h3>Profile Settings</h3>
            <div className={styles.profileSection}>
              <div className={styles.avatarSection}>
                <div className={styles.avatarWrapper}>
                  <div className={styles.avatarImage}>
                    <img
                      src={user?.photo || 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" fill="#262631"/><circle cx="48" cy="38" r="19" fill="#4a4a5e"/><rect x="14" y="64" width="68" height="38" rx="19" fill="#4a4a5e"/></svg>')}
                      alt="Profile"
                    />
                  </div>
                </div>
                <div className={styles.profileForm}>
                  <div className={styles.formGroup}>
                    <label>Full Name</label>
                    <input type="text" value={[user?.firstName, user?.lastName].filter(Boolean).join(' ') || '—'} disabled />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Email Address</label>
                    <input type="email" value={user?.email || '—'} disabled />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Bio</label>
                    <textarea rows="3" value={user?.bio || ''} placeholder="No bio added yet." disabled />
                  </div>
                  <Link href="/dashboard/profile" className={styles.saveProfileBtn}>
                    Edit Full Profile
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* SECTION: SECURITY */}
        {activeTab === 'security' && (
          <section className={styles.section}>
            <h3>Security Settings</h3>
            <div className={styles.securitySection}>
              <div className={styles.securityCard}>
                <div className={styles.securityItem}>
                  <div>
                    <h4>Two-Factor Authentication</h4>
                    <p>Add an extra layer of security to your account</p>
                  </div>
                  <button
                    className={styles.securityBtn}
                    onClick={handleToggleTwoFactor}
                    disabled={isSavingTwoFactor}
                  >
                    {settings.twoFactorEnabled ? 'Disable' : 'Enable'}
                  </button>
                </div>

                <div className={styles.securityItem}>
                  <div>
                    <h4>Change Password</h4>
                    <p>Update your password regularly to keep your account secure</p>
                  </div>
                  <button
                    className={styles.securityBtn}
                    onClick={() => {
                      setShowPasswordForm((v) => !v);
                      setPasswordMessage({ type: '', text: '' });
                    }}
                  >
                    {showPasswordForm ? 'Cancel' : 'Change'}
                  </button>
                </div>

                {showPasswordForm && (
                  <div className={styles.passwordForm}>
                    <div className={styles.formGroup}>
                      <label>Current Password</label>
                      <input
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={(e) => handlePasswordFieldChange('currentPassword', e.target.value)}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>New Password</label>
                      <input
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => handlePasswordFieldChange('newPassword', e.target.value)}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Confirm New Password</label>
                      <input
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => handlePasswordFieldChange('confirmPassword', e.target.value)}
                      />
                    </div>
                    {passwordMessage.text && (
                      <p className={passwordMessage.type === 'error' ? styles.messageError : styles.messageSuccess}>
                        {passwordMessage.text}
                      </p>
                    )}
                    <button
                      className={styles.saveProfileBtn}
                      onClick={handleChangePassword}
                      disabled={
                        isChangingPassword ||
                        !passwordForm.currentPassword ||
                        !passwordForm.newPassword ||
                        !passwordForm.confirmPassword
                      }
                    >
                      {isChangingPassword ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                )}

                <div className={styles.securityItem}>
                  <div>
                    <h4>Active Sessions</h4>
                    <p>
                      {isLoadingSessions
                        ? 'Loading…'
                        : `You are logged in on ${sessions.length} device${sessions.length === 1 ? '' : 's'}`}
                    </p>
                  </div>
                  {sessions.length > 1 && (
                    <button className={styles.securityBtn} onClick={handleRevokeOtherSessions}>
                      Sign out others
                    </button>
                  )}
                </div>

                {sessionMessage && <p className={styles.messageSuccess}>{sessionMessage}</p>}

                {sessions.length > 0 && (
                  <div className={styles.sessionsList}>
                    {sessions.map((session) => (
                      <div key={session.id} className={styles.sessionRow}>
                        <div>
                          <h5>
                            {session.userAgent}
                            {session.isCurrent && <span className={styles.currentTag}>This device</span>}
                          </h5>
                          <p>
                            {session.ip ? `${session.ip} · ` : ''}
                            Last active {new Date(session.lastActiveAt).toLocaleString()}
                          </p>
                        </div>
                        <button className={styles.securityBtnSmall} onClick={() => handleRevokeSession(session.id)}>
                          Sign out
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className={styles.securityItem}>
                  <div>
                    <h4>Login History</h4>
                    <p>Review recent login activity</p>
                  </div>
                </div>

                {isLoadingHistory ? (
                  <p className={styles.mutedText}>Loading…</p>
                ) : (
                  <div className={styles.sessionsList}>
                    {loginHistory.map((entry) => (
                      <div key={entry.id} className={styles.sessionRow}>
                        <div>
                          <h5>{entry.userAgent}</h5>
                          <p>
                            {entry.ip ? `${entry.ip} · ` : ''}
                            {new Date(entry.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <span
                          className={entry.status === 'Active' ? styles.statusActiveTag : styles.statusSignedOutTag}
                        >
                          {entry.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* SECTION: BILLING */}
        {activeTab === 'billing' && (
          <section className={styles.section}>
            <h3>Billing &amp; Invoices</h3>
            <div className={styles.billingSection}>
              <div className={styles.billingCard}>
                <div className={styles.billingHeader}>
                  <span>Current Plan</span>
                  <span className={styles.billingPlan}>Professional</span>
                </div>
                <div className={styles.billingDetails}>
                  <div>
                    <span>Next Billing Date</span>
                    <span>November 24, 2024</span>
                  </div>
                  <div>
                    <span>Amount</span>
                    <span>$79.00 USD</span>
                  </div>
                  <div>
                    <span>Status</span>
                    <span className={styles.billingStatus}>Active</span>
                  </div>
                </div>
                <div className={styles.billingActions}>
                  <button className={styles.billingBtn}>Upgrade Plan</button>
                  <button className={styles.billingBtnSecondary}>View Invoices</button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* SECTION: FINAL CTA */}
        <section className={styles.footer}>
          <div>
            <h3>Everything is configured for your creative workflow.</h3>
          </div>
          <div className={styles.footerActions}>
            <Link href="/dashboard" className={styles.dashboardBtn}>
              Return to Dashboard
            </Link>
            {saveMessage && <span style={{ color: '#4ade80', marginRight: 12 }}>{saveMessage}</span>}
            <button className={styles.saveBtn} onClick={handleSaveSettings} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Settings'}</button>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}