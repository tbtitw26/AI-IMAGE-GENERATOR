'use client';

import Link from 'next/link';

export default function Logo({ className = '', style = {} }) {
  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '10px',
        textDecoration: 'none',
        ...style,
      }}
    >
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        <defs>
          <linearGradient id="logoGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="50%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
          <linearGradient id="logoGrad2" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
          <filter id="logoGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* outer diamond / prism */}
        <path
          d="M16 2L29 9.5V22.5L16 30L3 22.5V9.5L16 2Z"
          fill="url(#logoGrad1)"
          fillOpacity="0.25"
          stroke="url(#logoGrad1)"
          strokeWidth="1.5"
        />

        {/* inner geometric facets */}
        <path
          d="M16 2L29 9.5L16 17L3 9.5L16 2Z"
          fill="url(#logoGrad2)"
          fillOpacity="0.4"
        />
        <path
          d="M16 17V30L3 22.5V9.5L16 17Z"
          fill="url(#logoGrad1)"
          fillOpacity="0.6"
        />
        <path
          d="M16 17L29 9.5V22.5L16 30V17Z"
          fill="url(#logoGrad2)"
          fillOpacity="0.8"
        />

        {/* glowing core AI star */}
        <circle cx="16" cy="16" r="3" fill="#ffffff" filter="url(#logoGlow)" />
      </svg>
      <span
        style={{
          fontSize: '20px',
          fontWeight: '800',
          letterSpacing: '-0.5px',
          color: '#ffffff',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        dexeric<span style={{ color: '#3b82f6' }}>.ai</span>
      </span>
    </div>
  );
}
