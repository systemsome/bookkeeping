import React from 'react';

interface CardTextureOverlayProps {
  pattern?: string;
  tier?: string;
  network?: string;
  className?: string;
}

export const CardTextureOverlay: React.FC<CardTextureOverlayProps> = ({
  pattern,
  tier = '',
  network = '',
  className = '',
}) => {
  const t = tier.toLowerCase();
  const net = network.toUpperCase();

  // Resolve effective pattern based on explicit pattern or tier/network
  let effectivePattern = pattern;
  if (!effectivePattern || effectivePattern === 'radial-sheen' || effectivePattern === 'none') {
    if (
      t.includes('黑金') ||
      t.includes('百夫长黑金') ||
      t.includes('世界之极') ||
      t.includes('无限') ||
      t.includes('black') ||
      t.includes('infinite') ||
      t.includes('world elite')
    ) {
      effectivePattern = 'carbon';
    } else if (t.includes('钻石') || t.includes('diamond') || t.includes('至臻') || t.includes('ultimate')) {
      effectivePattern = 'diamond-facets';
    } else if (t.includes('白金') || t.includes('platinum') || t.includes('钛金') || t.includes('titanium')) {
      effectivePattern = 'silk-stripes';
    } else if (t.includes('金卡') || t.includes('gold') || t.includes('金葵花') || t.includes('理财金')) {
      effectivePattern = 'waves';
    } else if (t.includes('世界') || t.includes('world') || t.includes('御玺') || t.includes('signature')) {
      effectivePattern = 'world-grid';
    } else if (t.includes('绿卡') || t.includes('green') || net === 'AMEX') {
      effectivePattern = 'centurion-guilloche';
    } else {
      effectivePattern = pattern || 'radial-sheen';
    }
  }

  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden select-none ${className}`}>
      {/* Dynamic Specular lighting gradients */}
      <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-white/15 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-black/40 blur-2xl pointer-events-none" />

      {/* 1. Carbon Fiber Weave (黑金卡 / 百夫长黑金 / 无限卡 / 世界之极) */}
      {effectivePattern === 'carbon' && (
        <>
          <svg className="absolute inset-0 w-full h-full opacity-25" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="card-carbon-weave" width="8" height="8" patternUnits="userSpaceOnUse">
                <rect width="4" height="4" fill="rgba(255,255,255,0.06)" />
                <rect x="4" y="4" width="4" height="4" fill="rgba(255,255,255,0.06)" />
                <rect x="0" y="4" width="4" height="4" fill="rgba(0,0,0,0.25)" />
                <rect x="4" y="0" width="4" height="4" fill="rgba(0,0,0,0.25)" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#card-carbon-weave)" />
          </svg>
          {/* Subtle gold specular beam */}
          <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 via-transparent to-amber-300/15 mix-blend-overlay" />
          <svg className="absolute inset-0 w-full h-full opacity-15 stroke-amber-400 fill-none" xmlns="http://www.w3.org/2000/svg">
            <line x1="0" y1="0" x2="100%" y2="100%" strokeWidth="0.8" strokeDasharray="12 16" />
            <line x1="20%" y1="0" x2="100%" y2="80%" strokeWidth="0.5" strokeDasharray="6 8" />
          </svg>
        </>
      )}

      {/* 2. Fluid Wave Ribbons (金卡 / 24K黄金 / 金葵花 / 理财金) */}
      {effectivePattern === 'waves' && (
        <>
          <svg
            className="absolute inset-0 w-full h-full opacity-30 stroke-amber-200 fill-none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M-60,70 Q60,10 180,65 T380,55 T600,75" strokeWidth="1.2" />
            <path d="M-60,100 Q80,30 200,85 T410,75 T620,95" strokeWidth="1.5" />
            <path d="M-60,130 Q100,50 230,105 T440,95 T640,115" strokeWidth="1.8" />
            <path d="M-60,160 Q120,70 260,125 T470,115 T660,135" strokeWidth="2.0" />
            <path d="M-60,190 Q140,90 290,145 T500,135 T680,155" strokeWidth="1.2" strokeDasharray="6 4" />
          </svg>
          <div className="absolute inset-0 bg-gradient-to-r from-amber-400/15 via-yellow-200/20 to-amber-500/10 mix-blend-color-dodge" />
        </>
      )}

      {/* 3. Diamond Facets & Prisms (钻石卡 / 至臻卡) */}
      {effectivePattern === 'diamond-facets' && (
        <>
          <svg
            className="absolute inset-0 w-full h-full opacity-25 stroke-cyan-200 fill-none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <polygon points="50,15 110,65 50,115 -10,65" strokeWidth="1" />
            <polygon points="120,35 220,105 120,175 20,105" strokeWidth="0.8" strokeDasharray="4 4" />
            <polygon points="260,10 340,75 260,140 180,75" strokeWidth="1.2" />
            <line x1="0" y1="65" x2="100%" y2="65" strokeWidth="0.5" strokeDasharray="5 5" />
            <line x1="50" y1="0" x2="50" y2="100%" strokeWidth="0.5" strokeDasharray="5 5" />
            <circle cx="260" cy="75" r="50" strokeWidth="0.75" />
            <circle cx="260" cy="75" r="70" strokeWidth="0.5" strokeDasharray="2 3" />
          </svg>
          <div className="absolute inset-0 bg-gradient-to-tr from-cyan-400/15 via-blue-500/10 to-indigo-300/20 mix-blend-overlay" />
        </>
      )}

      {/* 4. Fine Silk Stripes / Brushed Platinum (白金卡 / 钛金卡) */}
      {(effectivePattern === 'silk-stripes' || effectivePattern === 'brushed-metal') && (
        <>
          <div
            className="absolute inset-0 opacity-25"
            style={{
              backgroundImage:
                'repeating-linear-gradient(60deg, rgba(255,255,255,0.2) 0px, rgba(255,255,255,0.2) 1.5px, transparent 1.5px, transparent 6px)',
            }}
          />
          <svg className="absolute inset-0 w-full h-full opacity-20 stroke-slate-200 fill-none" xmlns="http://www.w3.org/2000/svg">
            <line x1="0" y1="35%" x2="100%" y2="35%" strokeWidth="0.75" strokeDasharray="8 6" />
            <line x1="0" y1="65%" x2="100%" y2="65%" strokeWidth="0.75" strokeDasharray="8 6" />
          </svg>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent mix-blend-overlay -skew-x-12 transform scale-150" />
        </>
      )}

      {/* 5. World Arcs & Meridians (世界卡 / 御玺卡) */}
      {effectivePattern === 'world-grid' && (
        <svg
          className="absolute inset-0 w-full h-full opacity-20 stroke-sky-200 fill-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <ellipse cx="85%" cy="50%" rx="180" ry="90" strokeWidth="1" />
          <ellipse cx="85%" cy="50%" rx="130" ry="65" strokeWidth="0.8" strokeDasharray="4 4" />
          <ellipse cx="85%" cy="50%" rx="80" ry="40" strokeWidth="1.2" />
          <line x1="0" y1="50%" x2="100%" y2="50%" strokeWidth="0.75" />
          <path d="M 0,20 Q 150,80 350,50 T 600,30" strokeWidth="1" strokeDasharray="6 6" />
        </svg>
      )}

      {/* 6. Centurion / Guilloche Engraving (美国运通卡 / 绿卡 / 经典百夫长) */}
      {effectivePattern === 'centurion-guilloche' && (
        <svg
          className="absolute inset-0 w-full h-full opacity-25 stroke-emerald-200 fill-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="12" y="10" width="calc(100% - 24px)" height="calc(100% - 20px)" rx="12" strokeWidth="1" strokeDasharray="4 3" />
          <rect x="16" y="14" width="calc(100% - 32px)" height="calc(100% - 28px)" rx="9" strokeWidth="0.75" />
          <g transform="translate(180, 50)">
            <ellipse cx="0" cy="0" rx="36" ry="18" strokeWidth="0.8" />
            <ellipse cx="0" cy="0" rx="36" ry="18" transform="rotate(30)" strokeWidth="0.8" />
            <ellipse cx="0" cy="0" rx="36" ry="18" transform="rotate(60)" strokeWidth="0.8" />
            <ellipse cx="0" cy="0" rx="36" ry="18" transform="rotate(90)" strokeWidth="0.8" />
            <ellipse cx="0" cy="0" rx="36" ry="18" transform="rotate(120)" strokeWidth="0.8" />
            <ellipse cx="0" cy="0" rx="36" ry="18" transform="rotate(150)" strokeWidth="0.8" />
          </g>
        </svg>
      )}

      {/* 7. Geometric Patterns */}
      {effectivePattern === 'geometric' && (
        <svg
          className="absolute inset-0 w-full h-full opacity-20 stroke-white/60 fill-none"
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

      {/* 8. Radial Sheen */}
      {effectivePattern === 'radial-sheen' && (
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_80%_15%,rgba(255,255,255,0.3)_0%,transparent_50%),radial-gradient(circle_at_15%_85%,rgba(0,0,0,0.35)_0%,transparent_60%)]" />
      )}

      {/* 9. Mesh Pattern */}
      {effectivePattern === 'mesh' && (
        <svg
          className="absolute inset-0 w-full h-full opacity-18 stroke-white/40 fill-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="card-mesh-pattern-gen" width="16" height="16" patternUnits="userSpaceOnUse">
              <path d="M 16 0 L 0 0 0 16" fill="none" strokeWidth="0.75" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#card-mesh-pattern-gen)" />
        </svg>
      )}

      {/* 10. Circuit Tech Pattern */}
      {effectivePattern === 'circuit' && (
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

      {/* 11. Subtle Dots */}
      {effectivePattern === 'dots' && (
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
