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
} from 'lucide-react';
import { FinancialAccount, TransactionType, Transaction } from '../types';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../lib/constants';
import {
  SUPPORTED_CURRENCIES,
  CurrencyItem,
  fetchLiveForexRates,
  getCachedForexRates,
  getCurrencyInfo,
  convertForeignToCny,
  ForexRatesResponse,
} from '../lib/forexRates';
import { CategoryIcon, POPULAR_CATEGORY_ICONS, matchCategoryIconName } from './CategoryIcon';

interface TransactionModalProps {
  accounts: FinancialAccount[];
  initialType?: TransactionType;
  initialAccountId?: string;
  initialTransaction?: Transaction | null;
  initialDate?: string;
  onClose: () => void;
  onSubmit: (tx: Omit<Transaction, 'id' | 'createdAt'>, existingId?: string) => void;
}

const CUSTOM_TAGS_STORAGE_KEY = 'asset_vault_custom_user_tags';
const CUSTOM_CATEGORIES_STORAGE_KEY = 'asset_vault_custom_user_categories';
const DEFAULT_PRESET_TAGS = ['日常必要', '改善娱乐', '境外海淘', '旅游出行', '固定支出', '家庭公共', '投资学习'];

export const TransactionModal: React.FC<TransactionModalProps> = ({
  accounts,
  initialType = 'EXPENSE',
  initialAccountId,
  initialTransaction,
  initialDate,
  onClose,
  onSubmit,
}) => {
  const isEditing = !!initialTransaction;

  const [type, setType] = useState<TransactionType>(
    initialTransaction?.type || initialType
  );

  // Currency & Forex State
  const initialCurrency = initialTransaction?.currency || 'CNY';
  const [currency, setCurrency] = useState<string>(initialCurrency);
  const [forexRates, setForexRates] = useState<ForexRatesResponse>(() => getCachedForexRates());
  const [isRefreshingRates, setIsRefreshingRates] = useState<boolean>(false);
  const [customRate, setCustomRate] = useState<string>(
    initialTransaction?.exchangeRate ? initialTransaction.exchangeRate.toString() : ''
  );
  const [showRateCustomizer, setShowRateCustomizer] = useState<boolean>(false);
  const [rateFeedback, setRateFeedback] = useState<string>('');

  // Currency Picker Dropdown / Popover State (点击展示币种)
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

  // Custom User Categories & Tags from LocalStorage
  const [customExpenseCategories, setCustomExpenseCategories] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(`${CUSTOM_CATEGORIES_STORAGE_KEY}_expense`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [customIncomeCategories, setCustomIncomeCategories] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(`${CUSTOM_CATEGORIES_STORAGE_KEY}_income`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

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

  // Category & Tag States
  const [category, setCategory] = useState<string>(
    initialTransaction?.category || '餐饮美食'
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

  // Add custom category handler with intelligent icon selection
  const handleAddCustomCategory = () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;

    if (type === 'EXPENSE') {
      const next = Array.from(new Set([...customExpenseCategories, trimmed]));
      setCustomExpenseCategories(next);
      localStorage.setItem(`${CUSTOM_CATEGORIES_STORAGE_KEY}_expense`, JSON.stringify(next));
    } else if (type === 'INCOME') {
      const next = Array.from(new Set([...customIncomeCategories, trimmed]));
      setCustomIncomeCategories(next);
      localStorage.setItem(`${CUSTOM_CATEGORIES_STORAGE_KEY}_income`, JSON.stringify(next));
    }
    setCategory(trimmed);
    setNewCategoryName('');
    setSelectedCustomIcon('');
    setShowIconPalette(false);
    setIsAddingCustomCategory(false);
  };

  // Delete custom category handler
  const handleDeleteCustomCategory = (
    catNameToDelete: string,
    targetType: 'EXPENSE' | 'INCOME',
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    if (targetType === 'EXPENSE') {
      const next = customExpenseCategories.filter((c) => c !== catNameToDelete);
      setCustomExpenseCategories(next);
      localStorage.setItem(`${CUSTOM_CATEGORIES_STORAGE_KEY}_expense`, JSON.stringify(next));
      if (category === catNameToDelete) {
        setCategory(EXPENSE_CATEGORIES[0]?.name || '餐饮美食');
      }
    } else {
      const next = customIncomeCategories.filter((c) => c !== catNameToDelete);
      setCustomIncomeCategories(next);
      localStorage.setItem(`${CUSTOM_CATEGORIES_STORAGE_KEY}_income`, JSON.stringify(next));
      if (category === catNameToDelete) {
        setCategory(INCOME_CATEGORIES[0]?.name || '工资薪酬');
      }
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

  // Update defaults when tab changes (only if creating fresh)
  useEffect(() => {
    if (!isEditing) {
      if (type === 'EXPENSE') {
        setCategory(EXPENSE_CATEGORIES[0]?.name || '餐饮美食');
      } else if (type === 'INCOME') {
        setCategory(INCOME_CATEGORIES[0]?.name || '工资薪酬');
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
  }, [type, accounts, isEditing]);

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
        category,
        tag: tag.trim() || undefined,
        description: description.trim() || (isForeign ? `${currentCurrencyInfo.name}交易 (${currentCurrencyInfo.symbol}${rawNumAmount})` : category),
        counterparty: counterparty.trim() || undefined,
        merchant: merchant.trim() || undefined,
      },
      initialTransaction?.id
    );

    onClose();
  };

  const isForeign = currency !== 'CNY';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl my-auto text-slate-900 dark:text-white">
        {/* Header with Close */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                {isEditing ? '编辑流水账目明细' : '记一笔流水账目'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                支持外币折算、丰富图标类别与自定义分类标签
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Transaction Type Tabs */}
        <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100/90 dark:bg-slate-800/90 rounded-2xl border border-slate-200/60 dark:border-slate-700 my-3.5">
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
            转账/划转
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
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Currency Click-to-Open Bar (点击展示币种) */}
          <div ref={currencyDropdownRef} className="relative">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                  <Globe2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 block">
                    记账币种 (点击选择切换)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {currency === 'CNY' ? '人民币基准本位币 (CNY)' : `当前选中: ${currentCurrencyInfo.name} (${currency})`}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isForeign && (
                  <button
                    type="button"
                    onClick={handleRefreshForex}
                    disabled={isRefreshingRates}
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-medium flex items-center gap-1 transition-colors px-2 py-1 bg-blue-50 dark:bg-blue-950/50 rounded-lg border border-blue-200/60 dark:border-blue-900/60"
                  >
                    <RefreshCw className={`w-3 h-3 ${isRefreshingRates ? 'animate-spin' : ''}`} />
                    <span>刷新汇率</span>
                  </button>
                )}

                {/* Clickable Currency Pill triggering Dropdown */}
                <button
                  type="button"
                  id="btn-trigger-currency-dropdown"
                  onClick={() => setIsCurrencyDropdownOpen((prev) => !prev)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 border shadow-2xs transition-all ${
                    isCurrencyDropdownOpen
                      ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-700 dark:border-slate-600'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:border-slate-400'
                  }`}
                >
                  <span className="text-sm">{currentCurrencyInfo.flag}</span>
                  <span className="font-mono">{currency}</span>
                  <span className="text-[11px] opacity-80">({currentCurrencyInfo.name})</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isCurrencyDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>

            {/* Click-to-Show Currency Dropdown Popover */}
            {isCurrencyDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-2 z-30 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-3 animate-in fade-in zoom-in-95 duration-150">
                {/* Search Bar inside popover */}
                <div className="relative mb-2.5">
                  <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={currencySearchQuery}
                    onChange={(e) => setCurrencySearchQuery(e.target.value)}
                    placeholder="搜索币种名称、代码 (如 USD, 日元, 港币)..."
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-slate-400"
                    autoFocus
                  />
                </div>

                {/* Popular / All Grid */}
                <div className="max-h-56 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-1.5 p-0.5">
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

                {/* Currency Footer tip */}
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

            {/* Rate feedback message */}
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

          {/* Foreign Currency Conversion & Exchange Rate Panel */}
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

              {/* Rate Customizer Input */}
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

              {/* Real-time Conversion Result Banner */}
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

          {/* Account Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                {type === 'INCOME'
                  ? '收款入账账户'
                  : type === 'TRANSFER' || type === 'REPAYMENT'
                  ? '转出/扣款付款账户'
                  : '支付/扣款账户'}
              </label>
              <select
                id="tx-select-account"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-slate-400 font-medium"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} (余额: ¥{acc.balance?.toFixed(2) || '0.00'})
                  </option>
                ))}
              </select>
            </div>

            {['TRANSFER', 'REPAYMENT', 'LEND_OUT', 'COLLECT_LENT', 'BORROW_IN', 'PAY_BORROW'].includes(
              type
            ) && (
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-slate-400 font-medium"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name}{' '}
                      {acc.usedCredit !== undefined
                        ? `(待还: ¥${acc.usedCredit.toFixed(2)})`
                        : `(余额: ¥${acc.balance?.toFixed(2) || '0.00'})`}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Category Selector with Icons & Custom Category Support (支持智能关键词匹配图标、自定义图标及删除) */}
          {type === 'EXPENSE' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <span>支出类别</span>
                  <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                    · 当前: <CategoryIcon nameOrIcon={category} className="w-3.5 h-3.5 inline" /> {category}
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingCustomCategory(!isAddingCustomCategory);
                    setShowIconPalette(false);
                  }}
                  className="text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 font-medium flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAddingCustomCategory ? '取消新建' : '自定义新类别'}</span>
                </button>
              </div>

              {/* Custom Category Input Form with Smart Keyword Icon Preview & Palette */}
              {isAddingCustomCategory && (
                <div className="p-3 rounded-2xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200/90 dark:border-rose-900/70 space-y-2.5 animate-in fade-in zoom-in-95 duration-150 shadow-xs">
                  <div className="flex items-center gap-2">
                    {/* Live Preview of Predicted/Selected Icon */}
                    <div
                      title="根据关键词智能匹配的图标（点击可手动更换）"
                      onClick={() => setShowIconPalette(!showIconPalette)}
                      className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 flex items-center justify-center flex-shrink-0 cursor-pointer shadow-2xs hover:scale-105 transition-transform"
                    >
                      <CategoryIcon nameOrIcon={predictedIcon} className="w-4 h-4" />
                    </div>

                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => {
                        setNewCategoryName(e.target.value);
                        // Reset manual override if cleared
                        if (!e.target.value) setSelectedCustomIcon('');
                      }}
                      placeholder="输入分类关键词 (如 宠物开销、母婴奶粉、咖啡、自驾加油、理发)..."
                      className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-rose-200 dark:border-rose-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-400"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomCategory();
                        }
                      }}
                    />

                    <button
                      type="button"
                      onClick={handleAddCustomCategory}
                      disabled={!newCategoryName.trim()}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-semibold shadow-2xs whitespace-nowrap"
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
                          ? `已自动匹配图标: ${predictedIcon}`
                          : '输入类别关键词即可自动智能识别图标'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowIconPalette(!showIconPalette)}
                      className="text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 font-medium"
                    >
                      <Palette className="w-3 h-3" />
                      <span>{showIconPalette ? '收起图标库' : '手动挑图标 🎨'}</span>
                    </button>
                  </div>

                  {/* Expandable Icon Selector Palette */}
                  {showIconPalette && (
                    <div className="pt-2 border-t border-rose-200/60 dark:border-rose-900/60 animate-in fade-in">
                      <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                        可选精选图标库:
                      </div>
                      <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5 max-h-32 overflow-y-auto p-1 bg-white/70 dark:bg-slate-900/60 rounded-xl border border-rose-100 dark:border-rose-900/40">
                        {POPULAR_CATEGORY_ICONS.map((item) => {
                          const IconComp = item.icon;
                          const isPicked = predictedIcon === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => setSelectedCustomIcon(item.id)}
                              className={`p-1.5 rounded-lg flex flex-col items-center gap-0.5 border text-center transition-all ${
                                isPicked
                                  ? 'bg-rose-600 text-white border-rose-600 shadow-2xs font-bold'
                                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                              }`}
                              title={item.name}
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

              {/* Expense Category Grid with Delete Buttons for Custom Categories */}
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-44 overflow-y-auto p-1 scrollbar-thin">
                {EXPENSE_CATEGORIES.map((c) => {
                  const isSelected = category === c.name;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCategory(c.name)}
                      className={`p-2 rounded-xl text-xs font-medium flex flex-col items-center gap-1.5 border transition-all ${
                        isSelected
                          ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-800 shadow-xs font-bold ring-1 ring-rose-400/40'
                          : 'bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200/60 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                          isSelected
                            ? 'bg-rose-600 text-white'
                            : 'bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <CategoryIcon nameOrIcon={c.icon || c.name} className="w-3.5 h-3.5" />
                      </div>
                      <span className="truncate w-full text-center text-[11px]">{c.name}</span>
                    </button>
                  );
                })}

                {/* Custom User Categories with Delete X Icon */}
                {customExpenseCategories.map((customCat) => {
                  const isSelected = category === customCat;
                  return (
                    <div
                      key={customCat}
                      className={`relative group p-2 rounded-xl text-xs font-medium flex flex-col items-center gap-1.5 border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-800 shadow-xs font-bold ring-1 ring-rose-400/40'
                          : 'bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200/60 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                      onClick={() => setCategory(customCat)}
                    >
                      {/* Delete Custom Category Button */}
                      <button
                        type="button"
                        onClick={(e) => handleDeleteCustomCategory(customCat, 'EXPENSE', e)}
                        title={`删除自定义类别「${customCat}」`}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 hover:bg-rose-700 text-white flex items-center justify-center shadow-xs transition-transform hover:scale-110 z-10"
                      >
                        <X className="w-3 h-3" />
                      </button>

                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                          isSelected
                            ? 'bg-rose-600 text-white'
                            : 'bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        <CategoryIcon nameOrIcon={customCat} className="w-3.5 h-3.5" />
                      </div>
                      <span className="truncate w-full text-center text-[11px]">{customCat}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Income Category Selector with Icons & Custom Support */}
          {type === 'INCOME' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <span>收入类别</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    · 当前: <CategoryIcon nameOrIcon={category} className="w-3.5 h-3.5 inline" /> {category}
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingCustomCategory(!isAddingCustomCategory);
                    setShowIconPalette(false);
                  }}
                  className="text-xs text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 font-medium flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAddingCustomCategory ? '取消新建' : '自定义新类别'}</span>
                </button>
              </div>

              {/* Custom Income Category Input Form with Smart Keyword Icon Preview & Palette */}
              {isAddingCustomCategory && (
                <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/90 dark:border-emerald-900/70 space-y-2.5 animate-in fade-in zoom-in-95 duration-150 shadow-xs">
                  <div className="flex items-center gap-2">
                    {/* Live Preview of Predicted/Selected Icon */}
                    <div
                      title="根据关键词智能匹配的图标（点击可手动更换）"
                      onClick={() => setShowIconPalette(!showIconPalette)}
                      className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center flex-shrink-0 cursor-pointer shadow-2xs hover:scale-105 transition-transform"
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
                      placeholder="输入收入分类关键词 (如 租金收益、咨询外快、理财分红、打赏)..."
                      className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomCategory();
                        }
                      }}
                    />

                    <button
                      type="button"
                      onClick={handleAddCustomCategory}
                      disabled={!newCategoryName.trim()}
                      className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-semibold shadow-2xs whitespace-nowrap"
                    >
                      添加并选中
                    </button>
                  </div>

                  {/* Smart Icon Feedback & Manual Palette Trigger */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1">
                    <div className="flex items-center gap-1.5">
                      <Wand2 className="w-3 h-3 text-emerald-600" />
                      <span>
                        {newCategoryName.trim()
                          ? `已自动匹配图标: ${predictedIcon}`
                          : '输入类别关键词即可自动智能识别图标'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowIconPalette(!showIconPalette)}
                      className="text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 font-medium"
                    >
                      <Palette className="w-3 h-3" />
                      <span>{showIconPalette ? '收起图标库' : '手动挑图标 🎨'}</span>
                    </button>
                  </div>

                  {/* Expandable Icon Selector Palette */}
                  {showIconPalette && (
                    <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-900/60 animate-in fade-in">
                      <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                        可选精选图标库:
                      </div>
                      <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5 max-h-32 overflow-y-auto p-1 bg-white/70 dark:bg-slate-900/60 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
                        {POPULAR_CATEGORY_ICONS.map((item) => {
                          const IconComp = item.icon;
                          const isPicked = predictedIcon === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => setSelectedCustomIcon(item.id)}
                              className={`p-1.5 rounded-lg flex flex-col items-center gap-0.5 border text-center transition-all ${
                                isPicked
                                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs font-bold'
                                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                              }`}
                              title={item.name}
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
              <div className="grid grid-cols-4 sm:grid-cols-4 gap-2 max-h-44 overflow-y-auto p-1 scrollbar-thin">
                {INCOME_CATEGORIES.map((c) => {
                  const isSelected = category === c.name;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCategory(c.name)}
                      className={`p-2 rounded-xl text-xs font-medium flex flex-col items-center gap-1.5 border transition-all ${
                        isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 shadow-xs font-bold ring-1 ring-emerald-400/40'
                          : 'bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200/60 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                          isSelected
                            ? 'bg-emerald-700 text-white'
                            : 'bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <CategoryIcon nameOrIcon={c.icon || c.name} className="w-3.5 h-3.5" />
                      </div>
                      <span className="truncate w-full text-center text-[11px]">{c.name}</span>
                    </button>
                  );
                })}

                {/* Custom Income Categories with Delete X Button */}
                {customIncomeCategories.map((customCat) => {
                  const isSelected = category === customCat;
                  return (
                    <div
                      key={customCat}
                      className={`relative group p-2 rounded-xl text-xs font-medium flex flex-col items-center gap-1.5 border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 shadow-xs font-bold ring-1 ring-emerald-400/40'
                          : 'bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200/60 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                      onClick={() => setCategory(customCat)}
                    >
                      {/* Delete Custom Income Category Button */}
                      <button
                        type="button"
                        onClick={(e) => handleDeleteCustomCategory(customCat, 'INCOME', e)}
                        title={`删除自定义类别「${customCat}」`}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 hover:bg-rose-700 text-white flex items-center justify-center shadow-xs transition-transform hover:scale-110 z-10"
                      >
                        <X className="w-3 h-3" />
                      </button>

                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                          isSelected
                            ? 'bg-emerald-700 text-white'
                            : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-400'
                        }`}
                      >
                        <CategoryIcon nameOrIcon={customCat} className="w-3.5 h-3.5" />
                      </div>
                      <span className="truncate w-full text-center text-[11px]">{customCat}</span>
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
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:bg-white dark:focus:bg-slate-800"
                />
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-24 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:bg-white dark:focus:bg-slate-800"
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

              {/* Tags Badges with Delete support for custom ones */}
              <div className="flex items-center gap-1.5 flex-wrap max-h-24 overflow-y-auto p-0.5">
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

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
              备注说明 / 商家对手方
            </label>
            <input
              id="tx-input-description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={isForeign ? `例如: 海外购物、Apple Store、Steam游戏、${currentCurrencyInfo.name}转账...` : "例如: 超市买菜、工作餐、房租转账..."}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:border-slate-400 focus:bg-white dark:focus:bg-slate-800"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              id="btn-submit-transaction"
              type="submit"
              className="w-full py-3.5 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all"
            >
              <Check className="w-4 h-4 text-emerald-400" />
              <span>
                {isForeign
                  ? `确认入账 (原币 ${currentCurrencyInfo.symbol}${parseFloat(amount) || 0} ➔ 折合 ¥${calculatedCnyAmount.toFixed(2)})`
                  : '确认记账并更新资产与额度'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
