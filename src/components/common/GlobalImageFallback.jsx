'use client';

import { useEffect } from 'react';

const FALLBACK_SRC = '/images/placeholder.svg';

export default function GlobalImageFallback() {
  useEffect(() => {
    const applyFallback = (img) => {
      if (!img || !(img instanceof HTMLImageElement)) return;
      if (img.dataset.imageFallbackApplied === 'true') return;

      const currentSrc = img.getAttribute('src');
      if (!currentSrc || currentSrc === FALLBACK_SRC) return;

      const handleError = () => {
        if (img.getAttribute('src') !== FALLBACK_SRC) {
          img.setAttribute('src', FALLBACK_SRC);
          img.dataset.imageFallbackApplied = 'true';
        }
      };

      img.addEventListener('error', handleError);
      img.dataset.imageFallbackApplied = 'true';
    };

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) return;

          if (node.tagName === 'IMG') {
            applyFallback(node);
          }

          node.querySelectorAll?.('img').forEach(applyFallback);
        });
      });
    });

    document.querySelectorAll('img').forEach(applyFallback);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return null;
}
