'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/common/Header';
import styles from './page.module.scss';

export default function VerifyEmailPage() {
  const [status, setStatus] = useState('pending');
  const [message, setMessage] = useState('Verifying your email address...');
  const [userEmail, setUserEmail] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [resendStatus, setResendStatus] = useState('idle');
  const [resendMessage, setResendMessage] = useState('');

  const handleResend = async (e) => {
    if (e) e.preventDefault();
    const targetEmail = resendEmail || userEmail;
    if (!targetEmail) return;
    setResendStatus('loading');
    setResendMessage('');
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail }),
      });
      const text = await response.text();
      const data = text ? JSON.parse(text) : {};
      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend verification email.');
      }
      setResendStatus('sent');
      setResendMessage(data.message || 'If an account with that email exists and is not yet verified, a new verification email has been sent.');
    } catch (error) {
      setResendStatus('error');
      setResendMessage(error.message || 'Failed to resend verification email.');
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const searchToken = params.get('token');
    const searchEmail = params.get('email');

    if (searchEmail) {
      setUserEmail(searchEmail);
      setResendEmail(searchEmail);
    }

    if (!searchToken) {
      setStatus('awaiting');
      setMessage(
        searchEmail
          ? `We've sent a verification link to ${searchEmail}. Please check your inbox (and spam folder) and click the link to activate your account.`
          : "We've sent a verification link to your email. Please check your inbox (and spam folder) and click the link to activate your account."
      );
      return;
    }

    const verify = async () => {
      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token: searchToken }),
        });

        const text = await response.text();
        const data = text ? JSON.parse(text) : {};
        if (!response.ok) {
          throw new Error(data.message || 'Verification failed.');
        }

        // Auto-login: Save session token and user info to localStorage
        if (data.token && data.user) {
          window.localStorage.setItem('token', data.token);
          window.localStorage.setItem('user', JSON.stringify(data.user));
          window.dispatchEvent(new Event('auth-state-changed'));
        }

        setStatus('success');
        setMessage(data.message || 'Your email has been verified successfully! Redirecting to dashboard...');

        // Auto redirect to dashboard after 1.5 seconds
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1500);
      } catch (error) {
        setStatus('error');
        setMessage(error.message || 'Verification failed.');
      }
    };

    verify();
  }, []);

  return (
    <div className={styles.verifyEmailPage}>
      <Header />
      <div className={styles.card}>
        <span className={styles.icon}>
          <span className="material-symbols-outlined">
            {status === 'success' ? 'check_circle' : status === 'error' ? 'error' : status === 'awaiting' ? 'mail' : 'hourglass_top'}
          </span>
        </span>
        <h1>
          {status === 'success'
            ? 'Email Verified!'
            : status === 'error'
            ? 'Verification Failed'
            : status === 'awaiting'
            ? 'Check Your Inbox'
            : 'Verifying...'}
        </h1>
        <p>{message}</p>

        {status === 'success' ? (
          <Link href="/dashboard" className={styles.primaryBtn}>
            Go to Dashboard
          </Link>
        ) : status === 'error' ? (
          <div className={styles.buttonRow}>
            <Link href="/register" className={styles.secondaryBtn}>
              Try Again
            </Link>
            <Link href="/login" className={styles.primaryBtn}>
              Go to Login
            </Link>
          </div>
        ) : status === 'awaiting' ? (
          <>
            {userEmail && !showEmailInput ? (
              <div style={{ margin: '16px 0' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '12px 16px', borderRadius: '12px', marginBottom: '16px', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#38bdf8', fontWeight: 600, wordBreak: 'break-all' }}>
                  ✉️ {userEmail}
                </div>
                <div className={styles.buttonRow}>
                  <button type="button" onClick={() => handleResend()} className={styles.primaryBtn} disabled={resendStatus === 'loading'}>
                    {resendStatus === 'loading' ? 'Sending...' : 'Resend Email'}
                  </button>
                  <button type="button" onClick={() => setShowEmailInput(true)} className={styles.secondaryBtn} style={{ cursor: 'pointer' }}>
                    Use another email
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleResend} style={{ width: '100%', display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
                <input
                  type="email"
                  required
                  placeholder="Your email address"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  style={{ flex: 1, minWidth: '200px', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff' }}
                />
                <button type="submit" className={styles.primaryBtn} disabled={resendStatus === 'loading'}>
                  {resendStatus === 'loading' ? 'Sending...' : 'Resend Email'}
                </button>
              </form>
            )}

            {resendMessage ? <p style={{ marginTop: '12px', fontSize: '14px', color: resendStatus === 'error' ? '#f87171' : '#4ade80' }}>{resendMessage}</p> : null}

            <div className={styles.buttonRow} style={{ marginTop: '20px' }}>
              <Link href="/login" className={styles.secondaryBtn}>
                Back to Login
              </Link>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
