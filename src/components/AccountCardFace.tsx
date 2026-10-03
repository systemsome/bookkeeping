import React, { useState, useEffect } from 'react';
import {
  Pencil,
  Trash2,
  Sliders,
  ArrowUpRight,
  ArrowDownLeft,
  ReceiptText,
  Wand2,
  GripVertical,
  ChevronUp,
  ChevronDown,
  ArrowUpToLine,
  Image as ImageIcon,
  Palette,
  Pin,
  PinOff,
  Sparkles,
  Copy,
  Check,
  ImageOff,
} from 'lucide-react';
import { FinancialAccount } from '../types';
import { detectBrandInfo, CARD_SKINS } from '../lib/brandHelper';
import { BrandLogo, CardNetworkBadge, EMVChip, ContactlessIcon } from './BrandLogo';
import { matchLogoHubBank } from '../lib/logohubData';
import { CardTextureOverlay } from './CardTextureOverlay';
import { getCardentifyPreset } from '../lib/cardentifyPresets';
import { formatCurrency } from '../lib/formatters';

interface AccountCardFaceProps {
  account: FinancialAccount;
  privacyMode: boolean;
  onEditAccount?: (account: FinancialAccount) => void;
  onDeleteAccount?: (accountId: string) => void;
  onClearCardImage?: (accountId: string) => void;
  onQuickReconcile?: (account: FinancialAccount) => void;
  onOpenRepayment?: (accountId: string, amount: number) => void;
  onOpenNewTx?: (defaultType: string, accountId: string) => void;
  onAutoRegenColor?: (accountId: string) => void;
  onOpenCardentifyGallery?: (account: FinancialAccount) => void;
  compact?: boolean;
  hideActionRow?: boolean;
  // Wake-up Mode ('hidden': default hidden, awake on hover/click; 'pinned': always visible)
  wakeMode?: 'hidden' | 'pinned';
  // Drag & Reorder Props
  isReorderMode?: boolean;
  reorderIndex?: number;
  totalCount?: number;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onMoveTop?: () => void;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}

export interface CardTierAesthetic {
  tierType: 'BLACK' | 'PLATINUM' | 'GOLD' | 'DIAMOND' | 'WORLD' | 'GREEN' | 'STANDARD';
  tierLabel: string;
  badgeContainerClass: string;
  badgeDotClass: string;
  artStyleClass: string;
  borderGlowClass: string;
  texturePattern: string;
}

export function getCardTierAesthetic(
  tier: string = '',
  network: string = '',
  isCredit: boolean = false
): CardTierAesthetic {
  const t = tier.toLowerCase();
  const net = network.toUpperCase();

  // 1. Black / Centurion / Infinite / World Elite (黑金/百夫长黑金/无限卡/世界之极)
  if (
    t.includes('黑金') ||
    t.includes('百夫长黑金') ||
    t.includes('世界之极') ||
    t.includes('无限') ||
    t.includes('black') ||
    t.includes('infinite') ||
    t.includes('world elite')
  ) {
    return {
      tierType: 'BLACK',
      tierLabel: tier || '黑金卡',
      badgeContainerClass:
        'bg-gradient-to-r from-zinc-950 via-zinc-900 to-black text-amber-300 border-amber-500/60 shadow-[0_2px_8px_rgba(0,0,0,0.8)] font-bold',
      badgeDotClass: 'bg-amber-400 animate-pulse',
      artStyleClass: 'card-art-black',
      borderGlowClass: 'border-amber-500/40 ring-1 ring-amber-400/20',
      texturePattern: 'carbon',
    };
  }

  // 2. Diamond / Ultimate (钻石卡/至臻卡)
  if (t.includes('钻石') || t.includes('diamond') || t.includes('至臻') || t.includes('ultimate')) {
    return {
      tierType: 'DIAMOND',
      tierLabel: tier || '钻石卡',
      badgeContainerClass:
        'bg-gradient-to-r from-cyan-950/90 via-blue-950/90 to-indigo-950/90 text-cyan-200 border-cyan-400/60 shadow-[0_2px_8px_rgba(6,182,212,0.25)] font-semibold',
      badgeDotClass: 'bg-cyan-300',
      artStyleClass: 'card-art-diamond',
      borderGlowClass: 'border-cyan-400/40 ring-1 ring-cyan-400/20',
      texturePattern: 'diamond-facets',
    };
  }

  // 3. Platinum / Titanium (白金卡/钛金卡/百夫长白金)
  if (t.includes('白金') || t.includes('platinum') || t.includes('钛金') || t.includes('titanium')) {
    return {
      tierType: 'PLATINUM',
      tierLabel: tier || '白金卡',
      badgeContainerClass:
        'bg-gradient-to-r from-slate-900/90 via-slate-800/90 to-slate-900/90 text-slate-100 border-slate-300/60 shadow-[0_2px_8px_rgba(203,213,225,0.2)] font-semibold',
      badgeDotClass: 'bg-slate-200',
      artStyleClass: 'card-art-platinum',
      borderGlowClass: 'border-slate-300/40 ring-1 ring-white/15',
      texturePattern: 'silk-stripes',
    };
  }

  // 4. World / Signature (世界卡/御玺卡)
  if (t.includes('御玺') || t.includes('signature') || t.includes('世界') || t.includes('world')) {
    return {
      tierType: 'WORLD',
      tierLabel: tier || (net === 'VISA' ? '御玺卡' : '世界卡'),
      badgeContainerClass:
        'bg-gradient-to-r from-sky-950/90 via-indigo-950/90 to-blue-950/90 text-sky-200 border-sky-400/60 shadow-[0_2px_8px_rgba(14,165,233,0.25)] font-semibold',
      badgeDotClass: 'bg-sky-300',
      artStyleClass: 'card-art-world',
      borderGlowClass: 'border-sky-400/40 ring-1 ring-indigo-400/20',
      texturePattern: 'world-grid',
    };
  }

  // 5. Gold / 金葵花 / 理财金 (金卡)
  if (t.includes('金卡') || t.includes('gold') || t.includes('金葵花') || t.includes('理财金')) {
    return {
      tierType: 'GOLD',
      tierLabel: tier || '金卡',
      badgeContainerClass:
        'bg-gradient-to-r from-amber-600/35 via-amber-500/30 to-amber-700/35 text-amber-100 border-amber-300/70 shadow-[0_2px_8px_rgba(245,158,11,0.25)] font-semibold',
      badgeDotClass: 'bg-amber-300',
      artStyleClass: 'card-art-gold',
      borderGlowClass: 'border-amber-400/50 ring-1 ring-amber-300/25',
      texturePattern: 'waves',
    };
  }

  // 6. Centurion Green (运通绿卡)
  if (t.includes('绿卡') || t.includes('green') || (net === 'AMEX' && t.includes('绿'))) {
    return {
      tierType: 'GREEN',
      tierLabel: tier || '运通绿卡',
      badgeContainerClass:
        'bg-gradient-to-r from-emerald-950/90 to-teal-950/90 text-emerald-200 border-emerald-400/60 shadow-[0_2px_8px_rgba(16,185,129,0.2)] font-semibold',
      badgeDotClass: 'bg-emerald-300',
      artStyleClass: 'card-art-green',
      borderGlowClass: 'border-emerald-400/40 ring-1 ring-emerald-300/20',
      texturePattern: 'centurion-guilloche',
    };
  }

  // 7. Standard / Classic / 普卡 (Default)
  return {
    tierType: 'STANDARD',
    tierLabel: tier || (isCredit ? '普卡' : '标准卡'),
    badgeContainerClass:
      'bg-black/40 text-slate-200 border-white/20 shadow-sm font-medium',
    badgeDotClass: 'bg-slate-400',
    artStyleClass: 'card-art-standard',
    borderGlowClass: 'border-white/20',
    texturePattern: 'radial-sheen',
  };
}

/**
 * 💳 银行卡样式的等级微标组件（以等级颜色呈现微型银行卡 Logo）
 */
export const TierCardLogo: React.FC<{
  tierType: 'BLACK' | 'PLATINUM' | 'GOLD' | 'DIAMOND' | 'WORLD' | 'GREEN' | 'STANDARD';
  tierLabel: string;
  className?: string;
  size?: 'sm' | 'md';
}> = ({ tierType, tierLabel, className = '', size = 'sm' }) => {
  const isMd = size === 'md';
  const svgClass = isMd ? 'w-5 h-3.5' : 'w-4 h-2.5 sm:w-4.5 sm:h-3';

  const styleConfig = {
    BLACK: {
      cardBg: 'fill-zinc-950 stroke-amber-400',
      chipColor: 'fill-amber-400',
      stripeColor: 'fill-amber-500/40',
      lineColor: 'stroke-amber-300',
      badgeBg: 'bg-zinc-950/90 border-amber-500/60 shadow-[0_0_8px_rgba(251,191,36,0.35)]',
    },
    PLATINUM: {
      cardBg: 'fill-slate-800 stroke-slate-200',
      chipColor: 'fill-slate-100',
      stripeColor: 'fill-slate-300/40',
      lineColor: 'stroke-slate-200',
      badgeBg: 'bg-slate-900/90 border-slate-300/60 shadow-[0_0_8px_rgba(226,232,240,0.3)]',
    },
    GOLD: {
      cardBg: 'fill-amber-950 stroke-amber-300',
      chipColor: 'fill-amber-300',
      stripeColor: 'fill-yellow-400/50',
      lineColor: 'stroke-amber-200',
      badgeBg: 'bg-amber-950/85 border-amber-400/70 shadow-[0_0_8px_rgba(245,158,11,0.4)]',
    },
    DIAMOND: {
      cardBg: 'fill-blue-950 stroke-cyan-300',
      chipColor: 'fill-cyan-300',
      stripeColor: 'fill-cyan-400/50',
      lineColor: 'stroke-cyan-200',
      badgeBg: 'bg-blue-950/85 border-cyan-400/70 shadow-[0_0_8px_rgba(34,211,238,0.4)]',
    },
    WORLD: {
      cardBg: 'fill-slate-950 stroke-sky-300',
      chipColor: 'fill-sky-300',
      stripeColor: 'fill-sky-400/50',
      lineColor: 'stroke-sky-200',
      badgeBg: 'bg-slate-950/85 border-sky-400/70 shadow-[0_0_8px_rgba(56,189,248,0.35)]',
    },
    GREEN: {
      cardBg: 'fill-emerald-950 stroke-emerald-300',
      chipColor: 'fill-emerald-300',
      stripeColor: 'fill-emerald-400/50',
      lineColor: 'stroke-emerald-200',
      badgeBg: 'bg-emerald-950/85 border-emerald-400/70 shadow-[0_0_8px_rgba(52,211,153,0.35)]',
    },
    STANDARD: {
      cardBg: 'fill-slate-900 stroke-slate-300/80',
      chipColor: 'fill-slate-300',
      stripeColor: 'fill-slate-400/35',
      lineColor: 'stroke-slate-300',
      badgeBg: 'bg-black/50 border-white/25 shadow-xs',
    },
  }[tierType];

  return (
    <div
      className={`px-1.5 py-0.5 rounded-md backdrop-blur-xl border flex items-center justify-center shrink-0 cursor-default select-none transition-transform hover:scale-110 ${styleConfig.badgeBg} ${className}`}
      title={`卡片等级: ${tierLabel}`}
    >
      <svg
        className={`${svgClass} shrink-0`}
        viewBox="0 0 20 13"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Card outer body */}
        <rect
          x="0.75"
          y="0.75"
          width="18.5"
          height="11.5"
          rx="2"
          className={styleConfig.cardBg}
          strokeWidth="1.2"
        />
        {/* Top magnetic stripe */}
        <rect x="0.75" y="2.8" width="18.5" height="1.8" className={styleConfig.stripeColor} />
        {/* Mini chip */}
        <rect x="2.5" y="6" width="3.2" height="2.4" rx="0.5" className={styleConfig.chipColor} />
        {/* Embossed card line details */}
        <line x1="7" y1="7.2" x2="16.5" y2="7.2" className={styleConfig.lineColor} strokeWidth="0.9" strokeLinecap="round" strokeDasharray="1.2 1" />
        <line x1="7" y1="9.8" x2="13" y2="9.8" className={styleConfig.lineColor} strokeWidth="0.8" strokeLinecap="round" opacity="0.75" />
      </svg>
    </div>
  );
};

export const AccountCardFace: React.FC<AccountCardFaceProps> = ({
  account,
  privacyMode,
  onEditAccount,
  onDeleteAccount,
  onClearCardImage,
  onQuickReconcile,
  onOpenRepayment,
  onOpenNewTx,
  onAutoRegenColor,
  onOpenCardentifyGallery,
  compact = false,
  hideActionRow = false,
  wakeMode = 'hidden',
  isReorderMode = false,
  reorderIndex,
  totalCount,
  onMoveUp,
  onMoveDown,
  onMoveTop,
  dragHandleProps,
}) => {
  // Hidden wake-up states: tap or pin to keep awake
  const [isCardAwake, setIsCardAwake] = useState<boolean>(false);
  const [isCardPinned, setIsCardPinned] = useState<boolean>(wakeMode === 'pinned');
  const [isCopiedCardNum, setIsCopiedCardNum] = useState<boolean>(false);
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);

  useEffect(() => {
    setIsCardPinned(wakeMode === 'pinned');
  }, [wakeMode]);

  // Auto reset delete confirmation after 6 seconds
  useEffect(() => {
    if (!confirmDelete) return;
    const timer = setTimeout(() => {
      setConfirmDelete(false);
    }, 6000);
    return () => clearTimeout(timer);
  }, [confirmDelete]);

  // Is actively awake via pin or click tap
  const isDetailsAwake = isCardPinned || isCardAwake;

  const brand = detectBrandInfo(account.name, account.bankName, account.category);
  const skinId = account.cardSkin || brand.cardSkin || 'classic-cmb';
  const skin = CARD_SKINS.find((s) => s.id === skinId) || CARD_SKINS[0];
  const preset = account.cardPresetId ? getCardentifyPreset(account.cardPresetId) : undefined;

  // 卡面左下角银行名称纯净提取
  const displayBankName = account.bankName || preset?.bankName || brand.shortName || brand.name || account.name;

  // 🏦 优先使用数据库持久化写入的 LogoHub 官方矢量徽标URL，支持智能兜底匹配
  const effectiveBankLogoUrl =
    account.bankLogoUrl ||
    matchLogoHubBank(displayBankName)?.logoUrl ||
    matchLogoHubBank(account.bankName || '')?.logoUrl ||
    matchLogoHubBank(account.name)?.logoUrl;

  // Has authentic Cardentify or custom Apple Pay image URL
  const hasCardImage = !!account.cardImageUrl;

  // Custom base color or skin gradient
  const customBg = account.cardBgColor || preset?.cardStyle.background;
  const isCredit = account.category === 'CREDIT_CARD' || account.category === 'JD_BAITIAO' || account.category === 'HUABEI';
  const isGold = account.category === 'GOLD';
  const isLend = account.category === 'RECEIVABLE';
  const isBorrow = account.category === 'PAYABLE';
  const isBankCard = account.category === 'DEBIT_CARD' || account.category === 'CREDIT_CARD';

  // Compute text color mode: 'dark' (e.g., titanium) or 'light' (white with drop-shadow)
  const isDarkMode = account.cardTextColor === 'dark' || preset?.textColorMode === 'dark';
  const textColorClass = isDarkMode ? 'text-slate-900' : 'text-white';
  const textSubColorClass = isDarkMode ? 'text-slate-600' : 'text-white/80';
  const textMutedColorClass = isDarkMode ? 'text-slate-500' : 'text-white/60';
  const borderToneClass = isDarkMode ? 'border-slate-300/80 shadow-md' : (preset?.cardStyle.borderColor || skin.borderColor);

  // Compute CSS background style
  const isCustomGradient = customBg && customBg.includes('gradient');
  const cardStyle: React.CSSProperties = isCustomGradient
    ? {
        background: customBg,
        backgroundImage: `${customBg}, ${skin.bgTexture}`,
      }
    : customBg
    ? {
        backgroundColor: customBg,
        backgroundImage: skin.bgTexture,
      }
    : {
        backgroundImage: skin.bgTexture,
      };

  // Texture pattern from account or preset
  const pattern = account.cardPattern || preset?.cardStyle.patternType || 'radial-sheen';

  // Credit math
  const creditLimit = account.creditLimit || 0;
  const usedCredit = account.usedCredit !== undefined ? account.usedCredit : account.balance || 0;
  const availableCredit = Math.max(0, creditLimit - usedCredit);
  const utilization = creditLimit > 0 ? (usedCredit / creditLimit) * 100 : 0;

  // Masked 16-digit Card Number
  const last4 = account.cardNumberLast4 || '8888';
  const cardFormattedNumber = `••••  ••••  ••••  ${last4}`;
  const tierName = account.cardTier || preset?.cardTier || brand.defaultTier || (isCredit ? '普卡' : '标准卡');
  const cardNetwork = account.cardNetwork || preset?.cardNetwork || brand.cardNetwork || 'UNIONPAY';
  const holder = account.holderName || 'ZHANG WEI';
  const expiry = account.cardExpiry || '08/29';

  // Dynamic visual texture, art style, and top tier badge mapping based on tier & network
  const aesthetic = getCardTierAesthetic(tierName, cardNetwork, isCredit);

  // Card click to toggle awake state
  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    // Don't toggle if user clicked an interactive child (e.g., buttons, drag handle)
    if (target.closest('button') || target.closest('.cursor-grab') || target.closest('a')) {
      return;
    }
    setIsCardAwake((prev) => !prev);
  };

  return (
    <div className="flex flex-col h-full group">
      {/* 💳 PHYSICAL ID-1 CARD (ISO/IEC 7810 Standard Aspect Ratio 85.60 mm × 53.98 mm ≈ 1.5858:1 from cards.no2.ac) */}
      <div className="relative w-full aspect-[85.6/53.98] shrink-0 select-none">
        <div
          onClick={handleCardClick}
          className={`w-full h-full bank-card-shape card-shadow-wallet border cursor-pointer ${
            hasCardImage
              ? `${aesthetic.borderGlowClass} shadow-xl bg-slate-950`
              : `${aesthetic.artStyleClass} ${aesthetic.borderGlowClass}`
          } ${
            hasCardImage ? '' : customBg ? '' : `bg-gradient-to-br ${skin.gradientClass}`
          } ${textColorClass} transition-all duration-300 hover:shadow-2xl hover:-translate-y-0.5 flex flex-col justify-between relative overflow-hidden`}
          style={hasCardImage ? undefined : cardStyle}
        >
          {/* ================= 1. CARD BACKGROUND LAYER ================= */}
          {hasCardImage ? (
            <>
              {/* Cardentify & Apple Pay Lossless Card Face Artwork */}
              <img
                src={account.cardImageUrl}
                alt={account.name}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover object-center select-none pointer-events-none z-0"
              />
              {/* Apple Pay subtle glossy specular sheen */}
              <div className="card-gloss-sheen absolute inset-0 pointer-events-none z-1" />
            </>
          ) : (
            /* High-Definition Simulated Texture Overlay (Waves, Sheen, Carbon, Diamond, Circuit, etc.) */
            <CardTextureOverlay
              pattern={account.cardPattern || preset?.cardStyle.patternType || aesthetic.texturePattern}
              tier={tierName}
              network={cardNetwork}
            />
          )}

          {/* ================= 2. CARD TOP ROW ================= */}
          <div className="relative z-10 p-3 sm:p-4 flex items-center justify-between gap-2 shrink-0">
            {hasCardImage ? (
              /* When hasCardImage: Keep top row completely clean to preserve authentic card face aesthetic */
              <div className="flex-1" />
            ) : (
              /* When NO custom image: Render Bank Name (+ optional Brand Logo) + Card Network */
              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
                {account.showBrandLogo && (
                  <BrandLogo
                    type={brand.logoType || preset?.logoType || 'generic'}
                    logoUrl={effectiveBankLogoUrl}
                    size={compact ? 'sm' : 'md'}
                    className="shadow-sm ring-1 ring-white/20 shrink-0"
                  />
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className={`font-bold text-xs sm:text-sm md:text-base tracking-wide drop-shadow-sm truncate max-w-[160px] sm:max-w-[220px] ${textColorClass}`}>
                      {account.bankName || brand.name || preset?.bankName}
                    </h3>
                    {account.category === 'DEBIT_CARD' && account.accountClass && (
                      <span className={`text-[7px] sm:text-[8.5px] font-bold px-1.5 py-0.2 rounded-full backdrop-blur-md border ${
                        account.accountClass === 'CLASS_1'
                          ? 'bg-emerald-500/25 text-emerald-200 border-emerald-400/40'
                          : account.accountClass === 'CLASS_2'
                          ? 'bg-amber-500/25 text-amber-200 border-amber-400/40'
                          : 'bg-sky-500/25 text-sky-200 border-sky-400/40'
                      }`}>
                        {account.accountClass === 'CLASS_1' ? 'Ⅰ类全功能' : account.accountClass === 'CLASS_2' ? 'Ⅱ类限额' : 'Ⅲ类零钱'}
                      </span>
                    )}
                  </div>
                  <p className={`text-[8px] sm:text-[9px] tracking-widest font-mono uppercase truncate ${textSubColorClass}`}>
                    {brand.englishName || preset?.englishName}
                  </p>
                </div>
              </div>
            )}

            {/* Right: Contactless Icon, Drag Handle & Card Organization Logo Corner Badge */}
            <div className="flex items-center gap-1.5 shrink-0 ml-auto pointer-events-auto z-25">
              {dragHandleProps && !hideActionRow && isReorderMode && (
                <div
                  {...dragHandleProps}
                  className="cursor-grab active:cursor-grabbing p-1 sm:p-1.5 rounded-lg backdrop-blur-md transition-all shadow-2xs border shrink-0 bg-black/40 hover:bg-black/60 text-white/90 border-white/20"
                  title="⠿ 按住可拖拽排版此卡片"
                >
                  <GripVertical className="w-3.5 h-3.5" />
                </div>
              )}

              {!hasCardImage && isBankCard && (
                <ContactlessIcon className={isDarkMode ? 'text-slate-700' : 'text-white/80'} />
              )}

              {/* 🌟 Top-Right Corner Badge: Card Organization Logo (银联/VISA/Mastercard/JCB/AMEX) - No Background */}
              {hasCardImage ? (
                <CardNetworkBadge
                  network={cardNetwork && cardNetwork !== 'NONE' ? cardNetwork : 'UNIONPAY'}
                  size={compact ? 'sm' : 'md'}
                  className="drop-shadow-lg select-none transition-transform hover:scale-105"
                />
              ) : (
                cardNetwork && cardNetwork !== 'NONE' && (
                  <CardNetworkBadge
                    network={cardNetwork}
                    size={compact ? 'sm' : 'md'}
                  />
                )
              )}
            </div>
          </div>

          {/* ================= 3. CARD MIDDLE ROW: Reorder Badge / Chip ================= */}
          <div
            className={`relative z-10 px-3 sm:px-4 my-auto flex items-center justify-between min-h-0 transition-opacity duration-300 ${
              isDetailsAwake
                ? 'opacity-0 pointer-events-none'
                : 'opacity-100 group-hover:opacity-0 group-hover:pointer-events-none'
            }`}
          >
            {hasCardImage ? (
              <div className="flex items-center gap-2">
                {isReorderMode && reorderIndex !== undefined && (
                  <div className="px-2.5 py-0.5 rounded-full bg-purple-600/90 backdrop-blur-md text-white text-[11px] font-bold border border-white/40 shadow-sm flex items-center gap-1">
                    <span>序号 #{reorderIndex + 1}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2.5 sm:gap-3">
                {isBankCard && <EMVChip size={compact ? 'sm' : 'md'} className="shadow-sm shrink-0" />}
                {account.notes && (
                  <p className={`text-[8px] sm:text-[9px] truncate max-w-[160px] ${textSubColorClass}`}>
                    {account.notes}
                  </p>
                )}
                {isReorderMode && reorderIndex !== undefined && (
                  <div className="px-2.5 py-0.5 rounded-full bg-purple-600/90 backdrop-blur-md text-white text-[11px] font-bold border border-white/40 shadow-sm flex items-center gap-1">
                    <span>序号 #{reorderIndex + 1}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ================= 4. BOTTOM-LEFT BANK TITLE & TIER BADGE ================= */}
          <div
            className={`absolute bottom-2.5 left-2.5 z-10 transition-all duration-300 ease-out pointer-events-auto ${
              isDetailsAwake
                ? 'opacity-0 translate-y-2 pointer-events-none scale-90'
                : 'opacity-100 translate-y-0 group-hover:opacity-0 group-hover:pointer-events-none'
            }`}
          >
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full backdrop-blur-xl bg-black/40 text-white/95 border border-white/20 shadow-md max-w-[280px] sm:max-w-[320px] select-none">
              {/* 🏦 LogoHub 官方矢量银行徽标 */}
              {effectiveBankLogoUrl && (
                <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center p-0.5 shrink-0 overflow-hidden shadow-2xs aspect-square border border-white/20">
                  <img
                    src={effectiveBankLogoUrl}
                    alt={displayBankName}
                    className="w-full h-full object-contain"
                    loading="lazy"
                  />
                </div>
              )}
              <span className="text-[10px] sm:text-[11px] font-bold truncate max-w-[100px] sm:max-w-[130px]">
                {displayBankName}
              </span>
              {account.category === 'DEBIT_CARD' && account.accountClass && (
                <span className={`text-[7px] sm:text-[8px] font-bold px-1.5 py-0.2 rounded-full border shrink-0 ${
                  account.accountClass === 'CLASS_1'
                    ? 'bg-emerald-500/25 text-emerald-200 border-emerald-400/40'
                    : account.accountClass === 'CLASS_2'
                    ? 'bg-amber-500/25 text-amber-200 border-amber-400/40'
                    : 'bg-sky-500/25 text-sky-200 border-sky-400/40'
                }`}>
                  {account.accountClass === 'CLASS_1' ? 'Ⅰ类' : account.accountClass === 'CLASS_2' ? 'Ⅱ类' : 'Ⅲ类'}
                </span>
              )}
              {/* 🌟 卡片等级：统一显示为银行卡样式的专属 Logo，以等级颜色呈现 */}
              <TierCardLogo
                tierType={aesthetic.tierType}
                tierLabel={aesthetic.tierLabel}
              />
            </div>
          </div>

          {/* ================= 5. SLEEPING STATE HINT (Bottom-right masked card number, "轻触唤醒" removed) ================= */}
          <div
            className={`absolute bottom-2.5 right-2.5 z-10 transition-all duration-300 ease-out pointer-events-auto ${
              isDetailsAwake
                ? 'opacity-0 translate-y-2 pointer-events-none scale-90'
                : 'opacity-100 translate-y-0 group-hover:opacity-0 group-hover:pointer-events-none'
            }`}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsCardAwake(true);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full backdrop-blur-xl bg-black/35 hover:bg-black/50 text-white/90 border border-white/20 shadow-md text-[10px] font-mono transition-transform hover:scale-105 active:scale-95 cursor-pointer"
              title="点击唤醒卡号与可用额度"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="tracking-wider">•••• {last4}</span>
            </button>
          </div>

          {/* ================= 6. AWAKENED STATE HUD (触碰卡面唤醒态·高透明磨砂玻璃坞) ================= */}
          {/* Glides up smoothly on hover or when awakened via click/tap - ABSOLUTE DOCK OVERLAY */}
          <div
            className={`absolute inset-x-0 bottom-0 z-20 p-2 sm:p-2.5 transition-all duration-300 ease-out transform ${
              isDetailsAwake
                ? 'opacity-100 translate-y-0 pointer-events-auto'
                : 'opacity-0 translate-y-3 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto'
            }`}
          >
            <div className="rounded-2xl backdrop-blur-2xl bg-slate-950/30 sm:bg-black/25 p-2 sm:p-2.5 border border-white/30 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] text-white backdrop-saturate-200 ring-1 ring-inset ring-white/15">
              {/* HUD Header Bar: Masked Card Number + Quick Sleep Toggle */}
              <div className="flex items-center justify-between pb-1 mb-1 border-b border-white/15 text-[10px] font-mono">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-white/70 text-[9px] shrink-0">卡号</span>
                  <span className="font-bold tracking-wider text-white text-[11px] sm:text-xs drop-shadow-sm font-mono truncate">
                    {cardFormattedNumber}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const numToCopy = account.cardNumberLast4
                        ? `6225 8888 0000 ${account.cardNumberLast4}`
                        : '6225 8888 0000 8888';
                      navigator.clipboard.writeText(numToCopy);
                      setIsCopiedCardNum(true);
                      setTimeout(() => setIsCopiedCardNum(false), 2000);
                    }}
                    className="p-1 rounded hover:bg-white/20 text-white/70 hover:text-white transition-colors flex items-center shrink-0 cursor-pointer"
                    title="点击复制此卡卡号"
                  >
                    {isCopiedCardNum ? (
                      <span className="text-[9px] text-emerald-300 font-sans font-bold flex items-center gap-0.5">
                        <Check className="w-2.5 h-2.5" /> 已复制
                      </span>
                    ) : (
                      <Copy className="w-2.5 h-2.5 text-white/60 hover:text-white" />
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {account.category === 'DEBIT_CARD' && account.accountClass && (
                    <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded-full border ${
                      account.accountClass === 'CLASS_1'
                        ? 'bg-emerald-500/25 text-emerald-200 border-emerald-400/40'
                        : account.accountClass === 'CLASS_2'
                        ? 'bg-amber-500/25 text-amber-200 border-amber-400/40'
                        : 'bg-sky-500/25 text-sky-200 border-sky-400/40'
                    }`}>
                      {account.accountClass === 'CLASS_1' ? 'Ⅰ类户' : account.accountClass === 'CLASS_2' ? 'Ⅱ类户' : 'Ⅲ类户'}
                    </span>
                  )}
                  <TierCardLogo
                    tierType={aesthetic.tierType}
                    tierLabel={aesthetic.tierLabel}
                  />
                </div>
              </div>

              {isCredit ? (
                <div>
                  {/* Available Credit Limit & Used Due */}
                  <div className="flex items-end justify-between gap-1.5">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1 mb-0.5">
                        <span className="text-[8px] uppercase tracking-wider font-bold text-emerald-300 leading-none">
                          剩余可用额度
                        </span>
                        <span className="text-[7px] px-1 py-0.1 rounded font-mono bg-emerald-400/25 text-emerald-200">
                          {utilization > 0 ? `已用 ${utilization.toFixed(0)}%` : '全额可用'}
                        </span>
                      </div>
                      <div className="font-mono font-black text-xs sm:text-sm md:text-base tracking-tight leading-tight text-emerald-200 drop-shadow-md truncate">
                        {formatCurrency(availableCredit, privacyMode)}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[8px] uppercase tracking-wider block leading-none text-rose-200 font-medium">
                        已用待还: <strong className="font-mono font-bold text-[10px] sm:text-[11px] text-white">{formatCurrency(usedCredit, privacyMode)}</strong>
                      </span>
                      <span className="text-[7px] sm:text-[8px] font-mono block mt-0.5 text-white/65">
                        总额度 {formatCurrency(creditLimit, privacyMode)}
                      </span>
                    </div>
                  </div>

                  {/* Bottom subline: holder & expiry */}
                  <div className="mt-1 pt-1 border-t border-white/15 flex items-center justify-between text-[7px] sm:text-[8px] font-mono text-white/80">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="uppercase text-white/70 truncate">{holder}</span>
                      <span className="text-white/50">{expiry}</span>
                    </div>
                    {(account.billDay || account.dueDay) && (
                      <span className="text-[7px] sm:text-[8px] text-amber-200/90 font-medium shrink-0">
                        {account.billDay ? `${account.billDay}日出账` : ''}
                        {account.billDay && account.dueDay ? ' · ' : ''}
                        {account.dueDay ? `${account.dueDay}日还款` : ''}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  {/* Debit / Savings / Wallet / Cash / Gold */}
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="min-w-0">
                      <span className="text-[8px] uppercase tracking-wider block leading-none text-white/70">
                        {isGold ? '黄金估值' : '可用余额'}
                      </span>
                      <span className="font-mono font-black text-xs sm:text-sm md:text-base text-emerald-200 leading-tight drop-shadow-sm truncate block mt-0.5">
                        {formatCurrency(account.balance, privacyMode)}
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[8px] text-white/60 block leading-none">
                        所属机构
                      </span>
                      <span className="text-[9px] sm:text-[10px] font-semibold text-white drop-shadow-xs block mt-0.5 truncate max-w-[120px]">
                        {account.bankName || brand.name}
                      </span>
                    </div>
                  </div>

                  <div className="mt-1 pt-1 border-t border-white/15 flex items-center justify-between text-[7px] sm:text-[8px] font-mono text-white/75">
                    <div className="flex items-center gap-2 truncate">
                      <span className="uppercase font-semibold text-white/90 truncate">{holder}</span>
                      <span className="text-white/60">{expiry}</span>
                    </div>
                    {account.notes && (
                      <span className="text-[7px] sm:text-[8px] text-white/60 truncate max-w-[120px]">
                        {account.notes}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ================= 6. CONSOLIDATED ACTION & MANAGEMENT DOCK UNDER THE CARD ================= */}
      {!hideActionRow && (
        <div className="mt-2.5 flex flex-col gap-1.5 shrink-0">
          {/* Row 1: Primary Business & Transaction Actions (Height: h-8) */}
          <div className="h-8 flex items-center justify-between gap-1.5 px-0.5">
            {isReorderMode ? (
              /* Reorder mode action bar */
              <div className="w-full h-full flex items-center gap-1.5 bg-purple-50/80 dark:bg-purple-950/40 p-0.5 rounded-xl border border-purple-200/80 dark:border-purple-800">
                <button
                  type="button"
                  onClick={onMoveTop}
                  disabled={reorderIndex === 0}
                  className="flex-1 h-full px-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-purple-100 disabled:opacity-40 text-purple-800 dark:text-purple-300 text-xs font-semibold border border-purple-200 dark:border-purple-800 shadow-2xs transition-all flex items-center justify-center gap-1"
                  title="置顶到第一位"
                >
                  <ArrowUpToLine className="w-3.5 h-3.5" />
                  <span>置顶</span>
                </button>
                <button
                  type="button"
                  onClick={onMoveUp}
                  disabled={reorderIndex === 0}
                  className="flex-1 h-full px-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-purple-100 disabled:opacity-40 text-purple-800 dark:text-purple-300 text-xs font-semibold border border-purple-200 dark:border-purple-800 shadow-2xs transition-all flex items-center justify-center gap-1"
                  title="往前移一位"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span>前移</span>
                </button>
                <button
                  type="button"
                  onClick={onMoveDown}
                  disabled={totalCount !== undefined && reorderIndex !== undefined && reorderIndex >= totalCount - 1}
                  className="flex-1 h-full px-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-purple-100 disabled:opacity-40 text-purple-800 dark:text-purple-300 text-xs font-semibold border border-purple-200 dark:border-purple-800 shadow-2xs transition-all flex items-center justify-center gap-1"
                  title="往后移一位"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span>后移</span>
                </button>
              </div>
            ) : isCredit ? (
              <>
                <button
                  type="button"
                  onClick={() => onOpenRepayment?.(account.id, usedCredit)}
                  className="flex-1 h-full px-2 rounded-xl bg-slate-900 dark:bg-white hover:bg-slate-800 text-white dark:text-slate-900 font-semibold text-xs text-center shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ReceiptText className="w-3.5 h-3.5 text-rose-400 dark:text-rose-600" />
                  <span>快速还款</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenNewTx?.('EXPENSE', account.id)}
                  className="flex-1 h-full px-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-xs text-center border border-slate-200 dark:border-slate-700 shadow-2xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <ArrowUpRight className="w-3.5 h-3.5 text-rose-500" />
                  <span>刷卡记账</span>
                </button>
              </>
            ) : isLend ? (
              <>
                <button
                  type="button"
                  onClick={() => onOpenNewTx?.('COLLECT_LENT', account.id)}
                  className="flex-1 h-full px-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-xs text-center shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>收回借款</span>
                </button>
                <button
                  type="button"
                  onClick={() => onQuickReconcile?.(account)}
                  className="flex-1 h-full px-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>改金额</span>
                </button>
              </>
            ) : isBorrow ? (
              <>
                <button
                  type="button"
                  onClick={() => onOpenNewTx?.('PAY_BORROW', account.id)}
                  className="flex-1 h-full px-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs text-center shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>归还借款</span>
                </button>
                <button
                  type="button"
                  onClick={() => onQuickReconcile?.(account)}
                  className="flex-1 h-full px-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>改金额</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onOpenNewTx?.('EXPENSE', account.id)}
                  className="flex-1 h-full px-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-semibold text-xs text-center border border-rose-200/80 dark:border-rose-900/50 shadow-2xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>支出</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenNewTx?.('INCOME', account.id)}
                  className="flex-1 h-full px-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-semibold text-xs text-center border border-emerald-200/80 dark:border-emerald-900/50 shadow-2xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                  <span>收入</span>
                </button>
                <button
                  type="button"
                  onClick={() => onQuickReconcile?.(account)}
                  className="h-full px-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center shrink-0 cursor-pointer"
                  title="修改余额"
                >
                  <span>改余额</span>
                </button>
              </>
            )}
          </div>

          {/* Row 2: Unified Card Management & Style Controls Toolbar (Height: h-7) */}
          <div className="h-7 flex items-center justify-between gap-1 px-1.5 py-0.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 text-[11px]">
            <div className="flex items-center gap-1 min-w-0 flex-1">
              {onOpenCardentifyGallery && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenCardentifyGallery(account);
                  }}
                  className="px-1.5 py-0.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1 cursor-pointer truncate"
                  title="从 Cardentify & CardArt 挑选更换官方高清卡面"
                >
                  <Palette className="w-3 h-3 text-indigo-500 shrink-0" />
                  <span>换卡面</span>
                </button>
              )}

              {hasCardImage && onClearCardImage && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClearCardImage(account.id);
                  }}
                  className="px-1.5 py-0.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-amber-600 dark:text-amber-400 transition-colors flex items-center gap-1 cursor-pointer truncate"
                  title="清除此卡面套用的自定义原图，恢复官方默认质感底色"
                >
                  <ImageOff className="w-3 h-3 text-amber-500 shrink-0" />
                  <span>删卡面</span>
                </button>
              )}

              {onAutoRegenColor && !hasCardImage && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAutoRegenColor(account.id);
                  }}
                  className="px-1.5 py-0.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 hover:text-purple-600 dark:hover:text-purple-400 transition-colors flex items-center gap-1 cursor-pointer truncate"
                  title="随机切换下一张高定卡面底色"
                >
                  <Wand2 className="w-3 h-3 text-purple-500 shrink-0" />
                  <span>换底色</span>
                </button>
              )}

              {onEditAccount && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditAccount(account);
                  }}
                  className="px-1.5 py-0.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1 cursor-pointer truncate"
                  title="编辑卡片完整属性与外观"
                >
                  <Pencil className="w-3 h-3 text-blue-500 shrink-0" />
                  <span>编辑</span>
                </button>
              )}

              {onQuickReconcile && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuickReconcile(account);
                  }}
                  className="px-1.5 py-0.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1 cursor-pointer truncate"
                  title="快速校对余额/欠款与额度"
                >
                  <Sliders className="w-3 h-3 text-slate-500 shrink-0" />
                  <span>校对</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-0.5 shrink-0 ml-auto">
              {/* Wake Pin Mode Toggle */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCardPinned(!isCardPinned);
                  if (isCardPinned) setIsCardAwake(false);
                }}
                className={`px-1.5 py-0.5 rounded-lg transition-colors flex items-center gap-0.5 cursor-pointer text-[10px] ${
                  isCardPinned
                    ? 'bg-amber-200/80 dark:bg-amber-950 text-amber-900 dark:text-amber-300 font-bold shadow-2xs'
                    : 'hover:bg-white dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title={isCardPinned ? '当前已锁定常显 (点击恢复隐藏唤醒)' : '点击锁定常显明细'}
              >
                {isCardPinned ? <Pin className="w-2.5 h-2.5 text-amber-600 shrink-0 rotate-45" /> : <PinOff className="w-2.5 h-2.5 text-slate-400 shrink-0" />}
                <span>{isCardPinned ? '常显' : '常显'}</span>
              </button>

              {/* Delete Account with non-blocking inline confirmation */}
              {onDeleteAccount && (
                confirmDelete ? (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/90 px-1.5 py-0.5 rounded-lg border border-rose-300 dark:border-rose-800 shadow-xs animate-in fade-in duration-150 shrink-0 z-10"
                  >
                    <span className="text-[10px] text-rose-700 dark:text-rose-300 font-bold whitespace-nowrap">确认删除?</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteAccount(account.id);
                        setConfirmDelete(false);
                      }}
                      className="px-1.5 py-0.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded text-[10px] font-bold shadow-2xs transition-all cursor-pointer"
                      title="立即确认删除此卡片"
                    >
                      确定
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDelete(false);
                      }}
                      className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 active:scale-95 text-slate-700 dark:text-slate-200 rounded text-[10px] transition-all cursor-pointer"
                    >
                      取消
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDelete(true);
                    }}
                    className="p-1 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/60 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                    title="删除此卡片"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
