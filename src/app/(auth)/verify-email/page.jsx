'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/common/Header';
import styles from './page.module.scss';

export default function VerifyEmailPage() {
  const [status, setStatus] = useState('pending');
  const [message, setMessage] = useState('Verifying your email address...');

  useEffect(() => {
    const searchToken = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('token') : null;
    if (!searchToken) {
      setStatus('error');
      setMessage('Verification token is missing.');
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

        setStatus('success');
        setMessage(data.message || 'Your email has been verified successfully.');
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
            {status === 'success' ? 'check_circle' : status === 'error' ? 'error' : 'hourglass_top'}
          </span>
        </span>
        <h1>{status === 'success' ? 'Email Verified' : status === 'error' ? 'Verification Failed' : 'Verifying...'}</h1>
        <p>{message}</p>

        {status === 'success' ? (
          <Link href="/login" className={styles.primaryBtn}>
            Continue to Login
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
        ) : null}
      </div>
    </div>
  );
}
