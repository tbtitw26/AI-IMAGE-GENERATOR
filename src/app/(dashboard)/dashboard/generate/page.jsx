'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.scss';

// Імпорт компонентів
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useImageGeneration } from '@/hooks/useImageGeneration';
import { useAuth } from '@/hooks/useAuth';

export default function GeneratePage() {
  const { token } = useAuth();
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

  useEffect(() => {
    if (!token) return;
    fetch('/api/projects', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => setProjects(data.projects || []))
      .catch(() => {});
  }, [token]);

  const models = [
    { name: 'Aether Ultra', icon: 'diamond', description: 'Premium quality' },
    { name: 'Cinema 4K', icon: 'movie', description: 'Cinematic style' },
    { name: 'Product Studio', icon: 'photo_camera', description: 'Product focus' },
    { name: 'Character Gen', icon: 'person', description: 'Character design' },
  ];

  const aspectRatios = ['16:9', '1:1', '9:16', '4:3', '3:4'];

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
      imageCount,
      projectId: selectedProjectId || null,
    });

    if (result.success) {
      setGeneratedImages(result.images);
      setLastGeneration({
        prompt: prompt.trim(),
        model: selectedModel,
        aspectRatio,
        imageCount,
        negativePrompt: negativePrompt.trim(),
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

  return (
    <DashboardLayout>
      <div className={styles.generate}>
        {/* SECTION 1: GENERATION STUDIO */}
        <section className={styles.studio}>
          {/* Left: Control Panel */}
          <div className={styles.controlPanel}>
            <div className={styles.panelCard}>
              {/* Prompt */}
              <div className={styles.promptSection}>
                <div className={styles.promptHeader}>
                  <label>Master Prompt</label>
                  <div className={styles.promptActions}>
                    <button className={styles.actionBtn} onClick={handleEnhance}>
                      <span className="material-symbols-outlined">auto_fix_high</span>
                      Enhance
                    </button>
                    <button className={styles.actionBtn} onClick={handleRandom}>
                      <span className="material-symbols-outlined">shuffle</span>
                      Random
                    </button>
                    <button className={styles.actionBtn} onClick={handleHistory}>
                      <span className="material-symbols-outlined">history</span>
                      History
                    </button>
                  </div>
                </div>
                <textarea
                  ref={textareaRef}
                  className={styles.promptInput}
                  placeholder="Describe the scene in detail..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={4}
                />
              </div>

              {/* Negative Prompt */}
              <div className={styles.negativeSection}>
                <label>Negative Prompt</label>
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
                <label>Model Engine</label>
                <div className={styles.modelGrid}>
                  {models.map((model) => (
                    <button
                      key={model.name}
                      className={`${styles.modelBtn} ${selectedModel === model.name ? styles.modelActive : ''}`}
                      onClick={() => setSelectedModel(model.name)}
                    >
                      <span className="material-symbols-outlined">{model.icon}</span>
                      {model.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Project (optional) */}
              <div className={styles.modelSection}>
                <label>Save to Project (optional)</label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: 'inherit' }}
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
                      >
                        {ratio}
                      </button>
                    ))}
                  </div>
                </div>
                <div className={styles.settingGroup}>
                  <label>Image Count</label>
                  <select
                    className={styles.countSelect}
                    value={imageCount}
                    onChange={(e) => setImageCount(Number(e.target.value))}
                  >
                    <option value={1}>1 Image</option>
                    <option value={4}>4 Images</option>
                    <option value={8}>8 Images</option>
                  </select>
                </div>
              </div>

              {/* Generate Button */}
              <button
                className={styles.generateBtn}
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
              >
                <span className="material-symbols-outlined">bolt</span>
                {isGenerating ? 'Generating...' : `Generate Now (${imageCount} Credits)`}
              </button>

              <div className={styles.apiPlaceholder}>
                <div className={styles.apiHeader}>
                  <span className="material-symbols-outlined">api</span>
                  <div>
                    <h4>AI API</h4>
                    <p>Without OPENAI_API_KEY, generations use a free test provider (Pollinations.ai, no cost). Add the key in .env.local to switch to OpenAI gpt-image-1.</p>
                  </div>
                </div>
                {generationError && <div className={styles.apiStatus}>Error: {generationError}</div>}
              </div>
            </div>
          </div>

          {/* Right: Live Preview */}
          <div className={styles.previewPanel}>
            <div className={styles.previewCard}>
              {isGenerating ? (
                <div className={styles.generatingState}>
                  <div className={styles.generatingSpinner}>
                    <span className="material-symbols-outlined">generating_tokens</span>
                  </div>
                  <h3>Generating...</h3>
                  <p>Creating your masterpiece</p>
                </div>
              ) : generatedImages.length > 0 ? (
                <>
                  <div className={styles.generationInfo}>
                    <div>
                      <p className={styles.infoLabel}>Last generation</p>
                      <h3>{lastGeneration?.prompt || 'Preview ready'}</h3>
                    </div>
                    <div className={styles.metaPill}>{lastGeneration?.model || selectedModel}</div>
                  </div>
                  <div className={styles.generatedGrid}>
                    {generatedImages.map((img, index) => (
                      <div key={index} className={styles.generatedItem}>
                        <Image src={img} alt={`Generated ${index + 1}`} fill unoptimized className={styles.generatedImage} />
                        <div className={styles.generatedOverlay}>
                          <a
                            href={img}
                            download={`aetherframe-${index + 1}.png`}
                            className={styles.downloadImageBtn}
                          >
                            <span className="material-symbols-outlined">download</span>
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className={styles.emptyState}>
                  <span className="material-symbols-outlined">generating_tokens</span>
                  <h3>Studio Canvas</h3>
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