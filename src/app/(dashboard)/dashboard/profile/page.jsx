'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import styles from './page.module.scss';

import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { useCurrency } from '@/context/CurrencyContext';
import { formatUserBalance } from '@/config/currency';

const DEFAULT_AVATAR =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="#262631"/><circle cx="60" cy="46" r="24" fill="#4a4a5e"/><rect x="18" y="80" width="84" height="46" rx="23" fill="#4a4a5e"/></svg>'
  );

const defaultProfile = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dob: '',
  bio: '',
  company: '',
  position: '',
  photo: '',
};

export default function ProfilePage() {
  const { user, token, refreshUser } = useAuth();
  const { currency } = useCurrency();
  const [profile, setProfile] = useState(defaultProfile);
  const [savedProfile, setSavedProfile] = useState(defaultProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    const next = {
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phone: user.phone || '',
      dob: user.dob || '',
      bio: user.bio || '',
      company: user.company || '',
      position: user.position || '',
      photo: user.photo || '',
    };
    setProfile(next);
    setSavedProfile(next);
  }, [user]);

  const handleChange = (key, value) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
    setSaveMessage('');
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');
    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(profile),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to update profile.');

      await refreshUser();
      setSavedProfile(profile);
      setIsEditing(false);
      setSaveMessage('Profile updated successfully.');
    } catch (err) {
      setSaveMessage(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setProfile(savedProfile);
    setIsEditing(false);
    setSaveMessage('');
  };

  const handlePhotoUpload = () => {
    fileInputRef.current?.click();
  };

  // Photo changes save immediately (no need to hit "Save Changes" first),
  // so the new picture shows up everywhere — including the dashboard top bar —
  // right away instead of only living in local state until the form is submitted.
  const savePhoto = async (photo) => {
    setProfile((prev) => ({ ...prev, photo }));
    setSavedProfile((prev) => ({ ...prev, photo }));
    setSaveMessage('');
    setIsSaving(true);
    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ photo }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to update photo.');
      await refreshUser();
      setSaveMessage('Profile photo updated.');
    } catch (err) {
      setSaveMessage(err.message || 'Failed to update photo.');
    } finally {
      setIsSaving(false);
    }
  };

  // Downscale + compress the picked file client-side before it becomes a data
  // URL, so a phone-camera photo doesn't turn into a multi-megabyte payload.
  const readAndResizeImage = (file, maxSize = 512, quality = 0.85) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Could not read the selected file.'));
      reader.onload = () => {
        const img = document.createElement('img');
        img.onerror = () => reject(new Error('Could not read the selected image.'));
        img.onload = () => {
          const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.src = typeof reader.result === 'string' ? reader.result : '';
      };
      reader.readAsDataURL(file);
    });

  const handlePhotoSelection = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const photo = await readAndResizeImage(file);
      await savePhoto(photo);
    } catch (err) {
      setSaveMessage(err.message || 'Failed to update photo.');
    }
  };

  const handleRemovePhoto = () => {
    savePhoto(defaultProfile.photo);
  };

  const quickStats = [
    { label: 'Member Since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—' },
    { label: 'Workspace Status', value: 'Active', highlight: true },
    { label: 'Balance', value: formatUserBalance(user, currency) },
    { label: 'Generations', value: String(user?.stats?.generations ?? 0) },
  ];

  return (
    <DashboardLayout>
      <div className={styles.profile}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>
              <span className={styles.pulseDot}></span>
              <span>Account Settings</span>
            </div>
            <h1>My Profile</h1>
            <p>
              Manage your professional identity, creative preferences, and billing information. Your
              profile is the foundation of your dexericai experience.
            </p>
          </div>

          <div className={styles.profileCard}>
            <div className={styles.profileCardGlow}></div>
            <div className={styles.profileCardContent}>
              <div className={styles.avatarSection}>
                <div className={styles.avatarWrapper}>
                  <Image
                    src={profile.photo || DEFAULT_AVATAR}
                    alt="Profile"
                    width={120}
                    height={120}
                    unoptimized
                    className={styles.profileImage}
                  />
                  <div className={styles.verifiedBadge}>
                    <span className="material-symbols-outlined">verified</span>
                  </div>
                </div>
                <div className={styles.profileInfo}>
                  <h3>
                    {profile.firstName} {profile.lastName}
                  </h3>
                  <div className={styles.planBadge}>Professional Plan</div>
                  <p>
                    <span className="material-symbols-outlined">calendar_month</span>
                    Member Since Oct 2023
                  </p>
                  <p className={styles.statusActive}>
                    <span className={styles.statusDot}></span>
                    Workspace Active
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.personalInfo}>
          <div className={styles.sectionHeader}>
            <span className="material-symbols-outlined">person</span>
            <h2>Personal Information</h2>
          </div>

          <div className={styles.infoCard}>
            <div className={styles.photoSection}>
              <div className={styles.photoWrapper}>
                <Image
                  src={profile.photo || DEFAULT_AVATAR}
                  alt="Profile Photo"
                  width={180}
                  height={180}
                  unoptimized
                  className={styles.profilePhoto}
                />
                <div className={styles.photoOverlay} onClick={handlePhotoUpload}>
                  <span className="material-symbols-outlined">photo_camera</span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handlePhotoSelection}
                />
              </div>
              <div className={styles.photoActions}>
                <button className={styles.uploadBtn} onClick={handlePhotoUpload}>
                  Upload New Photo
                </button>
                <button className={styles.removeBtn} onClick={handleRemovePhoto}>
                  Remove Photo
                </button>
              </div>
            </div>

            <div className={styles.formSection}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>First Name</label>
                  <input
                    type="text"
                    value={profile.firstName}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Last Name</label>
                  <input
                    type="text"
                    value={profile.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Email Address</label>
                <div className={styles.emailWrapper}>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    disabled={!isEditing}
                  />
                  <span className="material-symbols-outlined">check_circle</span>
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Date of Birth</label>
                  <input
                    type="text"
                    value={profile.dob}
                    onChange={(e) => handleChange('dob', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Company</label>
                  <input
                    type="text"
                    value={profile.company}
                    onChange={(e) => handleChange('company', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Position</label>
                  <input
                    type="text"
                    value={profile.position}
                    onChange={(e) => handleChange('position', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Bio</label>
                <textarea
                  rows="3"
                  value={profile.bio}
                  onChange={(e) => handleChange('bio', e.target.value)}
                  disabled={!isEditing}
                />
              </div>

              {saveMessage ? (
                <p style={{ marginTop: '0.75rem', color: '#7cd6b0', fontWeight: 600 }}>{saveMessage}</p>
              ) : null}

              <div className={styles.formActions}>
                {!isEditing ? (
                  <button className={styles.editBtn} onClick={() => setIsEditing(true)}>
                    Edit Profile
                  </button>
                ) : (
                  <>
                    <button className={styles.cancelBtn} onClick={handleCancel}>
                      Cancel
                    </button>
                    <button className={styles.saveBtn} onClick={handleSave} disabled={isSaving}>
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className={styles.stats}>
          <div className={styles.statsGrid}>
            {quickStats.map((stat, index) => (
              <div key={index} className={styles.statCard}>
                <span className={styles.statLabel}>{stat.label}</span>
                <span className={`${styles.statValue} ${stat.highlight ? styles.statHighlight : ''}`}>
                  {stat.value}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.footer}>
          <div>
            <h3>Your creative identity is always up to date.</h3>
            <p>Changes are saved securely across the dexericai network.</p>
          </div>
          <div className={styles.footerActions}>
            <Link href="/dashboard" className={styles.dashboardBtn}>
              Return to Dashboard
            </Link>
            <button className={styles.saveChangesBtn} onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
