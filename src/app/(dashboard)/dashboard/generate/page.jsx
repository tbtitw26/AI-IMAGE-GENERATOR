'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.scss';

// Імпорт компонентів
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useImageGeneration } from '@/hooks/useImageGeneration';
import { useAuth } from '@/hooks/useAuth';
import { PLAN_LIMITS, PREMIUM_MODELS } from '@/lib/plan';

export default function GeneratePage() {
  const { token, user } = useAuth();
  const plan = user?.plan || 'free';
  const planLimits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('Aether Ultra');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [imageCount, setImageCount] = useState(4);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [lastGeneration, setLastGeneration] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const textareaRef = useRef(null);
  const { generate, isGenerating, error: generationError } = useImageGeneration();
  const [lockedModelHint, setLockedModelHint] = useState('');

  const effectiveImageCount = Math.min(imageCount, planLimits.maxImagesPerGeneration);

  useEffect(() => {
    if (!token) return;
    fetch('/api/projects', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => setProjects(data.projects || []))
      .catch(() => {});
  }, [token]);

  const models = [
    { name: 'Aether Ultra', icon: 'diamond', description: 'Premium quality, balanced for everything', variant: 'ultra' },
    { name: 'Cinema 4K', icon: 'movie', description: 'Cinematic color & depth of field', variant: 'cinema' },
    { name: 'Product Studio', icon: 'photo_camera', description: 'Clean studio lighting for products', variant: 'studio' },
    { name: 'Character Gen', icon: 'person', description: 'Consistent character design', variant: 'character' },
  ];

  const aspectRatios = ['16:9', '1:1', '9:16', '4:3', '3:4'];

  const getAspectDims = (ratio) => {
    const [w, h] = ratio.split(':').map(Number);
    const maxDim = 22;
    return w >= h
      ? { width: maxDim, height: Math.max(6, Math.round((h / w) * maxDim)) }
      : { width: Math.max(6, Math.round((w / h) * maxDim)), height: maxDim };
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      alert('Please enter a prompt');
      return;
    }

    setGeneratedImages([]);

    const result = await generate({
      prompt,
      negativePrompt,
      model: selectedModel,
      aspectRatio,
      imageCount: effectiveImageCount,
      projectId: selectedProjectId || null,
    });

    if (result.success) {
      setGeneratedImages(result.images);
      setLastGeneration({
        prompt: prompt.trim(),
        model: selectedModel,
        aspectRatio,
        imageCount: effectiveImageCount,
        negativePrompt: negativePrompt.trim(),
        commercialLicense: result.commercialLicense,
      });
    } else if (result.message) {
      alert(result.message);
    }
  };

  const handleEnhance = () => {
    const enhancement = ' cinematic lighting, ultra detailed, high contrast, sharp focus';
    setPrompt((current) => `${current.trim()}${current.trim() ? '' : ''}${enhancement}`.trim());
    textareaRef.current?.focus();
  };

  const handleRandom = () => {
    const presets = [
      'a neon cyberpunk city at sunrise, cinematic composition, volumetric lighting',
      'a luxury product shot on a marble pedestal, soft studio light, premium editorial look',
      'a fantasy forest with glowing mushrooms, misty atmosphere, vibrant colors',
      'a futuristic aircraft interior, clean minimal design, dramatic reflections',
    ];

    const preset = presets[Math.floor(Math.random() * presets.length)];
    setPrompt(preset);
    textareaRef.current?.focus();
  };

  const handleHistory = () => {
    if (!lastGeneration) return;

    setPrompt(lastGeneration.prompt);
    setSelectedModel(lastGeneration.model);
    setAspectRatio(lastGeneration.aspectRatio);
    setImageCount(lastGeneration.imageCount);
    setNegativePrompt(lastGeneration.negativePrompt || '');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  // Реальний (клієнтський) 2x апскейл — доступний з плану Studio.
  // Малює зображення на canvas удвічі більшого розміру та скачує PNG.
  const handleUpscale = (dataUrl, index) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width * 2;
      canvas.height = img.height * 2;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `aetherframe-${index + 1}-upscaled-2x.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
    img.src = dataUrl;
  };

  return (
    <DashboardLayout>
      <div className={styles.generate}>
        <div className={styles.accentBar} />

        {/* Page Header */}
        <header className={styles.pageHeader}>
          <div>
            <span className={styles.eyebrow}>Generation Studio</span>
            <h1>
              Craft your next <span className={styles.gradientWord}>frame</span>
            </h1>
            <p>Describe a scene, pick an engine, and render premium visuals in seconds.</p>
          </div>
          <Link href="/pricing" className={styles.planChip}>
            <span className="material-symbols-outlined">workspace_premium</span>
            {plan === 'studio' || plan === 'enterprise' ? 'Studio' : plan === 'creator' ? 'Creator' : 'Free'} plan
          </Link>
        </header>

        {/* SECTION 1: GENERATION STUDIO */}
        <section className={styles.studio}>
          {/* Left: Control Panel */}
          <div className={styles.controlPanel}>
            <div className={styles.panelCard}>
              {/* Prompt */}
              <div className={styles.promptSection}>
                <div className={styles.promptHeader}>
                  <label>
                    <span className={styles.sectionIcon}>
                      <span className="material-symbols-outlined">edit_note</span>
                    </span>
                    Master Prompt
                  </label>
                  <div className={styles.promptActions}>
                    <button className={styles.actionBtn} onClick={handleEnhance}>
                      <span className="material-symbols-outlined">auto_fix_high</span>
                      Enhance
                    </button>
                    <button className={styles.actionBtn} onClick={handleRandom}>
                      <span className="material-symbols-outlined">shuffle</span>
                      Random
                    </button>
                    <button className={styles.actionBtn} onClick={handleHistory} disabled={!lastGeneration}>
                      <span className="material-symbols-outlined">history</span>
                      History
                    </button>
                  </div>
                </div>
                <div className={styles.promptInputWrap}>
                  <textarea
                    ref={textareaRef}
                    className={styles.promptInput}
                    placeholder="A neon-lit cyberpunk alley at midnight, cinematic composition, volumetric fog..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={4}
                  />
                  <span className={styles.charCount}>{prompt.length}</span>
                </div>
              </div>

              {/* Negative Prompt */}
              <div className={styles.negativeSection}>
                <label>
                  <span className={styles.sectionIcon}>
                    <span className="material-symbols-outlined">block</span>
                  </span>
                  Negative Prompt
                </label>
                <textarea
                  className={styles.negativeInput}
                  placeholder="Blurry, low resolution, bad anatomy..."
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  rows={2}
                />
              </div>

              {/* Model Engine */}
              <div className={styles.modelSection}>
                <label>
                  <span className={styles.sectionIcon}>
                    <span className="material-symbols-outlined">auto_awesome_mosaic</span>
                  </span>
                  Model Engine
                </label>
                <div className={styles.modelGrid}>
                  {models.map((model) => {
                    const isLocked = PREMIUM_MODELS.includes(model.name) && !planLimits.premiumModels;
                    return (
                      <button
                        key={model.name}
                        className={`${styles.modelBtn} ${selectedModel === model.name ? styles.modelActive : ''} ${isLocked ? styles.modelLocked : ''}`}
                        data-variant={model.variant}
                        onClick={() => {
                          if (isLocked) {
                            setLockedModelHint(`${model.name} requires the Studio plan. You're currently on the ${plan === 'creator' ? 'Creator' : 'Free'} plan.`);
                            return;
                          }
                          setLockedModelHint('');
                          setSelectedModel(model.name);
                        }}
                      >
                        <span className={styles.modelIconWrap}>
                          <span className="material-symbols-outlined">{isLocked ? 'lock' : model.icon}</span>
                        </span>
                        <span className={styles.modelText}>
                          <span className={styles.modelName}>{model.name}</span>
                          <span className={styles.modelDesc}>{isLocked ? 'Studio plan required' : model.description}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
                {lockedModelHint && (
                  <p className={styles.lockedHint}>
                    {lockedModelHint} <Link href="/pricing">Upgrade →</Link>
                  </p>
                )}
              </div>

              {/* Project (optional) */}
              <div className={styles.modelSection}>
                <label>
                  <span className={styles.sectionIcon}>
                    <span className="material-symbols-outlined">folder_open</span>
                  </span>
                  Save to Project (optional)
                </label>
                <select
                  className={styles.projectSelect}
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                >
                  <option value="">No project — gallery only</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>{project.title}</option>
                  ))}
                </select>
              </div>

              {/* Settings */}
              <div className={styles.settingsRow}>
                <div className={styles.settingGroup}>
                  <label>Aspect Ratio</label>
                  <div className={styles.aspectBtns}>
                    {aspectRatios.map((ratio) => (
                      <button
                        key={ratio}
                        className={`${styles.aspectBtn} ${aspectRatio === ratio ? styles.aspectActive : ''}`}
                        onClick={() => setAspectRatio(ratio)}
                        title={ratio}
                      >
                        <span className={styles.aspectShape} style={getAspectDims(ratio)} />
                        {ratio}
                      </button>
                    ))}
                  </div>
                </div>
                <div className={styles.settingGroup}>
                  <label>Image Count</label>
                  <div className={styles.countBtns}>
                    {[1, 2, 4, 8].filter((n) => n <= planLimits.maxImagesPerGeneration).map((n) => (
                      <button
                        key={n}
                        className={`${styles.countBtn} ${effectiveImageCount === n ? styles.countActive : ''}`}
                        onClick={() => setImageCount(n)}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  {planLimits.maxImagesPerGeneration < 8 && (
                    <Link href="/pricing" className={styles.upgradeHintSmall}>
                      Upgrade for up to {plan === 'free' ? '4 (Creator) or 8 (Studio)' : '8'} per batch
                    </Link>
                  )}
                </div>
              </div>

              {/* Generate Button */}
              <button
                className={styles.generateBtn}
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
              >
                <span className={styles.generateBtnShine} />
                <span className="material-symbols-outlined">bolt</span>
                {isGenerating ? 'Generating...' : `Generate Now (${effectiveImageCount} Credits)`}
              </button>

              {generationError && (
                <div className={styles.apiPlaceholder}>
                  <div className={styles.apiStatus}>Error: {generationError}</div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Live Preview */}
          <div className={styles.previewPanel}>
            <div className={styles.previewCard}>
              {isGenerating ? (
                <div className={styles.generatingState}>
                  <div className={styles.generatingGrid}>
                    {Array.from({ length: effectiveImageCount }).map((_, i) => (
                      <div
                        key={i}
                        className={styles.skeletonItem}
                        style={{ aspectRatio: aspectRatio.replace(':', ' / '), animationDelay: `${i * 0.12}s` }}
                      />
                    ))}
                  </div>
                  <div className={styles.generatingCaption}>
                    <span className={styles.generatingDot} />
                    Rendering {effectiveImageCount} frame{effectiveImageCount > 1 ? 's' : ''} with {selectedModel}...
                  </div>
                </div>
              ) : generatedImages.length > 0 ? (
                <>
                  <div className={styles.generationInfo}>
                    <div>
                      <p className={styles.infoLabel}>Last generation</p>
                      <h3>{lastGeneration?.prompt || 'Preview ready'}</h3>
                    </div>
                    <div className={styles.metaPillGroup}>
                      <div className={styles.metaPill}>{lastGeneration?.model || selectedModel}</div>
                      {lastGeneration && (
                        <div className={lastGeneration.commercialLicense ? styles.licenseBadgeCommercial : styles.licenseBadgePersonal}>
                          <span className="material-symbols-outlined">
                            {lastGeneration.commercialLicense ? 'verified' : 'person'}
                          </span>
                          {lastGeneration.commercialLicense ? 'Commercial License' : 'Personal Use Only'}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className={styles.generatedGrid}>
                    {generatedImages.map((img, index) => (
                      <div
                        key={index}
                        className={styles.generatedItem}
                        style={{ animationDelay: `${index * 0.08}s` }}
                      >
                        <Image src={img} alt={`Generated ${index + 1}`} fill unoptimized className={styles.generatedImage} />
                        <div className={styles.generatedOverlay}>
                          <a
                            href={img}
                            download={`aetherframe-${index + 1}.png`}
                            className={styles.downloadImageBtn}
                          >
                            <span className="material-symbols-outlined">download</span>
                          </a>
                          {planLimits.advancedUpscale ? (
                            <button
                              className={styles.downloadImageBtn}
                              onClick={() => handleUpscale(img, index)}
                              title="Upscale 2x (Studio)"
                            >
                              <span className="material-symbols-outlined">hd</span>
                            </button>
                          ) : (
                            <Link
                              href="/pricing"
                              className={styles.downloadImageBtn}
                              title="Advanced upscaling requires the Studio plan"
                            >
                              <span className="material-symbols-outlined">lock</span>
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className={styles.emptyState}>
                  <div className={styles.emptyFrame} style={{ aspectRatio: aspectRatio.replace(':', ' / ') }}>
                    <span className="material-symbols-outlined">auto_awesome</span>
                  </div>
                  <h3>Your canvas awaits</h3>
                  <p>Enter your prompt or select a preset to begin generating premium assets.</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}