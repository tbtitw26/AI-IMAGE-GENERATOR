'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';

export default function PublicGalleryPage() {
  const { isAuthenticated } = useAuth();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    // If user is authenticated, redirect to dashboard gallery
    if (isAuthenticated && !redirecting) {
      setRedirecting(true);
      window.location.href = '/dashboard/gallery';
    }
  }, [isAuthenticated, redirecting]);

  if (redirecting) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0e1a', color: '#94a3b8' }}>
        Redirecting to your gallery...
      </div>
    );
  }

  return (
    <>
      <Header />
      <main style={{ minHeight: '100vh', background: '#0a0e1a', paddingTop: '60px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 24px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '48px', fontWeight: 'bold', color: '#f3f4f6', marginBottom: '16px' }}>
            Community Gallery
          </h1>
          <p style={{ fontSize: '18px', color: '#94a3b8', marginBottom: '32px' }}>
            Sign in to access your personal gallery and view your AI-generated images.
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginTop: '48px' }}>
            <div style={{ background: 'rgba(178, 197, 255, 0.05)', border: '1px solid rgba(178, 197, 255, 0.2)', borderRadius: '12px', padding: '24px' }}>
              <h3 style={{ color: '#b2c5ff', marginBottom: '8px' }}>Sign In</h3>
              <p style={{ color: '#94a3b8', marginBottom: '16px', fontSize: '14px' }}>
                Access your personal gallery and all your generated images.
              </p>
              <Link 
                href="/login"
                style={{
                  display: 'inline-block',
                  background: '#b2c5ff',
                  color: '#000',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontWeight: 'bold',
                  transition: 'opacity 0.3s',
                }}
                onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                onMouseLeave={(e) => e.target.style.opacity = '1'}
              >
                Sign In
              </Link>
            </div>

            <div style={{ background: 'rgba(178, 197, 255, 0.05)', border: '1px solid rgba(178, 197, 255, 0.2)', borderRadius: '12px', padding: '24px' }}>
              <h3 style={{ color: '#b2c5ff', marginBottom: '8px' }}>New User?</h3>
              <p style={{ color: '#94a3b8', marginBottom: '16px', fontSize: '14px' }}>
                Create an account to start generating and managing AI images.
              </p>
              <Link 
                href="/register"
                style={{
                  display: 'inline-block',
                  background: 'transparent',
                  color: '#b2c5ff',
                  border: '1px solid #b2c5ff',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontWeight: 'bold',
                  transition: 'all 0.3s',
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(178, 197, 255, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent';
                }}
              >
                Get Started
              </Link>
            </div>
          </div>

          <div style={{ marginTop: '48px', padding: '32px', background: 'rgba(178, 197, 255, 0.05)', borderRadius: '12px', border: '1px solid rgba(178, 197, 255, 0.2)' }}>
            <h3 style={{ color: '#f3f4f6', marginBottom: '16px' }}>About Your Gallery</h3>
            <p style={{ color: '#94a3b8', lineHeight: '1.6' }}>
              Your personal gallery stores all AI-generated images created through dexericai. 
              You can organize, favorite, and download your creations. All images are securely stored 
              in your account and backed up automatically.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
