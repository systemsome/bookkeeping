import React, { useState, useMemo } from 'react';
import {
  Search,
  ArrowUpRight,
  ArrowDownRight,
  RotateCw,
  ReceiptText,
  Receipt,
  Sparkles,
  Trash2,
  Pencil,
  Globe2,
  UploadCloud,
  Download,
  FileSpreadsheet,
  PlusCircle,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  TrendingDown,
  TrendingUp,
  Wallet,
  CalendarDays,
  Clock,
  Tag,
  Filter,
  X,
  Plus,
  Layers,
  ArrowUpDown,
} from 'lucide-react';
import { Transaction, FinancialAccount, TransactionType } from '../types';
import {
  formatCurrency,
  formatDate,
  getWeekdayName,
  formatDateWithWeekday,
  sortTransactions,
} from '../lib/formatters';
import { getCurrencyInfo } from '../lib/forexRates';
import { TransactionImportModal } from './TransactionImportModal';
import { TransactionExportModal } from './TransactionExportModal';
import { ReceiptModal } from './ReceiptModal';
import { downloadTransactionTemplate } from '../lib/transactionImportExport';
import { CategoryIcon } from './CategoryIcon';

interface TransactionLedgerProps {
  transactions: Transaction[];
  accounts: FinancialAccount[];
  privacyMode: boolean;
  onDeleteTransaction: (txId: string) => void;
  onEditTransaction: (tx: Transaction) => void;
  onOpenNewTx: (type?: string, accountId?: string, defaultDate?: string) => void;
  onImportTransactions: (
    importedList: Transaction[],
    syncAccountBalances: boolean
  ) => void;
  onShowToast: (msg: string) => void;
}

export const TransactionLedger: React.FC<TransactionLedgerProps> = ({
  transactions,
  accounts,
  privacyMode,
  onDeleteTransaction,
  onEditTransaction,
  onOpenNewTx,
  onImportTransactions,
  onShowToast,
}) => {
  // Today helpers
  const today = useMemo(() => {
    const d = new Date();
    return {
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      date: d.getDate(),
      dateStr: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`,
      yearMonthStr: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
    };
  }, []);

  // Calendar State: active viewing month
  const [calendarYearMonth, setCalendarYearMonth] = useState<string>(() => today.yearMonthStr);
  // Selected date filter (null means viewing all transactions or filtered month)
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(null);
  // Whether calendar is expanded or minimized (隐藏式，点击打开和关闭)
  const [isCalendarExpanded, setIsCalendarExpanded] = useState<boolean>(false);

  // List View filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Modals for Upload, Export & Receipt
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptSingleTxId, setReceiptSingleTxId] = useState<string | null>(null);

  // Account map for quick lookup
  const accountMap = useMemo(() => {
    const map = new Map<string, FinancialAccount>();
    accounts.forEach((a) => map.set(a.id, a));
    return map;
  }, [accounts]);

  // Extract unique months for month selectors
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => {
      if (t.date && t.date.length >= 7) {
        set.add(t.date.substring(0, 7));
      }
    });
    set.add(today.yearMonthStr);
    return Array.from(set).sort().reverse();
  }, [transactions, today.yearMonthStr]);

  // Extract unique currencies
  const currenciesPresent = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => {
      if (t.currency) set.add(t.currency);
    });
    return Array.from(set);
  }, [transactions]);

  // Always sorted transactions (strictly by Date YYYY-MM-DD desc, Time HH:mm desc)
  const sortedTransactions = useMemo(() => {
    return sortTransactions(transactions, sortOrder);
  }, [transactions, sortOrder]);

  // -------------------------------------------------------------
  // CALENDAR AGGREGATION & DATA (Compact / Scaled-down)
  // -------------------------------------------------------------
  const { currentYear, currentMonth } = useMemo(() => {
    const parts = calendarYearMonth.split('-').map(Number);
    return {
      currentYear: parts[0] || today.year,
      currentMonth: parts[1] || today.month,
    };
  }, [calendarYearMonth, today]);

  const handlePrevMonth = () => {
    let y = currentYear;
    let m = currentMonth - 1;
    if (m < 1) {
      m = 12;
      y -= 1;
    }
    const newYm = `${y}-${String(m).padStart(2, '0')}`;
    setCalendarYearMonth(newYm);
  };

  const handleNextMonth = () => {
    let y = currentYear;
    let m = currentMonth + 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
    const newYm = `${y}-${String(m).padStart(2, '0')}`;
    setCalendarYearMonth(newYm);
  };

  const handleGoToToday = () => {
    setCalendarYearMonth(today.yearMonthStr);
    setSelectedDateFilter(today.dateStr);
  };

  // Group transactions by date for calendar calculation
  const dailySummaryMap = useMemo(() => {
    const map = new Map<
      string,
      {
        expense: number;
        income: number;
        transfer: number;
        repayment: number;
        totalCount: number;
      }
    >();

    transactions.forEach((tx) => {
      if (!tx.date) return;
      let entry = map.get(tx.date);
      if (!entry) {
        entry = { expense: 0, income: 0, transfer: 0, repayment: 0, totalCount: 0 };
        map.set(tx.date, entry);
      }
      entry.totalCount += 1;
      if (tx.type === 'EXPENSE') entry.expense += tx.amount;
      else if (tx.type === 'INCOME') entry.income += tx.amount;
      else if (tx.type === 'TRANSFER') entry.transfer += tx.amount;
      else if (tx.type === 'REPAYMENT') entry.repayment += tx.amount;
    });

    return map;
  }, [transactions]);

  // Calendar Monthly Overview Stats
  const monthStats = useMemo(() => {
    let totalExpense = 0;
    let totalIncome = 0;
    let txCount = 0;
    let daysWithTx = 0;

    dailySummaryMap.forEach((entry, dateStr) => {
      if (dateStr.startsWith(calendarYearMonth)) {
        totalExpense += entry.expense;
        totalIncome += entry.income;
        txCount += entry.totalCount;
        if (entry.totalCount > 0) daysWithTx += 1;
      }
    });

    return {
      totalExpense,
      totalIncome,
      netBalance: totalIncome - totalExpense,
      txCount,
      daysWithTx,
    };
  }, [dailySummaryMap, calendarYearMonth]);

  // Build Calendar Matrix (Weeks x 7 Days, Monday starting)
  const calendarCells = useMemo(() => {
    const daysInCurrentMonth = new Date(currentYear, currentMonth, 0).getDate();
    const firstDayOfWeek = new Date(currentYear, currentMonth - 1, 1).getDay();
    const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

    const daysInPrevMonth = new Date(currentYear, currentMonth - 1, 0).getDate();
    const cells: {
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
      summary?: {
        expense: number;
        income: number;
        transfer: number;
        repayment: number;
        totalCount: number;
      };
    }[] = [];

    // 1. Previous month padding
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    for (let i = startOffset - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const dateStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(dayNum).padStart(
        2,
        '0'
      )}`;
      cells.push({
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: dateStr === today.dateStr,
        isSelected: dateStr === selectedDateFilter,
        summary: dailySummaryMap.get(dateStr),
      });
    }

    // 2. Current month days
    for (let day = 1; day <= daysInCurrentMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(
        2,
        '0'
      )}`;
      cells.push({
        dateStr,
        dayNumber: day,
        isCurrentMonth: true,
        isToday: dateStr === today.dateStr,
        isSelected: dateStr === selectedDateFilter,
        summary: dailySummaryMap.get(dateStr),
      });
    }

    // 3. Next month padding (up to 35 or 42)
    const totalCells = cells.length > 35 ? 42 : 35;
    const remaining = totalCells - cells.length;
    const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    for (let day = 1; day <= remaining; day++) {
      const dateStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(day).padStart(
        2,
        '0'
      )}`;
      cells.push({
        dateStr,
        dayNumber: day,
        isCurrentMonth: false,
        isToday: dateStr === today.dateStr,
        isSelected: dateStr === selectedDateFilter,
        summary: dailySummaryMap.get(dateStr),
      });
    }

    return cells;
  }, [currentYear, currentMonth, today.dateStr, selectedDateFilter, dailySummaryMap]);

  // -------------------------------------------------------------
  // UNIFIED FILTERING & SEQUENTIAL DATE GROUPING
  // -------------------------------------------------------------
  const filteredTransactions = useMemo(() => {
    return sortedTransactions.filter((tx) => {
      // Date specific filter from calendar click
      if (selectedDateFilter && tx.date !== selectedDateFilter) {
        return false;
      }
      if (selectedType !== 'ALL' && tx.type !== selectedType) {
        return false;
      }
      if (
        selectedAccountId !== 'ALL' &&
        tx.accountId !== selectedAccountId &&
        tx.targetAccountId !== selectedAccountId
      ) {
        return false;
      }
      if (selectedMonth !== 'ALL' && !tx.date.startsWith(selectedMonth)) {
        return false;
      }
      if (selectedCurrency === 'FOREIGN_ONLY') {
        if (!tx.currency || tx.currency === 'CNY') return false;
      } else if (selectedCurrency !== 'ALL') {
        if ((tx.currency || 'CNY') !== selectedCurrency) return false;
      }

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchDesc = tx.description?.toLowerCase().includes(term);
        const matchCat = tx.category?.toLowerCase().includes(term);
        const matchMerchant = tx.merchant?.toLowerCase().includes(term);
        const matchTag = tx.tag?.toLowerCase().includes(term);
        const matchCounterparty = tx.counterparty?.toLowerCase().includes(term);
        const matchCurrency = tx.currency?.toLowerCase().includes(term);
        if (
          !matchDesc &&
          !matchCat &&
          !matchMerchant &&
          !matchTag &&
          !matchCounterparty &&
          !matchCurrency
        ) {
          return false;
        }
      }
      return true;
    });
  }, [
    sortedTransactions,
    selectedDateFilter,
    selectedType,
    selectedAccountId,
    selectedMonth,
    selectedCurrency,
    searchTerm,
  ]);

  // Summary statistics of filtered results
  let filteredExpense = 0;
  let filteredIncome = 0;
  let foreignCount = 0;
  filteredTransactions.forEach((tx) => {
    if (tx.type === 'EXPENSE') filteredExpense += tx.amount;
    if (tx.type === 'INCOME') filteredIncome += tx.amount;
    if (tx.currency && tx.currency !== 'CNY') foreignCount += 1;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              记账本
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
              共 {transactions.length} 笔明细
            </span>
            {selectedDateFilter && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60 flex items-center gap-1">
                <span>已筛选指定日期: {selectedDateFilter}</span>
                <button
                  onClick={() => setSelectedDateFilter(null)}
                  className="hover:text-amber-900 dark:hover:text-amber-200"
                  title="清除日期筛选"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            收支日历与全量流水明细同屏排列，按日期与时间自动倒序归纳，支持账单批量导入与导出
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Generate Receipt Button */}
          <button
            id="btn-ledger-receipt"
            onClick={() => {
              setReceiptSingleTxId(null);
              setIsReceiptModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-semibold text-xs sm:text-sm shadow-2xs active:scale-95 transition-all"
            title="一键生成沉浸式消费账单小票，模拟出票音效与印章动画，支持高清长图保存与分享"
          >
            <Receipt className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>账单小票</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
          </button>

          {/* Upload Button */}
          <button
            id="btn-ledger-upload"
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm shadow-xs active:scale-95 transition-all"
            title="上传导入微信/支付宝账单、银行流水或标准表格"
          >
            <UploadCloud className="w-4 h-4" />
            <span>上传导入</span>
          </button>

          {/* Export Button */}
          <button
            id="btn-ledger-export"
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold text-xs sm:text-sm shadow-2xs active:scale-95 transition-all"
            title="导出 Excel / CSV / JSON"
          >
            <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>导出</span>
          </button>

          {/* Add Record Button */}
          <button
            id="btn-ledger-add"
            onClick={() => onOpenNewTx('EXPENSE', undefined, selectedDateFilter || undefined)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white font-semibold text-xs sm:text-sm shadow-xs active:scale-95 transition-all"
          >
            <PlusCircle className="w-4 h-4 text-emerald-400" />
            <span>记一笔</span>
          </button>
        </div>
      </div>

      {/* 2. Collapsible Income/Expense Calendar Widget (隐藏式收支日历，点击打开和关闭) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs transition-all">
        {/* Calendar Header & Month Navigation */}
        <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${isCalendarExpanded ? 'pb-3 border-b border-slate-100 dark:border-slate-800' : ''}`}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCalendarExpanded((prev) => !prev)}
              className="flex items-center gap-2 text-left group"
              title={isCalendarExpanded ? '点击收起日历' : '点击展开日历'}
            >
              <div className="p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/60 group-hover:scale-105 transition-transform">
                <CalendarDays className="w-4 h-4" />
              </div>
              <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-mono flex items-center gap-1.5">
                <span>{currentYear}年 {String(currentMonth).padStart(2, '0')}月 收支日历</span>
              </span>
            </button>

            {isCalendarExpanded && (
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/60 dark:border-slate-700">
                <button
                  id="btn-cal-prev-month"
                  onClick={handlePrevMonth}
                  className="p-1 rounded hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all"
                  title="上个月"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  id="btn-cal-next-month"
                  onClick={handleNextMonth}
                  className="p-1 rounded hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all"
                  title="下个月"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {isCalendarExpanded && (
              <select
                value={calendarYearMonth}
                onChange={(e) => setCalendarYearMonth(e.target.value)}
                className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-0.5 text-slate-600 dark:text-slate-300 focus:outline-none"
              >
                {availableMonths.map((m) => (
                  <option key={m} value={m}>
                    {m.replace('-', '年')}月
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Quick Month Metrics Badges & Toggle Button */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-semibold border border-rose-100 dark:border-rose-900/40">
                月支: -{formatCurrency(monthStats.totalExpense, privacyMode)}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-semibold border border-emerald-100 dark:border-emerald-900/40">
                月收: +{formatCurrency(monthStats.totalIncome, privacyMode)}
              </span>
              <span
                className={`px-2 py-0.5 rounded-md font-semibold border ${
                  monthStats.netBalance >= 0
                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-900/40'
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/40'
                }`}
              >
                结余: {formatCurrency(monthStats.netBalance, privacyMode)}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {isCalendarExpanded && (
                <button
                  onClick={handleGoToToday}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium border border-slate-200/80 dark:border-slate-700 transition-all"
                >
                  今天
                </button>
              )}

              <button
                onClick={() => setIsCalendarExpanded((prev) => !prev)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200/80 dark:border-slate-700 transition-all shadow-2xs"
                title={isCalendarExpanded ? '点击收起收支日历' : '点击展开收支日历'}
              >
                <span>{isCalendarExpanded ? '收起日历' : '展开日历'}</span>
                {isCalendarExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Compact Scaled Calendar Grid (Collapsible) */}
        {isCalendarExpanded && (
          <div className="pt-3 animate-in fade-in duration-150">
            {/* Weekday Header */}
            <div className="grid grid-cols-7 gap-1 mb-1 text-center text-[11px] font-semibold text-slate-400 dark:text-slate-500 py-1">
              <div>一</div>
              <div>二</div>
              <div>三</div>
              <div>四</div>
              <div>五</div>
              <div className="text-amber-600/80 dark:text-amber-400/80">六</div>
              <div className="text-rose-600/80 dark:text-rose-400/80">日</div>
            </div>

            {/* Compact Days Matrix */}
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {calendarCells.map((cell) => {
                const hasExpense = cell.summary && cell.summary.expense > 0;
                const hasIncome = cell.summary && cell.summary.income > 0;
                const hasTrans = cell.summary && cell.summary.totalCount > 0;

                return (
                  <div
                    key={cell.dateStr}
                    onClick={() => {
                      // Toggle date filter: if clicked again on selected date, clear it
                      if (selectedDateFilter === cell.dateStr) {
                        setSelectedDateFilter(null);
                      } else {
                        setSelectedDateFilter(cell.dateStr);
                      }
                    }}
                    className={`h-[48px] sm:h-[52px] p-1 sm:p-1.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between select-none relative group ${
                      cell.isSelected
                        ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20 shadow-xs'
                        : cell.isCurrentMonth
                        ? 'border-slate-200/60 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100/60 dark:hover:bg-slate-800/50'
                        : 'border-slate-100 dark:border-slate-800/30 bg-white dark:bg-slate-900/20 opacity-30 hover:opacity-60'
                    }`}
                    title={`${cell.dateStr} (点击过滤下方明细)`}
                  >
                    {/* Centered Day Number Header */}
                    <div className="relative flex items-center justify-center w-full">
                      <span
                        className={`text-xs sm:text-[13px] font-bold font-mono tracking-tight text-center ${
                          cell.isToday
                            ? 'w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px] shadow-2xs'
                            : cell.isSelected
                            ? 'text-emerald-700 dark:text-emerald-400 font-black'
                            : cell.isCurrentMonth
                            ? 'text-slate-800 dark:text-slate-200'
                            : 'text-slate-400 dark:text-slate-600'
                        }`}
                      >
                        {cell.dayNumber}
                      </span>

                      {hasTrans && (
                        <span className="absolute right-0 top-0.5 text-[8px] font-mono text-slate-400 dark:text-slate-500">
                          {cell.summary!.totalCount}笔
                        </span>
                      )}
                    </div>

                    {/* Compact Amount / Indicator Badges */}
                    <div className="flex items-center gap-0.5 justify-between text-[9px] sm:text-[10px] font-mono leading-none truncate w-full px-0.5">
                      {hasExpense ? (
                        <span className="text-rose-600 dark:text-rose-400 truncate text-left">
                          -{Math.round(cell.summary!.expense)}
                        </span>
                      ) : (
                        <span />
                      )}
                      {hasIncome && (
                        <span className="text-emerald-700 dark:text-emerald-400 truncate text-right font-medium">
                          +{Math.round(cell.summary!.income)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Calendar Quick Prompt Bar */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 mt-2 px-1">
              <span>💡 点击上方任一日历格子可直接筛选该日流水；再次点击可取消筛选</span>
              {selectedDateFilter && (
                <button
                  onClick={() => setSelectedDateFilter(null)}
                  className="text-emerald-600 hover:text-emerald-700 font-semibold"
                >
                  显示全月所有明细
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. Unified Filters & Search Toolbar */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
            <input
              id="ledger-search-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索分类、备注、商户、标签、币种..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-slate-400 focus:bg-white dark:focus:bg-slate-800"
            />
          </div>

          {/* Type Filter */}
          <div>
            <select
              id="ledger-filter-type"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm focus:outline-none focus:border-slate-400"
            >
              <option value="ALL">全部交易类型</option>
              <option value="EXPENSE">支出消费</option>
              <option value="INCOME">收入进账</option>
              <option value="TRANSFER">账户转账划转</option>
              <option value="REPAYMENT">信用卡与白条还款</option>
              <option value="LEND_OUT">借出款项</option>
              <option value="COLLECT_LENT">收回借款</option>
              <option value="BORROW_IN">借入款项</option>
              <option value="PAY_BORROW">归还借款</option>
            </select>
          </div>

          {/* Account Filter */}
          <div>
            <select
              id="ledger-filter-account"
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm focus:outline-none focus:border-slate-400"
            >
              <option value="ALL">全部关联账户</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          {/* Month Filter */}
          <div>
            <select
              id="ledger-filter-month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm focus:outline-none focus:border-slate-400"
            >
              <option value="ALL">全部历史月份</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {m} 月
                </option>
              ))}
            </select>
          </div>

          {/* Currency Filter */}
          <div>
            <select
              id="ledger-filter-currency"
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm focus:outline-none focus:border-slate-400"
            >
              <option value="ALL">全部币种</option>
              <option value="FOREIGN_ONLY">🌐 仅外币交易</option>
              <option value="CNY">🇨🇳 人民币 (CNY)</option>
              {currenciesPresent
                .filter((c) => c !== 'CNY')
                .map((cur) => {
                  const info = getCurrencyInfo(cur);
                  return (
                    <option key={cur} value={cur}>
                      {info.flag} {info.code}
                    </option>
                  );
                })}
            </select>
          </div>
        </div>

        {/* Sub-bar with Counts, Order & Download Template */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 flex-wrap gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            <span>
              当前列出 <strong className="text-slate-900 dark:text-white font-bold">{filteredTransactions.length}</strong> 笔账目
            </span>
            <span className="text-rose-600 dark:text-rose-400 font-medium">
              支出总计: -{formatCurrency(filteredExpense, privacyMode)}
            </span>
            <span className="text-emerald-700 dark:text-emerald-400 font-medium">
              收入总计: +{formatCurrency(filteredIncome, privacyMode)}
            </span>
            {foreignCount > 0 && (
              <span className="text-blue-700 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-100 dark:border-blue-900/60 flex items-center gap-1">
                <Globe2 className="w-3 h-3" />
                包含 {foreignCount} 笔外币
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
              className="text-xs text-slate-600 dark:text-slate-300 hover:text-emerald-600 flex items-center gap-1 font-medium transition-colors"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{sortOrder === 'desc' ? '最新日期在前 (倒序)' : '最早日期在前 (正序)'}</span>
            </button>

            <button
              onClick={() => downloadTransactionTemplate('csv')}
              className="text-xs text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1 transition-colors"
              title="下载标准 CSV 导入模板"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>导入模板</span>
            </button>

            {(searchTerm ||
              selectedDateFilter ||
              selectedType !== 'ALL' ||
              selectedAccountId !== 'ALL' ||
              selectedMonth !== 'ALL' ||
              selectedCurrency !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedDateFilter(null);
                  setSelectedType('ALL');
                  setSelectedAccountId('ALL');
                  setSelectedMonth('ALL');
                  setSelectedCurrency('ALL');
                }}
                className="text-xs text-rose-500 hover:text-rose-600 font-semibold"
              >
                重置所有筛选
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. Sequential Chronological Transactions List (账本明细 - 采用与日历同款背景卡片及图标底色) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs overflow-hidden transition-all">
        {/* Section Header: 账本明细卡片头部 (与收支日历同款卡片背景框与图标底色) */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/60">
              <ReceiptText className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-mono tracking-tight">
                账本明细
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold font-mono border border-slate-200/60 dark:border-slate-700">
                共 {filteredTransactions.length} 笔
              </span>
            </div>

            {selectedDateFilter && (
              <span className="text-xs px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-medium border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                <span>📅 已选日期: {selectedDateFilter}</span>
                <button
                  onClick={() => setSelectedDateFilter(null)}
                  className="text-emerald-700 dark:text-emerald-400 hover:text-rose-600 font-bold ml-0.5"
                  title="清除日期过滤"
                >
                  ×
                </button>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 flex-wrap">
            <button
              onClick={() => {
                setReceiptSingleTxId(null);
                setIsReceiptModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-400 font-semibold border border-amber-200/80 dark:border-amber-800/60 transition-colors shadow-2xs"
              title="一键生成当前明细小票"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>生成账单小票</span>
            </button>

            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium border border-slate-200/80 dark:border-slate-700 transition-colors shadow-2xs"
              title="点击切换时间排序"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{sortOrder === 'desc' ? '时间倒序' : '时间正序'}</span>
            </button>
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-4">
            <ReceiptText className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
            <div>
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                暂无符合条件的记账明细
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                您可以点击右上角“记一笔”快速添加，或点击“上传导入”批量导入历史账单
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => onOpenNewTx('EXPENSE', undefined, selectedDateFilter || undefined)}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-700 text-white font-semibold text-xs sm:text-sm hover:bg-slate-800 transition-all inline-flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4 text-emerald-400" />
                <span>记一笔账单</span>
              </button>
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 font-semibold text-xs sm:text-sm hover:bg-emerald-100 transition-all inline-flex items-center gap-1.5"
              >
                <UploadCloud className="w-4 h-4" />
                <span>批量导入</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredTransactions.map((tx) => {
                const acc = accountMap.get(tx.accountId);
                const targetAcc = tx.targetAccountId ? accountMap.get(tx.targetAccountId) : null;
                const isExpense = tx.type === 'EXPENSE';
                const isIncome = tx.type === 'INCOME';
                const isTransfer = tx.type === 'TRANSFER';
                const isRepayment = tx.type === 'REPAYMENT';
                const isForeign = tx.currency && tx.currency !== 'CNY';
                const curInfo = isForeign ? getCurrencyInfo(tx.currency!) : null;

                return (
                  <div
                    key={tx.id}
                    className="px-4 sm:px-5 py-3.5 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors flex items-center justify-between gap-3 group"
                  >
                    {/* Left: Icon & Description & Metadata */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          isExpense
                            ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400'
                            : isIncome
                            ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400'
                            : isRepayment
                            ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400'
                            : 'bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400'
                        }`}
                      >
                        <CategoryIcon
                          nameOrIcon={tx.category}
                          className="w-4 h-4"
                          defaultIcon={
                            isExpense
                              ? ArrowDownRight
                              : isIncome
                              ? ArrowUpRight
                              : isRepayment
                              ? ReceiptText
                              : RotateCw
                          }
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                            {tx.description || tx.category}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                            {tx.category}
                          </span>
                          {tx.tag && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100/80 dark:bg-slate-800/80 text-slate-400">
                              #{tx.tag}
                            </span>
                          )}
                          {tx.merchant && (
                            <span className="text-[10px] text-slate-400">
                              商户: {tx.merchant}
                            </span>
                          )}
                        </div>

                        {/* Date, Time & Account Path */}
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1 flex-wrap font-mono">
                          <span className="font-medium text-slate-600 dark:text-slate-300">
                            {tx.date}
                          </span>
                          {tx.time && (
                            <span className="flex items-center gap-0.5 text-slate-500 dark:text-slate-400">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {tx.time}
                            </span>
                          )}
                          <span>·</span>
                          <span className="text-slate-600 dark:text-slate-300 font-medium">
                            {acc?.name || '账户'}
                          </span>
                          {targetAcc && (
                            <>
                              <span>➔</span>
                              <span className="text-slate-600 dark:text-slate-300 font-medium">
                                {targetAcc.name}
                              </span>
                            </>
                          )}
                          {tx.counterparty && (
                            <>
                              <span>·</span>
                              <span>对方: {tx.counterparty}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Amount, Foreign Currency & Actions */}
                    <div className="text-right flex items-center gap-3 sm:gap-5 flex-shrink-0">
                      <div>
                        <div
                          className={`text-sm sm:text-base font-bold font-mono ${
                            isExpense
                              ? 'text-rose-600 dark:text-rose-400'
                              : isIncome
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-blue-600 dark:text-blue-400'
                          }`}
                        >
                          {isExpense
                            ? `-${formatCurrency(tx.amount, privacyMode)}`
                            : isIncome
                            ? `+${formatCurrency(tx.amount, privacyMode)}`
                            : formatCurrency(tx.amount, privacyMode)}
                        </div>

                        {isForeign && curInfo && (
                          <div className="text-[10px] text-blue-700 dark:text-blue-300 font-mono">
                            原币: {curInfo.symbol}{tx.originalAmount || tx.amount}
                          </div>
                        )}
                      </div>

                      {/* Quick Action buttons */}
                      <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setReceiptSingleTxId(tx.id);
                            setIsReceiptModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                          title="生成此笔消费小票"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onEditTransaction(tx)}
                          className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="编辑此记录"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`确定删除记录 “${tx.description || tx.category}” 吗？`)) {
                              onDeleteTransaction(tx.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="删除此记录"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
        )}
      </div>

      {/* Upload / Batch Import Modal */}
      {isImportModalOpen && (
        <TransactionImportModal
          isOpen={isImportModalOpen}
          accounts={accounts}
          onClose={() => setIsImportModalOpen(false)}
          onImport={(importedList, syncBalances) => {
            onImportTransactions(importedList, syncBalances);
            setIsImportModalOpen(false);
          }}
          onShowToast={onShowToast}
        />
      )}

      {/* Export Modal */}
      {isExportModalOpen && (
        <TransactionExportModal
          isOpen={isExportModalOpen}
          transactions={filteredTransactions.length > 0 ? filteredTransactions : sortedTransactions}
          accounts={accounts}
          onClose={() => setIsExportModalOpen(false)}
          onShowToast={onShowToast}
        />
      )}

      {/* Consumption Receipt Modal (生动逼真出票动效与小票分享) */}
      {isReceiptModalOpen && (
        <ReceiptModal
          isOpen={isReceiptModalOpen}
          onClose={() => {
            setIsReceiptModalOpen(false);
            setReceiptSingleTxId(null);
          }}
          transactions={filteredTransactions.length > 0 ? filteredTransactions : sortedTransactions}
          accounts={accounts}
          selectedDate={selectedDateFilter}
          initialSingleTxId={receiptSingleTxId}
        />
      )}
    </div>
  );
};
