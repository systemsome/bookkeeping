import React, { useState, useMemo, useEffect } from 'react';
import {
  Download,
  FileSpreadsheet,
  FileText,
  FileJson,
  X,
  Check,
  Calendar,
  Filter,
  Search,
  CheckSquare,
  Square,
  CreditCard,
  Building2,
  Tag,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  RotateCcw,
  Sparkles,
  Eye,
  CheckCheck,
} from 'lucide-react';
import { Transaction, FinancialAccount, TransactionType } from '../types';
import {
  exportTransactions,
  TransactionExportOptions,
  getTransactionTypeLabel,
} from '../lib/transactionImportExport';
import { formatCurrency } from '../lib/formatters';
import { CategoryIcon } from './CategoryIcon';

interface TransactionExportModalProps {
  isOpen?: boolean;
  allTransactions?: Transaction[];
  filteredTransactions?: Transaction[];
  transactions?: Transaction[];
  accounts: FinancialAccount[];
  privacyMode?: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

type DatePresetType =
  | 'ALL'
  | 'THIS_MONTH'
  | 'LAST_MONTH'
  | 'LAST_7_DAYS'
  | 'LAST_30_DAYS'
  | 'LAST_90_DAYS'
  | 'THIS_YEAR'
  | 'CUSTOM';

const formatDateStr = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getPresetDateRange = (preset: DatePresetType): { startDate: string; endDate: string } => {
  const now = new Date();
  const todayStr = formatDateStr(now);

  if (preset === 'THIS_MONTH') {
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { startDate: formatDateStr(firstDay), endDate: formatDateStr(lastDay) };
  }
  if (preset === 'LAST_MONTH') {
    const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
    return { startDate: formatDateStr(firstDay), endDate: formatDateStr(lastDay) };
  }
  if (preset === 'LAST_7_DAYS') {
    const start = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
    return { startDate: formatDateStr(start), endDate: todayStr };
  }
  if (preset === 'LAST_30_DAYS') {
    const start = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
    return { startDate: formatDateStr(start), endDate: todayStr };
  }
  if (preset === 'LAST_90_DAYS') {
    const start = new Date(now.getTime() - 89 * 24 * 60 * 60 * 1000);
    return { startDate: formatDateStr(start), endDate: todayStr };
  }
  if (preset === 'THIS_YEAR') {
    const firstDay = new Date(now.getFullYear(), 0, 1);
    const lastDay = new Date(now.getFullYear(), 11, 31);
    return { startDate: formatDateStr(firstDay), endDate: formatDateStr(lastDay) };
  }
  return { startDate: '', endDate: '' };
};

export const TransactionExportModal: React.FC<TransactionExportModalProps> = ({
  allTransactions = [],
  filteredTransactions = [],
  transactions = [],
  accounts = [],
  privacyMode = false,
  onClose,
  onShowToast,
}) => {
  // Source transaction list
  const effectiveAll = useMemo(() => {
    if (allTransactions.length > 0) return allTransactions;
    if (transactions && transactions.length > 0) return transactions;
    return [];
  }, [allTransactions, transactions]);

  // Account lookup map
  const accountMap = useMemo(() => {
    const map = new Map<string, FinancialAccount>();
    accounts.forEach((a) => map.set(a.id, a));
    return map;
  }, [accounts]);

  // Export format & options
  const [exportFormat, setExportFormat] = useState<'xlsx' | 'csv' | 'json'>('xlsx');
  const [customFileName, setCustomFileName] = useState('');

  // Date Range & Filters
  const [datePreset, setDatePreset] = useState<DatePresetType>('THIS_MONTH');
  const initialDates = useMemo(() => getPresetDateRange('THIS_MONTH'), []);
  const [startDate, setStartDate] = useState<string>(initialDates.startDate);
  const [endDate, setEndDate] = useState<string>(initialDates.endDate);
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [accountFilter, setAccountFilter] = useState<string>('ALL');
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  // Selected Transaction IDs
  const [selectedTxIds, setSelectedTxIds] = useState<Set<string>>(new Set());

  // Handle Preset Change
  const handlePresetSelect = (preset: DatePresetType) => {
    setDatePreset(preset);
    if (preset !== 'CUSTOM') {
      const range = getPresetDateRange(preset);
      setStartDate(range.startDate);
      setEndDate(range.endDate);
    }
  };

  // Filter candidate transactions based on date range, type, account, keyword
  const filteredCandidates = useMemo(() => {
    return effectiveAll.filter((tx) => {
      // 1. Date Range filter
      if (startDate && tx.date < startDate) return false;
      if (endDate && tx.date > endDate) return false;

      // 2. Type filter
      if (typeFilter !== 'ALL') {
        if (typeFilter === 'DEBT') {
          if (!['LEND_OUT', 'COLLECT_LENT', 'BORROW_IN', 'PAY_BORROW'].includes(tx.type)) return false;
        } else if (tx.type !== typeFilter) {
          return false;
        }
      }

      // 3. Account filter
      if (accountFilter !== 'ALL') {
        if (tx.accountId !== accountFilter && tx.targetAccountId !== accountFilter) {
          return false;
        }
      }

      // 4. Search keyword
      if (searchKeyword.trim()) {
        const q = searchKeyword.toLowerCase().trim();
        const acc = accountMap.get(tx.accountId);
        const targetAcc = tx.targetAccountId ? accountMap.get(tx.targetAccountId) : null;
        const match =
          (tx.note && tx.note.toLowerCase().includes(q)) ||
          (tx.merchant && tx.merchant.toLowerCase().includes(q)) ||
          (tx.category && tx.category.toLowerCase().includes(q)) ||
          (tx.tags && tx.tags.some((tag) => tag.toLowerCase().includes(q))) ||
          (acc && (acc.name.toLowerCase().includes(q) || (acc.bankName && acc.bankName.toLowerCase().includes(q)))) ||
          (targetAcc && (targetAcc.name.toLowerCase().includes(q) || (targetAcc.bankName && targetAcc.bankName.toLowerCase().includes(q))));
        if (!match) return false;
      }

      return true;
    });
  }, [effectiveAll, startDate, endDate, typeFilter, accountFilter, searchKeyword, accountMap]);

  // Whenever filteredCandidates change, default to selecting all of them
  useEffect(() => {
    setSelectedTxIds(new Set(filteredCandidates.map((t) => t.id)));
  }, [filteredCandidates]);

  // Actual transactions to be exported (intersecting candidates and checked items)
  const targetTransactions = useMemo(() => {
    return filteredCandidates.filter((t) => selectedTxIds.has(t.id));
  }, [filteredCandidates, selectedTxIds]);

  // Calculate totals
  const totalExpense = useMemo(() => {
    return targetTransactions
      .filter((t) => t && t.type === 'EXPENSE')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
  }, [targetTransactions]);

  const totalIncome = useMemo(() => {
    return targetTransactions
      .filter((t) => t && t.type === 'INCOME')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
  }, [targetTransactions]);

  const netBalance = totalIncome - totalExpense;

  // Toggle single item
  const handleToggleTx = (id: string) => {
    setSelectedTxIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Select all matching candidates
  const handleSelectAll = () => {
    setSelectedTxIds(new Set(filteredCandidates.map((t) => t.id)));
  };

  // Deselect all
  const handleDeselectAll = () => {
    setSelectedTxIds(new Set());
  };

  // Invert selection
  const handleInvertSelection = () => {
    setSelectedTxIds((prev) => {
      const next = new Set<string>();
      filteredCandidates.forEach((t) => {
        if (!prev.has(t.id)) {
          next.add(t.id);
        }
      });
      return next;
    });
  };

  // Select only expense or only income
  const handleSelectOnlyType = (type: TransactionType) => {
    const matchingIds = filteredCandidates.filter((t) => t.type === type).map((t) => t.id);
    setSelectedTxIds(new Set(matchingIds));
  };

  const isAllSelected =
    filteredCandidates.length > 0 && filteredCandidates.every((t) => selectedTxIds.has(t.id));
  const isNoneSelected = targetTransactions.length === 0;

  // Smart default filename
  const defaultFileNameSuggestion = useMemo(() => {
    if (startDate && endDate) {
      return `财务记账明细_${startDate.replace(/-/g, '')}至${endDate.replace(/-/g, '')}`;
    }
    return `财务记账流水全量明细`;
  }, [startDate, endDate]);

  // Execute Export
  const handleExecuteExport = () => {
    if (targetTransactions.length === 0) {
      onShowToast('请至少勾选一笔要导出的账单记录');
      return;
    }

    try {
      const options: TransactionExportOptions = {
        format: exportFormat,
        scope: 'filtered',
        filename: customFileName.trim() || defaultFileNameSuggestion,
      };

      exportTransactions(targetTransactions, accounts, options);
      onShowToast(
        `🎉 已成功导出 ${targetTransactions.length} 笔明细 (${
          exportFormat === 'xlsx' ? 'Excel .xlsx' : exportFormat === 'csv' ? 'CSV 格式' : 'JSON 格式'
        })！`
      );
      onClose();
    } catch (err) {
      console.error('Export failed:', err);
      onShowToast('导出失败，请重试或切换为 CSV 格式导出');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-5xl w-full max-h-[92vh] overflow-hidden text-slate-800 dark:text-slate-100 flex flex-col">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-sm shadow-blue-500/20">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg">
                  导出记账本明细
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
                  支持日期区间与预览勾选
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                在导出前自由筛选起止日期区间、按需勾选特定账单并实时核对导出明细
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="关闭窗口"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Main Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Section 1: Date Range Selection & Quick Presets */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>1. 选择导出日期区间</span>
              </label>

              {/* Quick Presets Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'THIS_MONTH', label: '本月' },
                  { id: 'LAST_MONTH', label: '上月' },
                  { id: 'LAST_7_DAYS', label: '近7天' },
                  { id: 'LAST_30_DAYS', label: '近30天' },
                  { id: 'LAST_90_DAYS', label: '近90天' },
                  { id: 'THIS_YEAR', label: '今年' },
                  { id: 'ALL', label: '全部时间' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handlePresetSelect(item.id as DatePresetType)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      datePreset === item.id
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Date Pickers & Quick Filter Toolbar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
              {/* Start Date */}
              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  起始日期
                </label>
                <input
                  id="export-start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setDatePreset('CUSTOM');
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-semibold"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  截止日期
                </label>
                <input
                  id="export-end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setDatePreset('CUSTOM');
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-semibold"
                />
              </div>

              {/* Transaction Type Filter */}
              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  交易类型筛选
                </label>
                <select
                  id="export-type-filter"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 font-medium"
                >
                  <option value="ALL">全部交易类型</option>
                  <option value="EXPENSE">仅支出消费</option>
                  <option value="INCOME">仅收入进账</option>
                  <option value="TRANSFER">仅转账划转</option>
                  <option value="REPAYMENT">仅信用卡/白条还款</option>
                  <option value="DEBT">仅借贷往来</option>
                </select>
              </div>

              {/* Account Filter */}
              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  关联账户筛选
                </label>
                <select
                  id="export-account-filter"
                  value={accountFilter}
                  onChange={(e) => setAccountFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 font-medium"
                >
                  <option value="ALL">全部账户 ({accounts.length})</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.bankName || a.name} {a.cardNumberLast4 ? `(*${a.cardNumberLast4})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Bill List Preview & Batch Checkbox Controls */}
          <div className="space-y-3">
            {/* Header & Quick Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>2. 账单明细实时预览与勾选</span>
                </label>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  已勾选 <strong className="text-blue-600 dark:text-blue-400 font-bold">{targetTransactions.length}</strong> / 匹配 {filteredCandidates.length} 笔 (总计 {effectiveAll.length} 笔)
                </span>
              </div>

              {/* Checkbox Operations & Keyword Search */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Search in preview */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                  <input
                    type="text"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    placeholder="搜索商户/备注/分类..."
                    className="w-36 sm:w-44 pl-7 pr-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Batch toggles */}
                <button
                  type="button"
                  onClick={isAllSelected ? handleDeselectAll : handleSelectAll}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1"
                >
                  <CheckCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>{isAllSelected ? '取消全选' : '全选'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleInvertSelection}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
                >
                  反选
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectOnlyType('EXPENSE')}
                  className="px-2 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-100 transition-colors"
                >
                  仅勾选支出
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectOnlyType('INCOME')}
                  className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs font-semibold hover:bg-emerald-100 transition-colors"
                >
                  仅勾选收入
                </button>
              </div>
            </div>

            {/* Live Transactions Preview Table */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
              <div className="max-h-64 sm:max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {filteredCandidates.length === 0 ? (
                  <div className="p-8 text-center space-y-2">
                    <Calendar className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      选定日期区间内暂无符合条件的账单记录
                    </p>
                    <p className="text-xs text-slate-400">
                      请尝试调整上方起始和截止日期，或重置交易类型筛选条件
                    </p>
                    <button
                      type="button"
                      onClick={() => handlePresetSelect('ALL')}
                      className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 font-semibold text-xs hover:bg-blue-100 transition-colors mt-2"
                    >
                      切换为全部时间
                    </button>
                  </div>
                ) : (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800/90 backdrop-blur-xs text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700 z-10">
                      <tr>
                        <th className="py-2.5 px-3 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={isAllSelected}
                            onChange={(e) => {
                              if (e.target.checked) handleSelectAll();
                              else handleDeselectAll();
                            }}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            title="全选/全不选"
                          />
                        </th>
                        <th className="py-2.5 px-3">日期与时间</th>
                        <th className="py-2.5 px-3">类型</th>
                        <th className="py-2.5 px-3">分类/标签</th>
                        <th className="py-2.5 px-3">收付账户</th>
                        <th className="py-2.5 px-3">商户与备注</th>
                        <th className="py-2.5 px-3 text-right">金额</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
                      {filteredCandidates.map((tx) => {
                        const isChecked = selectedTxIds.has(tx.id);
                        const acc = accountMap.get(tx.accountId);
                        const targetAcc = tx.targetAccountId ? accountMap.get(tx.targetAccountId) : null;
                        const isExpense = tx.type === 'EXPENSE';
                        const isIncome = tx.type === 'INCOME';
                        const isRepay = tx.type === 'REPAYMENT';
                        const isTransfer = tx.type === 'TRANSFER';

                        return (
                          <tr
                            key={tx.id}
                            onClick={() => handleToggleTx(tx.id)}
                            className={`cursor-pointer transition-colors ${
                              isChecked
                                ? 'bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-50/70 dark:hover:bg-blue-950/40'
                                : 'opacity-60 hover:opacity-90 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                            }`}
                          >
                            {/* Checkbox */}
                            <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleTx(tx.id)}
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                            </td>

                            {/* Date & Time */}
                            <td className="py-2.5 px-3 font-mono font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                              <div>{tx.date}</div>
                              {tx.time && (
                                <div className="text-[10px] text-slate-400 font-normal">{tx.time}</div>
                              )}
                            </td>

                            {/* Type Badge */}
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[11px] font-semibold font-sans ${
                                  isExpense
                                    ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                                    : isIncome
                                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                                    : isRepay
                                    ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300'
                                    : 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                                }`}
                              >
                                {getTransactionTypeLabel(tx.type)}
                              </span>
                            </td>

                            {/* Category with Icon */}
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
                                <CategoryIcon
                                  category={tx.category}
                                  type={tx.type}
                                  className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400"
                                />
                                <span>{tx.category || '未分类'}</span>
                              </div>
                            </td>

                            {/* Account info */}
                            <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 max-w-[160px] truncate">
                              <div className="flex items-center gap-1 truncate font-medium">
                                <span>{acc?.bankName || acc?.name || '未知账户'}</span>
                                {acc?.cardNumberLast4 && (
                                  <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400">
                                    *{acc.cardNumberLast4}
                                  </span>
                                )}
                              </div>
                              {targetAcc && (
                                <div className="text-[10px] text-slate-400 flex items-center gap-0.5 truncate">
                                  <ArrowRight className="w-2.5 h-2.5 shrink-0" />
                                  <span className="truncate">{targetAcc.bankName || targetAcc.name}</span>
                                </div>
                              )}
                            </td>

                            {/* Merchant & Note */}
                            <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 max-w-[200px] truncate">
                              <div className="font-medium truncate text-slate-800 dark:text-slate-200">
                                {tx.merchant || tx.note || '-'}
                              </div>
                              {tx.merchant && tx.note && (
                                <div className="text-[10px] text-slate-400 truncate">{tx.note}</div>
                              )}
                            </td>

                            {/* Amount */}
                            <td className="py-2.5 px-3 text-right font-mono font-bold whitespace-nowrap">
                              <span
                                className={
                                  isExpense
                                    ? 'text-rose-600 dark:text-rose-400'
                                    : isIncome
                                    ? 'text-emerald-700 dark:text-emerald-400'
                                    : isRepay
                                    ? 'text-purple-600 dark:text-purple-400'
                                    : 'text-blue-600 dark:text-blue-400'
                                }
                              >
                                {isExpense ? '-' : isIncome ? '+' : ''}
                                ¥{(tx.amount || 0).toFixed(2)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Export Format, Custom File Name & Live Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-1">
            {/* Format Selection */}
            <div className="lg:col-span-2 space-y-2">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                3. 选择导出文件格式
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {/* Excel XLSX */}
                <button
                  type="button"
                  onClick={() => setExportFormat('xlsx')}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                    exportFormat === 'xlsx'
                      ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 ring-2 ring-emerald-500/20 font-semibold'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800'
                  }`}
                >
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-bold">Excel 工作表</span>
                  <span className="text-[10px] text-slate-400 font-mono">.xlsx 格式</span>
                </button>

                {/* CSV */}
                <button
                  type="button"
                  onClick={() => setExportFormat('csv')}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                    exportFormat === 'csv'
                      ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/20 font-semibold'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800'
                  }`}
                >
                  <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-bold">CSV 表格</span>
                  <span className="text-[10px] text-slate-400 font-mono">.csv (UTF-8)</span>
                </button>

                {/* JSON */}
                <button
                  type="button"
                  onClick={() => setExportFormat('json')}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                    exportFormat === 'json'
                      ? 'border-purple-600 bg-purple-50/60 dark:bg-purple-950/40 text-purple-900 dark:text-purple-100 ring-2 ring-purple-500/20 font-semibold'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800'
                  }`}
                >
                  <FileJson className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <span className="text-xs font-bold">JSON 数据</span>
                  <span className="text-[10px] text-slate-400 font-mono">.json 结构</span>
                </button>
              </div>

              {/* Custom File Name */}
              <div className="pt-1">
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  自定义导出文件名 (可选)
                </label>
                <input
                  id="export-filename-input"
                  type="text"
                  value={customFileName}
                  onChange={(e) => setCustomFileName(e.target.value)}
                  placeholder={`留空则默认: ${defaultFileNameSuggestion}`}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Live Financial Totals Summary Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/40 dark:from-slate-800/80 dark:to-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs space-y-2 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-700">
                  <span className="font-bold text-slate-800 dark:text-slate-200">导出数据汇总</span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold font-mono text-[11px]">
                    {targetTransactions.length} 笔
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span className="flex items-center gap-1">
                    <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
                    <span>支出消费合计:</span>
                  </span>
                  <span className="text-rose-600 dark:text-rose-400 font-mono font-bold">
                    -¥{totalExpense.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                    <span>收入进账合计:</span>
                  </span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-mono font-bold">
                    +¥{totalIncome.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                  <span>收支净结余:</span>
                  <span
                    className={`font-mono font-bold ${
                      netBalance >= 0
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {netBalance >= 0 ? '+' : ''}¥{netBalance.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 pt-1">
                💡 导出的文件包含账户名称、卡号尾号、交易分类、商户信息与完整备注。
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {targetTransactions.length > 0 ? (
              <span>
                即将导出所选的 <strong className="text-blue-600 dark:text-blue-400 font-bold font-mono">{targetTransactions.length}</strong> 笔账单 (文件格式: {exportFormat.toUpperCase()})
              </span>
            ) : (
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                ⚠️ 当前未勾选任何账单，请在上方列表中至少勾选一笔明细
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors"
            >
              取消
            </button>

            <button
              id="btn-execute-export"
              onClick={handleExecuteExport}
              disabled={targetTransactions.length === 0}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-xs sm:text-sm shadow-md active:scale-95 transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>立即导出并下载 ({targetTransactions.length} 笔)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
