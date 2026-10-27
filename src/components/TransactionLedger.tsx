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
  RotateCcw,
  FolderKanban,
  CalendarClock,
  ListOrdered,
  RefreshCw,
  CheckSquare,
  Square,
  Copy,
  CopyPlus,
  SlidersHorizontal,
  BarChart3,
  PieChart,
  Rows3,
  AlignJustify,
  Folder,
  Check,
  ArrowRight,
  ArchiveRestore,
  Briefcase,
  Split,
  MoreHorizontal,
} from 'lucide-react';
import { Transaction, FinancialAccount, TransactionType, LedgerProject, UserProfile } from '../types';
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
import { downloadTransactionTemplate, exportTransactions } from '../lib/transactionImportExport';
import { getStoredExpenseCategories, getStoredIncomeCategories } from '../lib/constants';
import { CategoryIcon } from './CategoryIcon';

interface TransactionLedgerProps {
  transactions?: Transaction[];
  accounts?: FinancialAccount[];
  projects?: LedgerProject[];
  privacyMode: boolean;
  currentUser?: UserProfile | null;
  onTriggerSync?: () => Promise<void> | void;
  onDeleteTransaction: (txId: string) => void;
  onBatchDeleteTransactions?: (txIds: string[]) => void;
  onBatchUpdateTransactions?: (txIds: string[], updates: Partial<Transaction>) => void;
  onDuplicateTransaction?: (tx: Transaction, cloneImmediately?: boolean) => void;
  onEditTransaction: (tx: Transaction) => void;
  onOpenNewTx: (type?: string, accountId?: string, defaultDate?: string, projectId?: string) => void;
  onRefundTransaction?: (tx: Transaction) => void;
  onImportTransactions: (
    importedList: Transaction[],
    syncAccountBalances: boolean
  ) => void;
  onShowToast: (msg: string) => void;
  onOpenRecurringTasks?: () => void;
  recurringTasksCount?: number;
  onOpenTrashBin?: () => void;
  trashCount?: number;
  onSettleReimbursement?: (tx: Transaction) => void;
}

export const TransactionLedger: React.FC<TransactionLedgerProps> = ({
  transactions = [],
  accounts = [],
  projects = [],
  privacyMode,
  currentUser,
  onTriggerSync,
  onDeleteTransaction,
  onBatchDeleteTransactions,
  onBatchUpdateTransactions,
  onDuplicateTransaction,
  onEditTransaction,
  onOpenNewTx,
  onRefundTransaction,
  onImportTransactions,
  onShowToast,
  onOpenRecurringTasks,
  recurringTasksCount,
  onOpenTrashBin,
  trashCount = 0,
  onSettleReimbursement,
}) => {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleManualSync = async () => {
    if (!onTriggerSync || isSyncing) return;
    setIsSyncing(true);
    try {
      await onTriggerSync();
    } finally {
      setTimeout(() => setIsSyncing(false), 600);
    }
  };
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

  // Date Helpers for presets (Today, Yesterday, This Week, Last 7 Days, This Month, Last Month, This Year)
  const dateHelpers = useMemo(() => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const toDateStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    const todayStr = toDateStr(now);

    const yest = new Date(now);
    yest.setDate(yest.getDate() - 1);
    const yesterdayStr = toDateStr(yest);

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const sevenDaysAgoStr = toDateStr(sevenDaysAgo);

    const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1;
    const monday = new Date(now);
    monday.setDate(monday.getDate() - dayOfWeek);
    const mondayStr = toDateStr(monday);

    let lastMYear = now.getFullYear();
    let lastM = now.getMonth();
    if (lastM === 0) {
      lastM = 12;
      lastMYear -= 1;
    }
    const lastMonthStr = `${lastMYear}-${pad(lastM)}`;

    return {
      todayStr,
      yesterdayStr,
      sevenDaysAgoStr,
      mondayStr,
      thisMonthStr: `${now.getFullYear()}-${pad(now.getMonth() + 1)}`,
      lastMonthStr,
      thisYearStr: `${now.getFullYear()}`,
    };
  }, []);

  // 1. Feature: Batch Operations & Multi-Select
  const [isBatchMode, setIsBatchMode] = useState<boolean>(false);
  const [selectedTxIds, setSelectedTxIds] = useState<Set<string>>(new Set());
  const [batchModal, setBatchModal] = useState<'DELETE' | 'PROJECT' | 'CATEGORY' | null>(null);
  const [batchSelectedProject, setBatchSelectedProject] = useState<string>('');
  const [batchSelectedCategory, setBatchSelectedCategory] = useState<string>('');

  // 2. Feature: Quick Duplicate / Clone Transaction
  const [duplicateTargetTx, setDuplicateTargetTx] = useState<Transaction | null>(null);

  // 3. Feature: Advanced Filters (Amount Range & Date Presets & Category)
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState<boolean>(false);
  const [amountMin, setAmountMin] = useState<string>('');
  const [amountMax, setAmountMax] = useState<string>('');
  const [selectedDatePreset, setSelectedDatePreset] = useState<
    'ALL' | 'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'LAST_7_DAYS' | 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_YEAR' | 'CUSTOM'
  >('ALL');
  const [customDateStart, setCustomDateStart] = useState<string>('');
  const [customDateEnd, setCustomDateEnd] = useState<string>('');

  // 4. Feature: View Mode (Grouped Timeline by Date vs Continuous Flat List)
  const [viewMode, setViewMode] = useState<'GROUPED' | 'FLAT'>(() => {
    try {
      return (localStorage.getItem('asset_vault_ledger_view_mode') as 'GROUPED' | 'FLAT') || 'GROUPED';
    } catch {
      return 'GROUPED';
    }
  });

  const handleToggleViewMode = (mode: 'GROUPED' | 'FLAT') => {
    setViewMode(mode);
    try {
      localStorage.setItem('asset_vault_ledger_view_mode', mode);
    } catch {}
  };

  // 5. Feature: Category Breakdown & Click-to-filter
  const [isCategoryBreakdownExpanded, setIsCategoryBreakdownExpanded] = useState<boolean>(true);
  const [breakdownType, setBreakdownType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // List View filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Modals for Upload, Export & Receipt
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptSingleTxId, setReceiptSingleTxId] = useState<string | null>(null);
  const [mobileActionTx, setMobileActionTx] = useState<Transaction | null>(null);

  // Account map for quick lookup
  const accountMap = useMemo(() => {
    const map = new Map<string, FinancialAccount>();
    (accounts || []).forEach((a) => map.set(a.id, a));
    return map;
  }, [accounts]);

  // Project map for quick lookup
  const projectMap = useMemo(() => {
    const map = new Map<string, LedgerProject>();
    (projects || []).forEach((p) => map.set(p.id, p));
    return map;
  }, [projects]);

  // Expanded split transaction rows state
  const [expandedSplitTxIds, setExpandedSplitTxIds] = useState<Set<string>>(new Set());

  const toggleSplitExpand = (txId: string) => {
    setExpandedSplitTxIds((prev) => {
      const next = new Set(prev);
      if (next.has(txId)) {
        next.delete(txId);
      } else {
        next.add(txId);
      }
      return next;
    });
  };

  // Extract unique months for month selectors
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    (transactions || []).forEach((t) => {
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
    (transactions || []).forEach((t) => {
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

    (transactions || []).forEach((tx) => {
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
  // UNIFIED FILTERING & ADVANCED MULTI-DIMENSIONAL CONDITIONS
  // -------------------------------------------------------------
  const filteredTransactions = useMemo(() => {
    return sortedTransactions.filter((tx) => {
      // 1. Date specific filter from calendar click
      if (selectedDateFilter && tx.date !== selectedDateFilter) {
        return false;
      }

      // 2. Transaction Type Filter
      if (selectedType === 'REIMBURSABLE') {
        if (!tx.isReimbursable || tx.reimbursementStatus === 'REIMBURSED') {
          return false;
        }
      } else if (selectedType === 'SPLIT') {
        if (!tx.splitItems || tx.splitItems.length === 0) {
          return false;
        }
      } else if (selectedType !== 'ALL' && tx.type !== selectedType) {
        return false;
      }

      // 3. Category Filter (Interactive drill-down from Category Breakdown)
      if (selectedCategory !== 'ALL' && tx.category !== selectedCategory) {
        return false;
      }

      // 4. Project Filter
      if (selectedProjectId !== 'ALL') {
        if (selectedProjectId === 'NONE') {
          if (tx.projectId) return false;
        } else {
          if (tx.projectId !== selectedProjectId && tx.projectName !== selectedProjectId) {
            return false;
          }
        }
      }

      // 5. Account Filter
      if (
        selectedAccountId !== 'ALL' &&
        tx.accountId !== selectedAccountId &&
        tx.targetAccountId !== selectedAccountId
      ) {
        return false;
      }

      // 6. Month Filter
      if (selectedMonth !== 'ALL' && !tx.date.startsWith(selectedMonth)) {
        return false;
      }

      // 7. Currency Filter
      if (selectedCurrency === 'FOREIGN_ONLY') {
        if (!tx.currency || tx.currency === 'CNY') return false;
      } else if (selectedCurrency !== 'ALL') {
        if ((tx.currency || 'CNY') !== selectedCurrency) return false;
      }

      // 8. Amount Range Filter (Feature 3)
      if (amountMin.trim() !== '') {
        const minVal = parseFloat(amountMin);
        if (!isNaN(minVal) && tx.amount < minVal) {
          return false;
        }
      }
      if (amountMax.trim() !== '') {
        const maxVal = parseFloat(amountMax);
        if (!isNaN(maxVal) && tx.amount > maxVal) {
          return false;
        }
      }

      // 9. Date Preset Filter (Feature 3)
      if (selectedDatePreset !== 'ALL') {
        if (selectedDatePreset === 'TODAY') {
          if (tx.date !== dateHelpers.todayStr) return false;
        } else if (selectedDatePreset === 'YESTERDAY') {
          if (tx.date !== dateHelpers.yesterdayStr) return false;
        } else if (selectedDatePreset === 'THIS_WEEK') {
          if (tx.date < dateHelpers.mondayStr || tx.date > dateHelpers.todayStr) return false;
        } else if (selectedDatePreset === 'LAST_7_DAYS') {
          if (tx.date < dateHelpers.sevenDaysAgoStr || tx.date > dateHelpers.todayStr) return false;
        } else if (selectedDatePreset === 'THIS_MONTH') {
          if (!tx.date.startsWith(dateHelpers.thisMonthStr)) return false;
        } else if (selectedDatePreset === 'LAST_MONTH') {
          if (!tx.date.startsWith(dateHelpers.lastMonthStr)) return false;
        } else if (selectedDatePreset === 'THIS_YEAR') {
          if (!tx.date.startsWith(dateHelpers.thisYearStr)) return false;
        } else if (selectedDatePreset === 'CUSTOM') {
          if (customDateStart && tx.date < customDateStart) return false;
          if (customDateEnd && tx.date > customDateEnd) return false;
        }
      }

      // 10. Keyword Search
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchDesc = tx.description?.toLowerCase().includes(term);
        const matchCat = tx.category?.toLowerCase().includes(term);
        const matchMerchant = tx.merchant?.toLowerCase().includes(term);
        const matchTag = tx.tag?.toLowerCase().includes(term);
        const matchCounterparty = tx.counterparty?.toLowerCase().includes(term);
        const matchCurrency = tx.currency?.toLowerCase().includes(term);
        const matchProject = tx.projectName?.toLowerCase().includes(term);
        const matchSplit = tx.splitItems?.some(
          (s) =>
            s.category?.toLowerCase().includes(term) ||
            s.description?.toLowerCase().includes(term) ||
            s.subCategory?.toLowerCase().includes(term)
        );
        if (
          !matchDesc &&
          !matchCat &&
          !matchMerchant &&
          !matchTag &&
          !matchCounterparty &&
          !matchCurrency &&
          !matchProject &&
          !matchSplit
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
    selectedCategory,
    selectedProjectId,
    selectedAccountId,
    selectedMonth,
    selectedCurrency,
    amountMin,
    amountMax,
    selectedDatePreset,
    customDateStart,
    customDateEnd,
    searchTerm,
    dateHelpers,
  ]);

  // Split Transactions stats and toggle all
  const totalSplitCount = useMemo(() => {
    return (transactions || []).filter((tx) => tx.splitItems && tx.splitItems.length > 0).length;
  }, [transactions]);

  const filteredSplitCount = useMemo(() => {
    return filteredTransactions.filter((tx) => tx.splitItems && tx.splitItems.length > 0).length;
  }, [filteredTransactions]);

  const isAllSplitsExpanded = useMemo(() => {
    const splitTxIds = filteredTransactions
      .filter((tx) => tx.splitItems && tx.splitItems.length > 0)
      .map((tx) => tx.id);
    return splitTxIds.length > 0 && splitTxIds.every((id) => expandedSplitTxIds.has(id));
  }, [filteredTransactions, expandedSplitTxIds]);

  const handleToggleAllSplits = () => {
    const splitTxIds = filteredTransactions
      .filter((tx) => tx.splitItems && tx.splitItems.length > 0)
      .map((tx) => tx.id);
    if (splitTxIds.length === 0) return;

    const allExpanded = splitTxIds.every((id) => expandedSplitTxIds.has(id));
    setExpandedSplitTxIds((prev) => {
      const next = new Set(prev);
      if (allExpanded) {
        splitTxIds.forEach((id) => next.delete(id));
      } else {
        splitTxIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  // Feature 1: Multi-select helpers
  const toggleTxSelection = (id: string) => {
    setSelectedTxIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllFiltered = () => {
    const ids = new Set<string>();
    filteredTransactions.forEach((tx) => ids.add(tx.id));
    setSelectedTxIds(ids);
  };

  const handleClearSelection = () => {
    setSelectedTxIds(new Set());
  };

  const handleInvertSelection = () => {
    setSelectedTxIds((prev) => {
      const next = new Set<string>();
      filteredTransactions.forEach((tx) => {
        if (!prev.has(tx.id)) next.add(tx.id);
      });
      return next;
    });
  };

  const batchSelectedStats = useMemo(() => {
    let expense = 0;
    let income = 0;
    selectedTxIds.forEach((id) => {
      const tx = sortedTransactions.find((t) => t.id === id);
      if (tx) {
        if (tx.type === 'EXPENSE') expense += tx.amount;
        else if (tx.type === 'INCOME') income += tx.amount;
      }
    });
    return { expense, income };
  }, [selectedTxIds, sortedTransactions]);

  const handleExecuteBatchDelete = () => {
    const ids = Array.from(selectedTxIds);
    if (ids.length === 0) return;
    if (onBatchDeleteTransactions) {
      onBatchDeleteTransactions(ids);
    } else {
      ids.forEach((id) => onDeleteTransaction(id));
      onShowToast(`🗑️ 已删除 ${ids.length} 笔账单`);
    }
    setSelectedTxIds(new Set());
    setBatchModal(null);
  };

  const handleExecuteBatchProject = () => {
    const ids = Array.from(selectedTxIds);
    if (ids.length === 0) return;
    const proj = projects.find((p) => p.id === batchSelectedProject);
    const updates = batchSelectedProject === 'CLEAR'
      ? { projectId: undefined, projectName: undefined }
      : { projectId: proj?.id, projectName: proj?.name };
    if (onBatchUpdateTransactions) {
      onBatchUpdateTransactions(ids, updates);
    } else {
      onShowToast(`✨ 已为 ${ids.length} 笔账单批量指派项目`);
    }
    setSelectedTxIds(new Set());
    setBatchModal(null);
  };

  const handleExecuteBatchCategory = () => {
    const ids = Array.from(selectedTxIds);
    if (ids.length === 0 || !batchSelectedCategory) return;
    if (onBatchUpdateTransactions) {
      onBatchUpdateTransactions(ids, { category: batchSelectedCategory });
    } else {
      onShowToast(`✨ 已为 ${ids.length} 笔账单批量修改分类为「${batchSelectedCategory}」`);
    }
    setSelectedTxIds(new Set());
    setBatchModal(null);
  };

  const handleBatchExportSelected = () => {
    const selectedTxs = sortedTransactions.filter((t) => selectedTxIds.has(t.id));
    if (selectedTxs.length === 0) {
      onShowToast('请先选择要导出的账单');
      return;
    }
    exportTransactions(selectedTxs, accounts, {
      format: 'csv',
      scope: 'filtered',
      filename: `已选账本流水_${selectedTxs.length}笔`,
    });
    onShowToast(`📥 已导出所选 ${selectedTxs.length} 笔流水为 CSV`);
  };

  // Feature 2: Quick Duplicate handler
  const handleInstantCloneTx = (tx: Transaction) => {
    if (onDuplicateTransaction) {
      onDuplicateTransaction(tx, true);
    } else {
      onOpenNewTx(tx.type, tx.accountId, today.dateStr, tx.projectId);
    }
    setDuplicateTargetTx(null);
  };

  const handleEditCloneTx = (tx: Transaction) => {
    if (onDuplicateTransaction) {
      onDuplicateTransaction(tx, false);
    } else {
      onOpenNewTx(tx.type, tx.accountId, today.dateStr, tx.projectId);
    }
    setDuplicateTargetTx(null);
  };

  // Feature 4: Grouped Timeline
  const groupedTransactions = useMemo(() => {
    const groups: {
      date: string;
      weekday: string;
      isToday: boolean;
      isYesterday: boolean;
      transactions: Transaction[];
      totalExpense: number;
      totalIncome: number;
      net: number;
    }[] = [];

    const map = new Map<string, Transaction[]>();
    filteredTransactions.forEach((tx) => {
      const d = tx.date || '未知日期';
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(tx);
    });

    map.forEach((txs, d) => {
      let dayExp = 0;
      let dayInc = 0;
      txs.forEach((t) => {
        if (t.type === 'EXPENSE') dayExp += t.amount;
        else if (t.type === 'INCOME') dayInc += t.amount;
      });

      groups.push({
        date: d,
        weekday: getWeekdayName(d),
        isToday: d === dateHelpers.todayStr,
        isYesterday: d === dateHelpers.yesterdayStr,
        transactions: txs,
        totalExpense: dayExp,
        totalIncome: dayInc,
        net: dayInc - dayExp,
      });
    });

    return groups;
  }, [filteredTransactions, dateHelpers]);

  // Feature 5: Category stats breakdown
  const categoryStats = useMemo(() => {
    const baseTxs = filteredTransactions.filter((t) => t.type === breakdownType);
    const catMap = new Map<string, { amount: number; count: number }>();
    let totalAmount = 0;

    baseTxs.forEach((tx) => {
      const cat = tx.category || '其他';
      const cur = catMap.get(cat) || { amount: 0, count: 0 };
      cur.amount += tx.amount;
      cur.count += 1;
      catMap.set(cat, cur);
      totalAmount += tx.amount;
    });

    const list = Array.from(catMap.entries()).map(([name, data]) => ({
      name,
      amount: data.amount,
      count: data.count,
      percent: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0,
    }));

    list.sort((a, b) => b.amount - a.amount);

    return {
      list,
      totalAmount,
      count: baseTxs.length,
    };
  }, [filteredTransactions, breakdownType]);

  // Summary statistics of filtered results
  let filteredExpense = 0;
  let filteredIncome = 0;
  let foreignCount = 0;
  (filteredTransactions || []).forEach((tx) => {
    if (tx.type === 'EXPENSE') filteredExpense += tx.amount;
    if (tx.type === 'INCOME') filteredIncome += tx.amount;
    if (tx.currency && tx.currency !== 'CNY') foreignCount += 1;
  });

  // Overall aggregate stats across all transactions (matching 账本项目 style)
  const overallLedgerStats = useMemo(() => {
    let totalExpense = 0;
    let totalIncome = 0;
    let totalRefund = 0;
    let expenseCount = 0;
    let incomeCount = 0;

    (transactions || []).forEach((t) => {
      if (t.type === 'EXPENSE') {
        totalExpense += t.amount;
        expenseCount += 1;
      } else if (t.type === 'INCOME') {
        totalIncome += t.amount;
        incomeCount += 1;
      } else if (t.type === 'REFUND') {
        totalRefund += t.amount;
      }
    });

    const netExpense = Math.max(0, totalExpense - totalRefund);
    const netBalance = totalIncome - netExpense;

    return {
      expenseCount,
      incomeCount,
      totalExpense,
      totalIncome,
      totalRefund,
      netExpense,
      netBalance,
    };
  }, [transactions]);

  // Render Individual Transaction Row (Used by both Grouped Timeline and Flat View)
  const renderTransactionRow = (tx: Transaction) => {
    const acc = accountMap.get(tx.accountId);
    const targetAcc = tx.targetAccountId ? accountMap.get(tx.targetAccountId) : null;
    const isExpense = tx.type === 'EXPENSE';
    const isIncome = tx.type === 'INCOME';
    const isTransfer = tx.type === 'TRANSFER';
    const isRepayment = tx.type === 'REPAYMENT';
    const isForeign = tx.currency && tx.currency !== 'CNY';
    const curInfo = isForeign ? getCurrencyInfo(tx.currency!) : null;
    const isSelected = selectedTxIds.has(tx.id);
    const hasSplits = Boolean(tx.splitItems && tx.splitItems.length > 0);
    const isSplitExpanded = expandedSplitTxIds.has(tx.id);

    return (
      <div
        key={tx.id}
        className={`transition-colors ${isSelected ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : ''} ${
          isSplitExpanded ? 'bg-indigo-50/20 dark:bg-indigo-950/15' : ''
        }`}
      >
        <div
          onClick={
            isBatchMode
              ? () => toggleTxSelection(tx.id)
              : () => {
                  if (typeof window !== 'undefined' && window.innerWidth < 640) {
                    setMobileActionTx(tx);
                  }
                }
          }
          className={`px-3.5 sm:px-5 py-3 sm:py-3.5 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors flex items-center justify-between gap-2.5 sm:gap-4 group cursor-pointer sm:cursor-default ${
            isBatchMode ? 'cursor-pointer select-none' : ''
          }`}
        >
        {/* Left: Checkbox (Feature 1) & Icon & Description & Metadata */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
          {/* Feature 1: Multi-select Checkbox */}
          {isBatchMode && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleTxSelection(tx.id);
              }}
              className="p-1 rounded text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors shrink-0"
              title={isSelected ? '取消勾选' : '勾选此账单'}
            >
              {isSelected ? (
                <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Square className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              )}
            </button>
          )}

          <div
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0 ${
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
              className="w-4 h-4 sm:w-4.5 sm:h-4.5"
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

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white truncate max-w-[130px] xs:max-w-[200px] sm:max-w-none">
                {tx.description || tx.category}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedCategory(tx.category || 'ALL');
                }}
                className="px-1.5 py-0.2 sm:px-2 sm:py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer shrink-0"
                title={`点击筛选「${tx.category}」分类`}
              >
                {tx.category}
              </button>
              {tx.projectName && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedProjectId(tx.projectId || tx.projectName || 'ALL');
                  }}
                  className="px-1.5 py-0.2 sm:px-2 sm:py-0.5 rounded text-[10px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200/60 dark:border-indigo-800/60 hover:bg-indigo-100 transition-colors flex items-center gap-0.5 cursor-pointer shrink-0 truncate max-w-[110px]"
                  title={`点击筛选「${tx.projectName}」项目明细`}
                >
                  📁 {tx.projectName}
                </button>
              )}
              {tx.tag && (
                <span className="hidden xs:inline px-1.5 py-0.2 rounded text-[10px] bg-slate-100/80 dark:bg-slate-800/80 text-slate-400 shrink-0">
                  #{tx.tag}
                </span>
              )}
              {tx.isReimbursable && (
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-bold border inline-flex items-center gap-0.5 shrink-0 ${
                    tx.reimbursementStatus === 'REIMBURSED'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                      : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800'
                  }`}
                >
                  <Briefcase className="w-2.5 h-2.5" />
                  <span>{tx.reimbursementStatus === 'REIMBURSED' ? '已报销' : '待报销'}</span>
                </span>
              )}
              {hasSplits && (
                <button
                  type="button"
                  id={`btn-split-toggle-${tx.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSplitExpand(tx.id);
                  }}
                  className={`px-1.5 py-0.2 sm:px-2.5 sm:py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold border inline-flex items-center gap-1 transition-all shadow-2xs cursor-pointer shrink-0 ${
                    isSplitExpanded
                      ? 'bg-indigo-600 text-white border-indigo-600 dark:bg-indigo-500 dark:border-indigo-500 shadow-sm'
                      : 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/60'
                  }`}
                  title={isSplitExpanded ? '点击收起已拆分子项明细' : '点击展开查看已拆分明细'}
                  aria-expanded={isSplitExpanded}
                >
                  <Split className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span>拆分 {tx.splitItems!.length} 项</span>
                </button>
              )}
              {tx.isRefund && (
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-800 shrink-0">
                  冲红
                </span>
              )}
              {tx.refundedAmount && tx.refundedAmount > 0 ? (
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-bold border border-amber-200 dark:border-amber-800 shrink-0">
                  已冲退 ¥{tx.refundedAmount.toFixed(0)}
                </span>
              ) : null}
              {tx.merchant && (
                <span className="hidden sm:inline text-[10px] text-slate-400 truncate max-w-[120px]">
                  商户: {tx.merchant}
                </span>
              )}
            </div>

            {/* Date, Time & Account Path */}
            <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] text-slate-400 mt-1 flex-wrap font-mono">
              <span className="font-medium text-slate-600 dark:text-slate-300">
                {tx.date}
              </span>
              {tx.time && (
                <span className="flex items-center gap-0.5 text-slate-500 dark:text-slate-400">
                  <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-400" />
                  {tx.time}
                </span>
              )}
              <span>·</span>
              <span className="text-slate-600 dark:text-slate-300 font-medium inline-flex items-center gap-1 truncate max-w-[120px] sm:max-w-none">
                <span>{acc?.name || '账户'}</span>
                {acc?.cardNumberLast4 && (
                  <span className="px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-mono text-[9px] sm:text-[10px] font-semibold border border-slate-200/60 dark:border-slate-700/60">
                    *{acc.cardNumberLast4}
                  </span>
                )}
              </span>
              {targetAcc && (
                <>
                  <span>➔</span>
                  <span className="text-slate-600 dark:text-slate-300 font-medium inline-flex items-center gap-1 truncate max-w-[120px] sm:max-w-none">
                    <span>{targetAcc.name}</span>
                    {targetAcc.cardNumberLast4 && (
                      <span className="px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-purple-600 dark:text-purple-400 font-mono text-[9px] sm:text-[10px] font-semibold border border-slate-200/60 dark:border-slate-700/60">
                        *{targetAcc.cardNumberLast4}
                      </span>
                    )}
                  </span>
                </>
              )}
              {tx.counterparty && (
                <span className="hidden sm:inline">
                  · 对方: {tx.counterparty}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Amount, Foreign Currency & Actions */}
        <div className="text-right flex items-center gap-2 sm:gap-5 flex-shrink-0">
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

            {/* Net expenditure after red-ink refund offset */}
            {isExpense && tx.refundedAmount && tx.refundedAmount > 0 && (
              <div className="text-[9px] sm:text-[10px] font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                净支: {formatCurrency(Math.max(0, tx.amount - tx.refundedAmount), privacyMode)}
              </div>
            )}

            {isForeign && curInfo && (
              <div className="text-[9px] sm:text-[10px] text-blue-700 dark:text-blue-300 font-mono">
                原币: {curInfo.symbol}{tx.originalAmount || tx.amount}
              </div>
            )}
          </div>

          {/* Quick Action buttons (大屏桌面端悬浮呈现，手机端由抽屉菜单承接以保持极简) */}
          <div className="hidden sm:flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
            {/* Split Expand/Collapse Action Button */}
            {hasSplits && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSplitExpand(tx.id);
                }}
                className={`p-1.5 rounded-lg transition-all flex items-center gap-1 ${
                  isSplitExpanded
                    ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-semibold'
                    : 'text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/50'
                }`}
                title={isSplitExpanded ? '收起拆分明细' : '展开拆分明细'}
                aria-label={isSplitExpanded ? '收起拆分明细' : '展开拆分明细'}
              >
                <Split className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Direct Red-ink Reversal Action for Expense Bills */}
            {isExpense && onRefundTransaction && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRefundTransaction(tx);
                }}
                className="px-2 py-1 rounded-lg text-xs font-semibold bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-900/60 transition-all flex items-center gap-1 shadow-2xs"
                title="对该笔支出账单平账冲红 (退款入账并冲减净支出)"
              >
                <RotateCcw className="w-3 h-3" />
                <span>冲红</span>
              </button>
            )}

            {/* Feature 2: Quick Duplicate / Clone Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setDuplicateTargetTx(tx);
              }}
              className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
              title="再记一笔 / 复制该账单"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setReceiptSingleTxId(tx.id);
                setIsReceiptModalOpen(true);
              }}
              className="p-1.5 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
              title="生成此笔消费小票"
            >
              <Receipt className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEditTransaction(tx);
              }}
              className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="编辑此记录"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (confirmDeleteId === tx.id) {
                  onDeleteTransaction(tx.id);
                  setConfirmDeleteId(null);
                } else {
                  setConfirmDeleteId(tx.id);
                  setTimeout(() => {
                    setConfirmDeleteId((cur) => (cur === tx.id ? null : cur));
                  }, 3500);
                }
              }}
              className={`p-1.5 rounded-lg transition-all flex items-center gap-1 ${
                confirmDeleteId === tx.id
                  ? 'bg-rose-600 text-white hover:bg-rose-700 px-2'
                  : 'text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
              }`}
              title={confirmDeleteId === tx.id ? '点击确认删除此记录' : '删除此记录'}
            >
              <Trash2 className="w-3.5 h-3.5" />
              {confirmDeleteId === tx.id && (
                <span className="text-[10px] font-bold">确认删除</span>
              )}
            </button>
          </div>

          {/* Mobile More Button (移动端操作触发按钮) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMobileActionTx(tx);
            }}
            className="sm:hidden p-1.5 -mr-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
            title="更多操作"
            aria-label="更多操作"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expanded Split Items Breakdown Drawer */}
        {hasSplits && isSplitExpanded && (
          <div className="border-t border-indigo-100/90 dark:border-indigo-900/50 bg-slate-50/80 dark:bg-slate-900/80 px-4 sm:px-6 py-3.5 space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                  <Split className="w-3.5 h-3.5" />
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                  拆分记账明细子项
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  (共 {tx.splitItems!.length} 笔)
                </span>
              </div>

              <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
                {(() => {
                  const splitSum = tx.splitItems!.reduce((acc, it) => acc + (it.amount || 0), 0);
                  const isForeign = Boolean(tx.currency && tx.currency !== 'CNY');
                  const targetBase = isForeign && tx.originalAmount !== undefined ? tx.originalAmount : tx.amount;
                  const curInfo = isForeign ? getCurrencyInfo(tx.currency!) : null;
                  const curSymbol = curInfo?.symbol || '¥';
                  const diff = Math.abs(splitSum - targetBase);
                  return (
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="text-slate-500 dark:text-slate-400">
                        子项合计:{' '}
                        <strong className="text-slate-900 dark:text-white font-bold">
                          {privacyMode ? '****' : `${curSymbol} ${splitSum.toFixed(2)}`}
                        </strong>
                      </span>
                      {diff < 0.01 ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-800 flex items-center gap-0.5">
                          <Check className="w-3 h-3" /> 完全匹配
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 font-bold border border-amber-200 dark:border-amber-800">
                          差额: {splitSum > targetBase ? '+' : ''}{curSymbol}{(splitSum - targetBase).toFixed(2)}
                        </span>
                      )}
                    </div>
                  );
                })()}

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditTransaction(tx);
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 transition-colors flex items-center gap-1 cursor-pointer"
                  title="在编辑窗口中调整或增删子项"
                >
                  <Pencil className="w-3 h-3" />
                  <span>编辑拆分</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSplitExpand(tx.id);
                  }}
                  className="px-2 py-1 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
                  title="收起子项明细"
                >
                  <span>收起</span>
                </button>
              </div>
            </div>

            {/* Split Sub-Items List */}
            <div className="space-y-1.5 pt-0.5">
              {tx.splitItems!.map((item, idx) => {
                const isForeign = Boolean(tx.currency && tx.currency !== 'CNY');
                const targetBase = isForeign && tx.originalAmount !== undefined ? tx.originalAmount : tx.amount;
                const percent = targetBase > 0 ? ((item.amount / targetBase) * 100).toFixed(1) : '0.0';
                const curInfo = isForeign ? getCurrencyInfo(tx.currency!) : null;
                const curSymbol = curInfo?.symbol || '¥';
                const subProject = item.projectId ? projectMap.get(item.projectId) : null;
                return (
                  <div
                    key={item.id || idx}
                    className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-3 text-xs shadow-2xs hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-5 h-5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-mono text-[10px] font-bold flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-900/60">
                        #{idx + 1}
                      </span>
                      <CategoryIcon
                        nameOrIcon={item.category}
                        className="w-4 h-4 text-slate-600 dark:text-slate-300 shrink-0"
                      />
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {item.category || '未分类'}
                        </span>
                        {item.subCategory && (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                            / {item.subCategory}
                          </span>
                        )}
                        {subProject && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 font-semibold">
                            📁 {subProject.name}
                          </span>
                        )}
                        {item.description && (
                          <span className="text-slate-500 dark:text-slate-400 text-[11px] truncate">
                            — {item.description}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 text-right font-mono">
                      <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-slate-400">
                        <div className="w-12 bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full"
                            style={{ width: `${Math.min(100, Math.max(2, parseFloat(percent)))}%` }}
                          />
                        </div>
                        <span className="w-10 text-right">{percent}%</span>
                      </div>
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                        {privacyMode ? '****' : `${curSymbol} ${item.amount.toFixed(2)}`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Metric Summary (与账本项目 / 信用卡专区顶部样式完全统一) */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 lg:p-8 shadow-sm relative">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200/70 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-xs font-semibold">
              <ListOrdered className="w-3.5 h-3.5" />
              <span>记账本</span>
            </div>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60">
              共 {(transactions || []).length} 笔明细
            </span>
            {selectedDateFilter && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                <span>已筛选: {selectedDateFilter}</span>
                <button
                  onClick={() => setSelectedDateFilter(null)}
                  className="hover:text-amber-900 dark:hover:text-amber-200"
                  title="清除日期筛选"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
            {currentUser && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>云端已同步</span>
              </span>
            )}
          </div>

          {/* Action Buttons: 纯功能图标展示，鼠标悬停显示文字浮层，与资产账户与导航栏风格统一 */}
          <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
            {/* 1. Generate Receipt Button (纯功能图标，悬停显示文字) */}
            <button
              id="btn-ledger-receipt"
              type="button"
              onClick={() => {
                setReceiptSingleTxId(null);
                setIsReceiptModalOpen(true);
              }}
              className="relative p-2 rounded-xl bg-transparent hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-center active:scale-95 group"
              title={
                selectedProjectId !== 'ALL' && selectedProjectId !== 'NONE'
                  ? `项目小票 (${projects.find((p) => p.id === selectedProjectId)?.name || '账本项目'})`
                  : '账单小票'
              }
              aria-label="账单小票"
            >
              <Receipt className="w-4 h-4 text-amber-500 transition-transform group-hover:scale-110" />
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-lg bg-slate-900/95 dark:bg-slate-800 text-white text-[11px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 z-50 shadow-md border border-slate-700/50">
                {selectedProjectId !== 'ALL' && selectedProjectId !== 'NONE'
                  ? `项目小票 (${projects.find((p) => p.id === selectedProjectId)?.name || '账本项目'})`
                  : '账单小票'}
              </span>
            </button>

            {/* 2. Recurring Tasks Button (纯功能图标，悬停显示文字) */}
            {onOpenRecurringTasks && (
              <button
                id="btn-ledger-recurring"
                type="button"
                onClick={onOpenRecurringTasks}
                className="relative p-2 rounded-xl bg-transparent hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-center active:scale-95 group"
                title="管理周期自动记账任务"
                aria-label="周期任务"
              >
                <CalendarClock className="w-4 h-4 text-indigo-500 transition-transform group-hover:scale-110" />
                {typeof recurringTasksCount === 'number' && recurringTasksCount > 0 && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.2 min-w-[18px] text-center rounded-full text-[10px] bg-indigo-600 text-white font-mono font-bold shadow-xs">
                    {recurringTasksCount}
                  </span>
                )}
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-lg bg-slate-900/95 dark:bg-slate-800 text-white text-[11px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 z-50 shadow-md border border-slate-700/50">
                  周期任务{typeof recurringTasksCount === 'number' && recurringTasksCount > 0 ? ` (${recurringTasksCount})` : ''}
                </span>
              </button>
            )}

            {/* 3. Trash Bin Button (纯功能图标，悬停显示文字) */}
            {onOpenTrashBin && (
              <button
                id="btn-ledger-trash"
                type="button"
                onClick={onOpenTrashBin}
                className="relative p-2 rounded-xl bg-transparent hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-center active:scale-95 group"
                title="查看已删除流水与一键防误删恢复"
                aria-label="回收站"
              >
                <ArchiveRestore className="w-4 h-4 text-rose-500 transition-transform group-hover:scale-110" />
                {typeof trashCount === 'number' && trashCount > 0 && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.2 min-w-[18px] text-center rounded-full text-[10px] bg-rose-600 text-white font-mono font-bold shadow-xs">
                    {trashCount}
                  </span>
                )}
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-lg bg-slate-900/95 dark:bg-slate-800 text-white text-[11px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 z-50 shadow-md border border-slate-700/50">
                  回收站{typeof trashCount === 'number' && trashCount > 0 ? ` (${trashCount})` : ''}
                </span>
              </button>
            )}

            {/* 4. Cloud Sync Button (纯功能图标，悬停显示文字) */}
            {onTriggerSync && (
              <button
                id="btn-ledger-cloud-sync"
                type="button"
                onClick={handleManualSync}
                disabled={isSyncing}
                className="relative p-2 rounded-xl bg-transparent text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-center active:scale-95 group disabled:opacity-50"
                title="立即同步最新账本明细到云端服务器"
                aria-label="云端同步"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-amber-600' : 'group-hover:rotate-180 transition-transform duration-300 text-slate-600 dark:text-slate-300'}`} />
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-lg bg-slate-900/95 dark:bg-slate-800 text-white text-[11px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 z-50 shadow-md border border-slate-700/50">
                  {isSyncing ? '正在同步...' : '云端同步'}
                </span>
              </button>
            )}

            {/* 5. Upload Import Button (纯功能图标，悬停显示文字) */}
            <button
              id="btn-ledger-upload"
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="relative p-2 rounded-xl bg-transparent hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-center active:scale-95 group"
              title="上传导入微信/支付宝账单、银行流水或标准表格"
              aria-label="上传导入"
            >
              <UploadCloud className="w-4 h-4 text-emerald-600 dark:text-emerald-400 transition-transform group-hover:scale-110" />
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-lg bg-slate-900/95 dark:bg-slate-800 text-white text-[11px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 z-50 shadow-md border border-slate-700/50">
                上传导入
              </span>
            </button>

            {/* 6. Export Button (纯功能图标，悬停显示文字) */}
            <button
              id="btn-ledger-export"
              type="button"
              onClick={() => setIsExportModalOpen(true)}
              className="relative p-2 rounded-xl bg-transparent hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-center active:scale-95 group"
              title="导出 Excel / CSV / JSON"
              aria-label="导出明细"
            >
              <Download className="w-4 h-4 text-blue-600 dark:text-blue-400 transition-transform group-hover:scale-110" />
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-lg bg-slate-900/95 dark:bg-slate-800 text-white text-[11px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 z-50 shadow-md border border-slate-700/50">
                导出明细
              </span>
            </button>

            {/* 7. Primary Add Record Button (与资产账户“添加资产”统一) */}
            <button
              id="btn-ledger-add"
              type="button"
              onClick={() => onOpenNewTx('EXPENSE', undefined, selectedDateFilter || undefined)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white text-xs sm:text-sm font-bold shadow-sm active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4 text-emerald-400 stroke-[3]" />
              <span>记一笔</span>
            </button>
          </div>
        </div>

        {/* Aggregate Stats Across All Transactions (移动端2列自适应精简排版，大屏5列统一呈现) */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-4 mt-5 sm:mt-6 pt-5 sm:pt-6 border-t border-slate-100 dark:border-slate-800">
          <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">流水总数</span>
            <div className="text-lg sm:text-2xl font-bold font-mono text-slate-900 dark:text-white mt-0.5 sm:mt-1">
              {(transactions || []).length}
            </div>
            <div className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 mt-0.5 sm:mt-1 truncate">
              支 {overallLedgerStats.expenseCount} 笔 · 收 {overallLedgerStats.incomeCount} 笔
            </div>
          </div>

          <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50">
            <span className="text-[11px] sm:text-xs text-emerald-700 dark:text-emerald-400 font-medium">总收入</span>
            <div className="text-lg sm:text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-0.5 sm:mt-1">
              +{formatCurrency(overallLedgerStats.totalIncome, privacyMode)}
            </div>
            <div className="text-[10px] sm:text-xs text-emerald-600/80 dark:text-emerald-500/80 mt-0.5 sm:mt-1 truncate">
              工资收入与报销收款
            </div>
          </div>

          <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-100/80 dark:border-rose-900/40">
            <span className="text-[11px] sm:text-xs text-rose-700 dark:text-rose-400 font-medium">退款冲红</span>
            <div className="text-lg sm:text-2xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-0.5 sm:mt-1">
              +{formatCurrency(overallLedgerStats.totalRefund, privacyMode)}
            </div>
            <div className="text-[10px] sm:text-xs text-rose-500/80 dark:text-rose-400/80 mt-0.5 sm:mt-1 truncate">
              已退款原路冲红抵消
            </div>
          </div>

          <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50">
            <span className="text-[11px] sm:text-xs text-rose-700 dark:text-rose-400 font-medium">实际支出</span>
            <div className="text-lg sm:text-2xl font-bold font-mono text-rose-700 dark:text-rose-400 mt-0.5 sm:mt-1">
              -{formatCurrency(overallLedgerStats.netExpense, privacyMode)}
            </div>
            <div className="text-[10px] sm:text-xs text-rose-600/80 dark:text-rose-500/80 mt-0.5 sm:mt-1 truncate">
              剔除退款后的净支出
            </div>
          </div>

          <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 col-span-2 lg:col-span-1">
            <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">净结余</span>
            <div
              className={`text-lg sm:text-2xl font-bold font-mono mt-0.5 sm:mt-1 ${
                overallLedgerStats.netBalance >= 0
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {overallLedgerStats.netBalance >= 0 ? '+' : ''}
              {formatCurrency(overallLedgerStats.netBalance, privacyMode)}
            </div>
            <div className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 mt-0.5 sm:mt-1 truncate">
              {overallLedgerStats.netBalance >= 0 ? '当期收支结余健康' : '支出大于收入'}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Collapsible Income/Expense Calendar Widget (折叠式收支日历，支持点击日期快速筛选并显示对应当天的消费列表) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs transition-all">
        {/* Calendar Header & Month Navigation */}
        <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${isCalendarExpanded ? 'pb-3 border-b border-slate-100 dark:border-slate-800' : ''}`}>
          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
            <button
              onClick={() => setIsCalendarExpanded((prev) => !prev)}
              className="flex items-center gap-2 text-left group"
              title={isCalendarExpanded ? '点击收起日历' : '点击展开日历'}
            >
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/60 group-hover:scale-105 transition-transform">
                <CalendarDays className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-mono flex items-center gap-2">
                  <span>{currentYear}年 {String(currentMonth).padStart(2, '0')}月 收支日历</span>
                  {selectedDateFilter && (
                    <span className="text-[11px] font-sans font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 animate-pulse">
                      已锁定: {selectedDateFilter}
                    </span>
                  )}
                </span>
              </div>
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
                className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-700 dark:text-slate-200 font-medium focus:outline-none"
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
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-mono">
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
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all shadow-2xs ${
                  isCalendarExpanded
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-slate-700'
                }`}
                title={isCalendarExpanded ? '点击收起收支日历' : '点击展开收支日历'}
              >
                <span>{isCalendarExpanded ? '收起日历' : '展开日历'}</span>
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
                    className={`h-[50px] sm:h-[54px] p-1 sm:p-1.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between select-none relative group ${
                      cell.isSelected
                        ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/50 ring-2 ring-emerald-500/30 shadow-xs'
                        : cell.isCurrentMonth
                        ? 'border-slate-200/60 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100/60 dark:hover:bg-slate-800/50'
                        : 'border-slate-100 dark:border-slate-800/30 bg-white dark:bg-slate-900/20 opacity-30 hover:opacity-60'
                    }`}
                    title={`${cell.dateStr} (点击快速筛选当天消费列表)`}
                  >
                    {/* Centered Day Number Header */}
                    <div className="relative flex items-center justify-between w-full">
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
                        <span className="text-[9px] font-mono font-medium px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                          {cell.summary!.totalCount}笔
                        </span>
                      )}
                    </div>

                    {/* Compact Amount / Indicator Badges */}
                    <div className="flex items-center gap-0.5 justify-between text-[9px] sm:text-[10px] font-mono leading-none truncate w-full px-0.5">
                      {hasExpense ? (
                        <span className="text-rose-600 dark:text-rose-400 truncate text-left font-medium">
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
            <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 mt-2.5 px-1">
              <span>💡 点击上方任一日历日期即可快速筛选显示当天明细；再次点击同一日期取消筛选</span>
              {selectedDateFilter && (
                <button
                  onClick={() => setSelectedDateFilter(null)}
                  className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-semibold"
                >
                  显示全月所有流水
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Feature 5: 收支结构与分类排行 Mini-Dashboard (支持点击分类交互式下钻筛选) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-900/60">
              <PieChart className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base font-bold text-slate-900 dark:text-white font-mono">
                  收支结构与分类排行
                </span>
                {selectedCategory !== 'ALL' && (
                  <span className="text-[11px] font-sans font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 animate-pulse flex items-center gap-1">
                    <span>已筛选: {selectedCategory}</span>
                    <button
                      onClick={() => setSelectedCategory('ALL')}
                      className="hover:text-rose-600 font-black ml-0.5"
                      title="清除分类筛选"
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                点击任一分类卡片即可直接交互式下钻筛选，查看对应全部流水
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Breakdown Type Switch */}
            <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700 text-xs">
              <button
                onClick={() => setBreakdownType('EXPENSE')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  breakdownType === 'EXPENSE'
                    ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-2xs font-semibold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                支出分类
              </button>
              <button
                onClick={() => setBreakdownType('INCOME')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  breakdownType === 'INCOME'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-2xs font-semibold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                收入来源
              </button>
            </div>

            <button
              onClick={() => setIsCategoryBreakdownExpanded((prev) => !prev)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 transition-all"
            >
              <span>{isCategoryBreakdownExpanded ? '收起' : '展开'}</span>
            </button>
          </div>
        </div>

        {isCategoryBreakdownExpanded && (
          <div className="pt-3 animate-in fade-in duration-150">
            {categoryStats.list.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                当前筛选条件下暂无{breakdownType === 'EXPENSE' ? '支出' : '收入'}明细
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {categoryStats.list.slice(0, 8).map((cat) => {
                  const isSelected = selectedCategory === cat.name;
                  return (
                    <button
                      key={cat.name}
                      onClick={() => setSelectedCategory(isSelected ? 'ALL' : cat.name)}
                      className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-600 ring-2 ring-emerald-500/30 shadow-xs'
                          : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100/60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <CategoryIcon nameOrIcon={cat.name} className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                            {cat.name}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-600 shrink-0">
                          {cat.percent.toFixed(1)}%
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between text-xs font-mono">
                        <span className={`font-bold ${breakdownType === 'EXPENSE' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {formatCurrency(cat.amount, privacyMode)}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {cat.count} 笔
                        </span>
                      </div>

                      {/* Percentage progress bar */}
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-2">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isSelected
                              ? 'bg-emerald-500'
                              : breakdownType === 'EXPENSE'
                              ? 'bg-rose-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(4, cat.percent))}%` }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Unified Filters & Search Toolbar (移动端2列并排自适应排列，大屏7列通栏展开) */}
      <div className="p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-2 sm:gap-2.5">
          {/* Search */}
          <div className="relative col-span-2 sm:col-span-2 lg:col-span-2">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
            <input
              id="ledger-search-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索项目、分类、备注、商户、标签..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-slate-400 focus:bg-white dark:focus:bg-slate-800"
            />
          </div>

          {/* Type Filter */}
          <div className="col-span-1">
            <select
              id="ledger-filter-type"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-2.5 sm:px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm focus:outline-none focus:border-slate-400 truncate"
            >
              <option value="ALL">全部交易类型</option>
              <option value="EXPENSE">支出消费</option>
              <option value="INCOME">收入进账</option>
              <option value="REIMBURSABLE">💼 待报销垫付款</option>
              <option value="SPLIT">🔀 拆分子项账单 ({totalSplitCount})</option>
              <option value="REFUND">平账冲红退费</option>
              <option value="TRANSFER">账户转账划转</option>
              <option value="REPAYMENT">信用卡与白条还款</option>
              <option value="LEND_OUT">借出款项</option>
              <option value="COLLECT_LENT">收回借款</option>
              <option value="BORROW_IN">借入款项</option>
              <option value="PAY_BORROW">归还借款</option>
            </select>
          </div>

          {/* Project Filter */}
          <div className="col-span-1">
            <select
              id="ledger-filter-project"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full px-2.5 sm:px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm focus:outline-none focus:border-indigo-400 font-medium truncate"
            >
              <option value="ALL">全部项目 ({projects.length})</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  📁 {p.name}
                </option>
              ))}
              <option value="NONE">未关联任何项目</option>
            </select>
          </div>

          {/* Account Filter */}
          <div className="col-span-1">
            <select
              id="ledger-filter-account"
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full px-2.5 sm:px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm focus:outline-none focus:border-slate-400 font-medium truncate"
            >
              <option value="ALL">全部关联账户 ({accounts.length})</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.bankName || a.name}{a.bankName && a.name !== a.bankName ? ` (${a.name})` : ''} {a.cardNumberLast4 ? `(*${a.cardNumberLast4})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Month Filter */}
          <div className="col-span-1">
            <select
              id="ledger-filter-month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-2.5 sm:px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm focus:outline-none focus:border-slate-400 truncate"
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
          <div className="col-span-2 sm:col-span-1">
            <select
              id="ledger-filter-currency"
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="w-full px-2.5 sm:px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm focus:outline-none focus:border-slate-400 truncate"
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

        {/* Feature 3: Expandable Advanced Multi-Dimensional Filter Drawer */}
        {isAdvancedFilterOpen && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3 animate-in fade-in duration-150">
            {/* Row 1: Amount Range Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300 w-20 shrink-0">
                💰 金额区间:
              </span>
              <div className="flex items-center gap-2 flex-wrap flex-1">
                <div className="flex items-center gap-1.5">
                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 text-slate-400 font-mono">¥</span>
                    <input
                      type="number"
                      placeholder="最低金额"
                      value={amountMin}
                      onChange={(e) => setAmountMin(e.target.value)}
                      className="w-24 pl-6 pr-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-mono text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <span className="text-slate-400">~</span>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 text-slate-400 font-mono">¥</span>
                    <input
                      type="number"
                      placeholder="最高金额"
                      value={amountMax}
                      onChange={(e) => setAmountMax(e.target.value)}
                      className="w-24 pl-6 pr-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-mono text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Quick Amount Tier Pills */}
                <div className="flex items-center gap-1 flex-wrap">
                  {[
                    { label: '全部金额', min: '', max: '' },
                    { label: '≤100元', min: '', max: '100' },
                    { label: '100~500元', min: '100', max: '500' },
                    { label: '500~2000元', min: '500', max: '2000' },
                    { label: '≥2000元 (大额)', min: '2000', max: '' },
                  ].map((tier) => {
                    const isTierActive = amountMin === tier.min && amountMax === tier.max;
                    return (
                      <button
                        key={tier.label}
                        type="button"
                        onClick={() => {
                          setAmountMin(tier.min);
                          setAmountMax(tier.max);
                        }}
                        className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all ${
                          isTierActive
                            ? 'bg-emerald-600 text-white font-semibold'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        {tier.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Row 2: Date Preset Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300 w-20 shrink-0">
                📅 快捷周期:
              </span>
              <div className="flex items-center gap-1.5 flex-wrap flex-1">
                {[
                  { id: 'ALL', label: '全部' },
                  { id: 'TODAY', label: '今天' },
                  { id: 'YESTERDAY', label: '昨天' },
                  { id: 'THIS_WEEK', label: '本周' },
                  { id: 'LAST_7_DAYS', label: '近7天' },
                  { id: 'THIS_MONTH', label: '本月' },
                  { id: 'LAST_MONTH', label: '上月' },
                  { id: 'THIS_YEAR', label: '今年' },
                  { id: 'CUSTOM', label: '自定义起止' },
                ].map((p) => {
                  const isPresetActive = selectedDatePreset === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedDatePreset(p.id as any)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                        isPresetActive
                          ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}

                {/* Custom Date Range Pickers */}
                {selectedDatePreset === 'CUSTOM' && (
                  <div className="flex items-center gap-1.5 ml-1">
                    <input
                      type="date"
                      value={customDateStart}
                      onChange={(e) => setCustomDateStart(e.target.value)}
                      className="px-2 py-0.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-mono"
                    />
                    <span className="text-slate-400">至</span>
                    <input
                      type="date"
                      value={customDateEnd}
                      onChange={(e) => setCustomDateEnd(e.target.value)}
                      className="px-2 py-0.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-mono"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

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

          <div className="flex items-center gap-2 flex-wrap">
            {/* Quick Filter Pill for Split Transactions */}
            {totalSplitCount > 0 && (
              <button
                type="button"
                id="btn-filter-split-txs"
                onClick={() => setSelectedType((prev) => (prev === 'SPLIT' ? 'ALL' : 'SPLIT'))}
                className={`text-xs px-2.5 py-1 rounded-xl border flex items-center gap-1.5 transition-all shadow-2xs ${
                  selectedType === 'SPLIT'
                    ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                    : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/80 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 font-medium'
                }`}
                title="快速仅查看已拆分子项的账单"
              >
                <Split className="w-3.5 h-3.5" />
                <span>已拆分账单 ({totalSplitCount})</span>
              </button>
            )}

            {/* Feature 3: Advanced Filter Toggle Button */}
            <button
              onClick={() => setIsAdvancedFilterOpen((prev) => !prev)}
              className={`text-xs px-2.5 py-1 rounded-xl border flex items-center gap-1.5 font-medium transition-all ${
                isAdvancedFilterOpen || amountMin || amountMax || selectedDatePreset !== 'ALL'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 font-semibold shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700 hover:bg-slate-200'
              }`}
              title="展开金额区间、时间范围等高级多维筛选"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>高级筛选</span>
              {(amountMin || amountMax || selectedDatePreset !== 'ALL') && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              )}
            </button>

            <button
              onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
              className="text-xs text-slate-600 dark:text-slate-300 hover:text-emerald-600 flex items-center gap-1 font-medium transition-colors"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{sortOrder === 'desc' ? '最新在前' : '最早在前'}</span>
            </button>

            <button
              onClick={() => downloadTransactionTemplate('csv')}
              className="text-xs text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1 transition-colors"
              title="下载标准 CSV 导入模板"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>模板</span>
            </button>

            {(searchTerm ||
              selectedDateFilter ||
              selectedType !== 'ALL' ||
              selectedCategory !== 'ALL' ||
              selectedProjectId !== 'ALL' ||
              selectedAccountId !== 'ALL' ||
              selectedMonth !== 'ALL' ||
              selectedCurrency !== 'ALL' ||
              amountMin ||
              amountMax ||
              selectedDatePreset !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedDateFilter(null);
                  setSelectedType('ALL');
                  setSelectedCategory('ALL');
                  setSelectedProjectId('ALL');
                  setSelectedAccountId('ALL');
                  setSelectedMonth('ALL');
                  setSelectedCurrency('ALL');
                  setAmountMin('');
                  setAmountMax('');
                  setSelectedDatePreset('ALL');
                  setCustomDateStart('');
                  setCustomDateEnd('');
                }}
                className="text-xs text-rose-500 hover:text-rose-600 font-semibold ml-1"
              >
                重置全部筛选
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. Sequential Chronological Transactions List (账本明细 - 支持按天聚合时间轴与连续平铺双视图，支持批量多选) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs overflow-hidden transition-all">
        {/* Section Header: 账本明细卡片头部 (移动端精简边距与控件流式对齐) */}
        <div className="p-3.5 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
            <div className="p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/60">
              <ReceiptText className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-mono tracking-tight">
                账本明细
              </span>
              <span className="text-xs px-2 sm:px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold font-mono border border-slate-200/60 dark:border-slate-700">
                共 {filteredTransactions.length} 笔
              </span>
            </div>

            {selectedDateFilter && (
              <span className="text-xs px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-medium border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                <span>📅 已选: {selectedDateFilter}</span>
                <button
                  onClick={() => setSelectedDateFilter(null)}
                  className="text-emerald-700 dark:text-emerald-400 hover:text-rose-600 font-bold ml-0.5"
                  title="清除日期过滤"
                >
                  ×
                </button>
              </span>
            )}

            {selectedCategory !== 'ALL' && (
              <span className="text-xs px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 font-medium border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
                <span>🏷️ 已选: {selectedCategory}</span>
                <button
                  onClick={() => setSelectedCategory('ALL')}
                  className="text-indigo-700 dark:text-indigo-400 hover:text-rose-600 font-bold ml-0.5"
                  title="清除分类过滤"
                >
                  ×
                </button>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-mono text-slate-400 flex-wrap justify-between sm:justify-end w-full sm:w-auto">
            {/* Feature 4: View Mode Switcher (按天分组 vs 连续列表) */}
            <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700">
              <button
                type="button"
                onClick={() => handleToggleViewMode('GROUPED')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-all ${
                  viewMode === 'GROUPED'
                    ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="按日期分组时间轴展示"
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>按天分组</span>
              </button>
              <button
                type="button"
                onClick={() => handleToggleViewMode('FLAT')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-all ${
                  viewMode === 'FLAT'
                    ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="连续平铺列表展示"
              >
                <Rows3 className="w-3.5 h-3.5" />
                <span>连续列表</span>
              </button>
            </div>

            {/* Feature 1: Batch Mode Toggle Button */}
            <button
              onClick={() => {
                setIsBatchMode((prev) => !prev);
                if (isBatchMode) {
                  setSelectedTxIds(new Set());
                }
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl font-semibold border transition-all shadow-2xs ${
                isBatchMode
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700'
              }`}
              title="开启或退出批量管理模式"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>{isBatchMode ? `批量中 (${selectedTxIds.size})` : '批量管理'}</span>
            </button>

            {/* Split Transactions: Expand All / Collapse All Button */}
            {filteredSplitCount > 0 && (
              <button
                type="button"
                id="btn-toggle-all-splits"
                onClick={handleToggleAllSplits}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all shadow-2xs cursor-pointer ${
                  isAllSplitsExpanded
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                }`}
                title={isAllSplitsExpanded ? '一键收起所有已拆分账单的子项明细' : '一键展开所有已拆分账单的子项明细'}
              >
                <Split className="w-3.5 h-3.5" />
                <span>{isAllSplitsExpanded ? '收起全部拆分' : `展开全部拆分 (${filteredSplitCount})`}</span>
              </button>
            )}

            <button
              onClick={() => {
                setReceiptSingleTxId(null);
                setIsReceiptModalOpen(true);
              }}
              className="relative p-1.5 rounded-xl bg-transparent hover:bg-amber-50 dark:hover:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center group"
              title="一键生成当前明细小票（支持导出当前所选项目的账单小票）"
              aria-label="账单小票"
            >
              <Receipt className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-lg bg-slate-900/95 dark:bg-slate-800 text-white text-[11px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 z-50 shadow-md border border-slate-700/50">
                {selectedProjectId !== 'ALL' && selectedProjectId !== 'NONE'
                  ? `生成「${projects.find((p) => p.id === selectedProjectId)?.name || '项目'}」小票`
                  : '账单小票'}
              </span>
            </button>

            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium border border-slate-200/80 dark:border-slate-700 transition-colors shadow-2xs"
              title="点击切换时间排序"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{sortOrder === 'desc' ? '倒序' : '正序'}</span>
            </button>
          </div>
        </div>

        {/* Feature 1: Batch Actions Assistant Bar (当开启批量管理时显示快速全选助手) */}
        {isBatchMode && (
          <div className="px-4 py-2.5 bg-emerald-50/70 dark:bg-emerald-950/40 border-b border-emerald-100 dark:border-emerald-900/40 flex items-center justify-between text-xs flex-wrap gap-2 animate-in fade-in duration-150">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
              <span className="font-semibold text-emerald-800 dark:text-emerald-300">
                ✓ 批量模式已开启
              </span>
              <span>·</span>
              <span>
                已选 <strong className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">{selectedTxIds.size}</strong> / {filteredTransactions.length} 笔
              </span>
              {selectedTxIds.size > 0 && (
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 hidden sm:inline">
                  (已选支出: -{formatCurrency(batchSelectedStats.expense, privacyMode)} / 收入: +{formatCurrency(batchSelectedStats.income, privacyMode)})
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAllFiltered}
                className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-emerald-50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-semibold"
              >
                全选本页 ({filteredTransactions.length})
              </button>
              <button
                type="button"
                onClick={handleInvertSelection}
                className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
              >
                反选
              </button>
              {selectedTxIds.size > 0 && (
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-rose-50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
                >
                  清空已选
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setIsBatchMode(false);
                  setSelectedTxIds(new Set());
                }}
                className="px-2 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium"
              >
                退出
              </button>
            </div>
          </div>
        )}

        {/* Dedicated Daily Focus Consumption Banner */}
        {selectedDateFilter && (
          <div className="p-3.5 sm:p-4 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-blue-950/40 border-b border-emerald-200/60 dark:border-emerald-900/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white font-mono">
                    {selectedDateFilter} {getWeekdayName(selectedDateFilter)} 当天账单明细
                  </h3>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-mono">
                    共 {filteredTransactions.length} 笔流水
                  </span>
                </div>
                <div className="flex items-center gap-2.5 mt-0.5 text-xs font-mono flex-wrap">
                  <span className="text-rose-600 dark:text-rose-400 font-bold">
                    当日支出: -{formatCurrency(filteredExpense, privacyMode)}
                  </span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                    当日收入: +{formatCurrency(filteredIncome, privacyMode)}
                  </span>
                  <span className="text-slate-600 dark:text-slate-300 font-medium">
                    收支净额: {formatCurrency(filteredIncome - filteredExpense, privacyMode)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                id="btn-add-for-selected-date"
                onClick={() => onOpenNewTx('EXPENSE', undefined, selectedDateFilter)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
                title={`为 ${selectedDateFilter} 补记一笔`}
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>为该日记一笔</span>
              </button>
              <button
                onClick={() => setSelectedDateFilter(null)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 shadow-2xs transition-all"
                title="返回查看全部流水"
              >
                <X className="w-3.5 h-3.5 text-slate-400" />
                <span>查看全部流水</span>
              </button>
            </div>
          </div>
        )}

        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-4">
            <ReceiptText className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
            <div>
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                {selectedDateFilter ? `「${selectedDateFilter}」当天暂无记账明细` : '暂无符合条件的记账明细'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {selectedDateFilter
                  ? `点击下方按钮即可为 ${selectedDateFilter} 快速补录消费账单`
                  : '您可以点击右上角“记一笔”快速添加，或点击“批量导入”上传历史账单'}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => onOpenNewTx('EXPENSE', undefined, selectedDateFilter || undefined)}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-700 text-white font-semibold text-xs sm:text-sm hover:bg-slate-800 transition-all inline-flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4 text-emerald-400" />
                <span>{selectedDateFilter ? `为 ${selectedDateFilter} 记一笔` : '记一笔账单'}</span>
              </button>
              {!selectedDateFilter && (
                <button
                  onClick={() => setIsImportModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 font-semibold text-xs sm:text-sm hover:bg-emerald-100 transition-all inline-flex items-center gap-1.5"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>批量导入</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div>
            {/* Feature 4: Grouped Timeline View (按天分组时间轴) */}
            {viewMode === 'GROUPED' ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {groupedTransactions.map((group) => (
                  <div key={group.date} className="relative">
                    {/* Day Group Header Bar (移动端自适应紧凑单行对齐) */}
                    <div className="px-3.5 sm:px-5 py-2 sm:py-2.5 bg-slate-50/90 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-bold font-mono text-slate-800 dark:text-slate-100">
                          {group.date}
                        </span>
                        <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                          {group.weekday}
                        </span>
                        {group.isToday && (
                          <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                            今天
                          </span>
                        )}
                        {group.isYesterday && (
                          <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                            昨天
                          </span>
                        )}
                        <span className="text-[10px] sm:text-[11px] text-slate-400 font-mono">
                          ({group.transactions.length}笔)
                        </span>
                      </div>

                      <div className="flex items-center gap-2 sm:gap-3 text-[11px] sm:text-xs font-mono ml-auto sm:ml-0">
                        {group.totalExpense > 0 && (
                          <span className="text-rose-600 dark:text-rose-400 font-medium">
                            支: -{formatCurrency(group.totalExpense, privacyMode)}
                          </span>
                        )}
                        {group.totalIncome > 0 && (
                          <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                            收: +{formatCurrency(group.totalIncome, privacyMode)}
                          </span>
                        )}
                        <span className={`text-[10px] sm:text-[11px] font-semibold ${group.net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>
                          结: {group.net >= 0 ? '+' : ''}{formatCurrency(group.net, privacyMode)}
                        </span>
                      </div>
                    </div>

                    {/* Day's Transactions List */}
                    <div className="divide-y divide-slate-100/70 dark:divide-slate-800/60">
                      {group.transactions.map((tx) => renderTransactionRow(tx))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Flat Continuous List View (连续列表) */
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredTransactions.map((tx) => renderTransactionRow(tx))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Feature 1: Floating Batch Dock (固定于底部中央悬浮 dock) */}
      {isBatchMode && selectedTxIds.size > 0 && (
        <div className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-700 shadow-2xl rounded-2xl px-4 py-3 flex items-center gap-3 sm:gap-4 flex-wrap max-w-[95vw] animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
              已选 <strong className="text-emerald-600 dark:text-emerald-400 font-mono text-base">{selectedTxIds.size}</strong> 笔
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono hidden md:inline">
              (支: -{formatCurrency(batchSelectedStats.expense, privacyMode)} / 收: +{formatCurrency(batchSelectedStats.income, privacyMode)})
            </span>
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <button
              onClick={() => {
                setBatchSelectedCategory(getStoredExpenseCategories(currentUser?.id)[0]?.name || '餐饮美食');
                setBatchModal('CATEGORY');
              }}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1 transition-all"
            >
              <Tag className="w-3.5 h-3.5 text-indigo-500" />
              <span>修改分类</span>
            </button>

            <button
              onClick={() => {
                setBatchSelectedProject(projects[0]?.id || 'CLEAR');
                setBatchModal('PROJECT');
              }}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1 transition-all"
            >
              <FolderKanban className="w-3.5 h-3.5 text-blue-500" />
              <span>指派项目</span>
            </button>

            <button
              onClick={handleBatchExportSelected}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1 transition-all"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>导出CSV</span>
            </button>

            <button
              onClick={() => setBatchModal('DELETE')}
              className="px-2.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-200/80 dark:border-rose-900/80 flex items-center gap-1 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>批量删除</span>
            </button>

            <button
              onClick={handleClearSelection}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-all"
              title="清空当前勾选"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Feature 1: Batch Delete Confirm Modal */}
      {batchModal === 'DELETE' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  确认批量删除流水？
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  将永久删除已勾选的 {selectedTxIds.size} 笔账单记录
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 space-y-1">
              <p className="font-semibold">⚠️ 重要提示：</p>
              <p>相关账户的余额将自动进行原路回退与冲账，操作后无法撤销。</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setBatchModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleExecuteBatchDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
              >
                确认删除 {selectedTxIds.size} 笔
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feature 1: Batch Assign Project Modal */}
      {batchModal === 'PROJECT' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-blue-600">
                <FolderKanban className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  批量指派归属项目
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  为选中的 {selectedTxIds.size} 笔账单流水统一关联项目
                </p>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                选择目标项目:
              </label>
              <select
                value={batchSelectedProject}
                onChange={(e) => setBatchSelectedProject(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-sm font-medium focus:outline-none focus:border-indigo-500"
              >
                <option value="CLEAR">❌ 清除项目关联 (设为无项目)</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    📁 {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setBatchModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleExecuteBatchProject}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
              >
                确认应用
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feature 1: Batch Modify Category Modal */}
      {batchModal === 'CATEGORY' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600">
                <Tag className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  批量修改消费分类
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  将选中的 {selectedTxIds.size} 笔账单流水分类统一修改
                </p>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                选择新分类:
              </label>
              <select
                value={batchSelectedCategory}
                onChange={(e) => setBatchSelectedCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-sm font-medium focus:outline-none focus:border-indigo-500"
              >
                <optgroup label="支出常用分类">
                  {getStoredExpenseCategories(currentUser?.id).map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="收入来源分类">
                  {getStoredIncomeCategories(currentUser?.id).map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setBatchModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleExecuteBatchCategory}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
              >
                确认修改分类
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feature 2: Quick Duplicate Transaction Modal (一键再记一笔 / 极速克隆) */}
      {duplicateTargetTx && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400">
                <CopyPlus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  再记一笔 / 复制该账单
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  以原账单为模板，极速记录一笔新消费
                </p>
              </div>
            </div>

            {/* Transaction Preview Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-500">账单描述:</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">
                  {duplicateTargetTx.description || duplicateTargetTx.category}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-500">交易金额:</span>
                <span className="font-bold text-base text-rose-600 dark:text-rose-400">
                  ¥{duplicateTargetTx.amount.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-500">扣款账户:</span>
                <span className="text-slate-700 dark:text-slate-300">
                  {accountMap.get(duplicateTargetTx.accountId)?.name || '原账户'}
                </span>
              </div>
              {duplicateTargetTx.projectName && (
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-500">归属项目:</span>
                  <span className="text-indigo-600 dark:text-indigo-400">
                    📁 {duplicateTargetTx.projectName}
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => handleInstantCloneTx(duplicateTargetTx)}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-xs active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span>⚡ 一键极速入账 (记录为今天消费)</span>
              </button>

              <button
                type="button"
                onClick={() => handleEditCloneTx(duplicateTargetTx)}
                className="w-full py-2 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2"
              >
                <Pencil className="w-3.5 h-3.5 text-slate-400" />
                <span>载入记账表单微调（修改金额/时间）</span>
              </button>
            </div>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setDuplicateTargetTx(null)}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-medium"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

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
          allTransactions={sortedTransactions}
          filteredTransactions={filteredTransactions}
          transactions={sortedTransactions}
          accounts={accounts}
          privacyMode={privacyMode}
          onClose={() => setIsExportModalOpen(false)}
          onShowToast={onShowToast}
        />
      )}

      {/* Consumption Receipt Modal (生动逼真出票动效与小票分享，全面支持账本项目打单) */}
      {isReceiptModalOpen && (
        <ReceiptModal
          isOpen={isReceiptModalOpen}
          onClose={() => {
            setIsReceiptModalOpen(false);
            setReceiptSingleTxId(null);
          }}
          transactions={sortedTransactions}
          accounts={accounts}
          projects={projects}
          selectedDate={selectedDateFilter}
          initialSingleTxId={receiptSingleTxId}
          initialProjectId={selectedProjectId !== 'ALL' && selectedProjectId !== 'NONE' ? selectedProjectId : null}
        />
      )}

      {/* Mobile Transaction Action Drawer / Bottom Sheet (移动端专用大触控区优雅操作抽屉) */}
      {mobileActionTx && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
          onClick={() => setMobileActionTx(null)}
        >
          <div
            className="w-full sm:max-w-md bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header: Drag handle indicator for mobile */}
            <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto sm:hidden -mt-1 mb-2" />

            {/* Transaction Overview */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                    mobileActionTx.type === 'EXPENSE'
                      ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400'
                      : mobileActionTx.type === 'INCOME'
                      ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400'
                      : mobileActionTx.type === 'REPAYMENT'
                      ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400'
                      : 'bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400'
                  }`}
                >
                  <CategoryIcon nameOrIcon={mobileActionTx.category} className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight truncate">
                    {mobileActionTx.description || mobileActionTx.category}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono mt-0.5 truncate">
                    <span>{mobileActionTx.date}</span>
                    {mobileActionTx.time && <span>{mobileActionTx.time}</span>}
                    <span>·</span>
                    <span>{accountMap.get(mobileActionTx.accountId)?.name || '账户'}</span>
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div
                  className={`text-xl font-black font-mono ${
                    mobileActionTx.type === 'EXPENSE'
                      ? 'text-rose-600 dark:text-rose-400'
                      : mobileActionTx.type === 'INCOME'
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-blue-600 dark:text-blue-400'
                  }`}
                >
                  {mobileActionTx.type === 'EXPENSE'
                    ? `-${formatCurrency(mobileActionTx.amount, privacyMode)}`
                    : mobileActionTx.type === 'INCOME'
                    ? `+${formatCurrency(mobileActionTx.amount, privacyMode)}`
                    : formatCurrency(mobileActionTx.amount, privacyMode)}
                </div>
                {mobileActionTx.projectName && (
                  <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 block truncate max-w-[120px]">
                    📁 {mobileActionTx.projectName}
                  </span>
                )}
              </div>
            </div>

            {/* Quick Details Chips */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">分类</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">{mobileActionTx.category}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">交易账户</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200 truncate block">
                  {accountMap.get(mobileActionTx.accountId)?.name || '未指定'}
                </span>
              </div>
              {mobileActionTx.merchant && (
                <div>
                  <span className="text-slate-400 block text-[10px]">商户名称</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200 truncate block">{mobileActionTx.merchant}</span>
                </div>
              )}
              {mobileActionTx.tag && (
                <div>
                  <span className="text-slate-400 block text-[10px]">标签</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">#{mobileActionTx.tag}</span>
                </div>
              )}
              {mobileActionTx.refundedAmount && mobileActionTx.refundedAmount > 0 ? (
                <div>
                  <span className="text-slate-400 block text-[10px]">已冲红退款</span>
                  <span className="font-semibold text-amber-600 dark:text-amber-400 font-mono">
                    ¥{mobileActionTx.refundedAmount.toFixed(2)}
                  </span>
                </div>
              ) : null}
              {mobileActionTx.splitItems && mobileActionTx.splitItems.length > 0 ? (
                <div>
                  <span className="text-slate-400 block text-[10px]">拆分明细</span>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                    已拆分 {mobileActionTx.splitItems.length} 项
                  </span>
                </div>
              ) : null}
            </div>

            {/* Action Grid (Large Touch Targets for Mobile) */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  const tx = mobileActionTx;
                  setMobileActionTx(null);
                  onEditTransaction(tx);
                }}
                className="py-3 px-3.5 rounded-2xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs active:scale-95 transition-all"
              >
                <Pencil className="w-4 h-4 text-emerald-400" />
                <span>编辑账单</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const tx = mobileActionTx;
                  setMobileActionTx(null);
                  setDuplicateTargetTx(tx);
                }}
                className="py-3 px-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 font-bold text-xs border border-emerald-200 dark:border-emerald-800 flex items-center justify-center gap-2 shadow-2xs active:scale-95 transition-all"
              >
                <Copy className="w-4 h-4 text-emerald-600" />
                <span>再记一笔</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const txId = mobileActionTx.id;
                  setMobileActionTx(null);
                  setReceiptSingleTxId(txId);
                  setIsReceiptModalOpen(true);
                }}
                className="py-3 px-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-700 dark:text-amber-300 font-bold text-xs border border-amber-200 dark:border-amber-800 flex items-center justify-center gap-2 shadow-2xs active:scale-95 transition-all"
              >
                <Receipt className="w-4 h-4 text-amber-600" />
                <span>消费小票</span>
              </button>

              {mobileActionTx.type === 'EXPENSE' && onRefundTransaction && (
                <button
                  type="button"
                  onClick={() => {
                    const tx = mobileActionTx;
                    setMobileActionTx(null);
                    onRefundTransaction(tx);
                  }}
                  className="py-3 px-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 font-bold text-xs border border-rose-200 dark:border-rose-900/60 flex items-center justify-center gap-2 shadow-2xs active:scale-95 transition-all"
                >
                  <RotateCcw className="w-4 h-4 text-rose-600" />
                  <span>平账冲红</span>
                </button>
              )}

              {mobileActionTx.splitItems && mobileActionTx.splitItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    toggleSplitExpand(mobileActionTx.id);
                    setMobileActionTx(null);
                  }}
                  className="py-3 px-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-bold text-xs border border-indigo-200 dark:border-indigo-800 flex items-center justify-center gap-2 shadow-2xs active:scale-95 transition-all"
                >
                  <Split className="w-4 h-4 text-indigo-600" />
                  <span>
                    {expandedSplitTxIds.has(mobileActionTx.id) ? '收起拆分' : '查看拆分'}
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  const txId = mobileActionTx.id;
                  setMobileActionTx(null);
                  if (confirmDeleteId === txId) {
                    onDeleteTransaction(txId);
                    setConfirmDeleteId(null);
                  } else {
                    setConfirmDeleteId(txId);
                    setTimeout(() => {
                      setConfirmDeleteId((cur) => (cur === txId ? null : cur));
                    }, 4000);
                  }
                }}
                className={`py-3 px-3.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  confirmDeleteId === mobileActionTx.id
                    ? 'bg-rose-600 text-white col-span-2'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 hover:text-rose-600 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700'
                }`}
              >
                <Trash2 className="w-4 h-4 text-rose-500" />
                <span>{confirmDeleteId === mobileActionTx.id ? '再次点击确认删除' : '删除记录'}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setMobileActionTx(null)}
              className="w-full py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-100/60 dark:bg-slate-800/60"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
