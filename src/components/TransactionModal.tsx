import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Sparkles,
  Check,
  Globe2,
  RefreshCw,
  ArrowRightLeft,
  ChevronDown,
  Info,
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

interface TransactionModalProps {
  accounts: FinancialAccount[];
  initialType?: TransactionType;
  initialAccountId?: string;
  initialTransaction?: Transaction | null;
  onClose: () => void;
  onSubmit: (tx: Omit<Transaction, 'id' | 'createdAt'>, existingId?: string) => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  accounts,
  initialType = 'EXPENSE',
  initialAccountId,
  initialTransaction,
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

  // Amount inputs
  // If editing a foreign currency tx, initialTransaction.originalAmount might exist, otherwise use amount
  const initialAmountStr = initialTransaction
    ? (initialTransaction.currency && initialTransaction.currency !== 'CNY' && initialTransaction.originalAmount !== undefined
        ? initialTransaction.originalAmount.toString()
        : initialTransaction.amount.toString())
    : '';

  const [amount, setAmount] = useState<string>(initialAmountStr);
  const [date, setDate] = useState<string>(
    initialTransaction?.date || new Date().toISOString().split('T')[0]
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

  // Categories & Details
  const [category, setCategory] = useState<string>(
    initialTransaction?.category || '餐饮美食'
  );
  const [tag, setTag] = useState<string>(initialTransaction?.tag || '日常');
  const [description, setDescription] = useState<string>(
    initialTransaction?.description || ''
  );
  const [counterparty, setCounterparty] = useState<string>(
    initialTransaction?.counterparty || ''
  );
  const [merchant, setMerchant] = useState<string>(
    initialTransaction?.merchant || ''
  );

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
    if (newCur === 'CNY') {
      setCustomRate('');
    } else {
      const rate = forexRates.ratesToCny[newCur] || getCurrencyInfo(newCur).defaultRate;
      setCustomRate(rate.toString());
    }
  };

  // Update defaults when tab changes (only if creating fresh)
  useEffect(() => {
    if (!isEditing) {
      if (type === 'EXPENSE') {
        setCategory('餐饮美食');
      } else if (type === 'INCOME') {
        setCategory('工资薪酬');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-2xl my-auto">
        {/* Header with Close */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                {isEditing ? '编辑流水账目明细' : '记一笔流水账目'}
              </h2>
              <p className="text-xs text-slate-500">支持外币原币录入并按实时汇率折合人民币入账</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Transaction Type Tabs */}
        <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/60 my-4">
          <button
            type="button"
            onClick={() => setType('EXPENSE')}
            className={`py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              type === 'EXPENSE'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            支出
          </button>
          <button
            type="button"
            onClick={() => setType('INCOME')}
            className={`py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              type === 'INCOME'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            收入
          </button>
          <button
            type="button"
            onClick={() => setType('TRANSFER')}
            className={`py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              type === 'TRANSFER'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            转账/划转
          </button>
          <button
            type="button"
            onClick={() => setType('REPAYMENT')}
            className={`py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              type === 'REPAYMENT'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            还款
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Currency Selector Bar */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <Globe2 className="w-3.5 h-3.5 text-blue-600" />
                <span>选择记账币种 (外币自动折算汇率)</span>
              </div>
              {isForeign && (
                <button
                  type="button"
                  onClick={handleRefreshForex}
                  disabled={isRefreshingRates}
                  className="text-[11px] text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 transition-colors"
                >
                  <RefreshCw className={`w-3 h-3 ${isRefreshingRates ? 'animate-spin' : ''}`} />
                  <span>刷新今日汇率</span>
                </button>
              )}
            </div>

            {/* Currency Badges */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {SUPPORTED_CURRENCIES.slice(0, 8).map((cur) => (
                <button
                  key={cur.code}
                  type="button"
                  onClick={() => handleCurrencyChange(cur.code)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-medium shrink-0 flex items-center gap-1.5 transition-all ${
                    currency === cur.code
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>{cur.flag}</span>
                  <span className="font-semibold">{cur.code}</span>
                  <span className="text-[10px] opacity-80">{cur.name}</span>
                </button>
              ))}

              {/* More Currencies Dropdown */}
              <div className="relative shrink-0">
                <select
                  value={SUPPORTED_CURRENCIES.slice(8).some((c) => c.code === currency) ? currency : ''}
                  onChange={(e) => {
                    if (e.target.value) handleCurrencyChange(e.target.value);
                  }}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border appearance-none pr-6 cursor-pointer ${
                    SUPPORTED_CURRENCIES.slice(8).some((c) => c.code === currency)
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <option value="" disabled>更多币种 ▾</option>
                  {SUPPORTED_CURRENCIES.slice(8).map((cur) => (
                    <option key={cur.code} value={cur.code}>
                      {cur.flag} {cur.code} ({cur.name})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Rate feedback message */}
            {rateFeedback && (
              <div className="text-[11px] text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg animate-in fade-in">
                {rateFeedback}
              </div>
            )}
          </div>

          {/* Amount Big Input Box */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">
                {isForeign ? `${currentCurrencyInfo.name} (${currency}) 原币金额` : '交易金额 (元)'}
              </span>
              {isForeign && (
                <span className="text-xs text-slate-500 font-mono">
                  {currentCurrencyInfo.flag} {currency}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-400">
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
                className="w-full bg-transparent text-2xl sm:text-3xl font-extrabold text-slate-900 placeholder-slate-300 focus:outline-none font-mono"
              />
            </div>

            {/* Quick Increment Buttons */}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-200/60 overflow-x-auto no-scrollbar">
              {(currency === 'JPY' || currency === 'KRW'
                ? [1000, 5000, 10000, 50000, 100000]
                : [10, 50, 100, 500, 1000, 5000]
              ).map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickAddAmount(val)}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-mono font-medium transition-colors whitespace-nowrap shadow-2xs"
                >
                  +{val}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setAmount('')}
                className="px-2.5 py-1 rounded-lg bg-slate-200/60 hover:bg-slate-200 text-slate-600 text-xs transition-colors"
              >
                重置
              </button>
            </div>
          </div>

          {/* Foreign Currency Conversion & Exchange Rate Panel */}
          {isForeign && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-50/90 via-indigo-50/60 to-sky-50/70 border border-blue-200/80 space-y-3 shadow-xs">
              {/* Rate & Live status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-lg bg-blue-600 text-white shadow-2xs">
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                  </span>
                  <div>
                    <span className="text-xs font-bold text-blue-950 block">
                      当日参考汇率: 1 {currency} = {currentExchangeRate} CNY
                    </span>
                    <span className="text-[11px] text-blue-700">
                      来源: {forexRates.provider || '国际实时汇率'} ({forexRates.updatedAt})
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowRateCustomizer(!showRateCustomizer)}
                  className="text-xs font-medium text-blue-800 hover:text-blue-950 underline self-start sm:self-auto"
                >
                  {showRateCustomizer ? '收起微调' : '自定义/微调汇率 ✎'}
                </button>
              </div>

              {/* Rate Customizer Input */}
              {showRateCustomizer && (
                <div className="p-3 rounded-xl bg-white/90 border border-blue-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">
                      实记汇率 (例如信用卡结算实际汇率):
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const standardRate = forexRates.ratesToCny[currency] || currentCurrencyInfo.defaultRate;
                        setCustomRate(standardRate.toString());
                      }}
                      className="text-[11px] text-blue-600 hover:underline"
                    >
                      恢复今日基准 ({forexRates.ratesToCny[currency] || currentCurrencyInfo.defaultRate})
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-mono">1 {currency} =</span>
                    <input
                      type="number"
                      step="0.0001"
                      value={customRate}
                      onChange={(e) => setCustomRate(e.target.value)}
                      placeholder={currentCurrencyInfo.defaultRate.toString()}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-xs text-slate-500 font-mono">CNY</span>
                  </div>
                </div>
              )}

              {/* Real-time Conversion Result Banner */}
              <div className="p-3 rounded-xl bg-blue-100/70 border border-blue-200/90 flex items-center justify-between">
                <div>
                  <span className="text-xs text-blue-900 font-semibold block">
                    折合记账本位币 (人民币 CNY):
                  </span>
                  <span className="text-[11px] text-blue-700 font-mono">
                    {currentCurrencyInfo.symbol}{parseFloat(amount) || 0} × {currentExchangeRate}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-lg sm:text-xl font-extrabold text-blue-950 font-mono">
                    ¥ {calculatedCnyAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <span className="text-[10px] text-blue-700">将按此金额扣减账户余额与计入月支出</span>
                </div>
              </div>
            </div>
          )}

          {/* Account Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
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
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-slate-400 focus:bg-white font-medium"
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
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-slate-400 focus:bg-white font-medium"
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

          {/* Category Selector for Expense & Income */}
          {type === 'EXPENSE' && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                支出类别
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-36 overflow-y-auto p-1">
                {EXPENSE_CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategory(c.name)}
                    className={`p-2 rounded-xl text-xs font-medium flex flex-col items-center gap-1 border transition-all ${
                      category === c.name
                        ? 'bg-rose-50 text-rose-700 border-rose-200 shadow-xs font-bold'
                        : 'bg-slate-50 text-slate-600 border-slate-200/60 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {type === 'INCOME' && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                收入类别
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-4 gap-2">
                {INCOME_CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategory(c.name)}
                    className={`p-2 rounded-xl text-xs font-medium flex flex-col items-center gap-1 border transition-all ${
                      category === c.name
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-xs font-bold'
                        : 'bg-slate-50 text-slate-600 border-slate-200/60 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Date & Tag Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                记账日期与时间
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:bg-white"
                />
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-24 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                标签分类
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {['日常必要', '改善娱乐', '境外海淘', '旅游出行', '固定支出'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTag(t)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border ${
                      tag === t
                        ? 'bg-slate-800 text-white border-slate-800'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              备注说明 / 商家对手方
            </label>
            <input
              id="tx-input-description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={isForeign ? `例如: 海外购物、Apple Store、Steam游戏、${currentCurrencyInfo.name}转账...` : "例如: 超市买菜、工作餐、房租转账..."}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-slate-400 focus:bg-white"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              id="btn-submit-transaction"
              type="submit"
              className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all"
            >
              <Check className="w-4 h-4" />
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

