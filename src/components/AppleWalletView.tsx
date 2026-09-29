import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  ChevronLeft,
  Copy,
  Check,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Sliders,
  ArrowUpRight,
  ArrowDownLeft,
  Pencil,
  Trash2,
  Palette,
  CreditCard,
  Building2,
  Calendar,
  Layers,
  ArrowRight,
  Receipt,
  Search,
  Wallet,
  Clock,
  ShieldCheck,
  Tag,
} from 'lucide-react';
import { FinancialAccount, AccountCategory, Transaction } from '../types';
import { formatCurrency } from '../lib/formatters';
import { detectBrandInfo, CARD_SKINS } from '../lib/brandHelper';
import { BrandLogo, CardNetworkBadge, EMVChip, ContactlessIcon } from './BrandLogo';
import { CardTextureOverlay } from './CardTextureOverlay';
import { getCardentifyPreset } from '../lib/cardentifyPresets';

interface AppleWalletViewProps {
  accounts: FinancialAccount[];
  transactions?: Transaction[];
  privacyMode: boolean;
  onAddAccount: (category?: AccountCategory) => void;
  onEditAccount: (account: FinancialAccount) => void;
  onDeleteAccount: (accountId: string) => void;
  onQuickReconcile: (account: FinancialAccount) => void;
  onOpenRepayment: (accountId: string, amount: number) => void;
  onOpenNewTx: (defaultType?: string, accountId?: string) => void;
  onOpenCardentifyGallery: (account: FinancialAccount) => void;
  onNormalizeAllCardFaces?: () => void;
}

type WalletFilter = 'ALL' | 'CREDIT' | 'DEBIT' | 'WALLET' | 'TRANSIT' | 'FUND';

export const AppleWalletView: React.FC<AppleWalletViewProps> = ({
  accounts,
  transactions = [],
  privacyMode,
  onAddAccount,
  onEditAccount,
  onDeleteAccount,
  onQuickReconcile,
  onOpenRepayment,
  onOpenNewTx,
  onOpenCardentifyGallery,
  onNormalizeAllCardFaces,
}) => {
  // Active Hero Card ID (null = full stacked wallet view, string = expanded card view)
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [walletFilter, setWalletFilter] = useState<WalletFilter>('ALL');
  const [copiedCardId, setCopiedCardId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Active Card Object
  const activeCard = useMemo(() => {
    return accounts.find((a) => a.id === activeCardId) || null;
  }, [accounts, activeCardId]);

  // Filtered Cards according to tab and search query
  const filteredAccounts = useMemo(() => {
    let list = [...accounts];

    // Filter by category
    if (walletFilter === 'CREDIT') {
      list = list.filter((a) => ['CREDIT_CARD', 'JD_BAITIAO', 'HUABEI'].includes(a.category));
    } else if (walletFilter === 'DEBIT') {
      list = list.filter((a) => a.category === 'DEBIT_CARD');
    } else if (walletFilter === 'WALLET') {
      list = list.filter((a) => ['ALIPAY', 'WECHAT'].includes(a.category));
    } else if (walletFilter === 'TRANSIT') {
      list = list.filter((a) => {
        const text = (a.name + ' ' + (a.bankName || '')).toLowerCase();
        return (
          text.includes('八达通') ||
          text.includes('suica') ||
          text.includes('icoca') ||
          text.includes('交通') ||
          text.includes('公交') ||
          text.includes('地铁')
        );
      });
    } else if (walletFilter === 'FUND') {
      list = list.filter((a) => ['FUND', 'GOLD', 'YUEBAO', 'JD_FINANCE'].includes(a.category));
    }

    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((a) => {
        const matchName = a.name.toLowerCase().includes(q);
        const matchBank = (a.bankName || '').toLowerCase().includes(q);
        const matchLast4 = (a.cardNumberLast4 || '').includes(q);
        return matchName || matchBank || matchLast4;
      });
    }

    return list;
  }, [accounts, walletFilter, searchQuery]);

  // Recent transactions for the active card
  const activeCardTransactions = useMemo(() => {
    if (!activeCard) return [];
    return transactions
      .filter((t) => t.accountId === activeCard.id || t.targetAccountId === activeCard.id)
      .slice(0, 10);
  }, [activeCard, transactions]);

  // Handle card copy
  const handleCopyCardNumber = (acc: FinancialAccount, e: React.MouseEvent) => {
    e.stopPropagation();
    const fullNum = acc.cardNumberLast4 ? `6225 8888 0000 ${acc.cardNumberLast4}` : '6225 8888 0000 8888';
    navigator.clipboard.writeText(fullNum);
    setCopiedCardId(acc.id);
    setTimeout(() => setCopiedCardId(null), 2500);
  };

  // Keyboard escape to collapse
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeCardId) {
        setActiveCardId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeCardId]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* ================= 1. APPLE WALLET STAGE HEADER ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shadow-md">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  Apple 钱包
                </h2>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {accounts.length} 张卡片
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                拟物层叠卡包 · 点击卡片展开 Pass 详情与流水
              </p>
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {onNormalizeAllCardFaces && (
            <button
              type="button"
              onClick={onNormalizeAllCardFaces}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all active:scale-95 shadow-2xs"
              title="一键对齐 CardArt & Cardentify 高清卡面"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>智能规整</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onAddAccount('DEBIT_CARD')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-black dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-black text-xs font-bold transition-all active:scale-95 shadow-sm"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>添加卡片</span>
          </button>
        </div>
      </div>

      {/* ================= 2. WALLET CATEGORY FILTER TABS ================= */}
      {!activeCard && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 modal-custom-scrollbar">
          {[
            { id: 'ALL', label: '全部卡片' },
            { id: 'CREDIT', label: '💳 信用卡' },
            { id: 'DEBIT', label: '🏦 借记卡' },
            { id: 'WALLET', label: '📱 数字钱包' },
            { id: 'TRANSIT', label: '🚇 交通出行' },
            { id: 'FUND', label: '📈 理财资产' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setWalletFilter(tab.id as WalletFilter)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all ${
                walletFilter === tab.id
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* ================= 3. ACTIVE EXPANDED CARD VIEW (HERO + PASS DETAIL DRAWER) ================= */}
      {activeCard ? (
        <div className="space-y-5 animate-in fade-in zoom-in-98 duration-200">
          {/* Active Navigation Bar */}
          <div className="flex items-center justify-between px-1">
            <button
              type="button"
              onClick={() => setActiveCardId(null)}
              className="flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>全部卡包</span>
            </button>

            <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[200px]">
              {activeCard.name}
            </span>

            <button
              type="button"
              onClick={() => setActiveCardId(null)}
              className="px-3 py-1 rounded-full bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-bold transition-all active:scale-95"
            >
              完成
            </button>
          </div>

          {/* Hero Pristine Physical Card */}
          <div className="relative w-full aspect-[85.6/53.98] select-none rounded-[18px] sm:rounded-[22px] overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.35)] ring-1 ring-black/10 dark:ring-white/15">
            <WalletCardFace account={activeCard} privacyMode={privacyMode} isHero />
          </div>

          {/* ================= APPLE WALLET PASS DETAIL DRAWER ================= */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
            {/* Primary Balance / Available Credit Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {activeCard.category === 'CREDIT_CARD' ||
                  activeCard.category === 'JD_BAITIAO' ||
                  activeCard.category === 'HUABEI'
                    ? '剩余免息可用额度'
                    : activeCard.category === 'GOLD'
                    ? '黄金当前市值'
                    : '当前账户可用余额'}
                </span>
                <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-slate-900 dark:text-white mt-1">
                  {activeCard.category === 'CREDIT_CARD' ||
                  activeCard.category === 'JD_BAITIAO' ||
                  activeCard.category === 'HUABEI' ? (
                    <span className="text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(
                        Math.max(
                          0,
                          (activeCard.creditLimit || 0) -
                            (activeCard.usedCredit !== undefined
                              ? activeCard.usedCredit
                              : activeCard.balance || 0)
                        ),
                        privacyMode
                      )}
                    </span>
                  ) : (
                    formatCurrency(activeCard.balance, privacyMode)
                  )}
                </div>
              </div>

              {/* Sub metrics for credit cards */}
              {(activeCard.category === 'CREDIT_CARD' ||
                activeCard.category === 'JD_BAITIAO' ||
                activeCard.category === 'HUABEI') && (
                <div className="text-right shrink-0">
                  <div className="text-xs text-rose-600 dark:text-rose-400 font-bold">
                    已用待还{' '}
                    <span className="font-mono text-sm">
                      {formatCurrency(
                        activeCard.usedCredit !== undefined
                          ? activeCard.usedCredit
                          : activeCard.balance || 0,
                        privacyMode
                      )}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 dark:text-slate-500 mt-0.5">
                    信用总额度 {formatCurrency(activeCard.creditLimit || 0, privacyMode)}
                  </div>
                </div>
              )}
            </div>

            {/* Apple Pay Quick Action Buttons Dock */}
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5">
              <button
                type="button"
                onClick={() => onOpenNewTx('EXPENSE', activeCard.id)}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-all active:scale-95 border border-slate-200/60 dark:border-slate-700/60"
              >
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center mb-1.5 shadow-xs">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold">记一笔</span>
              </button>

              {(activeCard.category === 'CREDIT_CARD' ||
                activeCard.category === 'JD_BAITIAO' ||
                activeCard.category === 'HUABEI') && (
                <button
                  type="button"
                  onClick={() =>
                    onOpenRepayment(
                      activeCard.id,
                      activeCard.usedCredit !== undefined
                        ? activeCard.usedCredit
                        : activeCard.balance || 0
                    )
                  }
                  className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-all active:scale-95 border border-slate-200/60 dark:border-slate-700/60"
                >
                  <div className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center mb-1.5 shadow-xs">
                    <ArrowDownLeft className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-bold">还款</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => onQuickReconcile(activeCard)}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-all active:scale-95 border border-slate-200/60 dark:border-slate-700/60"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center mb-1.5 shadow-xs">
                  <Sliders className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold">校准</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenCardentifyGallery(activeCard)}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-all active:scale-95 border border-slate-200/60 dark:border-slate-700/60"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-indigo-600 text-white flex items-center justify-center mb-1.5 shadow-xs">
                  <Palette className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold">换卡面</span>
              </button>

              <button
                type="button"
                onClick={() => onEditAccount(activeCard)}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-all active:scale-95 border border-slate-200/60 dark:border-slate-700/60"
              >
                <div className="w-8 h-8 rounded-full bg-slate-700 dark:bg-slate-600 text-white flex items-center justify-center mb-1.5 shadow-xs">
                  <Pencil className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold">编辑</span>
              </button>
            </div>

            {/* Card Credential & Security Details */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  卡号凭证
                </span>
                <button
                  type="button"
                  onClick={(e) => handleCopyCardNumber(activeCard, e)}
                  className="flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {copiedCardId === activeCard.id ? (
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 已复制完整卡号
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Copy className="w-3.5 h-3.5" /> 复制卡号
                    </span>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold tracking-widest text-slate-900 dark:text-white text-sm sm:text-base">
                  •••• &nbsp;•••• &nbsp;•••• &nbsp;{activeCard.cardNumberLast4 || '8888'}
                </span>
                <span className="text-slate-400">
                  EXP: {activeCard.cardExpiry || '08/29'}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                <span>持卡人: {activeCard.holderName || 'ZHANG WEI'}</span>
                <span>机构: {activeCard.bankName || '商业银行'}</span>
                {activeCard.dueDay && (
                  <span className="text-amber-600 dark:text-amber-400 font-semibold">
                    每月{activeCard.dueDay}日还款
                  </span>
                )}
              </div>
            </div>

            {/* Recent Card Activity Section */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>此卡最新流水记录 ({activeCardTransactions.length})</span>
                </h4>
              </div>

              {activeCardTransactions.length === 0 ? (
                <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                  <Receipt className="w-8 h-8 mx-auto opacity-40 mb-2" />
                  <p>此卡暂无交易流水记录</p>
                  <button
                    type="button"
                    onClick={() => onOpenNewTx('EXPENSE', activeCard.id)}
                    className="mt-2 text-blue-600 dark:text-blue-400 font-bold hover:underline"
                  >
                    立即记一笔 ➔
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {activeCardTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="py-3 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 dark:text-white truncate">
                          {tx.description || tx.category}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {tx.date} {tx.time || ''} · {tx.category}
                        </div>
                      </div>

                      <div
                        className={`font-mono font-bold text-sm shrink-0 ${
                          tx.type === 'INCOME'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {tx.type === 'INCOME' ? '+' : '-'}
                        {formatCurrency(tx.amount, privacyMode)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Other Cards Fan at Bottom (Quick Switch) */}
          <div className="pt-4 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 px-1">
              其他卡片 (点击切换)
            </span>
            <div className="flex items-center gap-3 overflow-x-auto pb-3 modal-custom-scrollbar">
              {accounts
                .filter((a) => a.id !== activeCard.id)
                .map((otherAcc) => (
                  <button
                    key={otherAcc.id}
                    type="button"
                    onClick={() => setActiveCardId(otherAcc.id)}
                    className="w-36 aspect-[85.6/53.98] rounded-xl overflow-hidden shadow-md ring-1 ring-black/10 dark:ring-white/10 shrink-0 hover:scale-105 transition-transform relative group text-left"
                  >
                    <WalletCardFace account={otherAcc} privacyMode={privacyMode} isThumbnail />
                  </button>
                ))}
            </div>
          </div>
        </div>
      ) : (
        /* ================= 4. ICONIC APPLE WALLET CARD STACK VIEW ================= */
        <div className="relative pt-2 pb-16">
          {filteredAccounts.length === 0 ? (
            <div className="py-20 text-center text-slate-400 dark:text-slate-500 space-y-3 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
              <CreditCard className="w-12 h-12 mx-auto opacity-40" />
              <p className="text-sm font-semibold">钱包中暂无此分类卡片</p>
              <button
                type="button"
                onClick={() => onAddAccount('DEBIT_CARD')}
                className="px-4 py-2 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-bold transition-all shadow-xs"
              >
                添加第一张卡片
              </button>
            </div>
          ) : (
            /* Vertical Stacking Container */
            <div
              className="relative w-full"
              style={{
                // Compute total height of stack container: first card height + offset per card
                minHeight: `${240 + Math.max(0, filteredAccounts.length - 1) * 72}px`,
              }}
            >
              {filteredAccounts.map((acc, index) => {
                // Stacking offset: each card peaks out by ~70px
                const topOffset = index * 70;
                // Layering z-index: front cards have higher z-index
                const zIndex = index + 1;

                return (
                  <div
                    key={acc.id}
                    onClick={() => setActiveCardId(acc.id)}
                    style={{
                      top: `${topOffset}px`,
                      zIndex,
                    }}
                    className="absolute left-0 right-0 w-full aspect-[85.6/53.98] cursor-pointer transition-all duration-300 ease-out hover:-translate-y-5 rounded-[18px] sm:rounded-[22px] overflow-hidden select-none shadow-[0_-4px_20px_rgba(0,0,0,0.18),0_12px_28px_rgba(0,0,0,0.28)] ring-1 ring-black/10 dark:ring-white/15 group"
                  >
                    <WalletCardFace account={acc} privacyMode={privacyMode} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ==========================================
// PURE LUXURY WALLET CARD COMPONENT
// ==========================================
interface WalletCardFaceProps {
  account: FinancialAccount;
  privacyMode: boolean;
  isHero?: boolean;
  isThumbnail?: boolean;
}

const WalletCardFace: React.FC<WalletCardFaceProps> = ({
  account,
  privacyMode,
  isHero = false,
  isThumbnail = false,
}) => {
  const brand = detectBrandInfo(account.name, account.bankName, account.category);
  const skinId = account.cardSkin || brand.cardSkin || 'classic-cmb';
  const skin = CARD_SKINS.find((s) => s.id === skinId) || CARD_SKINS[0];
  const preset = account.cardPresetId ? getCardentifyPreset(account.cardPresetId) : undefined;

  const hasCardImage = !!account.cardImageUrl;
  const customBg = account.cardBgColor || preset?.cardStyle.background;
  const isDarkMode = account.cardTextColor === 'dark' || preset?.textColorMode === 'dark';
  const textColorClass = isDarkMode ? 'text-slate-900' : 'text-white';
  const textSubClass = isDarkMode ? 'text-slate-600' : 'text-white/80';

  const isCredit =
    account.category === 'CREDIT_CARD' ||
    account.category === 'JD_BAITIAO' ||
    account.category === 'HUABEI';

  const creditLimit = account.creditLimit || 0;
  const usedCredit = account.usedCredit !== undefined ? account.usedCredit : account.balance || 0;
  const availableCredit = Math.max(0, creditLimit - usedCredit);

  const cardStyle: React.CSSProperties = customBg
    ? customBg.includes('gradient')
      ? { background: customBg }
      : { backgroundColor: customBg }
    : {};

  return (
    <div
      className={`w-full h-full relative overflow-hidden flex flex-col justify-between ${
        hasCardImage ? 'bg-slate-950' : customBg ? '' : `bg-gradient-to-br ${skin.gradientClass}`
      } ${textColorClass}`}
      style={hasCardImage ? undefined : cardStyle}
    >
      {/* 1. Background Artwork Image or Texture */}
      {hasCardImage ? (
        <>
          <img
            src={account.cardImageUrl}
            alt={account.name}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover object-center select-none pointer-events-none z-0"
          />
          {/* Apple Pay subtle specular sheen */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/25 pointer-events-none mix-blend-overlay z-1" />
        </>
      ) : (
        <CardTextureOverlay pattern={account.cardPattern || preset?.cardStyle.patternType || 'radial-sheen'} />
      )}

      {/* 2. Top Header Bar (Always visible in stack view) */}
      <div className="relative z-10 p-3.5 sm:p-4 flex items-center justify-between gap-2">
        {/* Left: Bank Logo & Name */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {hasCardImage ? (
            /* When official artwork is active: Clean frosted pill with bank name */
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full backdrop-blur-md bg-black/45 border border-white/20 text-white shadow-xs max-w-[220px] truncate">
              <span className="text-[11px] font-bold truncate">
                {account.bankName || preset?.bankName || brand.shortName || brand.name || account.name}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 min-w-0">
              {account.showBrandLogo && (
                <BrandLogo
                  type={preset?.logoType || brand.logoType}
                  size={isThumbnail ? 'sm' : 'md'}
                  className="shadow-sm ring-1 ring-white/20 shrink-0"
                />
              )}
              <div className="min-w-0">
                <h3 className="font-bold text-xs sm:text-sm tracking-wide truncate max-w-[150px]">
                  {account.bankName || preset?.bankName || brand.name}
                </h3>
                <p className={`text-[9px] uppercase tracking-wider font-mono truncate ${textSubClass}`}>
                  {account.name}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right: Balance / Available Glance & Network */}
        <div className="flex items-center gap-2 shrink-0">
          {!isThumbnail && (
            <div className="text-right px-2.5 py-0.8 rounded-full backdrop-blur-md bg-black/45 border border-white/20 text-white shadow-xs font-mono">
              <span className="text-[9px] text-white/70 mr-1">
                {isCredit ? '可用' : '余额'}
              </span>
              <span className="text-xs font-bold text-emerald-300">
                {formatCurrency(isCredit ? availableCredit : account.balance, privacyMode)}
              </span>
            </div>
          )}

          {!hasCardImage && (
            <CardNetworkBadge
              network={account.cardNetwork || preset?.cardNetwork || brand.cardNetwork}
              size={isThumbnail ? 'sm' : 'md'}
            />
          )}
        </div>
      </div>

      {/* 3. Middle section: EMV Chip or Subtle Artwork (Hero / Thumbnail mode) */}
      {!hasCardImage && !isThumbnail && (
        <div className="relative z-10 px-3.5 sm:px-4 my-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <EMVChip size="md" className="shadow-sm" />
            <ContactlessIcon className={isDarkMode ? 'text-slate-700' : 'text-white/80'} />
          </div>
          {account.cardTier && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-md bg-white/20 text-white border border-white/20">
              {account.cardTier}
            </span>
          )}
        </div>
      )}

      {/* 4. Bottom Footer: Masked Number & Holder (Visible in hero or full display) */}
      <div className="relative z-10 p-3.5 sm:p-4 mt-auto flex items-end justify-between text-xs font-mono">
        <div>
          <span className="text-xs sm:text-sm font-bold tracking-widest drop-shadow-sm">
            •••• &nbsp;•••• &nbsp;•••• &nbsp;{account.cardNumberLast4 || '8888'}
          </span>
          <div className="text-[9px] uppercase tracking-wider font-sans mt-0.5 opacity-80">
            {account.holderName || 'ZHANG WEI'}
          </div>
        </div>

        <div className="text-right text-[10px] opacity-80">
          <span>{account.cardExpiry || '08/29'}</span>
        </div>
      </div>
    </div>
  );
};
