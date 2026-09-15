import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Sparkles,
  Check,
  Globe2,
  RefreshCw,
  ArrowRightLeft,
  ChevronDown,
  Info,
  Plus,
  Tag as TagIcon,
  Search,
  CheckCircle2,
  FolderPlus,
  Trash2,
  Wand2,
  Palette,
  CreditCard,
  Building2,
  Wallet,
  Coins,
  Receipt,
  RotateCcw,
  SlidersHorizontal,
  Settings2,
  FolderKanban,
} from 'lucide-react';
import { FinancialAccount, TransactionType, Transaction, ExpenseCategory, IncomeCategory, LedgerProject } from '../types';
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  getStoredExpenseCategories,
  saveStoredExpenseCategories,
  getStoredIncomeCategories,
  saveStoredIncomeCategories,
} from '../lib/constants';
import {
  SUPPORTED_CURRENCIES,
  CurrencyItem,
  fetchLiveForexRates,
  getCachedForexRates,
  getCurrencyInfo,
  ForexRatesResponse,
} from '../lib/forexRates';
import {
  CategoryIcon,
  POPULAR_CATEGORY_ICONS,
  matchCategoryIconName,
  setCustomCategoryIcon,
  removeCustomCategoryIcon,
} from './CategoryIcon';

interface TransactionModalProps {
  accounts: FinancialAccount[];
  projects?: LedgerProject[];
  initialType?: TransactionType;
  initialAccountId?: string;
  initialProjectId?: string;
  initialRefundedTxId?: string;
  initialTransaction?: Transaction | null;
  initialDate?: string;
  allTransactions?: Transaction[];
  onClose: () => void;
  onSubmit: (tx: Omit<Transaction, 'id' | 'createdAt'>, existingId?: string) => void;
}

const CUSTOM_TAGS_STORAGE_KEY = 'asset_vault_custom_user_tags';
const DEFAULT_PRESET_TAGS = ['日常必要', '改善娱乐', '境外海淘', '旅游出行', '固定支出', '家庭公共', '投资学习'];

export const TransactionModal: React.FC<TransactionModalProps> = ({
  accounts,
  projects = [],
  initialType = 'EXPENSE',
  initialAccountId,
  initialProjectId,
  initialRefundedTxId,
  initialTransaction,
  initialDate,
  allTransactions = [],
  onClose,
  onSubmit,
}) => {
  const isEditing = !!initialTransaction;

  const [type, setType] = useState<TransactionType>(
    initialTransaction?.type || initialType
  );

  // Refund Reconcile Linking State
  const [refundedTxId, setRefundedTxId] = useState<string>(
    initialTransaction?.refundedTxId || initialRefundedTxId || ''
  );
  const [refundReason, setRefundReason] = useState<string>(
    initialTransaction?.refundReason || '售后退费平账'
  );

  // Ledger Project Assignment State
  const [projectId, setProjectId] = useState<string>(
    initialTransaction?.projectId || initialProjectId || ''
  );

  const refundableExpenses = useMemo(() => {
    return (allTransactions || []).filter((t) => t.type === 'EXPENSE');
  }, [allTransactions]);

  const selectedRefundExpense = useMemo(() => {
    return refundableExpenses.find((t) => t.id === refundedTxId);
  }, [refundableExpenses, refundedTxId]);

  // Auto-prefill refund when initialRefundedTxId is provided
  useEffect(() => {
    if (initialRefundedTxId && !initialTransaction) {
      setType('REFUND');
      setRefundedTxId(initialRefundedTxId);
      const chosen = (allTransactions || []).find((t) => t.id === initialRefundedTxId);
      if (chosen) {
        const already = chosen.refundedAmount || 0;
        const rem = Math.max(0, chosen.amount - already);
        setAmount(rem.toString());
        setCategory(chosen.category);
        if (chosen.merchant) setMerchant(chosen.merchant);
        if (chosen.accountId) setAccountId(chosen.accountId);
        if (chosen.projectId) setProjectId(chosen.projectId);
        setDescription(`退款平账: ${chosen.description || chosen.category} (冲红)`);
      }
    }
  }, [initialRefundedTxId, allTransactions, initialTransaction]);
  const initialCurrency = initialTransaction?.currency || 'CNY';
  const [currency, setCurrency] = useState<string>(initialCurrency);
  const [forexRates, setForexRates] = useState<ForexRatesResponse>(() => getCachedForexRates());
  const [isRefreshingRates, setIsRefreshingRates] = useState<boolean>(false);
  const [customRate, setCustomRate] = useState<string>(
    initialTransaction?.exchangeRate ? initialTransaction.exchangeRate.toString() : ''
  );
  const [showRateCustomizer, setShowRateCustomizer] = useState<boolean>(false);
  const [rateFeedback, setRateFeedback] = useState<string>('');

  // Currency Picker Popover State
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState<boolean>(false);
  const [currencySearchQuery, setCurrencySearchQuery] = useState<string>('');
  const currencyDropdownRef = useRef<HTMLDivElement>(null);

  // Amount inputs
  const initialAmountStr = initialTransaction
    ? (initialTransaction.currency && initialTransaction.currency !== 'CNY' && initialTransaction.originalAmount !== undefined
        ? initialTransaction.originalAmount.toString()
        : initialTransaction.amount.toString())
    : '';

  const [amount, setAmount] = useState<string>(initialAmountStr);
  const [date, setDate] = useState<string>(
    initialTransaction?.date || initialDate || new Date().toISOString().split('T')[0]
  );
  const [time, setTime] = useState<string>(
    initialTransaction?.time || new Date().toTimeString().split(' ')[0].substring(0, 5)
  );

  // Accounts
  const [accountId, setAccountId] = useState<string>(
    initialTransaction?.accountId ||
      initialAccountId ||
      (accounts.length > 0 ? accounts[0].id : '')
  );
  const [targetAccountId, setTargetAccountId] = useState<string>(
    initialTransaction?.targetAccountId ||
      (accounts.length > 1 ? accounts[1].id : '')
  );

  // Fully Customizable Categories State
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>(() =>
    getStoredExpenseCategories()
  );
  const [incomeCategories, setIncomeCategories] = useState<IncomeCategory[]>(() =>
    getStoredIncomeCategories()
  );
  const [isManagingCategories, setIsManagingCategories] = useState<boolean>(false);

  // Custom Tags State
  const [availableTags, setAvailableTags] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(CUSTOM_TAGS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return Array.from(new Set([...DEFAULT_PRESET_TAGS, ...parsed]));
      }
    } catch {
      // fallback
    }
    return DEFAULT_PRESET_TAGS;
  });

  // Selected Category & Tag
  const [category, setCategory] = useState<string>(
    initialTransaction?.category || (expenseCategories[0]?.name || '餐饮美食')
  );
  const [tag, setTag] = useState<string>(initialTransaction?.tag || '日常必要');
  const [description, setDescription] = useState<string>(
    initialTransaction?.description || ''
  );
  const [counterparty, setCounterparty] = useState<string>(
    initialTransaction?.counterparty || ''
  );
  const [merchant, setMerchant] = useState<string>(
    initialTransaction?.merchant || ''
  );

  // UI State for Adding Custom Category & Tag
  const [isAddingCustomCategory, setIsAddingCustomCategory] = useState<boolean>(false);
  const [newCategoryName, setNewCategoryName] = useState<string>('');
  const [selectedCustomIcon, setSelectedCustomIcon] = useState<string>('');
  const [showIconPalette, setShowIconPalette] = useState<boolean>(false);
  const [iconGroupFilter, setIconGroupFilter] = useState<string>('全部');

  const [isAddingCustomTag, setIsAddingCustomTag] = useState<boolean>(false);
  const [newTagName, setNewTagName] = useState<string>('');

  // Dynamically predicted icon based on user keyword input
  const predictedIcon = useMemo(() => {
    if (selectedCustomIcon) return selectedCustomIcon;
    if (!newCategoryName.trim()) return 'Folder';
    return matchCategoryIconName(newCategoryName);
  }, [newCategoryName, selectedCustomIcon]);

  // Close currency popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (currencyDropdownRef.current && !currencyDropdownRef.current.contains(e.target as Node)) {
        setIsCurrencyDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Fetch live exchange rates on mount
  useEffect(() => {
    let mounted = true;
    fetchLiveForexRates().then((data) => {
      if (mounted) {
        setForexRates(data);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Current currency object
  const currentCurrencyInfo: CurrencyItem = useMemo(() => {
    return getCurrencyInfo(currency);
  }, [currency]);

  // Current effective exchange rate (CNY per 1 foreign unit)
  const currentExchangeRate: number = useMemo(() => {
    if (currency === 'CNY') return 1.0;
    const parsedCustom = parseFloat(customRate);
    if (!isNaN(parsedCustom) && parsedCustom > 0) {
      return parsedCustom;
    }
    return forexRates.ratesToCny[currency] || currentCurrencyInfo.defaultRate || 1.0;
  }, [currency, customRate, forexRates, currentCurrencyInfo]);

  // Calculate final RMB Amount
  const calculatedCnyAmount = useMemo(() => {
    const rawVal = parseFloat(amount);
    if (isNaN(rawVal) || rawVal <= 0) return 0;
    if (currency === 'CNY') return rawVal;
    return Number((rawVal * currentExchangeRate).toFixed(2));
  }, [amount, currency, currentExchangeRate]);

  // Refresh live forex rates handler
  const handleRefreshForex = async () => {
    setIsRefreshingRates(true);
    try {
      const data = await fetchLiveForexRates(true);
      setForexRates(data);
      if (data.ratesToCny[currency]) {
        setCustomRate(data.ratesToCny[currency].toString());
      }
      setRateFeedback(`✨ 已获取最新实时汇率: 1 ${currency} = ${data.ratesToCny[currency] || currentCurrencyInfo.defaultRate} CNY`);
      setTimeout(() => setRateFeedback(''), 3500);
    } catch (e) {
      setRateFeedback('刷新汇率失败，已使用基准缓存汇率');
      setTimeout(() => setRateFeedback(''), 3500);
    } finally {
      setIsRefreshingRates(false);
    }
  };

  // Handle currency change
  const handleCurrencyChange = (newCur: string) => {
    setCurrency(newCur);
    setIsCurrencyDropdownOpen(false);
    setCurrencySearchQuery('');
    if (newCur === 'CNY') {
      setCustomRate('');
    } else {
      const rate = forexRates.ratesToCny[newCur] || getCurrencyInfo(newCur).defaultRate;
      setCustomRate(rate.toString());
    }
  };

  // Filter supported currencies for dropdown
  const filteredCurrencies = useMemo(() => {
    if (!currencySearchQuery.trim()) return SUPPORTED_CURRENCIES;
    const q = currencySearchQuery.toLowerCase();
    return SUPPORTED_CURRENCIES.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.symbol.toLowerCase().includes(q)
    );
  }, [currencySearchQuery]);

  // Filtered icons in palette
  const filteredPaletteIcons = useMemo(() => {
    if (iconGroupFilter === '全部') return POPULAR_CATEGORY_ICONS;
    return POPULAR_CATEGORY_ICONS.filter((item) => item.categoryGroup === iconGroupFilter);
  }, [iconGroupFilter]);

  // Icon groups list for category tabs
  const iconGroups = ['全部', '餐饮食品', '购物百货', '交通出行', '居家生活', '休闲数码', '健康教育', '金融收入'];

  // Add custom category handler with permanent icon mapping registration
  const handleAddCategory = () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;

    const chosenIconId = predictedIcon || 'Folder';
    // Persist exact icon selection to global category icon mapper
    setCustomCategoryIcon(trimmed, chosenIconId);

    if (type === 'EXPENSE') {
      const exists = expenseCategories.some((c) => c.name === trimmed);
      let updated: ExpenseCategory[];
      if (exists) {
        updated = expenseCategories.map((c) =>
          c.name === trimmed ? { ...c, icon: chosenIconId } : c
        );
      } else {
        const newCat: ExpenseCategory = {
          id: `exp-${Date.now()}-${encodeURIComponent(trimmed)}`,
          name: trimmed,
          icon: chosenIconId,
          color: '#f43f5e',
        };
        updated = [...expenseCategories, newCat];
      }
      setExpenseCategories(updated);
      saveStoredExpenseCategories(updated);
    } else if (type === 'INCOME') {
      const exists = incomeCategories.some((c) => c.name === trimmed);
      let updated: IncomeCategory[];
      if (exists) {
        updated = incomeCategories.map((c) =>
          c.name === trimmed ? { ...c, icon: chosenIconId } : c
        );
      } else {
        const newCat: IncomeCategory = {
          id: `inc-${Date.now()}-${encodeURIComponent(trimmed)}`,
          name: trimmed,
          icon: chosenIconId,
          color: '#10b981',
        };
        updated = [...incomeCategories, newCat];
      }
      setIncomeCategories(updated);
      saveStoredIncomeCategories(updated);
    }

    setCategory(trimmed);
    setNewCategoryName('');
    setSelectedCustomIcon('');
    setShowIconPalette(false);
    setIsAddingCustomCategory(false);
  };

  // Delete category handler (Supports deleting ANY category, built-in or custom)
  const handleDeleteCategory = (
    catNameToDelete: string,
    targetType: 'EXPENSE' | 'INCOME',
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    if (targetType === 'EXPENSE') {
      if (expenseCategories.length <= 1) {
        alert('请至少保留一个支出类别');
        return;
      }
      const updated = expenseCategories.filter((c) => c.name !== catNameToDelete);
      setExpenseCategories(updated);
      saveStoredExpenseCategories(updated);
      removeCustomCategoryIcon(catNameToDelete);
      if (category === catNameToDelete) {
        setCategory(updated[0]?.name || '餐饮美食');
      }
    } else {
      if (incomeCategories.length <= 1) {
        alert('请至少保留一个收入类别');
        return;
      }
      const updated = incomeCategories.filter((c) => c.name !== catNameToDelete);
      setIncomeCategories(updated);
      saveStoredIncomeCategories(updated);
      removeCustomCategoryIcon(catNameToDelete);
      if (category === catNameToDelete) {
        setCategory(updated[0]?.name || '工资薪酬');
      }
    }
  };

  // Reset categories to factory defaults
  const handleResetCategoriesToDefault = (targetType: 'EXPENSE' | 'INCOME') => {
    if (confirm(`确定要恢复${targetType === 'EXPENSE' ? '支出' : '收入'}类别为系统预设分类吗？`)) {
      if (targetType === 'EXPENSE') {
        setExpenseCategories([...EXPENSE_CATEGORIES]);
        saveStoredExpenseCategories([...EXPENSE_CATEGORIES]);
        setCategory(EXPENSE_CATEGORIES[0].name);
      } else {
        setIncomeCategories([...INCOME_CATEGORIES]);
        saveStoredIncomeCategories([...INCOME_CATEGORIES]);
        setCategory(INCOME_CATEGORIES[0].name);
      }
      setIsManagingCategories(false);
    }
  };

  // Add custom tag handler
  const handleAddCustomTag = () => {
    const trimmed = newTagName.trim();
    if (!trimmed) return;

    const next = Array.from(new Set([...availableTags, trimmed]));
    setAvailableTags(next);
    localStorage.setItem(CUSTOM_TAGS_STORAGE_KEY, JSON.stringify(next));
    setTag(trimmed);
    setNewTagName('');
    setIsAddingCustomTag(false);
  };

  // Delete custom tag handler
  const handleDeleteCustomTag = (tagToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = availableTags.filter((t) => t !== tagToDelete);
    setAvailableTags(next);
    localStorage.setItem(CUSTOM_TAGS_STORAGE_KEY, JSON.stringify(next));
    if (tag === tagToDelete) {
      setTag(DEFAULT_PRESET_TAGS[0] || '日常必要');
    }
  };

  // Update defaults when tab changes
  useEffect(() => {
    if (!isEditing) {
      if (type === 'EXPENSE') {
        setCategory(expenseCategories[0]?.name || '餐饮美食');
      } else if (type === 'INCOME') {
        setCategory(incomeCategories[0]?.name || '工资薪酬');
      } else if (type === 'REPAYMENT') {
        setCategory('还信用卡/花呗/白条');
        const creditAcc = accounts.find(
          (a) => a.category === 'CREDIT_CARD' || a.category === 'JD_BAITIAO' || a.category === 'HUABEI'
        );
        if (creditAcc) {
          setTargetAccountId(creditAcc.id);
          if (creditAcc.usedCredit) {
            setAmount(creditAcc.usedCredit.toString());
          }
        }
      } else if (type === 'TRANSFER') {
        setCategory('资金划转');
      } else if (type === 'LEND_OUT') {
        setCategory('人情借出款');
      } else if (type === 'COLLECT_LENT') {
        setCategory('收回借款');
      } else if (type === 'BORROW_IN') {
        setCategory('借入款项');
      } else if (type === 'PAY_BORROW') {
        setCategory('归还借款');
      }
    }
  }, [type, accounts, isEditing, expenseCategories, incomeCategories]);

  const handleQuickAddAmount = (add: number) => {
    const current = parseFloat(amount) || 0;
    setAmount((current + add).toString());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rawNumAmount = parseFloat(amount);
    if (isNaN(rawNumAmount) || rawNumAmount <= 0) {
      alert('请输入有效的金额');
      return;
    }

    if (!accountId) {
      alert('请选择扣款或操作账户');
      return;
    }

    const isForeign = currency !== 'CNY';
    const finalAmountInCny = isForeign ? calculatedCnyAmount : rawNumAmount;

    const chosenProj = projects.find((p) => p.id === projectId);
    const finalProjectId =
      projectId ||
      (type === 'REFUND' && selectedRefundExpense?.projectId
        ? selectedRefundExpense.projectId
        : undefined);
    const finalProjectName =
      chosenProj?.name ||
      (type === 'REFUND' && selectedRefundExpense?.projectName
        ? selectedRefundExpense.projectName
        : undefined);

    onSubmit(
      {
        type,
        amount: finalAmountInCny,
        originalAmount: isForeign ? rawNumAmount : undefined,
        currency: isForeign ? currency : 'CNY',
        exchangeRate: isForeign ? currentExchangeRate : undefined,
        date,
        time,
        accountId,
        targetAccountId:
          ['TRANSFER', 'REPAYMENT', 'LEND_OUT', 'COLLECT_LENT', 'BORROW_IN', 'PAY_BORROW'].includes(type)
            ? targetAccountId
            : undefined,
        category: type === 'REFUND' && !category ? '平账冲红' : category,
        tag: tag.trim() || (type === 'REFUND' ? '平账冲红' : undefined),
        projectId: finalProjectId,
        projectName: finalProjectName,
        description:
          description.trim() ||
          (type === 'REFUND'
            ? selectedRefundExpense
              ? `退款平账: ${selectedRefundExpense.description || selectedRefundExpense.category} (冲红)`
              : '支出退款平账 (冲红)'
            : isForeign
            ? `${currentCurrencyInfo.name}交易 (${currentCurrencyInfo.symbol}${rawNumAmount})`
            : category),
        counterparty: counterparty.trim() || undefined,
        merchant: merchant.trim() || selectedRefundExpense?.merchant || undefined,
        isRefund: type === 'REFUND',
        refundedTxId: type === 'REFUND' && refundedTxId ? refundedTxId : undefined,
        refundedTxDescription:
          type === 'REFUND' && selectedRefundExpense
            ? selectedRefundExpense.description || selectedRefundExpense.category
            : undefined,
        refundedTxAmount:
          type === 'REFUND' && selectedRefundExpense ? selectedRefundExpense.amount : undefined,
        refundReason: type === 'REFUND' ? refundReason : undefined,
      },
      initialTransaction?.id
    );

    onClose();
  };

  const isForeign = currency !== 'CNY';

  // Selected active accounts helper
  const selectedAccount = useMemo(() => {
    return accounts.find((a) => a.id === accountId) || accounts[0];
  }, [accounts, accountId]);

  const selectedTargetAccount = useMemo(() => {
    return accounts.find((a) => a.id === targetAccountId) || accounts[1];
  }, [accounts, targetAccountId]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-5 overflow-hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden text-slate-900 dark:text-white my-auto animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fixed Header with Close */}
        <div className="shrink-0 px-5 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md flex items-center justify-between z-20">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`p-2 rounded-xl border shadow-2xs shrink-0 ${
                type === 'EXPENSE'
                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200/70 dark:border-rose-800/60'
                  : type === 'INCOME'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200/70 dark:border-emerald-800/60'
                  : type === 'TRANSFER'
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-200/70 dark:border-blue-800/60'
                  : type === 'REPAYMENT'
                  ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border-purple-200/70 dark:border-purple-800/60'
                  : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-200/70 dark:border-rose-800/60'
              }`}
            >
              {type === 'EXPENSE' ? (
                <Sparkles className="w-4 h-4" />
              ) : type === 'INCOME' ? (
                <Wallet className="w-4 h-4" />
              ) : type === 'TRANSFER' ? (
                <ArrowRightLeft className="w-4 h-4" />
              ) : type === 'REPAYMENT' ? (
                <CreditCard className="w-4 h-4" />
              ) : (
                <RotateCcw className="w-4 h-4" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                  {isEditing ? '编辑流水账目明细' : '记一笔流水账目'}
                </h2>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${
                    type === 'EXPENSE'
                      ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-200/80 dark:border-rose-800/80'
                      : type === 'INCOME'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-800/80'
                      : type === 'TRANSFER'
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border-blue-200/80 dark:border-blue-800/80'
                      : type === 'REPAYMENT'
                      ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 border-purple-200/80 dark:border-purple-800/80'
                      : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/80'
                  }`}
                >
                  {type === 'EXPENSE'
                    ? '支出单'
                    : type === 'INCOME'
                    ? '收入单'
                    : type === 'TRANSFER'
                    ? '转账单'
                    : type === 'REPAYMENT'
                    ? '还款单'
                    : '平账冲红'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 hidden sm:block truncate mt-0.5">
                清晰记录每一笔资金流动，实时同步联动资产与待还额度
              </p>
            </div>
          </div>

          {/* Fixed Close Button - Always visible at top right */}
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭记账窗口"
            title="关闭窗口 (Esc)"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 ml-2 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body with Clean Floating Scrollbar */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 sm:py-5 modal-custom-scrollbar">
          <form id="transaction-form" onSubmit={handleSubmit} className="space-y-4">
            {/* Transaction Type Tabs */}
            <div className="grid grid-cols-5 gap-1 p-1 bg-slate-100/90 dark:bg-slate-800/90 rounded-2xl border border-slate-200/60 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setType('EXPENSE')}
                className={`py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  type === 'EXPENSE'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                支出
              </button>
              <button
                type="button"
                onClick={() => setType('INCOME')}
                className={`py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  type === 'INCOME'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                收入
              </button>
              <button
                type="button"
                onClick={() => setType('TRANSFER')}
                className={`py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  type === 'TRANSFER'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                转账
              </button>
              <button
                type="button"
                onClick={() => setType('REPAYMENT')}
                className={`py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  type === 'REPAYMENT'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                还款
              </button>
              <button
                type="button"
                onClick={() => setType('REFUND')}
                className={`py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  type === 'REFUND'
                    ? 'bg-rose-700 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                平账冲红
              </button>
            </div>

            {/* Dedicated Refund Callout & Link Picker */}
            {type === 'REFUND' && (
              <div className="p-3.5 rounded-2xl bg-rose-50/90 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/50 space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <RotateCcw className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <span className="font-bold text-rose-900 dark:text-rose-200">
                      平账冲红功能 (支出退费冲账)
                    </span>
                    <p className="text-rose-700 dark:text-rose-300 mt-0.5 leading-relaxed">
                      花出去的钱后续被退费时（例如之前花了100，过了许久被退回90），冲红冲减原支出并入账退回资金，不虚增收入，保持实际支出与账户余额绝对准确。
                    </p>
                  </div>
                </div>

                {/* Historical Expense Bill Picker */}
                {refundableExpenses.length > 0 && (
                  <div className="pt-2 border-t border-rose-200/60 dark:border-rose-900/40">
                    <label className="block text-xs font-bold text-rose-900 dark:text-rose-200 mb-1">
                      关联历史原支出账单 (选定后自动匹配分类商户与限额)
                    </label>
                    <select
                      value={refundedTxId}
                      onChange={(e) => {
                        const chosenId = e.target.value;
                        setRefundedTxId(chosenId);
                        const chosen = refundableExpenses.find((t) => t.id === chosenId);
                        if (chosen) {
                          const already = chosen.refundedAmount || 0;
                          const rem = Math.max(0, chosen.amount - already);
                          setAmount(rem.toString());
                          setCategory(chosen.category);
                          if (chosen.merchant) setMerchant(chosen.merchant);
                          if (chosen.accountId) setAccountId(chosen.accountId);
                          setDescription(`退款平账: ${chosen.description || chosen.category} (冲红)`);
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-1 focus:ring-rose-500"
                    >
                      <option value="">-- 作为独立冲红单记账 (不强制关联具体单据) --</option>
                      {refundableExpenses.map((t) => {
                        const already = t.refundedAmount || 0;
                        const rem = Math.max(0, t.amount - already);
                        return (
                          <option key={t.id} value={t.id}>
                            [{t.date}] {t.description || t.category} · 原支出 ¥{t.amount.toFixed(2)} (已退: ¥{already.toFixed(2)} | 剩可退: ¥{rem.toFixed(2)})
                          </option>
                        );
                      })}
                    </select>

                    {selectedRefundExpense && (
                      <div className="mt-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 flex items-center justify-between text-xs">
                        <div className="font-mono text-slate-600 dark:text-slate-300">
                          原单: <span className="font-bold text-slate-900 dark:text-white">¥{selectedRefundExpense.amount.toFixed(2)}</span>
                          {' · '}
                          剩余可冲红: <span className="font-bold text-emerald-600">¥{Math.max(0, selectedRefundExpense.amount - (selectedRefundExpense.refundedAmount || 0)).toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              const rem = Math.max(0, selectedRefundExpense.amount - (selectedRefundExpense.refundedAmount || 0));
                              setAmount(rem.toString());
                            }}
                            className="px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[10px] font-bold"
                          >
                            全额退
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const rem = Math.max(0, selectedRefundExpense.amount - (selectedRefundExpense.refundedAmount || 0));
                              setAmount((Math.round(rem * 0.9 * 100) / 100).toString());
                            }}
                            className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-semibold"
                          >
                            退90%
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          {/* Currency Selector Bar */}
          <div className="relative" ref={currencyDropdownRef}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                交易币种与实时汇率
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRefreshForex}
                  disabled={isRefreshingRates}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
                >
                  <RefreshCw className={`w-3 h-3 ${isRefreshingRates ? 'animate-spin' : ''}`} />
                  <span>{isRefreshingRates ? '更新中...' : '刷新汇率'}</span>
                </button>
              </div>
            </div>

            {/* Currency Pill Trigger Button */}
            <div className="flex items-center gap-2 mt-1.5">
              <button
                type="button"
                onClick={() => setIsCurrencyDropdownOpen(!isCurrencyDropdownOpen)}
                className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 transition-colors flex-1 text-left group"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{currentCurrencyInfo.flag}</span>
                  <div>
                    <span className="font-mono font-bold text-xs sm:text-sm text-slate-900 dark:text-white mr-1.5">
                      {currency}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {currentCurrencyInfo.name} ({currentCurrencyInfo.symbol})
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  {currency !== 'CNY' && (
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                      1 {currency} ≈ {currentExchangeRate} CNY
                    </span>
                  )}
                  <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                </div>
              </button>

              {/* Fast CNY reset button */}
              {currency !== 'CNY' && (
                <button
                  type="button"
                  onClick={() => handleCurrencyChange('CNY')}
                  className="px-2.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 transition-colors"
                >
                  切回 CNY
                </button>
              )}
            </div>

            {/* Currency Dropdown Popover */}
            {isCurrencyDropdownOpen && (
              <div className="absolute top-full left-0 right-0 z-30 mt-1.5 p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-2 animate-in fade-in zoom-in-95 duration-150">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="搜索币种代码/名称 (如 USD, 日元, EUR)..."
                    value={currencySearchQuery}
                    onChange={(e) => setCurrencySearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    autoFocus
                  />
                </div>

                <div className="max-h-56 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-1.5 p-0.5 modal-custom-scrollbar">
                  {filteredCurrencies.map((cur) => {
                    const isSelected = currency === cur.code;
                    const liveRate = forexRates.ratesToCny[cur.code] || cur.defaultRate;
                    return (
                      <button
                        key={cur.code}
                        type="button"
                        onClick={() => handleCurrencyChange(cur.code)}
                        className={`p-2 rounded-xl text-left border flex items-center justify-between transition-all ${
                          isSelected
                            ? 'bg-slate-900 dark:bg-slate-700 text-white border-slate-900 dark:border-slate-600 shadow-2xs'
                            : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200/70 dark:border-slate-700/60 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                        }`}
                      >
                        <div className="min-w-0 flex items-center gap-1.5">
                          <span className="text-base">{cur.flag}</span>
                          <div className="min-w-0">
                            <div className="font-bold text-xs font-mono truncate">{cur.code}</div>
                            <div className="text-[10px] opacity-75 truncate">{cur.name}</div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          {cur.code !== 'CNY' && (
                            <span className={`text-[10px] font-mono block ${isSelected ? 'text-emerald-300' : 'text-slate-400'}`}>
                              ≈{liveRate}
                            </span>
                          )}
                          {isSelected && <Check className="w-3 h-3 text-emerald-400 ml-auto mt-0.5" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-[11px] text-slate-400 px-1">
                  <span>支持全球 15+ 主要货币实时汇率自动换算</span>
                  <button
                    type="button"
                    onClick={() => setIsCurrencyDropdownOpen(false)}
                    className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  >
                    关闭
                  </button>
                </div>
              </div>
            )}

            {rateFeedback && (
              <div className="text-[11px] text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-lg mt-1.5 animate-in fade-in border border-blue-100 dark:border-blue-900/60">
                {rateFeedback}
              </div>
            )}
          </div>

          {/* Amount Big Input Box */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                {isForeign ? `${currentCurrencyInfo.name} (${currency}) 原币金额` : '交易金额 (元)'}
              </span>
              {isForeign && (
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {currentCurrencyInfo.flag} {currency}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-400 dark:text-slate-500">
                {currentCurrencyInfo.symbol}
              </span>
              <input
                id="tx-input-amount"
                type="number"
                step="0.01"
                min="0.01"
                required
                autoFocus
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-transparent text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-slate-600 focus:outline-none font-mono"
              />
            </div>

            {/* Quick Increment Buttons */}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-700 overflow-x-auto no-scrollbar">
              {(currency === 'JPY' || currency === 'KRW'
                ? [1000, 5000, 10000, 50000, 100000]
                : [10, 50, 100, 500, 1000, 5000]
              ).map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickAddAmount(val)}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-mono font-medium transition-colors whitespace-nowrap shadow-2xs"
                >
                  +{val}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setAmount('')}
                className="px-2.5 py-1 rounded-lg bg-slate-200/60 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 text-xs transition-colors"
              >
                重置
              </button>
            </div>
          </div>

          {/* Foreign Currency Conversion Panel */}
          {isForeign && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-50/90 via-indigo-50/60 to-sky-50/70 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-sky-950/30 border border-blue-200/80 dark:border-blue-800/60 space-y-3 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-lg bg-blue-600 text-white shadow-2xs">
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                  </span>
                  <div>
                    <span className="text-xs font-bold text-blue-950 dark:text-blue-200 block">
                      当日参考汇率: 1 {currency} = {currentExchangeRate} CNY
                    </span>
                    <span className="text-[11px] text-blue-700 dark:text-blue-400">
                      来源: {forexRates.provider || '国际实时汇率'} ({forexRates.updatedAt})
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowRateCustomizer(!showRateCustomizer)}
                  className="text-xs font-medium text-blue-800 dark:text-blue-300 hover:underline self-start sm:self-auto"
                >
                  {showRateCustomizer ? '收起微调' : '自定义/微调汇率 ✎'}
                </button>
              </div>

              {showRateCustomizer && (
                <div className="p-3 rounded-xl bg-white/90 dark:bg-slate-800 border border-blue-200 dark:border-blue-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      实记汇率 (例如信用卡结算实际汇率):
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const standardRate = forexRates.ratesToCny[currency] || currentCurrencyInfo.defaultRate;
                        setCustomRate(standardRate.toString());
                      }}
                      className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      恢复今日基准 ({forexRates.ratesToCny[currency] || currentCurrencyInfo.defaultRate})
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">1 {currency} =</span>
                    <input
                      type="number"
                      step="0.0001"
                      value={customRate}
                      onChange={(e) => setCustomRate(e.target.value)}
                      placeholder={currentCurrencyInfo.defaultRate.toString()}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">CNY</span>
                  </div>
                </div>
              )}

              <div className="p-3 rounded-xl bg-blue-100/70 dark:bg-blue-950/60 border border-blue-200/90 dark:border-blue-800/80 flex items-center justify-between">
                <div>
                  <span className="text-xs text-blue-900 dark:text-blue-200 font-semibold block">
                    折合记账本位币 (人民币 CNY):
                  </span>
                  <span className="text-[11px] text-blue-700 dark:text-blue-400 font-mono">
                    {currentCurrencyInfo.symbol}{parseFloat(amount) || 0} × {currentExchangeRate}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-lg sm:text-xl font-extrabold text-blue-950 dark:text-blue-200 font-mono">
                    ¥ {calculatedCnyAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <span className="text-[10px] text-blue-700 dark:text-blue-400">将按此金额扣减账户余额与计入月支出</span>
                </div>
              </div>
            </div>
          )}

          {/* Account Selection (支付/扣款账户及目标账户) */}
          <div className={`grid gap-3 ${['TRANSFER', 'REPAYMENT', 'LEND_OUT', 'COLLECT_LENT', 'BORROW_IN', 'PAY_BORROW'].includes(type) ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
            <div>
              <label htmlFor="tx-select-account" className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                {type === 'REFUND'
                  ? '退款接收入账账户 (资金退回到哪里)'
                  : type === 'INCOME'
                  ? '收款入账账户'
                  : type === 'TRANSFER' || type === 'REPAYMENT'
                  ? '支付/扣款转出账户'
                  : '支付/扣款账户'}
              </label>

              <select
                id="tx-select-account"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-blue-400 font-medium"
              >
                {accounts.map((acc) => {
                  const cardSuffix = acc.cardNumberLast4 ? ` [尾号 ${acc.cardNumberLast4}]` : '';
                  const balanceStr = acc.usedCredit !== undefined
                    ? `(待还: ¥${acc.usedCredit.toFixed(2)})`
                    : `(余额: ¥${acc.balance?.toFixed(2) || '0.00'})`;
                  return (
                    <option key={acc.id} value={acc.id}>
                      {acc.bankName || acc.name}{acc.bankName && acc.name !== acc.bankName ? ` (${acc.name})` : ''}{cardSuffix} {balanceStr}
                    </option>
                  );
                })}
              </select>
            </div>

            {['TRANSFER', 'REPAYMENT', 'LEND_OUT', 'COLLECT_LENT', 'BORROW_IN', 'PAY_BORROW'].includes(
              type
            ) && (
              <div>
                <label htmlFor="tx-select-target-account" className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                  {type === 'REPAYMENT'
                    ? '待还款信用卡/白条'
                    : type === 'TRANSFER'
                    ? '转入目标账户'
                    : '目标关联账户'}
                </label>

                <select
                  id="tx-select-target-account"
                  value={targetAccountId}
                  onChange={(e) => setTargetAccountId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-purple-400 font-medium"
                >
                  {accounts
                    .filter((acc) => acc.id !== accountId)
                    .map((acc) => {
                      const cardSuffix = acc.cardNumberLast4 ? ` [尾号 ${acc.cardNumberLast4}]` : '';
                      const balInfo = acc.usedCredit !== undefined
                        ? `(待还: ¥${acc.usedCredit.toFixed(2)})`
                        : `(余额: ¥${acc.balance?.toFixed(2) || '0.00'})`;
                      return (
                        <option key={acc.id} value={acc.id}>
                          {acc.bankName || acc.name}{acc.bankName && acc.name !== acc.bankName ? ` (${acc.name})` : ''}{cardSuffix} {balInfo}
                        </option>
                      );
                    })}
                </select>
              </div>
            )}
          </div>

          {/* Fully Customizable Expense Categories (支持全部自定义删除与添加、智能图标库识别) */}
          {type === 'EXPENSE' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <span>支出类别</span>
                  <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                    · 当前: <CategoryIcon nameOrIcon={category} className="w-3.5 h-3.5 inline text-rose-600" /> {category}
                  </span>
                </label>
                
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsManagingCategories(!isManagingCategories)}
                    className={`text-xs px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1 transition-colors ${
                      isManagingCategories
                        ? 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                    <span>{isManagingCategories ? '完成管理' : '管理/删除分类'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingCustomCategory(!isAddingCustomCategory);
                      setShowIconPalette(false);
                    }}
                    className="text-xs px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 hover:text-rose-700 dark:text-rose-400 font-medium border border-rose-200/80 dark:border-rose-900/60 flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isAddingCustomCategory ? '取消新建' : '新建类别'}</span>
                  </button>
                </div>
              </div>

              {/* Management mode top bar with Reset to default button */}
              {isManagingCategories && (
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between text-xs animate-in fade-in">
                  <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                    <Info className="w-3.5 h-3.5 shrink-0" />
                    <span>点击任意类别右上角的红色 ✕ 即可删除</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleResetCategoriesToDefault('EXPENSE')}
                    className="text-xs text-amber-700 dark:text-amber-300 hover:text-rose-600 dark:hover:text-rose-400 underline font-semibold shrink-0"
                  >
                    恢复预设分类
                  </button>
                </div>
              )}

              {/* Custom Category Input Form with Smart Keyword Icon Preview & Filterable Palette */}
              {isAddingCustomCategory && (
                <div className="p-3 rounded-2xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200/90 dark:border-rose-900/70 space-y-2.5 animate-in fade-in zoom-in-95 duration-150 shadow-xs">
                  <div className="flex items-center gap-2">
                    {/* Live Preview of Predicted/Selected Icon */}
                    <div
                      title="根据关键词智能匹配的图标（点击可手动挑选）"
                      onClick={() => setShowIconPalette(!showIconPalette)}
                      className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 flex items-center justify-center flex-shrink-0 cursor-pointer shadow-2xs hover:scale-105 transition-transform"
                    >
                      <CategoryIcon nameOrIcon={predictedIcon} className="w-4 h-4" />
                    </div>

                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => {
                        setNewCategoryName(e.target.value);
                        if (!e.target.value) setSelectedCustomIcon('');
                      }}
                      placeholder="输入分类名 (如 宠物猫粮、美发烫发、咖啡、羽毛球、自驾加油、房租)..."
                      className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-rose-200 dark:border-rose-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-400"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCategory();
                        }
                      }}
                    />

                    <button
                      type="button"
                      onClick={handleAddCategory}
                      disabled={!newCategoryName.trim()}
                      className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-semibold shadow-2xs whitespace-nowrap"
                    >
                      添加并选中
                    </button>
                  </div>

                  {/* Smart Icon Feedback & Manual Palette Trigger */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1">
                    <div className="flex items-center gap-1.5">
                      <Wand2 className="w-3 h-3 text-rose-500" />
                      <span>
                        {newCategoryName.trim()
                          ? `✨ 智能识别匹配图标: ${predictedIcon}`
                          : '输入类别关键词即可自动智能识别图标库'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowIconPalette(!showIconPalette)}
                      className="text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 font-medium"
                    >
                      <Palette className="w-3 h-3" />
                      <span>{showIconPalette ? '收起图标库' : '挑选手选图标 🎨'}</span>
                    </button>
                  </div>

                  {/* Categorized Icon Selector Palette */}
                  {showIconPalette && (
                    <div className="pt-2 border-t border-rose-200/60 dark:border-rose-900/60 animate-in fade-in space-y-2">
                      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                        {iconGroups.map((grp) => (
                          <button
                            key={grp}
                            type="button"
                            onClick={() => setIconGroupFilter(grp)}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-medium whitespace-nowrap transition-colors ${
                              iconGroupFilter === grp
                                ? 'bg-rose-600 text-white font-bold shadow-2xs'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {grp}
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5 max-h-36 overflow-y-auto p-1.5 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-rose-100 dark:border-rose-900/40 modal-custom-scrollbar">
                        {filteredPaletteIcons.map((item) => {
                          const IconComp = item.icon;
                          const isPicked = predictedIcon === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => setSelectedCustomIcon(item.id)}
                              className={`p-1.5 rounded-lg flex flex-col items-center gap-0.5 border text-center transition-all ${
                                isPicked
                                  ? 'bg-rose-600 text-white border-rose-600 shadow-2xs font-bold ring-1 ring-rose-400'
                                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                              }`}
                              title={`${item.name} (${item.id})`}
                            >
                              <IconComp className="w-3.5 h-3.5" />
                              <span className="text-[9px] truncate w-full leading-tight">{item.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Expense Category Grid - All categories deletable and customizable */}
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1 modal-custom-scrollbar">
                {expenseCategories.map((c) => {
                  const isSelected = category === c.name;
                  return (
                    <div
                      key={c.id || c.name}
                      className={`relative group p-2 rounded-xl text-xs font-medium flex flex-col items-center gap-1.5 border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-800 shadow-xs font-bold ring-1 ring-rose-400/40'
                          : 'bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200/60 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                      onClick={() => setCategory(c.name)}
                    >
                      {/* Delete button (Always visible in management mode, visible on hover in normal mode) */}
                      {(isManagingCategories || true) && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteCategory(c.name, 'EXPENSE', e)}
                          title={`删除分类「${c.name}」`}
                          className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 hover:bg-rose-700 text-white flex items-center justify-center shadow-xs transition-transform hover:scale-110 z-10 ${
                            isManagingCategories ? 'opacity-100 scale-100' : 'opacity-0 group-hover:opacity-100'
                          }`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}

                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                          isSelected
                            ? 'bg-rose-600 text-white'
                            : 'bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        <CategoryIcon nameOrIcon={c.icon || c.name} className="w-3.5 h-3.5" />
                      </div>
                      <span className="truncate w-full text-center text-[11px]">{c.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Fully Customizable Income Categories */}
          {type === 'INCOME' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <span>收入类别</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    · 当前: <CategoryIcon nameOrIcon={category} className="w-3.5 h-3.5 inline text-emerald-600" /> {category}
                  </span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsManagingCategories(!isManagingCategories)}
                    className={`text-xs px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1 transition-colors ${
                      isManagingCategories
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                    <span>{isManagingCategories ? '完成管理' : '管理/删除分类'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingCustomCategory(!isAddingCustomCategory);
                      setShowIconPalette(false);
                    }}
                    className="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 font-medium border border-emerald-200/80 dark:border-emerald-900/60 flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isAddingCustomCategory ? '取消新建' : '新建类别'}</span>
                  </button>
                </div>
              </div>

              {isManagingCategories && (
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between text-xs animate-in fade-in">
                  <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                    <Info className="w-3.5 h-3.5 shrink-0" />
                    <span>点击任意类别右上角的红色 ✕ 即可删除</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleResetCategoriesToDefault('INCOME')}
                    className="text-xs text-amber-700 dark:text-amber-300 hover:text-rose-600 dark:hover:text-rose-400 underline font-semibold shrink-0"
                  >
                    恢复预设分类
                  </button>
                </div>
              )}

              {/* Custom Income Category Input Form */}
              {isAddingCustomCategory && (
                <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/90 dark:border-emerald-900/70 space-y-2.5 animate-in fade-in zoom-in-95 duration-150 shadow-xs">
                  <div className="flex items-center gap-2">
                    <div
                      title="根据关键词智能匹配的图标（点击可手动挑选）"
                      onClick={() => setShowIconPalette(!showIconPalette)}
                      className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center flex-shrink-0 cursor-pointer shadow-2xs hover:scale-105 transition-transform"
                    >
                      <CategoryIcon nameOrIcon={predictedIcon} className="w-4 h-4" />
                    </div>

                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => {
                        setNewCategoryName(e.target.value);
                        if (!e.target.value) setSelectedCustomIcon('');
                      }}
                      placeholder="输入收入分类名 (如 租金收益、咨询外快、理财分红、打赏、奖金)..."
                      className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCategory();
                        }
                      }}
                    />

                    <button
                      type="button"
                      onClick={handleAddCategory}
                      disabled={!newCategoryName.trim()}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-semibold shadow-2xs whitespace-nowrap"
                    >
                      添加并选中
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1">
                    <div className="flex items-center gap-1.5">
                      <Wand2 className="w-3 h-3 text-emerald-600" />
                      <span>
                        {newCategoryName.trim()
                          ? `✨ 智能识别匹配图标: ${predictedIcon}`
                          : '输入类别关键词即可自动智能识别图标库'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowIconPalette(!showIconPalette)}
                      className="text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 font-medium"
                    >
                      <Palette className="w-3 h-3" />
                      <span>{showIconPalette ? '收起图标库' : '挑选手选图标 🎨'}</span>
                    </button>
                  </div>

                  {showIconPalette && (
                    <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-900/60 animate-in fade-in space-y-2">
                      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                        {iconGroups.map((grp) => (
                          <button
                            key={grp}
                            type="button"
                            onClick={() => setIconGroupFilter(grp)}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-medium whitespace-nowrap transition-colors ${
                              iconGroupFilter === grp
                                ? 'bg-emerald-700 text-white font-bold shadow-2xs'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {grp}
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5 max-h-36 overflow-y-auto p-1.5 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-emerald-100 dark:border-emerald-900/40 modal-custom-scrollbar">
                        {filteredPaletteIcons.map((item) => {
                          const IconComp = item.icon;
                          const isPicked = predictedIcon === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => setSelectedCustomIcon(item.id)}
                              className={`p-1.5 rounded-lg flex flex-col items-center gap-0.5 border text-center transition-all ${
                                isPicked
                                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs font-bold ring-1 ring-emerald-400'
                                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                              }`}
                              title={`${item.name} (${item.id})`}
                            >
                              <IconComp className="w-3.5 h-3.5" />
                              <span className="text-[9px] truncate w-full leading-tight">{item.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Income Category Grid */}
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1 modal-custom-scrollbar">
                {incomeCategories.map((c) => {
                  const isSelected = category === c.name;
                  return (
                    <div
                      key={c.id || c.name}
                      className={`relative group p-2 rounded-xl text-xs font-medium flex flex-col items-center gap-1.5 border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 shadow-xs font-bold ring-1 ring-emerald-400/40'
                          : 'bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200/60 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                      onClick={() => setCategory(c.name)}
                    >
                      {(isManagingCategories || true) && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteCategory(c.name, 'INCOME', e)}
                          title={`删除分类「${c.name}」`}
                          className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 hover:bg-rose-700 text-white flex items-center justify-center shadow-xs transition-transform hover:scale-110 z-10 ${
                            isManagingCategories ? 'opacity-100 scale-100' : 'opacity-0 group-hover:opacity-100'
                          }`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}

                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                          isSelected
                            ? 'bg-emerald-700 text-white'
                            : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-400'
                        }`}
                      >
                        <CategoryIcon nameOrIcon={c.icon || c.name} className="w-3.5 h-3.5" />
                      </div>
                      <span className="truncate w-full text-center text-[11px]">{c.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Date & Tag Details with Custom Tag Support & Deletion */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                记账日期与时间
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:bg-white dark:focus:bg-slate-800 font-mono"
                />
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-24 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:bg-white dark:focus:bg-slate-800 font-mono"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1">
                  <TagIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>自定义标签分类</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddingCustomTag(!isAddingCustomTag)}
                  className="text-xs text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 font-medium flex items-center gap-0.5"
                >
                  <Plus className="w-3 h-3" />
                  <span>{isAddingCustomTag ? '取消' : '新建标签'}</span>
                </button>
              </div>

              {/* Custom Tag Input Form */}
              {isAddingCustomTag && (
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 mb-2 animate-in fade-in">
                  <input
                    type="text"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="输入标签 (如 自驾游, 健身房)..."
                    className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomTag();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomTag}
                    disabled={!newTagName.trim()}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-medium"
                  >
                    添加
                  </button>
                </div>
              )}

              {/* Tags Badges with Delete support */}
              <div className="flex items-center gap-1.5 flex-wrap max-h-24 overflow-y-auto p-0.5 modal-custom-scrollbar">
                {availableTags.map((t) => {
                  const isSelected = tag === t;
                  const isCustom = !DEFAULT_PRESET_TAGS.includes(t);
                  return (
                    <div
                      key={t}
                      className={`inline-flex items-center rounded-lg text-xs font-medium border transition-colors ${
                        isSelected
                          ? 'bg-slate-900 dark:bg-slate-700 text-white border-slate-900 dark:border-slate-600 shadow-2xs font-semibold'
                          : 'bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setTag(t)}
                        className="px-2.5 py-1"
                      >
                        #{t}
                      </button>
                      {isCustom && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteCustomTag(t, e)}
                          title={`删除标签 #${t}`}
                          className="pr-1.5 pl-0.5 text-slate-400 hover:text-rose-500 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 归属账本项目关联 (方便统计单项目支出与收入、独立核算结余) */}
          <div className="p-3 bg-slate-50/80 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FolderKanban className="w-3.5 h-3.5 text-indigo-500" />
                <span>归属账本项目 (专项支出/收入/结余统计)</span>
              </label>
              {projectId && (
                <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-200/60 dark:border-indigo-800/60">
                  已关联专项
                </span>
              )}
            </div>

            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">-- 日常通用个人账目 (不归入特定项目) --</option>
              {projects.map((proj) => (
                <option key={proj.id} value={proj.id}>
                  📁 [{proj.category}] {proj.name} {proj.budget ? `(预算: ¥${proj.budget})` : ''} {proj.status === 'COMPLETED' ? '【已结项】' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Notes & Merchant Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="tx-input-description" className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                备注说明
              </label>
              <input
                id="tx-input-description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={isForeign ? `例如: 海外购物、Apple Store、${currentCurrencyInfo.name}转账...` : "例如: 超市买菜、工作餐、房租转账..."}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-blue-400 focus:bg-white dark:focus:bg-slate-800 transition-colors"
              />
            </div>
            <div>
              <label htmlFor="tx-input-merchant" className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                商家 / 交易对手方 (选填)
              </label>
              <input
                id="tx-input-merchant"
                type="text"
                value={merchant || counterparty}
                onChange={(e) => {
                  setMerchant(e.target.value);
                  setCounterparty(e.target.value);
                }}
                placeholder="例如: 盒马鲜生、山姆会员店、星巴克..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-blue-400 focus:bg-white dark:focus:bg-slate-800 transition-colors"
              />
            </div>
          </div>
        </form>
      </div>

      {/* Fixed Footer with Cancel & Submit Actions - Always visible regardless of scrolling */}
      <div className="shrink-0 px-5 sm:px-6 py-3.5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/90 dark:bg-slate-900/95 backdrop-blur-md flex items-center justify-between gap-3 z-20">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium text-xs sm:text-sm transition-colors"
        >
          取消
        </button>
        <button
          id="btn-submit-transaction"
          type="submit"
          form="transaction-form"
          className="flex-1 py-2.5 sm:py-3 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm active:scale-[0.99] transition-all"
        >
          <Check className="w-4 h-4 text-emerald-400 dark:text-white" />
          <span>
            {isForeign
              ? `确认入账 (${currentCurrencyInfo.symbol}${parseFloat(amount) || 0} ➔ 折合 ¥${calculatedCnyAmount.toFixed(2)})`
              : isEditing
              ? '保存修改并更新流水'
              : '确认记账并更新资产与额度'}
          </span>
        </button>
      </div>
    </div>
  </div>
);
};
