'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import styles from './page.module.scss';

// Імпорт компонентів
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';

const MODEL_FILTERS = ['All Outputs', 'Aether Ultra', 'Cinema 4K', 'Product Studio', 'Character Gen'];

export default function GalleryPage() {
  const { token } = useAuth();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [selectedImage, setSelectedImage] = useState(null);

  const loadImages = async () => {
    if (!token) return;
    setIsLoading(true);
    setError('');
    try {
      const url = projectId ? `/api/gallery?projectId=${projectId}` : '/api/gallery';
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to load gallery.');
      setImages(data.images || []);
    } catch (err) {
      setError(err.message || 'Failed to load gallery.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, projectId]);

  const toggleFavorite = async (image) => {
    setImages((prev) => prev.map((img) => (img.id === image.id ? { ...img, favorite: !img.favorite } : img)));
    try {
      await fetch('/api/gallery', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: image.id, favorite: !image.favorite }),
      });
    } catch {
      // revert on failure
      setImages((prev) => prev.map((img) => (img.id === image.id ? { ...img, favorite: image.favorite } : img)));
    }
  };

  const deleteImage = async (image) => {
    if (!window.confirm('Delete this image permanently?')) return;
    const prevImages = images;
    setImages((prev) => prev.filter((img) => img.id !== image.id));
    setSelectedImage(null);
    try {
      const response = await fetch(`/api/gallery?id=${image.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Delete failed');
    } catch {
      setImages(prevImages);
      alert('Failed to delete image.');
    }
  };

  const filteredImages = filter === 'all' ? images : images.filter((img) => img.category === filter);

  const sortedImages = [...filteredImages].sort((a, b) => {
    if (sortBy === 'date') return new Date(b.createdAt) - new Date(a.createdAt);
    return 0;
  });

  return (
    <DashboardLayout>
      <div className={styles.gallery}>
        {/* SECTION 1: HEADER */}
        <section className={styles.header}>
          <div className={styles.headerContent}>
            <h1>Generated Images</h1>
            <p>Review and manage your AI generation portfolio. All images are stored in your account.</p>
            {projectId && (
              <p style={{ color: '#b2c5ff' }}>
                Filtered by project. <a href="/dashboard/gallery" style={{ color: '#b2c5ff', textDecoration: 'underline' }}>Show all</a>
              </p>
            )}
          </div>
        </section>

        {/* Filter Bar */}
        <div className={styles.filterBar}>
          <div className={styles.filterTabs}>
            {MODEL_FILTERS.map((f) => (
              <button
                key={f}
                className={`${styles.filterTab} ${filter === (f === 'All Outputs' ? 'all' : f) ? styles.active : ''}`}
                onClick={() => setFilter(f === 'All Outputs' ? 'all' : f)}
              >
                {f}
              </button>
            ))}
          </div>
          <div className={styles.filterActions}>
            <button className={styles.sortBtn} onClick={() => setSortBy('date')}>
              <span className="material-symbols-outlined">sort</span>
              Sort by: Date
            </button>
          </div>
        </div>

        {error && <p style={{ color: '#f87171' }}>{error}</p>}

        {isLoading ? (
          <p style={{ color: '#94a3b8' }}>Loading gallery...</p>
        ) : sortedImages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8' }}>
            <p>No images yet. Head to Generate to create your first one.</p>
          </div>
        ) : (
          <section className={styles.galleryGrid}>
            <div className={styles.masonryGrid}>
              {sortedImages.map((image) => (
                <div key={image.id} className={styles.masonryItem}>
                  <div className={styles.imageCard}>
                    <div className={styles.imageWrapper}>
                      <img src={image.src} alt={image.title} className={styles.imageZoom} loading="lazy" />
                      <div className={styles.imageOverlay}>
                        <div className={styles.overlayTop}>
                          <span className={styles.modelBadge}>{image.model}</span>
                          <button
                            className={styles.favoriteBtn}
                            onClick={() => toggleFavorite(image)}
                            style={{ color: image.favorite ? '#f87171' : undefined }}
                          >
                            <span className="material-symbols-outlined">favorite</span>
                          </button>
                        </div>
                        <div className={styles.overlayBottom}>
                          <p className={styles.imageTitle}>{image.title}</p>
                          <div className={styles.imageActions}>
                            <div className={styles.imageMeta}>
                              <span>{image.aspectRatio}</span>
                            </div>
                            <div className={styles.actionButtons}>
                              <button className={styles.variantBtn} onClick={() => setSelectedImage(image)}>Preview</button>
                              <a className={styles.downloadBtn} href={image.src} download={`aetherframe-${image.id}.png`}>Download</a>
                              <button className={styles.downloadBtn} style={{ background: 'transparent', color: '#f87171' }} onClick={() => deleteImage(image)}>Delete</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {selectedImage && (
          <div style={{ marginTop: '24px', background: 'rgba(22, 22, 30, 0.9)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(178, 197, 255, 0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, color: '#f3f4f6' }}>{selectedImage.title}</h3>
                <p style={{ margin: '4px 0 0', color: '#c3c6d6' }}>{selectedImage.category}</p>
              </div>
              <button onClick={() => setSelectedImage(null)} style={{ background: 'transparent', color: '#b2c5ff', border: '1px solid rgba(178, 197, 255, 0.2)', borderRadius: '999px', padding: '8px 12px', cursor: 'pointer' }}>Close</button>
            </div>
            <img src={selectedImage.src} alt={selectedImage.title} style={{ maxWidth: '100%', borderRadius: 8 }} />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
