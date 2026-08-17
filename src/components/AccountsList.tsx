import React, { useState } from 'react';
import {
  Wallet,
  CreditCard,
  TrendingUp,
  Plus,
  Coins,
  HandCoins,
  Pencil,
  Trash2,
  Sliders,
  Check,
  X,
  Sparkles,
  Building2,
  Banknote,
  Smartphone,
  LayoutGrid,
  List,
  GripVertical,
  ArrowUpDown,
  Move,
  CheckCircle2,
  ArrowUpToLine,
  ChevronUp,
  ChevronDown,
  Layers,
  ArrowDownWideNarrow,
  Calendar,
} from 'lucide-react';
import { FinancialAccount, AccountCategory } from '../types';
import { ACCOUNT_CATEGORY_CONFIG } from '../lib/constants';
import { AccountCardFace } from './AccountCardFace';
import { formatCurrency } from '../lib/formatters';
import { getRandomCardBackground } from '../lib/brandHelper';

interface AccountsListProps {
  accounts: FinancialAccount[];
  privacyMode: boolean;
  onAddAccount: (category?: AccountCategory) => void;
  onEditAccount: (account: FinancialAccount) => void;
  onDeleteAccount: (accountId: string) => void;
  onReorderAccounts?: (newAccounts: FinancialAccount[]) => void;
  onDirectUpdateAccount: (accountId: string, updates: Partial<FinancialAccount>) => void;
  onClearPresetData: () => void;
  onOpenBatchReconcile: () => void;
  onOpenRepayment: (accountId: string, amount: number) => void;
  onOpenNewTx: (defaultType?: string, accountId?: string) => void;
}

export const AccountsList: React.FC<AccountsListProps> = ({
  accounts,
  privacyMode,
  onAddAccount,
  onEditAccount,
  onDeleteAccount,
  onReorderAccounts,
  onDirectUpdateAccount,
  onClearPresetData,
  onOpenBatchReconcile,
  onOpenRepayment,
  onOpenNewTx,
}) => {
  const [filterGroup, setFilterGroup] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'CARD' | 'TABLE'>('CARD');

  // Drag & Drop Layout State
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [draggedAccountId, setDraggedAccountId] = useState<string | null>(null);
  const [dragOverAccountId, setDragOverAccountId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Quick Reconcile Modal State
  const [reconcilingAccount, setReconcilingAccount] = useState<FinancialAccount | null>(null);
  const [quickBalance, setQuickBalance] = useState<string>('');
  const [quickUsedCredit, setQuickUsedCredit] = useState<string>('');
  const [quickCreditLimit, setQuickCreditLimit] = useState<string>('');
  const [quickGoldGrams, setQuickGoldGrams] = useState<string>('');
  const [quickGoldPrice, setQuickGoldPrice] = useState<string>('');
  const [quickNotes, setQuickNotes] = useState<string>('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

  // Reorder Core
  const handleReorder = (fromId: string, toId: string) => {
    if (!fromId || !toId || fromId === toId) return;
    const fromIndex = accounts.findIndex((a) => a.id === fromId);
    const toIndex = accounts.findIndex((a) => a.id === toId);
    if (fromIndex === -1 || toIndex === -1) return;

    const newAccounts = [...accounts];
    const [moved] = newAccounts.splice(fromIndex, 1);
    newAccounts.splice(toIndex, 0, moved);

    if (onReorderAccounts) {
      onReorderAccounts(newAccounts);
      showToast(`✨ 已更新「${moved.name}」卡片排版位置`);
    }
  };

  const handleMoveUp = (accountId: string) => {
    const idx = accounts.findIndex((a) => a.id === accountId);
    if (idx <= 0) return;
    const newAccounts = [...accounts];
    const [item] = newAccounts.splice(idx, 1);
    newAccounts.splice(idx - 1, 0, item);
    onReorderAccounts?.(newAccounts);
    showToast(`✨ 卡片「${item.name}」已往前调整`);
  };

  const handleMoveDown = (accountId: string) => {
    const idx = accounts.findIndex((a) => a.id === accountId);
    if (idx < 0 || idx >= accounts.length - 1) return;
    const newAccounts = [...accounts];
    const [item] = newAccounts.splice(idx, 1);
    newAccounts.splice(idx + 1, 0, item);
    onReorderAccounts?.(newAccounts);
    showToast(`✨ 卡片「${item.name}」已往后调整`);
  };

  const handleMoveTop = (accountId: string) => {
    const idx = accounts.findIndex((a) => a.id === accountId);
    if (idx <= 0) return;
    const newAccounts = [...accounts];
    const [item] = newAccounts.splice(idx, 1);
    newAccounts.unshift(item);
    onReorderAccounts?.(newAccounts);
    showToast(`✨ 卡片「${item.name}」已成功置顶`);
  };

  // Quick Preset Sorts
  const handleSortByBalance = () => {
    const sorted = [...accounts].sort((a, b) => b.balance - a.balance);
    onReorderAccounts?.(sorted);
    showToast('✨ 已按账户资产与余额由高到低排列');
  };

  const handleSortByCategory = () => {
    const categoryOrder: Record<AccountCategory, number> = {
      DEBIT_CARD: 1,
      ALIPAY: 2,
      CASH: 3,
      YUEBAO: 4,
      FUND: 5,
      GOLD: 6,
      JD_FINANCE: 7,
      CREDIT_CARD: 8,
      JD_BAITIAO: 9,
      HUABEI: 10,
      RECEIVABLE: 11,
      PAYABLE: 12,
    };
    const sorted = [...accounts].sort((a, b) => {
      const orderA = categoryOrder[a.category] || 99;
      const orderB = categoryOrder[b.category] || 99;
      return orderA - orderB;
    });
    onReorderAccounts?.(sorted);
    showToast('✨ 已按卡片类型标准分组排版');
  };

  const handleSortByDueDate = () => {
    const sorted = [...accounts].sort((a, b) => {
      const isCreditA = a.category === 'CREDIT_CARD' || a.category === 'JD_BAITIAO' || a.category === 'HUABEI';
      const isCreditB = b.category === 'CREDIT_CARD' || b.category === 'JD_BAITIAO' || b.category === 'HUABEI';
      if (isCreditA && !isCreditB) return -1;
      if (!isCreditA && isCreditB) return 1;
      return (a.dueDay || 99) - (b.dueDay || 99);
    });
    onReorderAccounts?.(sorted);
    showToast('✨ 已优先排列还款日临近的信贷卡片');
  };

  // HTML5 Drag Events
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedAccountId(id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverAccountId !== id) {
      setDragOverAccountId(id);
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/plain') || draggedAccountId;
    if (sourceId && sourceId !== targetId) {
      handleReorder(sourceId, targetId);
    }
    setDraggedAccountId(null);
    setDragOverAccountId(null);
  };

  const handleDragEnd = () => {
    setDraggedAccountId(null);
    setDragOverAccountId(null);
  };

  const handleOpenQuickReconcile = (acc: FinancialAccount) => {
    setReconcilingAccount(acc);
    setQuickBalance(acc.balance.toString());
    setQuickUsedCredit((acc.usedCredit !== undefined ? acc.usedCredit : acc.balance).toString());
    setQuickCreditLimit((acc.creditLimit || 20000).toString());
    setQuickGoldGrams((acc.goldGrams || 50).toString());
    setQuickGoldPrice((acc.goldUnitPrice || 600).toString());
    setQuickNotes(acc.notes || '');
  };

  const handleSaveQuickReconcile = () => {
    if (!reconcilingAccount) return;
    const isCredit =
      reconcilingAccount.category === 'CREDIT_CARD' ||
      reconcilingAccount.category === 'JD_BAITIAO' ||
      reconcilingAccount.category === 'HUABEI';
    const isGold = reconcilingAccount.category === 'GOLD';

    const updates: Partial<FinancialAccount> = {
      notes: quickNotes.trim() || undefined,
    };

    if (isCredit) {
      const used = parseFloat(quickUsedCredit) || 0;
      const limit = parseFloat(quickCreditLimit) || 0;
      updates.usedCredit = used;
      updates.creditLimit = limit;
      updates.balance = used;
    } else if (isGold) {
      const g = parseFloat(quickGoldGrams) || 0;
      const p = parseFloat(quickGoldPrice) || 0;
      updates.goldGrams = g;
      updates.goldUnitPrice = p;
      updates.balance = g * p;
    } else {
      updates.balance = parseFloat(quickBalance) || 0;
    }

    onDirectUpdateAccount(reconcilingAccount.id, updates);
    setReconcilingAccount(null);
  };

  const groups = [
    { id: 'ALL', label: '全部账户', count: accounts.length },
    {
      id: 'LIQUID',
      label: '流动资金 (储蓄卡/支付宝/现金)',
      count: accounts.filter((a) => ['DEBIT_CARD', 'ALIPAY', 'CASH'].includes(a.category)).length,
    },
    {
      id: 'INVESTMENT',
      label: '理财投资 (余额宝/基金/黄金/京东)',
      count: accounts.filter((a) =>
        ['YUEBAO', 'FUND', 'GOLD', 'JD_FINANCE'].includes(a.category)
      ).length,
    },
    {
      id: 'CREDIT',
      label: '信用负债 (信用卡/白条/花呗/借入)',
      count: accounts.filter((a) =>
        ['CREDIT_CARD', 'JD_BAITIAO', 'HUABEI', 'PAYABLE'].includes(a.category)
      ).length,
    },
    {
      id: 'DEBT_RECEIVABLE',
      label: '借出债权 (借出待收回)',
      count: accounts.filter((a) => a.category === 'RECEIVABLE').length,
    },
  ];

  const filteredAccounts = accounts.filter((acc) => {
    if (filterGroup === 'ALL') return true;
    const config = ACCOUNT_CATEGORY_CONFIG[acc.category];
    return config.group === filterGroup;
  });

  return (
    <div className="space-y-6">
      {/* Toast notification banner */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center gap-2 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-2xl shadow-xl border border-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Top Header & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              资产账户
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
              共 {accounts.length} 张卡片/账户
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            支持银行借记卡、信用卡、支付宝、微信、余额宝、公募基金、黄金积存金与白条，支持自由拖动排版与自定义卡片顺序
          </p>
        </div>

        {/* Action Button Group */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          {/* Reorder Layout Mode Toggle */}
          {accounts.length > 1 && (
            <button
              onClick={() => setIsReorderMode(!isReorderMode)}
              className={`flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-3 py-2.5 rounded-xl border transition-all ${
                isReorderMode
                  ? 'bg-purple-600 hover:bg-purple-700 text-white border-purple-600 shadow-xs'
                  : 'bg-white hover:bg-purple-50 text-purple-700 border-purple-200/80'
              }`}
              title="开启拖拽排版与卡面位置调整"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>{isReorderMode ? '完成排版' : '拖动排版'}</span>
            </button>
          )}

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
            <button
              onClick={() => setViewMode('CARD')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                viewMode === 'CARD'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="卡面视图 (真实银行卡与平台质感卡面)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>卡面视图</span>
            </button>
            <button
              onClick={() => setViewMode('TABLE')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                viewMode === 'TABLE'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="紧凑明细列表"
            >
              <List className="w-3.5 h-3.5" />
              <span>列表</span>
            </button>
          </div>

          {accounts.length > 0 && (
            <>
              <button
                id="btn-batch-reconcile"
                onClick={onOpenBatchReconcile}
                className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs sm:text-sm px-3 py-2.5 rounded-xl border border-slate-200 shadow-2xs transition-colors"
                title="在一个页面快速校准所有账户余额"
              >
                <Sliders className="w-3.5 h-3.5 text-slate-500" />
                <span>批量校准</span>
              </button>

              <button
                id="btn-clear-preset-demo"
                onClick={() => {
                  if (
                    confirm(
                      '确定清空当前的示例数据并从零开始手工录入您的真实资产吗？（此操作将重置所有账户与流水）'
                    )
                  ) {
                    onClearPresetData();
                  }
                }}
                className="flex items-center gap-1 bg-white hover:bg-rose-50 text-rose-600 font-medium text-xs px-3 py-2.5 rounded-xl border border-rose-200/80 transition-colors"
                title="清空预设数据，从零手工录入"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>清空示例</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* REORDER TOOLBAR (when in reorder mode) */}
      {isReorderMode && accounts.length > 1 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200/90 shadow-2xs space-y-3 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-purple-600 text-white">
                <Move className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-purple-950">
                  拖拽自定义卡片排版模式
                </h4>
                <p className="text-[11px] sm:text-xs text-purple-700">
                  长按任意卡片即可直接拖动位置，或使用快捷置顶/前移/后移按钮，松开自动保存。
                </p>
              </div>
            </div>

            {/* Quick Sorters */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-semibold text-purple-800">一键快捷排版：</span>
              <button
                onClick={handleSortByBalance}
                className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-purple-100 text-purple-900 text-xs font-semibold border border-purple-200 shadow-2xs transition-colors flex items-center gap-1"
              >
                <ArrowDownWideNarrow className="w-3 h-3 text-purple-600" />
                <span>余额从高到低</span>
              </button>
              <button
                onClick={handleSortByCategory}
                className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-purple-100 text-purple-900 text-xs font-semibold border border-purple-200 shadow-2xs transition-colors flex items-center gap-1"
              >
                <Layers className="w-3 h-3 text-purple-600" />
                <span>按卡片类别规整</span>
              </button>
              <button
                onClick={handleSortByDueDate}
                className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-purple-100 text-purple-900 text-xs font-semibold border border-purple-200 shadow-2xs transition-colors flex items-center gap-1"
              >
                <Calendar className="w-3 h-3 text-purple-600" />
                <span>还款日临近优先</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      {accounts.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {groups.map((g) => (
            <button
              key={g.id}
              onClick={() => setFilterGroup(g.id)}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all border ${
                filterGroup === g.id
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border-slate-200/80 hover:bg-slate-50'
              }`}
            >
              <span>{g.label}</span>
              <span
                className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[11px] font-mono ${
                  filterGroup === g.id
                    ? 'bg-slate-800 text-slate-200'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {g.count}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Empty State */}
      {accounts.length === 0 ? (
        <div className="rounded-3xl bg-white border border-slate-200/80 p-8 text-center shadow-xs space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto text-slate-700">
            <Building2 className="w-8 h-8" />
          </div>

          <div className="max-w-md mx-auto">
            <h3 className="text-xl font-bold text-slate-900">
              开始添加您的真实资产卡片
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              点击下方任意类别卡片，立即添加招商银行、工商银行、支付宝、微信支付、京东金融等专属卡面。
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5 max-w-4xl mx-auto text-left">
            <button
              onClick={() => onAddAccount('DEBIT_CARD')}
              className="p-4 rounded-2xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-300 transition-all group flex flex-col justify-between"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                    银行储蓄借记卡
                  </h4>
                  <p className="text-[11px] text-slate-500">招商/工行/建行等</p>
                </div>
              </div>
              <span className="text-xs text-blue-600 font-semibold mt-3 block">
                + 添加借记卡卡面
              </span>
            </button>

            <button
              onClick={() => onAddAccount('CREDIT_CARD')}
              className="p-4 rounded-2xl bg-slate-50 hover:bg-rose-50/60 border border-slate-200 hover:border-rose-300 transition-all group flex flex-col justify-between"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                    借贷信用卡
                  </h4>
                  <p className="text-[11px] text-slate-500">经典白金/白麒麟等</p>
                </div>
              </div>
              <span className="text-xs text-rose-600 font-semibold mt-3 block">
                + 添加信用卡卡面
              </span>
            </button>

            <button
              onClick={() => onAddAccount('ALIPAY')}
              className="p-4 rounded-2xl bg-slate-50 hover:bg-sky-50/60 border border-slate-200 hover:border-sky-300 transition-all group flex flex-col justify-between"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-500 text-white flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                    支付宝 / 微信 / 京东
                  </h4>
                  <p className="text-[11px] text-slate-500">平台数字钱包</p>
                </div>
              </div>
              <span className="text-xs text-sky-600 font-semibold mt-3 block">
                + 添加数字钱包卡面
              </span>
            </button>

            <button
              onClick={() => onAddAccount('GOLD')}
              className="p-4 rounded-2xl bg-slate-50 hover:bg-amber-50/60 border border-slate-200 hover:border-amber-300 transition-all group flex flex-col justify-between"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                    黄金 / 基金 / 现金
                  </h4>
                  <p className="text-[11px] text-slate-500">24K积存金/公募组合</p>
                </div>
              </div>
              <span className="text-xs text-amber-600 font-semibold mt-3 block">
                + 添加投资理财卡面
              </span>
            </button>
          </div>
        </div>
      ) : viewMode === 'CARD' ? (
        /* REALISTIC CARD FACE GRID (Default with Drag and Drop) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {filteredAccounts.map((acc, index) => {
            const isDraggingThis = draggedAccountId === acc.id;
            const isOverThis = dragOverAccountId === acc.id && !isDraggingThis;

            return (
              <div
                key={acc.id}
                draggable
                onDragStart={(e) => handleDragStart(e, acc.id)}
                onDragOver={(e) => handleDragOver(e, acc.id)}
                onDrop={(e) => handleDrop(e, acc.id)}
                onDragEnd={handleDragEnd}
                className={`h-full transition-all duration-200 rounded-3xl ${
                  isDraggingThis
                    ? 'opacity-30 scale-95 ring-2 ring-purple-500 shadow-2xl'
                    : isOverThis
                    ? 'scale-102 ring-4 ring-purple-400 bg-purple-50/50 p-1 shadow-xl'
                    : ''
                }`}
              >
                <AccountCardFace
                  account={acc}
                  privacyMode={privacyMode}
                  onEditAccount={onEditAccount}
                  onDeleteAccount={onDeleteAccount}
                  onQuickReconcile={handleOpenQuickReconcile}
                  onOpenRepayment={onOpenRepayment}
                  onOpenNewTx={onOpenNewTx}
                  isReorderMode={isReorderMode}
                  reorderIndex={index}
                  totalCount={filteredAccounts.length}
                  onMoveUp={() => handleMoveUp(acc.id)}
                  onMoveDown={() => handleMoveDown(acc.id)}
                  onMoveTop={() => handleMoveTop(acc.id)}
                  onAutoRegenColor={(accountId) => {
                    const newPal = getRandomCardBackground();
                    onDirectUpdateAccount(accountId, { cardBgColor: newPal.gradient });
                  }}
                />
              </div>
            );
          })}
        </div>
      ) : (
        /* DENSE TABLE LIST VIEW (with Drag & Drop Support) */
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="py-3 px-3 w-10 text-center">排版</th>
                  <th className="py-3 px-4">账户卡片</th>
                  <th className="py-3 px-4">类别</th>
                  <th className="py-3 px-4">持卡人/卡号</th>
                  <th className="py-3 px-4 text-right">余额 / 待还欠款</th>
                  <th className="py-3 px-4 text-right">额度 / 详情</th>
                  <th className="py-3 px-4 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredAccounts.map((acc, index) => {
                  const isCredit =
                    acc.category === 'CREDIT_CARD' || acc.category === 'JD_BAITIAO' || acc.category === 'HUABEI';
                  const isDraggingThis = draggedAccountId === acc.id;
                  const isOverThis = dragOverAccountId === acc.id && !isDraggingThis;

                  return (
                    <tr
                      key={acc.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, acc.id)}
                      onDragOver={(e) => handleDragOver(e, acc.id)}
                      onDrop={(e) => handleDrop(e, acc.id)}
                      onDragEnd={handleDragEnd}
                      className={`transition-colors ${
                        isDraggingThis
                          ? 'opacity-30 bg-purple-50'
                          : isOverThis
                          ? 'bg-purple-100/70 border-y-2 border-purple-400'
                          : 'hover:bg-slate-50/70'
                      }`}
                    >
                      <td className="py-3 px-3 text-center">
                        <div
                          className="cursor-grab active:cursor-grabbing inline-flex p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
                          title="按住上下拖拽排版"
                        >
                          <GripVertical className="w-4 h-4" />
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-mono font-bold flex items-center justify-center">
                            {index + 1}
                          </span>
                          <div>
                            <div className="font-bold text-slate-900">{acc.name}</div>
                            <div className="text-xs text-slate-400">
                              {acc.bankName || '数字账户'} {acc.notes ? `• ${acc.notes}` : ''}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700">
                          {ACCOUNT_CATEGORY_CONFIG[acc.category]?.label || '账户'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-600">
                        <div>{acc.holderName || '持卡人'}</div>
                        <div>{acc.cardNumberLast4 ? `尾号 ${acc.cardNumberLast4}` : '-'}</div>
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-bold text-base font-mono ${
                          isCredit ? 'text-rose-600' : 'text-slate-900'
                        }`}
                      >
                        {formatCurrency(
                          isCredit
                            ? acc.usedCredit !== undefined
                              ? acc.usedCredit
                              : acc.balance
                            : acc.balance,
                          privacyMode
                        )}
                      </td>
                      <td className="py-3 px-4 text-right text-xs text-slate-500 font-mono">
                        {isCredit && acc.creditLimit ? (
                          <div>总额度: {formatCurrency(acc.creditLimit, privacyMode)}</div>
                        ) : acc.goldGrams ? (
                          <div>{acc.goldGrams} 克 (¥{acc.goldUnitPrice}/g)</div>
                        ) : (
                          <div>-</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Row Move buttons */}
                          <button
                            onClick={() => handleMoveUp(acc.id)}
                            disabled={index === 0}
                            className="p-1 rounded text-slate-400 hover:text-slate-800 disabled:opacity-20 hover:bg-slate-100"
                            title="上移"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleMoveDown(acc.id)}
                            disabled={index >= filteredAccounts.length - 1}
                            className="p-1 rounded text-slate-400 hover:text-slate-800 disabled:opacity-20 hover:bg-slate-100"
                            title="下移"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleOpenQuickReconcile(acc)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                            title="修改余额"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onEditAccount(acc)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                            title="编辑完整卡面"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`确定删除「${acc.name}」吗？`)) {
                                onDeleteAccount(acc.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50"
                            title="删除"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* QUICK RECONCILE POPUP MODAL */}
      {reconcilingAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Sliders className="w-4 h-4 text-slate-700" />
                <span>快速校对卡片金额与账单</span>
              </h3>
              <button
                onClick={() => setReconcilingAccount(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="font-bold text-slate-900 text-sm">
                {reconcilingAccount.name}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {reconcilingAccount.bankName || '数字账户'}{' '}
                {reconcilingAccount.cardNumberLast4
                  ? `(尾号 ${reconcilingAccount.cardNumberLast4})`
                  : ''}
              </div>
            </div>

            {/* Credit Card Used / Limit Inputs */}
            {reconcilingAccount.category === 'CREDIT_CARD' ||
            reconcilingAccount.category === 'JD_BAITIAO' ||
            reconcilingAccount.category === 'HUABEI' ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    当前已用待还金额 (¥)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={quickUsedCredit}
                    onChange={(e) => setQuickUsedCredit(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900 font-mono text-base font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    总授信信用额度 (¥)
                  </label>
                  <input
                    type="number"
                    step="1000"
                    value={quickCreditLimit}
                    onChange={(e) => setQuickCreditLimit(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900 font-mono text-sm"
                  />
                </div>
              </div>
            ) : reconcilingAccount.category === 'GOLD' ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    持有克重 (g)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={quickGoldGrams}
                    onChange={(e) => setQuickGoldGrams(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900 font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    金价单价 (¥/g)
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={quickGoldPrice}
                    onChange={(e) => setQuickGoldPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900 font-mono text-sm"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  真实账户最新可用余额 (¥)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={quickBalance}
                  onChange={(e) => setQuickBalance(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900 font-mono text-lg font-bold"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                备注备忘
              </label>
              <input
                type="text"
                value={quickNotes}
                onChange={(e) => setQuickNotes(e.target.value)}
                placeholder="例如：工资代发卡 / 日常买菜支付卡"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setReconcilingAccount(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSaveQuickReconcile}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 shadow-xs"
              >
                保存校准
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
