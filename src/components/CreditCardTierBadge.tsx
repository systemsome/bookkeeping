import React from 'react';
import {
  Crown,
  Sparkles,
  Gem,
  Globe,
  Layers,
  Award,
  Shield,
  CreditCard,
} from 'lucide-react';

export interface CardTierStyleConfig {
  tierName: string;
  badgeLabel: string;
  artStyleTitle: string;
  badgeBgClass: string;
  badgeBorderClass: string;
  badgeTextClass: string;
  glowClass: string;
  iconName: string;
  iconNode: React.ReactNode;
}

export function getCreditCardTierStyle(
  rawTier: string = '',
  cardNetwork?: string
): CardTierStyleConfig {
  const t = (rawTier || '').toLowerCase();

  // 1. 黑金卡 / 百夫长黑金 / 无限卡 / 世界之极 (Ultra-Luxury Black / Infinite / World Elite)
  if (
    t.includes('百夫长黑金') ||
    t.includes('黑金') ||
    t.includes('世界之极') ||
    t.includes('world elite') ||
    t.includes('无限卡') ||
    t.includes('infinite') ||
    t.includes('centurion black') ||
    t.includes('黑卡')
  ) {
    let label = '黑金卡';
    if (t.includes('世界之极') || t.includes('world elite')) label = '世界之极';
    else if (t.includes('无限') || t.includes('infinite')) label = '无限卡';
    else if (t.includes('百夫长')) label = '百夫长黑金';

    return {
      tierName: 'BLACK_INFINITE',
      badgeLabel: label,
      artStyleTitle: '曜石暗纹 · 殿堂黑金',
      badgeBgClass: 'bg-gradient-to-r from-zinc-950 via-zinc-900 to-black',
      badgeBorderClass: 'border-amber-500/60',
      badgeTextClass: 'text-amber-300 font-black',
      glowClass: 'shadow-[0_0_12px_rgba(245,158,11,0.25)] ring-1 ring-amber-400/30',
      iconName: 'Crown',
      iconNode: <Crown className="w-3 h-3 text-amber-400 shrink-0" />,
    };
  }

  // 2. 钻石卡 (Diamond)
  if (t.includes('钻石') || t.includes('diamond')) {
    return {
      tierName: 'DIAMOND',
      badgeLabel: '钻石卡',
      artStyleTitle: '晶辉深曜 · 皇家蓝钻',
      badgeBgClass: 'bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-900',
      badgeBorderClass: 'border-cyan-400/60',
      badgeTextClass: 'text-cyan-200 font-bold',
      glowClass: 'shadow-[0_0_12px_rgba(34,211,238,0.25)] ring-1 ring-cyan-400/30',
      iconName: 'Gem',
      iconNode: <Gem className="w-3 h-3 text-cyan-300 shrink-0" />,
    };
  }

  // 3. 御玺卡 (Signature) / 世界卡 (World)
  if (t.includes('御玺') || t.includes('signature') || t.includes('世界卡') || t.includes('world')) {
    const isSignature = t.includes('御玺') || t.includes('signature');
    return {
      tierName: 'SIGNATURE_WORLD',
      badgeLabel: isSignature ? '御玺卡' : '世界卡',
      artStyleTitle: isSignature ? '寰宇曜蓝 · 御玺礼宾' : '环球商旅 · 世界之翼',
      badgeBgClass: 'bg-gradient-to-r from-sky-950 via-blue-900 to-indigo-950',
      badgeBorderClass: 'border-sky-400/50',
      badgeTextClass: 'text-sky-200 font-bold',
      glowClass: 'shadow-[0_0_10px_rgba(56,189,248,0.2)] ring-1 ring-sky-400/30',
      iconName: 'Globe',
      iconNode: <Globe className="w-3 h-3 text-sky-300 shrink-0" />,
    };
  }

  // 4. 白金卡 (Platinum) / 百夫长白金
  if (t.includes('白金') || t.includes('platinum')) {
    const isCenturion = t.includes('百夫长');
    return {
      tierName: 'PLATINUM',
      badgeLabel: isCenturion ? '百夫长白金' : '白金卡',
      artStyleTitle: '冷光钛银 · 白金高定',
      badgeBgClass: 'bg-gradient-to-r from-slate-900 via-slate-800 to-zinc-900',
      badgeBorderClass: 'border-slate-300/50',
      badgeTextClass: 'text-slate-100 font-bold',
      glowClass: 'shadow-[0_0_10px_rgba(203,213,225,0.2)] ring-1 ring-white/20',
      iconName: 'Sparkles',
      iconNode: <Sparkles className="w-3 h-3 text-indigo-300 shrink-0" />,
    };
  }

  // 5. 钛金卡 (Titanium)
  if (t.includes('钛金') || t.includes('titanium')) {
    return {
      tierName: 'TITANIUM',
      badgeLabel: '钛金卡',
      artStyleTitle: '航天精工 · 哑光钛质',
      badgeBgClass: 'bg-gradient-to-r from-slate-800 via-slate-700 to-zinc-800',
      badgeBorderClass: 'border-slate-400/50',
      badgeTextClass: 'text-slate-200 font-semibold',
      glowClass: 'shadow-2xs ring-1 ring-slate-400/20',
      iconName: 'Layers',
      iconNode: <Layers className="w-3 h-3 text-slate-300 shrink-0" />,
    };
  }

  // 6. 运通绿卡 (Green Card)
  if (t === '绿卡' || t.includes('运通绿') || t.includes('green')) {
    return {
      tierName: 'GREEN',
      badgeLabel: '百夫长绿卡',
      artStyleTitle: '传奇罗马绿 · 经典印记',
      badgeBgClass: 'bg-gradient-to-r from-emerald-950 via-emerald-800 to-teal-950',
      badgeBorderClass: 'border-emerald-400/50',
      badgeTextClass: 'text-emerald-200 font-bold',
      glowClass: 'shadow-[0_0_10px_rgba(16,185,129,0.2)] ring-1 ring-emerald-400/30',
      iconName: 'Shield',
      iconNode: <Shield className="w-3 h-3 text-emerald-300 shrink-0" />,
    };
  }

  // 6.5. 至臻卡 (JCB Ultimate)
  if (t.includes('至臻') || t.includes('ultimate')) {
    return {
      tierName: 'ULTIMATE',
      badgeLabel: '至臻卡',
      artStyleTitle: '极光流曜 · 至臻典藏',
      badgeBgClass: 'bg-gradient-to-r from-violet-950 via-purple-900 to-indigo-950',
      badgeBorderClass: 'border-purple-400/50',
      badgeTextClass: 'text-purple-200 font-bold',
      glowClass: 'shadow-[0_0_10px_rgba(168,85,247,0.2)] ring-1 ring-purple-400/30',
      iconName: 'Sparkles',
      iconNode: <Sparkles className="w-3 h-3 text-purple-300 shrink-0" />,
    };
  }

  // 7. 金卡 (Gold) / 运通金卡
  if (t.includes('金卡') || t.includes('gold')) {
    return {
      tierName: 'GOLD',
      badgeLabel: '金卡',
      artStyleTitle: '24K流金 · 璀璨波浪',
      badgeBgClass: 'bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600',
      badgeBorderClass: 'border-amber-300/80',
      badgeTextClass: 'text-amber-950 font-black',
      glowClass: 'shadow-[0_0_10px_rgba(245,158,11,0.25)] ring-1 ring-yellow-400/40',
      iconName: 'Award',
      iconNode: <Award className="w-3 h-3 text-amber-950 shrink-0" />,
    };
  }

  // 8. 普卡 (Classic / Standard) / 默认
  return {
    tierName: 'STANDARD',
    badgeLabel: '普卡',
    artStyleTitle: '品牌标准 · 官方原色',
    badgeBgClass: 'bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700',
    badgeBorderClass: 'border-slate-300/70 dark:border-slate-600',
    badgeTextClass: 'text-slate-700 dark:text-slate-300 font-semibold',
    glowClass: 'shadow-2xs',
    iconName: 'CreditCard',
    iconNode: <CreditCard className="w-3 h-3 text-slate-500 dark:text-slate-400 shrink-0" />,
  };
}

interface CreditCardTierBadgeProps {
  cardTier?: string;
  cardNetwork?: string;
  showArtStyleTag?: boolean;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export const CreditCardTierBadge: React.FC<CreditCardTierBadgeProps> = ({
  cardTier,
  cardNetwork,
  showArtStyleTag = false,
  size = 'sm',
  className = '',
}) => {
  const config = getCreditCardTierStyle(cardTier, cardNetwork);

  const sizeClasses = {
    xs: 'px-1.5 py-0.2 text-[9px] gap-1',
    sm: 'px-2 py-0.5 text-[10px] sm:text-[11px] gap-1.5',
    md: 'px-2.5 py-1 text-xs gap-1.5',
  }[size];

  return (
    <div
      className={`inline-flex items-center rounded-full border transition-all select-none ${config.badgeBgClass} ${config.badgeBorderClass} ${config.badgeTextClass} ${config.glowClass} ${sizeClasses} ${className}`}
      title={`卡片等级: ${config.badgeLabel} · 卡面艺术风格: ${config.artStyleTitle}`}
    >
      <span className="flex items-center justify-center shrink-0">
        {config.iconNode}
      </span>
      <span className="tracking-wide shrink-0">{config.badgeLabel}</span>
      {showArtStyleTag && (
        <>
          <span className="opacity-40 text-[9px] font-normal select-none">|</span>
          <span className="opacity-85 text-[10px] font-normal truncate max-w-[130px] hidden sm:inline">
            {config.artStyleTitle}
          </span>
        </>
      )}
    </div>
  );
};
