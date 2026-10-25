import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  X,
  Plus,
  CalendarClock,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  Trash2,
  Edit2,
  Calendar,
  Sparkles,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Wallet,
  Building2,
  Tag as TagIcon,
  HelpCircle,
  Globe2,
  ArrowRightLeft,
  ChevronDown,
  Check,
  Search,
} from 'lucide-react';
import {
  RecurringTask,
  RecurringFrequency,
  FinancialAccount,
  LedgerProject,
  TransactionType,
  UserProfile,
} from '../types';
import { formatCurrency } from '../lib/formatters';
import { calculateNextDueDate } from '../lib/storage';
import {
  SUPPORTED_CURRENCIES,
  CurrencyItem,
  fetchLiveForexRates,
  getCachedForexRates,
  getCurrencyInfo,
  ForexRatesResponse,
} from '../lib/forexRates';

interface RecurringTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: RecurringTask[];
  accounts: FinancialAccount[];
  projects?: LedgerProject[];
  currentUser: UserProfile;
  privacyMode?: boolean;
  onSaveTask: (task: RecurringTask) => void;
  onDeleteTask: (taskId: string) => void;
  onExecuteTask: (taskId: string) => void;
  onExecuteAllDue: () => void;
  onCleanDuplicates?: () => void;
}

export const RecurringTasksModal: React.FC<RecurringTasksModalProps> = ({
  isOpen,
  onClose,
  tasks,
  accounts,
  projects = [],
  currentUser,
  privacyMode = false,
  onSaveTask,
  onDeleteTask,
  onExecuteTask,
  onExecuteAllDue,
  onCleanDuplicates,
}) => {
  const [filterType, setFilterType] = useState<'ALL' | 'EXPENSE' | 'INCOME'>('ALL');
  const [editingTask, setEditingTask] = useState<RecurringTask | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Form State
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<TransactionType>('EXPENSE');
  const [formAmount, setFormAmount] = useState('');
  const [formCurrency, setFormCurrency] = useState<string>('CNY');
  const [formCustomRate, setFormCustomRate] = useState<string>('');
  const [showRateCustomizer, setShowRateCustomizer] = useState<boolean>(false);
  const [forexRates, setForexRates] = useState<ForexRatesResponse>(() => getCachedForexRates());
  const [isRefreshingRates, setIsRefreshingRates] = useState<boolean>(false);
  const [rateFeedback, setRateFeedback] = useState<string>('');
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState<boolean>(false);
  const [currencySearchQuery, setCurrencySearchQuery] = useState<string>('');
  const currencyDropdownRef = useRef<HTMLDivElement>(null);

  const [formFrequency, setFormFrequency] = useState<RecurringFrequency>('MONTHLY');
  const [formDayOfMonth, setFormDayOfMonth] = useState<number>(1);
  const [formAccountId, setFormAccountId] = useState(accounts[0]?.id || '');
  const [formCategory, setFormCategory] = useState('房租物业');
  const [formTag, setFormTag] = useState('固定支出');
  const [formDescription, setFormDescription] = useState('');
  const [formMerchant, setFormMerchant] = useState('');
  const [formProjectId, setFormProjectId] = useState('');
  const [formAutoExecute, setFormAutoExecute] = useState(true);
  const [formEnabled, setFormEnabled] = useState(true);

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

  // Close currency dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (currencyDropdownRef.current && !currencyDropdownRef.current.contains(e.target as Node)) {
        setIsCurrencyDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentCurrencyInfo: CurrencyItem = useMemo(() => {
    return getCurrencyInfo(formCurrency);
  }, [formCurrency]);

  const currentExchangeRate: number = useMemo(() => {
    if (formCurrency === 'CNY') return 1.0;
    const parsedCustom = parseFloat(formCustomRate);
    if (!isNaN(parsedCustom) && parsedCustom > 0) {
      return parsedCustom;
    }
    return forexRates.ratesToCny[formCurrency] || currentCurrencyInfo.defaultRate || 1.0;
  }, [formCurrency, formCustomRate, forexRates, currentCurrencyInfo]);

  const isForeign = formCurrency !== 'CNY';

  const calculatedCnyAmount = useMemo(() => {
    const rawVal = parseFloat(formAmount);
    if (isNaN(rawVal) || rawVal <= 0) return 0;
    if (formCurrency === 'CNY') return rawVal;
    return Number((rawVal * currentExchangeRate).toFixed(2));
  }, [formAmount, formCurrency, currentExchangeRate]);

  const filteredCurrencies = useMemo(() => {
    if (!currencySearchQuery.trim()) return SUPPORTED_CURRENCIES;
    const q = currencySearchQuery.toLowerCase().trim();
    return SUPPORTED_CURRENCIES.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.symbol.toLowerCase().includes(q)
    );
  }, [currencySearchQuery]);

  const handleRefreshForex = async () => {
    setIsRefreshingRates(true);
    try {
      const data = await fetchLiveForexRates(true);
      setForexRates(data);
      if (data.ratesToCny[formCurrency]) {
        setFormCustomRate(data.ratesToCny[formCurrency].toString());
      }
      setRateFeedback(`✨ 已获取最新汇率: 1 ${formCurrency} = ${data.ratesToCny[formCurrency] || currentCurrencyInfo.defaultRate} CNY`);
      setTimeout(() => setRateFeedback(''), 3500);
    } catch {
      setRateFeedback('刷新汇率失败，已使用基准缓存汇率');
      setTimeout(() => setRateFeedback(''), 3500);
    } finally {
      setIsRefreshingRates(false);
    }
  };

  const handleCurrencyChange = (newCur: string) => {
    setFormCurrency(newCur);
    setIsCurrencyDropdownOpen(false);
    setCurrencySearchQuery('');
    if (newCur === 'CNY') {
      setFormCustomRate('');
      setShowRateCustomizer(false);
    } else {
      const standardRate = forexRates.ratesToCny[newCur] || getCurrencyInfo(newCur).defaultRate;
      setFormCustomRate(standardRate.toString());
    }
  };

  const handleQuickAddAmount = (addVal: number) => {
    const current = parseFloat(formAmount) || 0;
    const nextVal = (current + addVal).toFixed(2);
    setFormAmount(nextVal.replace(/\.00$/, ''));
  };

  if (!isOpen) return null;

  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (filterType === 'ALL') return true;
      return t.type === filterType;
    });
  }, [tasks, filterType]);

  // Statistics
  const { monthlyExpense, monthlyIncome, dueCount } = useMemo(() => {
    let exp = 0;
    let inc = 0;
    let due = 0;

    tasks.forEach((t) => {
      if (!t.enabled) return;
      // Convert to estimated monthly amount
      let mult = 1;
      if (t.frequency === 'DAILY') mult = 30;
      else if (t.frequency === 'WEEKLY') mult = 4.33;
      else if (t.frequency === 'MONTHLY') mult = 1;
      else if (t.frequency === 'YEARLY') mult = 1 / 12;

      const amt = (t.amount || 0) * mult;
      if (t.type === 'EXPENSE') exp += amt;
      else if (t.type === 'INCOME') inc += amt;

      if (t.nextDueDate <= todayStr) {
        due += 1;
      }
    });

    return { monthlyExpense: exp, monthlyIncome: inc, dueCount: due };
  }, [tasks, todayStr]);

  const startEdit = (t: RecurringTask) => {
    setEditingTask(t);
    setIsCreatingNew(true);
    setFormName(t.name);
    setFormType(t.type);
    const taskCur = t.currency || 'CNY';
    setFormCurrency(taskCur);
    if (taskCur !== 'CNY' && t.originalAmount !== undefined && t.originalAmount > 0) {
      setFormAmount(t.originalAmount.toString());
    } else {
      setFormAmount(t.amount.toString());
    }
    setFormCustomRate(t.exchangeRate ? t.exchangeRate.toString() : '');
    setShowRateCustomizer(false);
    setFormFrequency(t.frequency);
    const inferredDay = t.dayOfMonth || (t.nextDueDate ? parseInt(t.nextDueDate.split('-')[2], 10) : 1);
    setFormDayOfMonth(inferredDay || 1);
    setFormAccountId(t.accountId);
    setFormCategory(t.category);
    setFormTag(t.tag || '固定支出');
    setFormDescription(t.description || '');
    setFormMerchant(t.merchant || '');
    setFormProjectId(t.projectId || '');
    setFormAutoExecute(t.autoExecute);
    setFormEnabled(t.enabled);
  };

  const previewNextDueDate = useMemo(() => {
    const dummyTask: Partial<RecurringTask> = {
      frequency: formFrequency,
      dayOfMonth: formDayOfMonth,
      lastExecutedDate: editingTask?.lastExecutedDate,
    };
    return calculateNextDueDate(dummyTask as RecurringTask);
  }, [formFrequency, formDayOfMonth, editingTask?.lastExecutedDate]);

  const startCreate = () => {
    setEditingTask(null);
    setIsCreatingNew(true);
    setFormName('');
    setFormType('EXPENSE');
    setFormAmount('');
    setFormCurrency('CNY');
    setFormCustomRate('');
    setShowRateCustomizer(false);
    setFormFrequency('MONTHLY');
    setFormDayOfMonth(1);
    setFormAccountId(accounts[0]?.id || '');
    setFormCategory('房租物业');
    setFormTag('固定支出');
    setFormDescription('');
    setFormMerchant('');
    setFormProjectId('');
    setFormAutoExecute(true);
    setFormEnabled(true);
  };

  const cancelEdit = () => {
    setIsCreatingNew(false);
    setEditingTask(null);
    setIsCurrencyDropdownOpen(false);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rawAmt = parseFloat(formAmount);
    if (isNaN(rawAmt) || rawAmt <= 0 || !formName.trim()) return;

    const isCurForeign = formCurrency !== 'CNY';
    const effectiveRate = currentExchangeRate;
    const finalBaseRmbAmount = isCurForeign
      ? Number((rawAmt * effectiveRate).toFixed(2))
      : rawAmt;

    const baseTask: Partial<RecurringTask> = {
      name: formName.trim(),
      type: formType,
      amount: finalBaseRmbAmount,
      originalAmount: isCurForeign ? rawAmt : undefined,
      currency: formCurrency,
      exchangeRate: isCurForeign ? effectiveRate : undefined,
      frequency: formFrequency,
      dayOfMonth: formFrequency === 'MONTHLY' ? formDayOfMonth : undefined,
      accountId: formAccountId,
      category: formCategory,
      tag: formTag,
      description: formDescription.trim(),
      merchant: formMerchant.trim(),
      projectId: formProjectId || undefined,
      autoExecute: formAutoExecute,
      enabled: formEnabled,
    };

    if (editingTask) {
      const mergedTask: RecurringTask = {
        ...editingTask,
        ...baseTask,
        updatedAt: new Date().toISOString(),
      } as RecurringTask;

      // 实时根据修改后的每月执行日/频率重新计算下次预计执行日期，确保修改即刻生效
      mergedTask.nextDueDate = calculateNextDueDate(mergedTask);

      onSaveTask(mergedTask);
    } else {
      const newTask: RecurringTask = {
        id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: currentUser.id,
        ...baseTask,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as RecurringTask;
      newTask.nextDueDate = calculateNextDueDate(newTask);
      onSaveTask(newTask);
    }

    cancelEdit();
  };

  const frequencyLabel = (f: RecurringFrequency, day?: number) => {
    if (f === 'DAILY') return '每天扣费';
    if (f === 'WEEKLY') return '每周扣费';
    if (f === 'MONTHLY') return `每月 ${day || 1} 日`;
    if (f === 'YEARLY') return '每年扣费';
    return f;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20 shadow-2xs">
              <CalendarClock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  周期性记账与固定账单
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  {tasks.length} 项规则
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                自动化管理每月房租、宽带、流媒体订阅、车贷与月薪，告别重复手工录入
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isCreatingNew && onCleanDuplicates && (
              <button
                type="button"
                onClick={onCleanDuplicates}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700 active:scale-95 transition-all"
                title="智能排查并清除因重复添加导致的重复历史流水，并原路恢复账户余额"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>清理重复账单</span>
              </button>
            )}
            {!isCreatingNew && (
              <button
                onClick={startCreate}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>新建周期任务</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40">
              <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 text-xs font-semibold">
                <span>预估月固定支出</span>
                <ArrowDownLeft className="w-4 h-4" />
              </div>
              <div className="mt-2 text-lg sm:text-xl font-bold font-mono text-rose-700 dark:text-rose-300">
                {formatCurrency(monthlyExpense, privacyMode)}
              </div>
              <div className="mt-1 text-[11px] text-rose-500/80">包含房租、按月订阅及定期缴费</div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40">
              <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                <span>预估月固定收入</span>
                <ArrowUpRight className="w-4 h-4" />
              </div>
              <div className="mt-2 text-lg sm:text-xl font-bold font-mono text-emerald-700 dark:text-emerald-300">
                {formatCurrency(monthlyIncome, privacyMode)}
              </div>
              <div className="mt-1 text-[11px] text-emerald-500/80">固定工资薪资与周期入账</div>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900/40 flex flex-col justify-between">
              <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400 text-xs font-semibold">
                <span>到期待执行入账</span>
                <Clock className="w-4 h-4" />
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-lg sm:text-xl font-bold font-mono text-indigo-700 dark:text-indigo-300">
                  {dueCount} <span className="text-xs font-normal">笔到期</span>
                </span>
                {dueCount > 0 && (
                  <button
                    onClick={onExecuteAllDue}
                    className="px-2.5 py-1 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-2xs active:scale-95 transition-all"
                  >
                    一键全部入账
                  </button>
                )}
              </div>
              <div className="text-[11px] text-indigo-500/80">到期任务可一键直入流水账本</div>
            </div>
          </div>

          {/* Create / Edit Form Drawer */}
          {isCreatingNew && (
            <form
              onSubmit={handleFormSubmit}
              className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-indigo-200 dark:border-indigo-800/60 space-y-4 animate-in fade-in duration-200"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  <span>{editingTask ? '编辑周期任务' : '新建周期固定账单'}</span>
                </h3>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  取消
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                {/* Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    任务名称 / 账单说明 *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="如：每月房租、iCloud订阅、月薪发放、宽带缴费"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    账单性质 *
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setFormType('EXPENSE')}
                      className={`py-1 text-xs font-bold rounded-lg transition-colors ${
                        formType === 'EXPENSE'
                          ? 'bg-rose-500 text-white'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      支出扣款
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormType('INCOME')}
                      className={`py-1 text-xs font-bold rounded-lg transition-colors ${
                        formType === 'INCOME'
                          ? 'bg-emerald-500 text-white'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      收入到账
                    </button>
                  </div>
                </div>

                {/* 3. Currency Selector Bar (Full Width across columns) */}
                <div className="sm:col-span-2 md:col-span-3 relative" ref={currencyDropdownRef}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Globe2 className="w-3.5 h-3.5 text-blue-500" />
                      <span>账单币种与外汇实时汇率</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleRefreshForex}
                      disabled={isRefreshingRates}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium disabled:opacity-50"
                      title="从国际汇率公网拉取最新实时汇率"
                    >
                      <RefreshCw className={`w-3 h-3 ${isRefreshingRates ? 'animate-spin' : ''}`} />
                      <span>{isRefreshingRates ? '更新中...' : '刷新汇率'}</span>
                    </button>
                  </div>

                  {/* Currency Pill Trigger Button */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsCurrencyDropdownOpen(!isCurrencyDropdownOpen)}
                      className={`flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl transition-all flex-1 text-left group border shadow-2xs ${
                        isForeign
                          ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 hover:border-blue-500'
                          : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 hover:border-blue-400'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{currentCurrencyInfo.flag}</span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                              {formCurrency}
                            </span>
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                              {currentCurrencyInfo.name} ({currentCurrencyInfo.symbol})
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {isForeign ? '外币周期账单，到期将自动按设定汇率折算人民币入账' : '国内法定本位币，直接以此金额记账与扣款'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {isForeign && (
                          <span className="font-mono text-blue-700 dark:text-blue-300 font-bold bg-blue-100/90 dark:bg-blue-900/60 px-2 py-0.5 rounded-lg border border-blue-200 dark:border-blue-800">
                            1 {formCurrency} ≈ {currentExchangeRate} CNY
                          </span>
                        )}
                        <span className="text-xs text-blue-600 dark:text-blue-400 group-hover:underline font-semibold flex items-center gap-0.5">
                          <span>选择币种</span>
                          <ChevronDown className="w-4 h-4 opacity-75" />
                        </span>
                      </div>
                    </button>

                    {/* Fast CNY reset button */}
                    {isForeign && (
                      <button
                        type="button"
                        onClick={() => handleCurrencyChange('CNY')}
                        className="px-3 py-2.5 rounded-xl bg-slate-200/80 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors shrink-0 shadow-2xs"
                        title="快速切换回人民币计价"
                      >
                        切回 人民币 (CNY)
                      </button>
                    )}
                  </div>

                  {/* Currency Dropdown Menu */}
                  {isCurrencyDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-2 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={currencySearchQuery}
                          onChange={(e) => setCurrencySearchQuery(e.target.value)}
                          placeholder="搜索币种代码/名称 (如 USD, EUR, 日元, 港币, 英镑)..."
                          className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                      </div>

                      <div className="max-h-56 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-1.5 p-0.5 modal-custom-scrollbar">
                        {filteredCurrencies.map((cur) => {
                          const isSelected = formCurrency === cur.code;
                          const liveRate = forexRates.ratesToCny[cur.code] || cur.defaultRate;
                          return (
                            <button
                              key={cur.code}
                              type="button"
                              onClick={() => handleCurrencyChange(cur.code)}
                              className={`p-2.5 rounded-xl text-left border flex items-center justify-between transition-all ${
                                isSelected
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs font-semibold'
                                  : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200/70 dark:border-slate-700/60 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                              }`}
                            >
                              <div className="min-w-0 flex items-center gap-2">
                                <span className="text-xl shrink-0">{cur.flag}</span>
                                <div className="min-w-0">
                                  <div className="font-bold text-xs font-mono truncate">{cur.code}</div>
                                  <div className={`text-[10px] truncate ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                                    {cur.name} ({cur.symbol})
                                  </div>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                {cur.code !== 'CNY' && (
                                  <span className={`text-[10px] font-mono block ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                                    ≈{liveRate}
                                  </span>
                                )}
                                {isSelected && <Check className="w-3.5 h-3.5 text-white ml-auto mt-0.5" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 px-1">
                        <span>支持全球 15+ 常用货币实时汇率自动换算</span>
                        <button
                          type="button"
                          onClick={() => setIsCurrencyDropdownOpen(false)}
                          className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
                        >
                          关闭
                        </button>
                      </div>
                    </div>
                  )}

                  {rateFeedback && (
                    <div className="text-[11px] text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-3 py-1.5 rounded-xl mt-1.5 border border-blue-100 dark:border-blue-900/60">
                      {rateFeedback}
                    </div>
                  )}
                </div>

                {/* 4. Amount Big Input Box (Full Width across columns) */}
                <div className="sm:col-span-2 md:col-span-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-2xs">
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                    <label htmlFor="rec-input-amount" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <span>{isForeign ? `${currentCurrencyInfo.name} (${formCurrency}) 外币每期金额 *` : '每期金额 (元) *'}</span>
                    </label>
                    {isForeign && (
                      <span className="text-xs text-blue-600 dark:text-blue-400 font-mono font-bold bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                        {currentCurrencyInfo.flag} {formCurrency} ({currentCurrencyInfo.symbol})
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-2xl sm:text-3xl font-extrabold text-slate-400 dark:text-slate-500 font-mono">
                      {currentCurrencyInfo.symbol}
                    </span>
                    <input
                      id="rec-input-amount"
                      type="number"
                      step="0.01"
                      required
                      min="0.01"
                      value={formAmount}
                      onChange={(e) => setFormAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-transparent text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-slate-600 focus:outline-none font-mono"
                    />
                  </div>

                  {/* Quick Increment Buttons */}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 overflow-x-auto no-scrollbar">
                    {(formCurrency === 'JPY' || formCurrency === 'KRW'
                      ? [1000, 5000, 10000, 50000, 100000]
                      : [5, 10, 50, 100, 500, 1000]
                    ).map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handleQuickAddAmount(val)}
                        className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-mono font-medium transition-colors whitespace-nowrap shadow-2xs"
                      >
                        +{val}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setFormAmount('')}
                      className="px-2.5 py-1 rounded-lg bg-slate-200/70 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 text-xs transition-colors"
                    >
                      重置
                    </button>
                  </div>
                </div>

                {/* 5. Foreign Currency Conversion Panel for Recurring Task */}
                {isForeign && (
                  <div className="sm:col-span-2 md:col-span-3 p-4 rounded-2xl bg-gradient-to-br from-blue-50/90 via-indigo-50/60 to-sky-50/70 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-sky-950/30 border border-blue-200/80 dark:border-blue-800/60 space-y-3 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="p-1 rounded-lg bg-blue-600 text-white shadow-2xs">
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                        </span>
                        <div>
                          <span className="text-xs font-bold text-blue-950 dark:text-blue-200 block">
                            当日参考汇率: 1 {formCurrency} = {currentExchangeRate} CNY
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
                            实记汇率 (如外币信用卡扣费结算汇率):
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const standardRate = forexRates.ratesToCny[formCurrency] || currentCurrencyInfo.defaultRate;
                              setFormCustomRate(standardRate.toString());
                            }}
                            className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            恢复今日基准 ({forexRates.ratesToCny[formCurrency] || currentCurrencyInfo.defaultRate})
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">1 {formCurrency} =</span>
                          <input
                            type="number"
                            step="0.0001"
                            value={formCustomRate}
                            onChange={(e) => setFormCustomRate(e.target.value)}
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
                          {currentCurrencyInfo.symbol}{parseFloat(formAmount) || 0} × {currentExchangeRate}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-base sm:text-lg font-black text-blue-950 dark:text-blue-200 font-mono">
                          ¥ {calculatedCnyAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <span className="text-[10px] text-blue-700 dark:text-blue-400">到期入账时以此金额更新资产并生成外汇记账凭证</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Frequency */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    周期频率 *
                  </label>
                  <select
                    value={formFrequency}
                    onChange={(e) => setFormFrequency(e.target.value as RecurringFrequency)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  >
                    <option value="MONTHLY">每月一次 (Monthly)</option>
                    <option value="WEEKLY">每周一次 (Weekly)</option>
                    <option value="DAILY">每天一次 (Daily)</option>
                    <option value="YEARLY">每年一次 (Yearly)</option>
                  </select>
                </div>

                {/* Day of Month */}
                {formFrequency === 'MONTHLY' && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        每月执行日
                      </label>
                      <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1">
                        <CalendarClock className="w-3 h-3" />
                        <span>预计下次：{previewNextDueDate}</span>
                      </span>
                    </div>
                    <select
                      value={formDayOfMonth}
                      onChange={(e) => setFormDayOfMonth(parseInt(e.target.value, 10))}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                    >
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                        <option key={day} value={day}>
                          每月 {day} 日
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Account */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    扣款 / 入账账户 *
                  </label>
                  <select
                    value={formAccountId}
                    onChange={(e) => setFormAccountId(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({formatCurrency(acc.balance, privacyMode)})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    账单分类
                  </label>
                  <input
                    type="text"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="如：房租物业、网络通信、餐饮美食"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  />
                </div>

                {/* Merchant */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    交易对手 / 商户
                  </label>
                  <input
                    type="text"
                    value={formMerchant}
                    onChange={(e) => setFormMerchant(e.target.value)}
                    placeholder="如：Apple Inc、房东、公司名称"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  />
                </div>

                {/* Project */}
                {projects.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      关联账本项目 (可选)
                    </label>
                    <select
                      value={formProjectId}
                      onChange={(e) => setFormProjectId(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                    >
                      <option value="">不关联任何项目</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Switches */}
              <div className="flex flex-wrap items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={formAutoExecute}
                    onChange={(e) => setFormAutoExecute(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>到期自动记入流水 (开启后系统进入时自动生成交易)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={formEnabled}
                    onChange={(e) => setFormEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>启用此任务规则</span>
                </label>
              </div>

              {/* Form buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs active:scale-95 transition-all"
                >
                  保存规则
                </button>
              </div>
            </form>
          )}

          {/* Filter Tab & List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <button
                  onClick={() => setFilterType('ALL')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    filterType === 'ALL'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  全部规则 ({tasks.length})
                </button>
                <button
                  onClick={() => setFilterType('EXPENSE')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    filterType === 'EXPENSE'
                      ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  固定支出
                </button>
                <button
                  onClick={() => setFilterType('INCOME')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    filterType === 'INCOME'
                      ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  固定收入
                </button>
              </div>

              <span className="text-xs text-slate-400">
                按下次执行日期排序
              </span>
            </div>

            {/* Tasks Cards */}
            {filteredTasks.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                <CalendarClock className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 font-medium">
                  暂无周期记账任务
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  点击上方「新建周期任务」设定定期房租、软件订阅或月薪
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredTasks.map((t) => {
                  const acc = accounts.find((a) => a.id === t.accountId);
                  const isDue = t.enabled && t.nextDueDate <= todayStr;
                  const isExpense = t.type === 'EXPENSE';

                  return (
                    <div
                      key={t.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                        !t.enabled
                          ? 'bg-slate-50/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'
                          : isDue
                          ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700/60 shadow-xs'
                          : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs'
                      }`}
                    >
                      <div>
                        {/* Top row */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-lg text-[11px] font-bold ${
                                isExpense
                                  ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400'
                                  : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400'
                              }`}
                            >
                              {isExpense ? '支出' : '收入'}
                            </span>
                            <span className="font-bold text-sm text-slate-900 dark:text-white truncate max-w-[180px]">
                              {t.name}
                            </span>
                            {t.currency && t.currency !== 'CNY' && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800">
                                {getCurrencyInfo(t.currency).flag} {t.currency}
                              </span>
                            )}
                          </div>

                          <div className="text-right">
                            {t.currency && t.currency !== 'CNY' ? (
                              <div>
                                <div
                                  className={`text-base font-bold font-mono ${
                                    isExpense
                                      ? 'text-rose-600 dark:text-rose-400'
                                      : 'text-emerald-600 dark:text-emerald-400'
                                  }`}
                                >
                                  {isExpense ? '-' : '+'}
                                  {getCurrencyInfo(t.currency).symbol}
                                  {t.originalAmount !== undefined
                                    ? t.originalAmount.toFixed(2)
                                    : (t.amount / (t.exchangeRate || 1)).toFixed(2)}
                                </div>
                                <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                                  折合 {formatCurrency(t.amount, privacyMode)}
                                </div>
                              </div>
                            ) : (
                              <div
                                className={`text-base font-bold font-mono ${
                                  isExpense
                                    ? 'text-rose-600 dark:text-rose-400'
                                    : 'text-emerald-600 dark:text-emerald-400'
                                }`}
                              >
                                {isExpense ? '-' : '+'}
                                {formatCurrency(t.amount, privacyMode)}
                              </div>
                            )}
                            <span className="text-[10px] text-slate-400">
                              {frequencyLabel(t.frequency, t.dayOfMonth)}
                            </span>
                          </div>
                        </div>

                        {/* Middle metadata */}
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-[11px]">
                            <Wallet className="w-3 h-3 text-slate-400" />
                            <span>{acc?.name || '未知账户'}</span>
                          </span>
                          <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-[11px]">
                            {t.category}
                          </span>
                          {t.merchant && (
                            <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-[11px] text-slate-600 dark:text-slate-300">
                              {t.merchant}
                            </span>
                          )}
                        </div>

                        {/* Next Due Alert */}
                        <div className="mt-3 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-slate-500 dark:text-slate-400">下次预计：</span>
                            <span
                              className={`font-mono font-semibold ${
                                isDue
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : 'text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {t.nextDueDate}
                            </span>
                            {isDue && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-500 text-white font-bold animate-pulse">
                                今日到期
                              </span>
                            )}
                          </div>

                          <span className="text-[11px] text-slate-400">
                            {t.autoExecute ? '⚡ 自动入账' : '🔔 仅提醒'}
                          </span>
                        </div>
                      </div>

                      {/* Bottom Actions */}
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => startEdit(t)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="编辑任务"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteTask(t.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="删除任务"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          onClick={() => onExecuteTask(t.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                            isDue
                              ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs'
                              : 'bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                          }`}
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>立即入账一笔</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>周期账单入账将自动更新关联资产账户余额并生成独立记账凭证</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-700 text-white font-semibold hover:bg-slate-800 transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};
