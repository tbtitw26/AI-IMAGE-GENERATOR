'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';

const SAMPLE_GALLERY = [
  {
    id: 1,
    title: 'Neon Metropolis',
    category: 'Cinematic',
    model: 'Cinema 4K',
    ratio: '16:9',
    src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDqZfKX0aP8kPE_MtGXRQPec5vbcVhQqDVqeJoFPwkhcRvyZwf18Zc_k-z7aUFaxPeZV6ZaWUiX5l5okR6NtAKLwYkZuOkWfna__HvBivBSXRFai9mgVeh7vw-O9EPHzTXj22ILtTI0JnqRRayfWPKbqjLi6o2rP5A0Jy9L1RthcW7gIjZLnJYFJXBkOXgkrJUSGWxedRa-5TFIiCg4tuuhDOL8wdB7YTqTsRVFaVWoHcxrA4TjbqwkBQ',
  },
  {
    id: 2,
    title: 'Luxury Chronograph',
    category: 'Product',
    model: 'Product Studio',
    ratio: '1:1',
    src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCuOadBGN1vPQiW3DRRu1JwDJe7A-1mVI5br9NnKgAeKFYnWVLkXxzwLkcOOj0j85tuMOEpjqhz5LJ2eFN8N1HV68D2NquM5VacdrMsazDTqMJCWUBPZo8tEytjC5-uLLibho2IA6NDKA-RxzgBX-vp5MUA3lTW06D6T-FqsFaY8ygKjXWkIUe6U6FC_xH2PDOuQehPwh3W6IWm5eYRfDlmQsldgtBnrGhqZIAW47ctep2WquGSHEWcsA',
  },
  {
    id: 3,
    title: 'Editorial Haute Couture',
    category: 'Fashion',
    model: 'Aether Ultra',
    ratio: '3:4',
    src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBs0LPQKrtWAIPN9_UNrs2gzS66AGYPS0Nc2Pm0cRUKlLnvlPIoET71J_Ftf1s4BDXFn7yU3kpMRbxpT8-Y7kKvUDWKEiQluXqkNIcaQAaSwEkWGJ5WcXxk_eQuKwM555qCueX741qIxGJQrs6BX0zOoX34Odkht2wnuPDiNXfGgOz_3sl1qTaiEobcYkYisPA1dQBwQhU-XfSH3LtO00Z7kohouWbyOOHU2Xo-3-H2IstYI2g4CvmYFg',
  },
  {
    id: 4,
    title: 'Minimalist Glass Villa',
    category: 'Architecture',
    model: 'Cinema 4K',
    ratio: '16:9',
    src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC7MxJEOwJWOFK15iYS5pw84XJWw10CNwPZwar8YPwtdXFFpBePPteOSqbuxVu79PLPhGWI9DeN2RPBtMREU0mDoZ5Kn2UdLVR45awXOmovpHnpjDDlHlnq4oiJOwNSWikVClaLYRRLDYBnYAYqHYkZEbnhHHISPeiV3Kxwm9duhTe7ri-Zg0o2kcljhAhYh2wCpR5f-B0Ayx2v-Cs3WDBeyTohLiFOgn7qgPgDZ0Qjnk84BcuNyq68LA',
  },
  {
    id: 5,
    title: 'Cyberpunk Protagonist',
    category: 'Character',
    model: 'Character Gen',
    ratio: '9:16',
    src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDDkI7zR3yHMGKFU_9a5FUQ31qkuRwGKa3zhabkSchzO0blyrUtsswvxTg6oxRJ8xStXmo4M9fUU1YT3LOds2ePKfc6LWSik1k5sjcsP3H-kG3jxRF28vhh8Ib6-gdlc4WnBpvGik2xPHlRUmT63n5TC2NVJKP2pgnMNT6bInnrdd0qn-LYfTpW1wZ-80Nwa0ZW2R57PYBuPZei7PyicFgk_69Uin6pvR6e4UdY_qk4ysLM6R47p4swUA',
  },
  {
    id: 6,
    title: 'Fine Diamond Ring',
    category: 'Product',
    model: 'Product Studio',
    ratio: '1:1',
    src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCU3SjI03MwrXllGICxRP6o5NKooU9g4pPfc4TnnT23SExATt6BSbWOppMnT9a7wZtW0pEaKNMSr8GNdfdKcYJynh3zL22wuXEBQInFK8UhEAL74xZ_5xeAKeIexe1QdMSsXLWMp6Q4jpNeKZ712mRx8ycyZqS1OUL8PTOV-FGYVAbdKHqYeCrcHVtEqi1_5L11cTmcq_ZWeTgylsJu0u_trYLSMxbxng7_pqfrP-1fubvVn80wMcDyWQ',
  },
];

const CATEGORIES = ['All', 'Cinematic', 'Product', 'Fashion', 'Architecture', 'Character'];

export default function PublicGalleryPage() {
  const { isAuthenticated } = useAuth();
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedImage, setSelectedImage] = useState(null);

  const filtered = activeCategory === 'All'
    ? SAMPLE_GALLERY
    : SAMPLE_GALLERY.filter((item) => item.category === activeCategory);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #070a1b 0%, #0e1636 100%)', color: '#fff' }}>
      <Header />
      
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '120px 24px 80px' }}>
        {/* Banner for logged-in users */}
        {isAuthenticated && (
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '16px', padding: '16px 24px', marginBottom: '36px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="material-symbols-outlined" style={{ color: '#3b82f6' }}>photo_library</span>
              <span style={{ fontSize: '15px', color: '#e2e8f0' }}>You are logged in. Access your personal workspace gallery and saved projects.</span>
            </div>
            <Link
              href="/dashboard/gallery"
              style={{ background: '#2563eb', color: '#fff', padding: '8px 20px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '14px' }}
            >
              My Gallery →
            </Link>
          </div>
        )}

        {/* Hero Title */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <span style={{ display: 'inline-block', background: 'rgba(178, 197, 255, 0.1)', color: '#b2c5ff', padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
            SHOWCASE GALLERY
          </span>
          <h1 style={{ fontSize: '42px', fontWeight: 800, color: '#f8fafc', marginBottom: '16px', letterSpacing: '-0.5px' }}>
            AI Artistry &amp; Visual Showcase
          </h1>
          <p style={{ fontSize: '18px', color: '#94a3b8', maxWidth: '640px', margin: '0 auto', lineHeight: 1.6 }}>
            Explore high-resolution, production-grade visual assets generated with the dexericai AI Rendering Engine.
          </p>
        </div>

        {/* Category Filter Tabs */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '40px' }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                background: activeCategory === cat ? '#2563eb' : 'rgba(255, 255, 255, 0.05)',
                color: activeCategory === cat ? '#ffffff' : '#94a3b8',
                border: activeCategory === cat ? '1px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.1)',
                padding: '10px 20px',
                borderRadius: '20px',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedImage(item)}
              style={{
                position: 'relative',
                borderRadius: '16px',
                overflow: 'hidden',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                cursor: 'pointer',
                transition: 'transform 0.3s ease, border-color 0.3s ease',
              }}
            >
              <div style={{ width: '100%', paddingTop: '75%', position: 'relative' }}>
                <img
                  src={item.src}
                  alt={item.title}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#f1f5f9' }}>{item.title}</h4>
                  <span style={{ fontSize: '13px', color: '#94a3b8' }}>{item.category} • {item.model}</span>
                </div>
                <span className="material-symbols-outlined" style={{ color: '#b2c5ff' }}>fullscreen</span>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Card */}
        <div style={{ marginTop: '64px', background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '24px', padding: '48px 32px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#ffffff', marginBottom: '16px' }}>Ready to generate your own assets?</h2>
          <p style={{ fontSize: '16px', color: '#cbd5e1', maxWidth: '540px', margin: '0 auto 28px', lineHeight: 1.6 }}>
            Join professionals creating ultra-realistic images, marketing materials, and architectural visualizations in seconds.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <Link
              href="/register"
              style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', color: '#ffffff', padding: '14px 32px', borderRadius: '12px', textDecoration: 'none', fontWeight: 700, fontSize: '16px', boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)' }}
            >
              Start Generating
            </Link>
            <Link
              href="/pricing"
              style={{ background: 'rgba(255, 255, 255, 0.08)', color: '#e2e8f0', border: '1px solid rgba(255, 255, 255, 0.15)', padding: '14px 32px', borderRadius: '12px', textDecoration: 'none', fontWeight: 600, fontSize: '16px' }}
            >
              View Pricing
            </Link>
          </div>
        </div>
      </main>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '24px' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '800px', width: '100%', background: '#0f172a', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.1)', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}
          >
            <img src={selectedImage.src} alt={selectedImage.title} style={{ width: '100%', maxHeight: '500px', objectFit: 'cover' }} />
            <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '20px', color: '#f8fafc' }}>{selectedImage.title}</h3>
                <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#94a3b8' }}>Category: {selectedImage.category} | Model: {selectedImage.model} | Ratio: {selectedImage.ratio}</p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <Link href="/register" style={{ background: '#2563eb', color: '#fff', padding: '10px 20px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '14px' }}>
                  Generate Similar
                </Link>
                <button onClick={() => setSelectedImage(null)} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
