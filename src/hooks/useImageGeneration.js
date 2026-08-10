'use client';

import { useState, useCallback } from 'react';

export function useImageGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [images, setImages] = useState([]);

  const generate = useCallback(async ({ prompt, negativePrompt, model, aspectRatio, imageCount, projectId }) => {
    setError('');

    if (!prompt || !prompt.trim()) {
      setError('Please enter a prompt');
      return { success: false };
    }

    const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;
    if (!token) {
      setError('Please sign in to generate images.');
      return { success: false };
    }

    setIsGenerating(true);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt, negativePrompt, model, aspectRatio, imageCount, projectId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Image generation failed.');
        return { success: false, message: data.message };
      }

      setImages(data.images || []);

      // Синхронізуємо баланс, збережений локально для відображення в UI
      if (typeof window !== 'undefined' && typeof data.balance === 'number') {
        const storedUser = window.localStorage.getItem('user');
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            parsedUser.balance = { ...parsedUser.balance, USD: data.balance };
            window.localStorage.setItem('user', JSON.stringify(parsedUser));
          } catch {
            // ignore malformed stored user
          }
        }
      }

      return {
        success: true,
        images: data.images,
        cost: data.cost,
        balance: data.balance,
        commercialLicense: data.commercialLicense,
        plan: data.plan,
      };
    } catch (err) {
      const message = err?.message || 'Network error while generating images.';
      setError(message);
      return { success: false, message };
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return { generate, isGenerating, error, images, setError };
}
