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
} from 'lucide-react';
import { FinancialAccount } from '../types';
import { detectBrandInfo, CARD_SKINS } from '../lib/brandHelper';
import { BrandLogo, CardNetworkBadge, EMVChip, ContactlessIcon } from './BrandLogo';
import { CardTextureOverlay } from './CardTextureOverlay';
import { getCardentifyPreset } from '../lib/cardentifyPresets';
import { formatCurrency } from '../lib/formatters';

interface AccountCardFaceProps {
  account: FinancialAccount;
  privacyMode: boolean;
  onEditAccount?: (account: FinancialAccount) => void;
  onDeleteAccount?: (accountId: string) => void;
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

export const AccountCardFace: React.FC<AccountCardFaceProps> = ({
  account,
  privacyMode,
  onEditAccount,
  onDeleteAccount,
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

  useEffect(() => {
    setIsCardPinned(wakeMode === 'pinned');
  }, [wakeMode]);

  // Is actively awake via pin or click tap
  const isDetailsAwake = isCardPinned || isCardAwake;

  const brand = detectBrandInfo(account.name, account.bankName, account.category);
  const skinId = account.cardSkin || brand.cardSkin || 'classic-cmb';
  const skin = CARD_SKINS.find((s) => s.id === skinId) || CARD_SKINS[0];
  const preset = account.cardPresetId ? getCardentifyPreset(account.cardPresetId) : undefined;

  // 卡面左下角银行名称纯净提取
  const displayBankName = account.bankName || preset?.bankName || brand.shortName || brand.name || account.name;

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
  const tierName = account.cardTier || preset?.cardTier || brand.defaultTier;
  const cardNetwork = account.cardNetwork || preset?.cardNetwork || brand.cardNetwork;
  const holder = account.holderName || 'ZHANG WEI';
  const expiry = account.cardExpiry || '08/29';

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
            hasCardImage ? 'border-white/20 shadow-xl bg-slate-950' : borderToneClass
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
            /* High-Definition Simulated Texture Overlay (Waves, Sheen, Mesh, Geometric, Circuit, etc.) */
            <CardTextureOverlay pattern={pattern} />
          )}

          {/* ================= 2. CARD TOP ROW ================= */}
          <div className="relative z-10 p-3 sm:p-4 flex items-center justify-between gap-2 shrink-0">
            {!hasCardImage ? (
              /* When NO custom image: Render Bank Name (+ optional Brand Logo) + Card Network */
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                {account.showBrandLogo && (
                  <BrandLogo
                    type={brand.logoType || preset?.logoType || 'generic'}
                    size={compact ? 'sm' : 'md'}
                    className="shadow-sm ring-1 ring-white/20 shrink-0"
                  />
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className={`font-bold text-xs sm:text-sm md:text-base tracking-wide drop-shadow-sm truncate max-w-[150px] sm:max-w-[210px] ${textColorClass}`}>
                      {account.bankName || brand.name || preset?.bankName}
                    </h3>
                    <span className={`text-[8px] sm:text-[10px] font-semibold px-1.5 py-0.2 rounded-full backdrop-blur-md border truncate max-w-[90px] ${
                      isDarkMode ? 'bg-slate-900/10 text-slate-800 border-slate-300' : 'bg-white/20 text-white border-white/20'
                    }`}>
                      {tierName}
                    </span>
                  </div>
                  <p className={`text-[8px] sm:text-[9px] tracking-widest font-mono uppercase truncate ${textSubColorClass}`}>
                    {brand.englishName || preset?.englishName}
                  </p>
                </div>
              </div>
            ) : (
              /* When hasCardImage: Keep top row completely clean to preserve authentic card face aesthetic */
              <div className="flex-1" />
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

          {/* ================= 4. BOTTOM-LEFT BANK TITLE (Only display bank name) ================= */}
          <div
            className={`absolute bottom-2.5 left-2.5 z-10 transition-all duration-300 ease-out pointer-events-auto ${
              isDetailsAwake
                ? 'opacity-0 translate-y-2 pointer-events-none scale-90'
                : 'opacity-100 translate-y-0 group-hover:opacity-0 group-hover:pointer-events-none'
            }`}
          >
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full backdrop-blur-xl bg-black/35 text-white/95 border border-white/20 shadow-md max-w-[190px] truncate select-none">
              <span className="text-[10px] font-bold truncate">{displayBankName}</span>
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

              {/* Delete Account */}
              {onDeleteAccount && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`确定移除卡片「${account.name}」吗？`)) {
                      onDeleteAccount(account.id);
                    }
                  }}
                  className="p-1 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/60 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                  title="删除此卡片"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
