import React from 'react';
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
} from 'lucide-react';
import { FinancialAccount } from '../types';
import { detectBrandInfo, CARD_SKINS } from '../lib/brandHelper';
import { BrandLogo, CardNetworkBadge, EMVChip, ContactlessIcon } from './BrandLogo';
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
  compact?: boolean;
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
  compact = false,
  isReorderMode = false,
  reorderIndex,
  totalCount,
  onMoveUp,
  onMoveDown,
  onMoveTop,
  dragHandleProps,
}) => {
  const brand = detectBrandInfo(account.name, account.bankName, account.category);
  const skinId = account.cardSkin || brand.cardSkin || 'classic-cmb';
  const skin = CARD_SKINS.find((s) => s.id === skinId) || CARD_SKINS[0];

  // Custom base color or skin gradient
  const customBg = account.cardBgColor;
  const isCredit = account.category === 'CREDIT_CARD' || account.category === 'JD_BAITIAO' || account.category === 'HUABEI';
  const isGold = account.category === 'GOLD';
  const isLend = account.category === 'RECEIVABLE';
  const isBorrow = account.category === 'PAYABLE';
  const isBankCard = account.category === 'DEBIT_CARD' || account.category === 'CREDIT_CARD';

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

  // Credit math
  const creditLimit = account.creditLimit || 0;
  const usedCredit = account.usedCredit !== undefined ? account.usedCredit : account.balance || 0;
  const availableCredit = Math.max(0, creditLimit - usedCredit);
  const utilization = creditLimit > 0 ? (usedCredit / creditLimit) * 100 : 0;

  // Masked 16-digit Card Number
  const last4 = account.cardNumberLast4 || '8888';
  const cardFormattedNumber = `••••  ••••  ••••  ${last4}`;
  const tierName = account.cardTier || brand.defaultTier;
  const cardNetwork = account.cardNetwork || brand.cardNetwork;
  const holder = account.holderName || 'ZHANG WEI';
  const expiry = account.cardExpiry || '08/29';

  return (
    <div className="flex flex-col justify-between h-full group">
      {/* 💳 PHYSICAL ID-1 CARD (ISO/IEC 7810 Standard Aspect Ratio 85.60 mm × 53.98 mm ≈ 1.5858:1) */}
      <div className="relative w-full aspect-[85.6/53.98] select-none">
        <div
          className={`w-full h-full rounded-2xl sm:rounded-[1.25rem] p-3.5 sm:p-5 overflow-hidden shadow-md sm:shadow-lg border ${
            skin.borderColor
          } ${
            customBg ? '' : `bg-gradient-to-br ${skin.gradientClass}`
          } text-white transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 flex flex-col justify-between relative`}
          style={cardStyle}
        >
          {/* Subtle metallic sheen & light reflection */}
          <div className="absolute -top-16 -left-16 w-56 h-56 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 w-56 h-56 rounded-full bg-black/20 blur-2xl pointer-events-none" />

          {/* ================= 1. CARD TOP ROW: Brand Logo + Bank Name + Card Network (VISA/万事达/银联/AMEX/JCB) ================= */}
          <div className="relative z-10 flex items-start justify-between gap-2">
            {/* Left: Brand Logo + Name + Tier */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <BrandLogo
                type={brand.logoType}
                size={compact ? 'sm' : 'md'}
                className="shadow-sm ring-1 ring-white/20 shrink-0"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="font-bold text-xs sm:text-sm md:text-base tracking-wide drop-shadow-sm text-white truncate max-w-[130px] sm:max-w-[170px]">
                    {account.bankName || brand.name}
                  </h3>
                  <span className="text-[8px] sm:text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/20 truncate max-w-[90px]">
                    {tierName}
                  </span>
                </div>
                <p className="text-[8px] sm:text-[9px] tracking-widest text-white/75 font-mono uppercase truncate">
                  {brand.englishName}
                </p>
              </div>
            </div>

            {/* Right: Contactless Icon + Transparent Card Network Badge */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Drag Handle in Card Top Bar */}
              <div
                {...dragHandleProps}
                className="cursor-grab active:cursor-grabbing p-1 rounded-lg bg-black/20 hover:bg-black/40 backdrop-blur-md text-white/80 hover:text-white transition-all shadow-2xs border border-white/10"
                title="⠿ 按住可拖拽排版此卡片"
              >
                <GripVertical className="w-3.5 h-3.5" />
              </div>
              {isBankCard && <ContactlessIcon className="text-white/80" />}
              <CardNetworkBadge network={cardNetwork} size={compact ? 'sm' : 'md'} />
            </div>
          </div>

          {/* ================= 2. CARD MIDDLE ROW: EMV Smart Chip + Card Label / Quick Action ================= */}
          <div className="relative z-10 my-auto flex items-center justify-between">
            <div className="flex items-center gap-2.5 sm:gap-3">
              {isBankCard && <EMVChip size={compact ? 'sm' : 'md'} className="shadow-sm" />}
              <div className="min-w-0">
                <div className="text-[11px] sm:text-xs font-semibold tracking-wide text-white/90 drop-shadow-xs truncate max-w-[180px]">
                  {account.name}
                </div>
                {account.notes && (
                  <p className="text-[8px] sm:text-[9px] text-white/70 truncate max-w-[160px]">
                    {account.notes}
                  </p>
                )}
              </div>
            </div>

            {/* Position badge when in reorder mode */}
            {isReorderMode && reorderIndex !== undefined && (
              <div className="px-2 py-0.5 rounded-full bg-purple-500/80 backdrop-blur-md text-white text-[10px] font-bold border border-white/30 shadow-xs flex items-center gap-1">
                <span>序号 #{reorderIndex + 1}</span>
              </div>
            )}

            {/* Inline Card Buttons (Hover reveal) */}
            {!isReorderMode && (
              <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity bg-black/30 backdrop-blur-md rounded-lg p-0.5 border border-white/20">
                {onAutoRegenColor && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAutoRegenColor(account.id);
                    }}
                    className="p-1 rounded hover:bg-white/20 text-purple-300 hover:text-white transition-colors"
                    title="✨ 随机切换卡面底色"
                  >
                    <Wand2 className="w-3 h-3" />
                  </button>
                )}
                {onQuickReconcile && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onQuickReconcile(account);
                    }}
                    className="p-1 rounded hover:bg-white/20 text-white/90 transition-colors"
                    title="快速校对余额/欠款"
                  >
                    <Sliders className="w-3 h-3" />
                  </button>
                )}
                {onEditAccount && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditAccount(account);
                    }}
                    className="p-1 rounded hover:bg-white/20 text-white/90 transition-colors"
                    title="编辑卡片外观与底色"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                )}
                {onDeleteAccount && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`确定移除卡片「${account.name}」吗？`)) {
                        onDeleteAccount(account.id);
                      }
                    }}
                    className="p-1 rounded hover:bg-rose-600/80 text-white/90 transition-colors"
                    title="删除此卡片"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ================= 3. CARD BOTTOM AREA ================= */}
          <div className="relative z-10 pt-1.5 border-t border-white/15">
            {isCredit ? (
              <div>
                {/* 💳 CREDIT CARDS: Highlight & ENLARGE Available Limit */}
                <div className="flex items-end justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[8px] sm:text-[9px] uppercase tracking-wider text-emerald-300 font-bold leading-none">
                        剩余可用额度
                      </span>
                      <span className="text-[7px] sm:text-[8px] px-1 py-0.2 rounded bg-emerald-400/25 text-emerald-100 font-mono">
                        {utilization > 0 ? `已用 ${utilization.toFixed(0)}%` : '全额可用'}
                      </span>
                    </div>
                    {/* ENLARGED AVAILABLE CREDIT */}
                    <div className="font-mono font-black text-sm sm:text-base md:text-xl text-emerald-200 tracking-tight leading-tight drop-shadow-md truncate">
                      {formatCurrency(availableCredit, privacyMode)}
                    </div>
                  </div>

                  {/* Right: Used / Due Debt and Total Limit */}
                  <div className="text-right shrink-0">
                    <span className="text-[8px] uppercase tracking-wider text-rose-200/90 block leading-none">
                      已用待还: <strong className="font-mono font-bold text-[11px] sm:text-xs text-white drop-shadow-sm">{formatCurrency(usedCredit, privacyMode)}</strong>
                    </span>
                    <span className="text-[7px] sm:text-[8px] text-white/70 font-mono block mt-0.5">
                      总额度 {formatCurrency(creditLimit, privacyMode)}
                    </span>
                  </div>
                </div>

                {/* Masked Card Number & Holder Info Row */}
                <div className="mt-1 pt-1 border-t border-white/10 flex items-center justify-between text-white/80 text-[8px] sm:text-[9px] font-mono">
                  <div className="tracking-widest font-semibold text-white/90">
                    {cardFormattedNumber}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="uppercase text-white/75">{holder}</span>
                    <span className="text-white/60">{expiry}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                {/* 💳 DEBIT / WALLET / GOLD / SAVINGS: Card Number & Available Balance */}
                <div className="flex items-center justify-between">
                  <div
                    className="font-mono text-xs sm:text-sm md:text-[15px] font-bold tracking-widest text-white/95 drop-shadow-sm"
                    style={{ letterSpacing: '0.15em' }}
                  >
                    {account.cardNumberLast4 ? cardFormattedNumber : '••••  ••••  ••••  8888'}
                  </div>

                  {/* Real-time Balance / Limit Tag */}
                  <div className="text-right">
                    <span className="text-[8px] uppercase tracking-wider text-white/70 block leading-none">
                      {isGold ? '黄金估值' : '可用余额'}
                    </span>
                    <span className="font-mono font-black text-xs sm:text-sm md:text-base leading-tight drop-shadow-sm text-white">
                      {formatCurrency(account.balance, privacyMode)}
                    </span>
                  </div>
                </div>

                {/* Bottom Details: Cardholder & Expiry Date */}
                <div className="mt-1 flex items-center justify-between text-white/80 text-[8px] sm:text-[9px] font-mono">
                  <div className="flex items-center gap-3">
                    <div>
                      <span className="text-[7px] uppercase tracking-widest text-white/60 block leading-none">
                        CARDHOLDER
                      </span>
                      <span className="font-semibold uppercase tracking-wider text-white">
                        {holder}
                      </span>
                    </div>
                    <div>
                      <span className="text-[7px] uppercase tracking-widest text-white/60 block leading-none">
                        VALID THRU
                      </span>
                      <span className="font-semibold text-white/90">
                        {expiry}
                      </span>
                    </div>
                  </div>

                  {account.bankName && (
                    <span className="text-[8px] sm:text-[9px] text-white/75">
                      {account.bankName}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================= 4. QUICK ACTION BAR UNDER THE PHYSICAL CARD ================= */}
      <div className="mt-2.5 flex items-center justify-between gap-1.5 px-0.5">
        {isReorderMode ? (
          /* Reorder mode action bar */
          <div className="w-full flex items-center gap-1.5 bg-purple-50/80 p-1 rounded-xl border border-purple-200/80">
            <button
              onClick={onMoveTop}
              disabled={reorderIndex === 0}
              className="flex-1 py-1.5 px-2 rounded-lg bg-white hover:bg-purple-100 disabled:opacity-40 disabled:hover:bg-white text-purple-800 text-xs font-semibold border border-purple-200 shadow-2xs transition-all flex items-center justify-center gap-1"
              title="置顶到第一位"
            >
              <ArrowUpToLine className="w-3.5 h-3.5" />
              <span>置顶</span>
            </button>
            <button
              onClick={onMoveUp}
              disabled={reorderIndex === 0}
              className="flex-1 py-1.5 px-2 rounded-lg bg-white hover:bg-purple-100 disabled:opacity-40 disabled:hover:bg-white text-purple-800 text-xs font-semibold border border-purple-200 shadow-2xs transition-all flex items-center justify-center gap-1"
              title="往前移一位"
            >
              <ChevronUp className="w-3.5 h-3.5" />
              <span>前移</span>
            </button>
            <button
              onClick={onMoveDown}
              disabled={totalCount !== undefined && reorderIndex !== undefined && reorderIndex >= totalCount - 1}
              className="flex-1 py-1.5 px-2 rounded-lg bg-white hover:bg-purple-100 disabled:opacity-40 disabled:hover:bg-white text-purple-800 text-xs font-semibold border border-purple-200 shadow-2xs transition-all flex items-center justify-center gap-1"
              title="往后移一位"
            >
              <ChevronDown className="w-3.5 h-3.5" />
              <span>后移</span>
            </button>
          </div>
        ) : isCredit ? (
          <>
            <button
              onClick={() => onOpenRepayment?.(account.id, usedCredit)}
              className="flex-1 py-1.5 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs text-center shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1"
            >
              <ReceiptText className="w-3.5 h-3.5 text-rose-400" />
              <span>快速还款</span>
            </button>
            <button
              onClick={() => onOpenNewTx?.('EXPENSE', account.id)}
              className="flex-1 py-1.5 px-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs text-center border border-slate-200 shadow-2xs transition-colors flex items-center justify-center gap-1"
            >
              <ArrowUpRight className="w-3.5 h-3.5 text-rose-500" />
              <span>刷卡记账</span>
            </button>
            <button
              onClick={() => onQuickReconcile?.(account)}
              className="p-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-900 border border-slate-200 shadow-2xs transition-colors"
              title="校对欠款/额度"
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>
          </>
        ) : isLend ? (
          <>
            <button
              onClick={() => onOpenNewTx?.('COLLECT_LENT', account.id)}
              className="flex-1 py-1.5 px-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-xs text-center shadow-xs transition-colors"
            >
              收回借款
            </button>
            <button
              onClick={() => onQuickReconcile?.(account)}
              className="py-1.5 px-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium border border-slate-200 transition-colors"
            >
              改金额
            </button>
          </>
        ) : isBorrow ? (
          <>
            <button
              onClick={() => onOpenNewTx?.('PAY_BORROW', account.id)}
              className="flex-1 py-1.5 px-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs text-center shadow-xs transition-colors"
            >
              归还借款
            </button>
            <button
              onClick={() => onQuickReconcile?.(account)}
              className="py-1.5 px-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium border border-slate-200 transition-colors"
            >
              改金额
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => onOpenNewTx?.('EXPENSE', account.id)}
              className="flex-1 py-1.5 px-2 rounded-xl bg-white hover:bg-rose-50 text-rose-600 font-semibold text-xs text-center border border-rose-200/80 shadow-2xs transition-colors flex items-center justify-center gap-1"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>支出</span>
            </button>
            <button
              onClick={() => onOpenNewTx?.('INCOME', account.id)}
              className="flex-1 py-1.5 px-2 rounded-xl bg-white hover:bg-emerald-50 text-emerald-700 font-semibold text-xs text-center border border-emerald-200/80 shadow-2xs transition-colors flex items-center justify-center gap-1"
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>收入</span>
            </button>
            <button
              onClick={() => onQuickReconcile?.(account)}
              className="py-1.5 px-2 rounded-xl bg-white hover:bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200 transition-colors"
              title="修改余额"
            >
              改余额
            </button>
          </>
        )}
      </div>
    </div>
  );
};
