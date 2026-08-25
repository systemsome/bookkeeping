import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Search,
  ReceiptText,
  FolderClosed,
  FolderOpen,
  ChevronsUpDown,
} from 'lucide-react';
import { FinancialAccount, AccountCategory, AssetGroup } from '../types';
import { ACCOUNT_CATEGORY_CONFIG } from '../lib/constants';
import { AccountCardFace } from './AccountCardFace';
import { formatCurrency } from '../lib/formatters';
import { getRandomCardBackground } from '../lib/brandHelper';
import { fetchLiveGoldRate, getCachedGoldRate, GoldMarketRate } from '../lib/goldRates';

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
  const [viewMode, setViewMode] = useState<'GROUPED' | 'CARD' | 'TABLE'>('GROUPED');

  // Drag & Drop Layout State
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [draggedAccountId, setDraggedAccountId] = useState<string | null>(null);
  const [dragOverAccountId, setDragOverAccountId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Collapsed Category Sections State (默认全部展开展示卡面，支持用户手动折叠/展开)
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const handleCollapseAll = () => {
    setCollapsedGroups({
      DEBIT_CARD: true,
      CREDIT_CARD: true,
      DIGITAL_WALLET: true,
      FUND: true,
      CASH: true,
      LEND_BORROW: true,
    });
    showToast('📁 已折叠全部资产大类');
  };

  const handleExpandAll = () => {
    setCollapsedGroups({});
    showToast('📂 已展开全部资产大类');
  };

  // Quick Reconcile Modal State
  const [reconcilingAccount, setReconcilingAccount] = useState<FinancialAccount | null>(null);
  const [quickBalance, setQuickBalance] = useState<string>('');
  const [quickUsedCredit, setQuickUsedCredit] = useState<string>('');
  const [quickCreditLimit, setQuickCreditLimit] = useState<string>('');
  const [quickGoldGrams, setQuickGoldGrams] = useState<string>('');
  const [quickGoldPrice, setQuickGoldPrice] = useState<string>('');
  const [quickNotes, setQuickNotes] = useState<string>('');
  const [liveGoldRate, setLiveGoldRate] = useState<GoldMarketRate>(() => getCachedGoldRate());

  // Fetch live gold rate for quick reconcile
  useEffect(() => {
    fetchLiveGoldRate().then((rate) => setLiveGoldRate(rate));
  }, []);

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
      CREDIT_CARD: 2,
      JD_BAITIAO: 3,
      HUABEI: 4,
      ALIPAY: 5,
      WECHAT: 6,
      YUEBAO: 7,
      FUND: 8,
      GOLD: 9,
      JD_FINANCE: 10,
      CASH: 11,
      RECEIVABLE: 12,
      PAYABLE: 13,
    };
    const sorted = [...accounts].sort((a, b) => {
      const orderA = categoryOrder[a.category] || 99;
      const orderB = categoryOrder[b.category] || 99;
      return orderA - orderB;
    });
    onReorderAccounts?.(sorted);
    showToast('✨ 已按卡片大类标准排版规整');
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

  // 6 Asset Major Groups requested: 借记卡 信用卡 数字钱包 理财基金 现金 借贷
  const groupDefinitions = useMemo(() => {
    // 1. 借记卡
    const debitCards = accounts.filter((a) => a.category === 'DEBIT_CARD');
    const debitTotal = debitCards.reduce((sum, a) => sum + (a.balance || 0), 0);

    // 2. 信用卡 (信用卡、白条、花呗)
    const creditCards = accounts.filter((a) =>
      ['CREDIT_CARD', 'JD_BAITIAO', 'HUABEI'].includes(a.category)
    );
    const creditUsedTotal = creditCards.reduce(
      (sum, a) => sum + (a.usedCredit !== undefined ? a.usedCredit : a.balance || 0),
      0
    );
    const creditLimitTotal = creditCards.reduce((sum, a) => sum + (a.creditLimit || 0), 0);

    // 3. 数字钱包 (支付宝、微信支付等)
    const walletAccounts = accounts.filter((a) =>
      ['ALIPAY', 'WECHAT'].includes(a.category)
    );
    const walletTotal = walletAccounts.reduce((sum, a) => sum + (a.balance || 0), 0);

    // 4. 理财基金 (余额宝、公募基金、黄金、京东金融)
    const fundAccounts = accounts.filter((a) =>
      ['YUEBAO', 'FUND', 'GOLD', 'JD_FINANCE'].includes(a.category)
    );
    const fundTotal = fundAccounts.reduce((sum, a) => sum + (a.balance || 0), 0);

    // 5. 现金
    const cashAccounts = accounts.filter((a) => a.category === 'CASH');
    const cashTotal = cashAccounts.reduce((sum, a) => sum + (a.balance || 0), 0);

    // 6. 借贷 (借出待收 / 借入待还)
    const lendBorrowAccounts = accounts.filter((a) =>
      ['RECEIVABLE', 'PAYABLE'].includes(a.category)
    );
    const receivableTotal = accounts
      .filter((a) => a.category === 'RECEIVABLE' && !a.isSettled)
      .reduce((sum, a) => sum + (a.balance || 0), 0);
    const payableTotal = accounts
      .filter((a) => a.category === 'PAYABLE' && !a.isSettled)
      .reduce((sum, a) => sum + (a.balance || 0), 0);

    return [
      {
        id: 'ALL',
        label: '全部账户',
        subLabel: '包含借记卡、信用卡、数字钱包、理财基金、现金与借贷',
        icon: Layers,
        badgeBg: 'bg-slate-100 dark:bg-slate-800',
        badgeText: 'text-slate-800 dark:text-slate-200',
        borderColor: 'border-slate-300 dark:border-slate-700',
        count: accounts.length,
        defaultAddCategory: 'DEBIT_CARD' as AccountCategory,
        metricsText: `共 ${accounts.length} 个账户`,
      },
      {
        id: 'DEBIT_CARD' as AssetGroup,
        label: '借记卡',
        subLabel: '各大商业银行储蓄卡、工资卡、活期账户',
        icon: Building2,
        badgeBg: 'bg-blue-50 dark:bg-blue-950/60',
        badgeText: 'text-blue-600 dark:text-blue-400',
        borderColor: 'border-blue-200 dark:border-blue-900/60',
        count: debitCards.length,
        defaultAddCategory: 'DEBIT_CARD' as AccountCategory,
        totalBalance: debitTotal,
        metricsText: `余额 ${formatCurrency(debitTotal, privacyMode)}`,
      },
      {
        id: 'CREDIT_CARD' as AssetGroup,
        label: '信用卡',
        subLabel: '各大行信用卡、京东白条、蚂蚁花呗消费信贷',
        icon: CreditCard,
        badgeBg: 'bg-rose-50 dark:bg-rose-950/60',
        badgeText: 'text-rose-600 dark:text-rose-400',
        borderColor: 'border-rose-200 dark:border-rose-900/60',
        count: creditCards.length,
        defaultAddCategory: 'CREDIT_CARD' as AccountCategory,
        totalBalance: creditUsedTotal,
        totalLimit: creditLimitTotal,
        metricsText: `已用欠款 ${formatCurrency(creditUsedTotal, privacyMode)} / 额度 ${formatCurrency(creditLimitTotal, privacyMode)}`,
      },
      {
        id: 'DIGITAL_WALLET' as AssetGroup,
        label: '数字钱包',
        subLabel: '支付宝余额、微信零钱、第三方移动支付钱包',
        icon: Smartphone,
        badgeBg: 'bg-sky-50 dark:bg-sky-950/60',
        badgeText: 'text-sky-600 dark:text-sky-400',
        borderColor: 'border-sky-200 dark:border-sky-900/60',
        count: walletAccounts.length,
        defaultAddCategory: 'ALIPAY' as AccountCategory,
        totalBalance: walletTotal,
        metricsText: `零钱余额 ${formatCurrency(walletTotal, privacyMode)}`,
      },
      {
        id: 'FUND' as AssetGroup,
        label: '理财基金',
        subLabel: '余额宝、公募基金、黄金积存金、京东金融',
        icon: TrendingUp,
        badgeBg: 'bg-amber-50 dark:bg-amber-950/60',
        badgeText: 'text-amber-600 dark:text-amber-400',
        borderColor: 'border-amber-200 dark:border-amber-900/60',
        count: fundAccounts.length,
        defaultAddCategory: 'FUND' as AccountCategory,
        totalBalance: fundTotal,
        metricsText: `理财市值 ${formatCurrency(fundTotal, privacyMode)}`,
      },
      {
        id: 'CASH' as AssetGroup,
        label: '现金',
        subLabel: '纸币现金、钱包零钱、应急备用现金',
        icon: Banknote,
        badgeBg: 'bg-emerald-50 dark:bg-emerald-950/60',
        badgeText: 'text-emerald-600 dark:text-emerald-400',
        borderColor: 'border-emerald-200 dark:border-emerald-900/60',
        count: cashAccounts.length,
        defaultAddCategory: 'CASH' as AccountCategory,
        totalBalance: cashTotal,
        metricsText: `备用现金 ${formatCurrency(cashTotal, privacyMode)}`,
      },
      {
        id: 'LEND_BORROW' as AssetGroup,
        label: '借贷',
        subLabel: '亲友借出待收回款项 (债权) 与借入款项 (债务)',
        icon: HandCoins,
        badgeBg: 'bg-purple-50 dark:bg-purple-950/60',
        badgeText: 'text-purple-600 dark:text-purple-400',
        borderColor: 'border-purple-200 dark:border-purple-900/60',
        count: lendBorrowAccounts.length,
        defaultAddCategory: 'RECEIVABLE' as AccountCategory,
        receivables: receivableTotal,
        payables: payableTotal,
        metricsText: `待收 ${formatCurrency(receivableTotal, privacyMode)} · 待还 ${formatCurrency(payableTotal, privacyMode)}`,
      },
    ];
  }, [accounts, privacyMode]);

  const currentGroupLabel = useMemo(() => {
    if (filterGroup === 'ALL') {
      return '全部账户';
    }
    const found = groupDefinitions.find((g) => g.id === filterGroup);
    return found ? found.label : '全部账户';
  }, [filterGroup, groupDefinitions]);

  const filteredAccounts = accounts.filter((acc) => {
    if (filterGroup === 'ALL') return true;
    const config = ACCOUNT_CATEGORY_CONFIG[acc.category];
    return config?.group === filterGroup;
  });

  // Six asset groups for grouped rendering
  const activeAssetGroups = useMemo(() => {
    const nonAllGroups = groupDefinitions.filter((g) => g.id !== 'ALL');
    if (filterGroup === 'ALL') {
      return nonAllGroups;
    }
    return nonAllGroups.filter((g) => g.id === filterGroup);
  }, [groupDefinitions, filterGroup]);

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

      {/* Top Header & Clean Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              资产账户
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
              共 {accounts.length} 张卡片/账户
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            资产分为：借记卡、信用卡、数字钱包、理财基金、现金、借贷 6 大类别，支持按分类排版与卡面拖动调整
          </p>
        </div>

        {/* Action Button Group */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          {/* Add Account Master Button */}
          <button
            id="btn-add-account-main"
            onClick={() => onAddAccount('DEBIT_CARD')}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm px-3.5 py-2 rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>添加新账户</span>
          </button>

          {/* Batch Reconcile */}
          {accounts.length > 0 && (
            <button
              id="btn-batch-reconcile"
              onClick={onOpenBatchReconcile}
              className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-200 shadow-2xs transition-colors"
              title="快速校准所有账户余额"
            >
              <Sliders className="w-3.5 h-3.5 text-slate-500" />
              <span>批量校对</span>
            </button>
          )}

          {/* Reorder Layout Mode Toggle */}
          {accounts.length > 1 && (
            <button
              onClick={() => setIsReorderMode(!isReorderMode)}
              className={`flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-3 py-2 rounded-xl border transition-all ${
                isReorderMode
                  ? 'bg-purple-600 hover:bg-purple-700 text-white border-purple-600 shadow-xs'
                  : 'bg-white hover:bg-purple-50 text-purple-700 border-purple-200/80'
              }`}
              title="开启拖拽排版与卡面位置调整"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>{isReorderMode ? '完成排版' : '拖动排序'}</span>
            </button>
          )}

          {/* View Mode Switcher: Grouped, Card, Table */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/80">
            <button
              onClick={() => setViewMode('GROUPED')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                viewMode === 'GROUPED'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="大类分组排版 (按6大资产大类分区排列)"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>大类排版</span>
            </button>
            <button
              onClick={() => setViewMode('CARD')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                viewMode === 'CARD'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="平铺卡面 (真实银行卡质感卡面)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>平铺卡面</span>
            </button>
            <button
              onClick={() => setViewMode('TABLE')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
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
        </div>
      </div>

      {/* 6 Asset Classes Interactive Summary & Filter Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {groupDefinitions
          .filter((g) => g.id !== 'ALL')
          .map((g) => {
            const isSelected = filterGroup === g.id;
            const IconComp = g.icon;

            return (
              <button
                key={g.id}
                type="button"
                onClick={() => {
                  setFilterGroup((prev) => (prev === g.id ? 'ALL' : g.id));
                }}
                className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-blue-500/40'
                    : 'bg-white hover:bg-slate-50/90 border-slate-200/80 text-slate-800 hover:border-slate-300 shadow-xs'
                }`}
                title={isSelected ? `点击取消筛选「${g.label}」` : `点击筛选「${g.label}」`}
              >
                <div className="flex items-center justify-between w-full">
                  <div
                    className={`p-2 rounded-xl shrink-0 ${
                      isSelected ? 'bg-white/20 text-white' : `${g.badgeBg} ${g.badgeText}`
                    }`}
                  >
                    <IconComp className="w-4 h-4" />
                  </div>
                  <span
                    className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {g.count} 张
                  </span>
                </div>

                <div className="mt-3">
                  <div
                    className={`text-xs font-bold truncate ${
                      isSelected ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {g.label}
                  </div>
                  <div
                    className={`text-[10px] mt-0.5 truncate font-mono ${
                      isSelected ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    {g.metricsText}
                  </div>
                </div>

                {isSelected && (
                  <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-400" />
                )}
              </button>
            );
          })}
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
                <span>按大类标准规整</span>
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
              资产已全新重排为6大资产大类：借记卡、信用卡、数字钱包、理财基金、现金、借贷。点击下方即可快速添加。
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 max-w-4xl mx-auto text-left">
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
                    借记卡
                  </h4>
                  <p className="text-[11px] text-slate-500">招行/工行/建行等储蓄卡</p>
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
                    信用卡 / 白条 / 花呗
                  </h4>
                  <p className="text-[11px] text-slate-500">经典白金/白条/花呗额度</p>
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
                    数字钱包
                  </h4>
                  <p className="text-[11px] text-slate-500">支付宝余额/微信零钱</p>
                </div>
              </div>
              <span className="text-xs text-sky-600 font-semibold mt-3 block">
                + 添加数字钱包
              </span>
            </button>

            <button
              onClick={() => onAddAccount('FUND')}
              className="p-4 rounded-2xl bg-slate-50 hover:bg-amber-50/60 border border-slate-200 hover:border-amber-300 transition-all group flex flex-col justify-between"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                    理财基金
                  </h4>
                  <p className="text-[11px] text-slate-500">余额宝/公募基金/黄金/京东金融</p>
                </div>
              </div>
              <span className="text-xs text-amber-600 font-semibold mt-3 block">
                + 添加理财基金卡面
              </span>
            </button>

            <button
              onClick={() => onAddAccount('CASH')}
              className="p-4 rounded-2xl bg-slate-50 hover:bg-emerald-50/60 border border-slate-200 hover:border-emerald-300 transition-all group flex flex-col justify-between"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                    现金备用金
                  </h4>
                  <p className="text-[11px] text-slate-500">随身现金/家中应急钞</p>
                </div>
              </div>
              <span className="text-xs text-emerald-600 font-semibold mt-3 block">
                + 添加现金账户
              </span>
            </button>

            <button
              onClick={() => onAddAccount('RECEIVABLE')}
              className="p-4 rounded-2xl bg-slate-50 hover:bg-purple-50/60 border border-slate-200 hover:border-purple-300 transition-all group flex flex-col justify-between"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center">
                  <HandCoins className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                    借贷往来
                  </h4>
                  <p className="text-[11px] text-slate-500">借出待收 / 借入待还</p>
                </div>
              </div>
              <span className="text-xs text-purple-600 font-semibold mt-3 block">
                + 添加借贷记录
              </span>
            </button>
          </div>
        </div>
      ) : viewMode === 'GROUPED' ? (
        /* SECTIONED VIEW: GROUPED BY 6 ASSET CLASSES (借记卡、信用卡、数字钱包、理财基金、现金、借贷) */
        <div className="space-y-5">
          {/* Quick Collapse / Expand All Header Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-1 py-1">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-bold text-slate-700">
                {filterGroup === 'ALL' ? '全部账户' : currentGroupLabel}
              </span>
              <span className="text-[11px] text-slate-400">
                · {filterGroup === 'ALL' ? '点击各分类标题栏即可单独折叠/展开' : `展示「${currentGroupLabel}」下全部卡片`}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {filterGroup !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => setFilterGroup('ALL')}
                  className="px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold shadow-2xs flex items-center gap-1 transition-colors"
                  title="返回查看全部账户"
                >
                  <span>查看全部账户</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleCollapseAll}
                className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors"
                title="折叠所有分类"
              >
                <FolderClosed className="w-3.5 h-3.5 text-slate-500" />
                <span>全部折叠</span>
              </button>

              <button
                type="button"
                onClick={handleExpandAll}
                className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors"
                title="展开所有分类"
              >
                <FolderOpen className="w-3.5 h-3.5 text-slate-500" />
                <span>全部展开</span>
              </button>
            </div>
          </div>

          {activeAssetGroups.map((group) => {
            const groupAccounts = accounts.filter(
              (acc) => ACCOUNT_CATEGORY_CONFIG[acc.category]?.group === group.id
            );

            // Skip rendering empty groups in filtered mode, but show with add-CTA in ALL mode
            if (groupAccounts.length === 0 && filterGroup !== 'ALL') {
              return (
                <div
                  key={group.id}
                  className="rounded-3xl bg-white border border-slate-200/80 p-8 text-center shadow-xs space-y-4"
                >
                  <div className={`w-12 h-12 rounded-2xl ${group.badgeBg} ${group.badgeText} flex items-center justify-center mx-auto`}>
                    <group.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      「{group.label}」暂无账户卡片
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">{group.subLabel}</p>
                  </div>
                  <button
                    onClick={() => onAddAccount(group.defaultAddCategory)}
                    className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>添加{group.label}账户</span>
                  </button>
                </div>
              );
            }

            if (groupAccounts.length === 0) {
              return null; // When viewing ALL, hide completely empty sections
            }

            const IconComponent = group.icon;
            const isCollapsed = filterGroup === 'ALL' ? !!collapsedGroups[group.id] : (collapsedGroups[group.id] === true);

            return (
              <div
                key={group.id}
                className={`transition-all duration-200 border ${
                  isCollapsed
                    ? 'rounded-2xl bg-white hover:bg-slate-50/70 border-slate-200/80 p-3.5 sm:p-4 shadow-2xs hover:shadow-xs'
                    : 'rounded-3xl bg-slate-50/50 border-slate-200/70 p-4 sm:p-6 space-y-4 shadow-2xs'
                }`}
              >
                {/* Category Section Header (Clickable Accordion) */}
                <div
                  onClick={() => toggleGroupCollapse(group.id)}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none group ${
                    isCollapsed ? '' : 'pb-3 border-b border-slate-200/60'
                  }`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleGroupCollapse(group.id);
                    }
                  }}
                  title={isCollapsed ? `点击展开「${group.label}」` : `点击折叠「${group.label}」`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${group.badgeBg} ${group.badgeText} border ${group.borderColor} group-hover:scale-105 transition-transform`}
                    >
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                          {group.label}
                        </h3>
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700">
                          {groupAccounts.length} 张卡片
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 mt-0.5">
                        {group.subLabel}
                      </p>
                    </div>
                  </div>

                  {/* Category Summary Metric, Quick Add CTA & Collapse Chevron */}
                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <div className="text-right px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                      <span className="text-[10px] text-slate-400 block">大类资产</span>
                      <span className="text-xs font-bold text-slate-900 font-mono">
                        {group.metricsText}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddAccount(group.defaultAddCategory);
                      }}
                      className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-200 shadow-2xs transition-colors flex items-center gap-1 shrink-0"
                      title={`添加「${group.label}」账户`}
                    >
                      <Plus className="w-3.5 h-3.5 text-blue-600" />
                      <span>添加{group.label}</span>
                    </button>

                    <div
                      className={`p-2 rounded-xl bg-white border border-slate-200 text-slate-600 group-hover:text-slate-900 group-hover:border-slate-300 transition-colors shadow-2xs flex items-center justify-center`}
                    >
                      {isCollapsed ? (
                        <ChevronDown className="w-4 h-4 text-slate-500 group-hover:text-blue-600 transition-colors" />
                      ) : (
                        <ChevronUp className="w-4 h-4 text-slate-500 group-hover:text-blue-600 transition-colors" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Cards Grid for this category (when expanded) */}
                {!isCollapsed && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 pt-1 animate-in fade-in duration-200">
                    {groupAccounts.map((acc, index) => {
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
                            totalCount={groupAccounts.length}
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
                )}
              </div>
            );
          })}
        </div>
      ) : viewMode === 'CARD' ? (
        /* REALISTIC CARD FACE GRID (Flat with Drag and Drop) */
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
                  <th className="py-3 px-4">资产大类</th>
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
                        <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700 font-medium">
                          {ACCOUNT_CATEGORY_CONFIG[acc.category]?.groupLabel || '资产'} · {ACCOUNT_CATEGORY_CONFIG[acc.category]?.label || '账户'}
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
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-amber-900 block">上海金 Au9999 现货行情:</span>
                    <span className="text-amber-700 font-mono">¥{liveGoldRate.priceRmbGram}/g · 汇率: 1 USD = {liveGoldRate.usdCnyRate} CNY</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setQuickGoldPrice(liveGoldRate.priceRmbGram.toString())}
                    className="px-2 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-xs transition-colors text-[11px]"
                  >
                    ⚡ 填入今日价 (¥{liveGoldRate.priceRmbGram})
                  </button>
                </div>

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
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900 font-mono text-sm font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      金价单价 (¥/g)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={quickGoldPrice}
                      onChange={(e) => setQuickGoldPrice(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900 font-mono text-sm font-semibold text-amber-700"
                    />
                  </div>
                </div>

                <div className="text-xs text-amber-800 font-medium flex items-center justify-between px-1">
                  <span>折算总估值:</span>
                  <span className="font-bold font-mono text-sm text-amber-900">
                    ¥{((parseFloat(quickGoldGrams) || 0) * (parseFloat(quickGoldPrice) || 0)).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
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
