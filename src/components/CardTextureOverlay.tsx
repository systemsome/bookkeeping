import React from 'react';

interface CardTextureOverlayProps {
  pattern?: string;
  className?: string;
}

export const CardTextureOverlay: React.FC<CardTextureOverlayProps> = ({
  pattern = 'radial-sheen',
  className = '',
}) => {
  if (!pattern || pattern === 'none') {
    return (
      <div className={`absolute inset-0 pointer-events-none ${className}`}>
        {/* Subtle base lighting */}
        <div className="absolute -top-16 -left-16 w-56 h-56 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-16 -right-16 w-56 h-56 rounded-full bg-black/25 blur-2xl" />
      </div>
    );
  }

  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden select-none ${className}`}>
      {/* Specular lighting gradient */}
      <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-white/15 blur-2xl" />
      <div className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full bg-black/35 blur-2xl" />

      {/* Pattern rendering */}
      {pattern === 'waves' && (
        <svg
          className="absolute inset-0 w-full h-full opacity-20 stroke-white/40 fill-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M-50,80 Q50,20 150,70 T350,60 T550,80" strokeWidth="1.2" />
          <path d="M-50,110 Q70,40 180,90 T380,80 T580,100" strokeWidth="1.4" />
          <path d="M-50,140 Q90,60 210,110 T410,100 T610,120" strokeWidth="1.6" />
          <path d="M-50,170 Q110,80 240,130 T440,120 T640,140" strokeWidth="1.8" />
        </svg>
      )}

      {pattern === 'geometric' && (
        <svg
          className="absolute inset-0 w-full h-full opacity-15 stroke-white/50 fill-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g transform="skewX(-18)">
            <line x1="20%" y1="0" x2="20%" y2="100%" strokeWidth="1" strokeDasharray="4 6" />
            <line x1="45%" y1="0" x2="45%" y2="100%" strokeWidth="1.5" />
            <line x1="70%" y1="0" x2="70%" y2="100%" strokeWidth="1" strokeDasharray="6 8" />
            <circle cx="80%" cy="30%" r="48" strokeWidth="1" />
            <circle cx="80%" cy="30%" r="80" strokeWidth="0.8" strokeDasharray="3 3" />
          </g>
        </svg>
      )}

      {pattern === 'radial-sheen' && (
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_80%_15%,rgba(255,255,255,0.3)_0%,transparent_50%),radial-gradient(circle_at_15%_85%,rgba(0,0,0,0.35)_0%,transparent_60%)]" />
      )}

      {pattern === 'mesh' && (
        <svg
          className="absolute inset-0 w-full h-full opacity-15 stroke-white/40 fill-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="card-mesh-pattern" width="16" height="16" patternUnits="userSpaceOnUse">
              <path d="M 16 0 L 0 0 0 16" fill="none" strokeWidth="0.75" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#card-mesh-pattern)" />
        </svg>
      )}

      {pattern === 'silk-stripes' && (
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, rgba(255,255,255,0.15) 0px, rgba(255,255,255,0.15) 2px, transparent 2px, transparent 8px)',
          }}
        />
      )}

      {pattern === 'circuit' && (
        <svg
          className="absolute inset-0 w-full h-full opacity-20 stroke-white/60 fill-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M 20 40 H 80 L 100 60 H 160" strokeWidth="1.2" />
          <circle cx="20" cy="40" r="2.5" fill="currentColor" />
          <circle cx="160" cy="60" r="2.5" fill="currentColor" />
          <path d="M 60 120 H 130 L 150 100 H 220" strokeWidth="1.2" />
          <circle cx="60" cy="120" r="2.5" fill="currentColor" />
          <circle cx="220" cy="100" r="2.5" fill="currentColor" />
        </svg>
      )}

      {pattern === 'dots' && (
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)',
            backgroundSize: '12px 12px',
          }}
        />
      )}
    </div>
  );
};
