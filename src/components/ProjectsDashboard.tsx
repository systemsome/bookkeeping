import React, { useState, useMemo } from 'react';
import {
  FolderKanban,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  RotateCcw,
  Sparkles,
  Calendar,
  CheckCircle2,
  Clock,
  Archive,
  Search,
  SlidersHorizontal,
  ChevronRight,
  ArrowLeft,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Pencil,
  Trash2,
  Tag,
  ReceiptText,
  AlertCircle,
  BarChart2,
  Layers,
  PieChart as PieChartIcon,
  X,
  Wallet,
} from 'lucide-react';
import {
  LedgerProject,
  Transaction,
  FinancialAccount,
  ProjectFinancialStats,
  ProjectStatus,
  TransactionType,
} from '../types';
import { calculateProjectStats } from '../lib/storage';
import { formatCurrency } from '../lib/formatters';
import { CategoryIcon } from './CategoryIcon';

interface ProjectsDashboardProps {
  projects?: LedgerProject[];
  transactions?: Transaction[];
  accounts?: FinancialAccount[];
  privacyMode?: boolean;
  onSaveProject?: (project: LedgerProject) => void;
  onDeleteProject?: (projectId: string) => void;
  onOpenNewTx?: (type?: TransactionType, accountId?: string, defaultDate?: string, projectId?: string) => void;
  onEditTransaction?: (tx: Transaction) => void;
  onDeleteTransaction?: (id: string) => void;
  onRefundTransaction?: (originalTx: Transaction) => void;
  onOpenProjectEditor?: (project?: LedgerProject | null) => void;
  onCreateProject?: () => void;
  onEditProject?: (project: LedgerProject) => void;
}

export const ProjectsDashboard: React.FC<ProjectsDashboardProps> = ({
  projects = [],
  transactions = [],
  accounts = [],
  privacyMode = false,
  onSaveProject,
  onDeleteProject,
  onOpenNewTx,
  onEditTransaction,
  onDeleteTransaction,
  onRefundTransaction,
  onOpenProjectEditor,
  onCreateProject,
  onEditProject,
}) => {
  // Safe helper to open project editor modal
  const handleOpenEditor = (proj?: LedgerProject | null) => {
    if (onOpenProjectEditor) {
      onOpenProjectEditor(proj);
    } else if (proj && onEditProject) {
      onEditProject(proj);
    } else if (!proj && onCreateProject) {
      onCreateProject();
    }
  };

  // Navigation: null means all projects overview, string means viewing single project statistics
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Filters for all projects view
  const [statusFilter, setStatusFilter] = useState<'ALL' | ProjectStatus>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Single project transaction filter
  const [singleProjectTxType, setSingleProjectTxType] = useState<string>('ALL');
  const [singleProjectTxSearch, setSingleProjectTxSearch] = useState<string>('');

  // Account map for fast lookup
  const accountMap = useMemo(() => {
    const map = new Map<string, FinancialAccount>();
    (accounts || []).forEach((a) => map.set(a.id, a));
    return map;
  }, [accounts]);

  // Pre-calculate statistics for every project
  const projectStatsMap = useMemo(() => {
    const map = new Map<string, ProjectFinancialStats>();
    (projects || []).forEach((proj) => {
      map.set(proj.id, calculateProjectStats(proj, transactions || []));
    });
    return map;
  }, [projects, transactions]);

  // Overall statistics across all active/visible projects
  const overallStats = useMemo(() => {
    let totalIncome = 0;
    let grossExpense = 0;
    let refundAmount = 0;
    let totalBudget = 0;
    let totalTxCount = 0;

    (projects || []).forEach((proj) => {
      const s = projectStatsMap.get(proj.id);
      if (s) {
        totalIncome += s.totalIncome;
        grossExpense += s.grossExpense;
        refundAmount += s.refundAmount;
        if (s.budget) totalBudget += s.budget;
        totalTxCount += s.transactionCount;
      }
    });

    const netExpense = Math.max(0, grossExpense - refundAmount);
    const netBalance = totalIncome - netExpense;

    return {
      totalIncome,
      grossExpense,
      refundAmount,
      netExpense,
      netBalance,
      totalBudget,
      totalTxCount,
      activeProjectsCount: (projects || []).filter((p) => p.status === 'ACTIVE').length,
      completedProjectsCount: (projects || []).filter((p) => p.status === 'COMPLETED').length,
    };
  }, [projects, projectStatsMap]);

  // Extract unique categories
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    (projects || []).forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [projects]);

  // Filtered projects list
  const filteredProjects = useMemo(() => {
    return (projects || []).filter((p) => {
      if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
      if (categoryFilter !== 'ALL' && p.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = p.name.toLowerCase().includes(q);
        const matchDesc = p.description?.toLowerCase().includes(q);
        const matchCat = p.category.toLowerCase().includes(q);
        if (!matchName && !matchDesc && !matchCat) return false;
      }
      return true;
    });
  }, [projects, statusFilter, categoryFilter, searchQuery]);

  // Selected project drilldown object & stats
  const activeProject = useMemo(() => {
    if (!selectedProjectId) return null;
    return projects.find((p) => p.id === selectedProjectId) || null;
  }, [projects, selectedProjectId]);

  const activeProjectStats = useMemo(() => {
    if (!activeProject) return null;
    return projectStatsMap.get(activeProject.id) || null;
  }, [activeProject, projectStatsMap]);

  // Transactions belonging to selected project
  const activeProjectTransactions = useMemo(() => {
    if (!activeProject) return [];
    return transactions.filter(
      (t) =>
        t.projectId === activeProject.id ||
        (t.projectName && t.projectName === activeProject.name)
    );
  }, [activeProject, transactions]);

  // Filtered transactions for active project
  const filteredActiveProjectTxs = useMemo(() => {
    return activeProjectTransactions.filter((t) => {
      if (singleProjectTxType === 'EXPENSE' && t.type !== 'EXPENSE') return false;
      if (singleProjectTxType === 'INCOME' && t.type !== 'INCOME') return false;
      if (singleProjectTxType === 'REFUND' && t.type !== 'REFUND' && !t.isRefund) return false;
      if (singleProjectTxSearch.trim()) {
        const q = singleProjectTxSearch.toLowerCase().trim();
        const matchDesc = t.description?.toLowerCase().includes(q);
        const matchCat = t.category.toLowerCase().includes(q);
        const matchMerchant = t.merchant?.toLowerCase().includes(q);
        const matchTag = t.tag?.toLowerCase().includes(q);
        if (!matchDesc && !matchCat && !matchMerchant && !matchTag) return false;
      }
      return true;
    });
  }, [activeProjectTransactions, singleProjectTxType, singleProjectTxSearch]);

  // Active project category breakdown
  const categoryBreakdown = useMemo(() => {
    if (!activeProject) return [];
    const catMap = new Map<string, { gross: number; refund: number; count: number }>();

    (activeProjectTransactions || []).forEach((t) => {
      if (t.type === 'EXPENSE') {
        const c = t.category || '其他';
        const cur = catMap.get(c) || { gross: 0, refund: 0, count: 0 };
        cur.gross += t.amount;
        cur.count += 1;
        catMap.set(c, cur);
      } else if (t.type === 'REFUND') {
        const c = t.category || '其他';
        const cur = catMap.get(c) || { gross: 0, refund: 0, count: 0 };
        cur.refund += t.amount;
        catMap.set(c, cur);
      }
    });

    const totalNetExpense = activeProjectStats?.netExpense || 1;
    const list = Array.from(catMap.entries()).map(([catName, data]) => {
      const net = Math.max(0, data.gross - data.refund);
      const percent = Math.min(100, Math.round((net / totalNetExpense) * 1000) / 10);
      return {
        category: catName,
        gross: data.gross,
        refund: data.refund,
        net,
        percent,
        count: data.count,
      };
    });

    return list.sort((a, b) => b.net - a.net);
  }, [activeProject, activeProjectTransactions, activeProjectStats]);

  // Toggle project status between ACTIVE and COMPLETED
  const handleToggleProjectStatus = (proj: LedgerProject) => {
    const nextStatus: ProjectStatus = proj.status === 'ACTIVE' ? 'COMPLETED' : 'ACTIVE';
    if (onSaveProject) {
      onSaveProject({
        ...proj,
        status: nextStatus,
        updatedAt: new Date().toISOString(),
      });
    }
  };

  // =========================================================================
  // VIEW 2: SINGLE PROJECT DRILLDOWN (单项目收支统计与流水)
  // =========================================================================
  if (activeProject && activeProjectStats) {
    const isExceeded =
      activeProject.budget && activeProjectStats.netExpense > activeProject.budget;

    return (
      <div className="space-y-6 pb-20 animate-in fade-in duration-200">
        {/* Back navigation & Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedProjectId(null)}
              className="p-2 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors flex items-center justify-center shadow-2xs"
              title="返回所有账本项目"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <div
                  className="w-3.5 h-3.5 rounded-full"
                  style={{ backgroundColor: activeProject.color || '#0d9488' }}
                />
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  {activeProject.name}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {activeProject.category}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    activeProject.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                      : activeProject.status === 'COMPLETED'
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {activeProject.status === 'ACTIVE'
                    ? '进行中'
                    : activeProject.status === 'COMPLETED'
                    ? '已结项'
                    : '已归档'}
                </span>
              </div>
              {activeProject.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {activeProject.description}
                </p>
              )}
            </div>
          </div>

          {/* Quick Actions for this single project */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onOpenNewTx('EXPENSE', undefined, undefined, activeProject.id)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
              title="为此项目记一笔支出"
            >
              <ArrowDownRight className="w-4 h-4" />
              <span>记支出</span>
            </button>

            <button
              onClick={() => onOpenNewTx('INCOME', undefined, undefined, activeProject.id)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
              title="为此项目记一笔收入 (如副业进账、报销返款、AA分摊)"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>记收入</span>
            </button>

            <button
              onClick={() => onOpenNewTx('REFUND', undefined, undefined, activeProject.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-900/60 text-xs font-bold shadow-2xs active:scale-95 transition-all"
              title="对该项目花出去的费用进行退费平账冲红"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>平账冲红</span>
            </button>

            <button
              onClick={() => handleOpenEditor(activeProject)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
              title="编辑此项目信息"
            >
              <Pencil className="w-4 h-4" />
            </button>

            <button
              onClick={() => handleToggleProjectStatus(activeProject)}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              {activeProject.status === 'ACTIVE' ? '结项归档' : '恢复进行中'}
            </button>
          </div>
        </div>

        {/* 6-Metric Financial Scoreboard for this Project */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          {/* 1. 项目总收入 */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-xs font-medium">项目总收入</span>
              <div className="p-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
                <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-base sm:text-lg font-black text-emerald-700 dark:text-emerald-400 font-mono">
              +{formatCurrency(activeProjectStats.totalIncome, privacyMode)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              共 {activeProjectStats.incomeCount} 笔收款
            </div>
          </div>

          {/* 2. 原始支出总额 */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-xs font-medium">原始支出款</span>
              <div className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600">
                <ArrowDownRight className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-base sm:text-lg font-black text-slate-700 dark:text-slate-300 font-mono">
              -{formatCurrency(activeProjectStats.grossExpense, privacyMode)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              共 {activeProjectStats.expenseCount} 笔支付
            </div>
          </div>

          {/* 3. 平账冲红退款 */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-xs font-medium">平账冲红</span>
              <div className="p-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600">
                <RotateCcw className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-base sm:text-lg font-black text-rose-600 dark:text-rose-400 font-mono">
              +{formatCurrency(activeProjectStats.refundAmount, privacyMode)}
            </div>
            <div className="text-[11px] text-rose-600/80 dark:text-rose-400/80 mt-0.5 font-medium">
              冲减支出 {activeProjectStats.refundCount} 笔
            </div>
          </div>

          {/* 4. 实际净支出 */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-rose-200/80 dark:border-rose-900/60 shadow-2xs bg-rose-50/20">
            <div className="flex items-center justify-between text-rose-700 dark:text-rose-400 mb-1.5">
              <span className="text-xs font-bold">实际净支出</span>
              <div className="p-1 rounded-lg bg-rose-100 dark:bg-rose-900/60 text-rose-600">
                <TrendingDown className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-base sm:text-lg font-black text-rose-700 dark:text-rose-400 font-mono">
              -{formatCurrency(activeProjectStats.netExpense, privacyMode)}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              原始支出 扣除 冲红
            </div>
          </div>

          {/* 5. 项目净结余 */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/60 shadow-2xs bg-emerald-50/20">
            <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-400 mb-1.5">
              <span className="text-xs font-bold">项目净结余</span>
              <div className="p-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
            </div>
            <div
              className={`text-base sm:text-lg font-black font-mono ${
                activeProjectStats.netBalance >= 0
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {activeProjectStats.netBalance >= 0 ? '+' : ''}
              {formatCurrency(activeProjectStats.netBalance, privacyMode)}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              收入 - 实际净支出
            </div>
          </div>

          {/* 6. 预算与剩余 */}
          <div
            className={`p-4 rounded-2xl border shadow-2xs ${
              isExceeded
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-900 text-rose-900 dark:text-rose-200'
                : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-xs font-medium">
                {isExceeded ? '⚠️ 预算超支' : '预算消耗'}
              </span>
              <span className="text-xs font-bold font-mono">
                {activeProject.budget
                  ? `${activeProjectStats.budgetUsagePercent.toFixed(1)}%`
                  : '未设预算'}
              </span>
            </div>
            <div className="text-base sm:text-lg font-black font-mono">
              {activeProject.budget
                ? formatCurrency(activeProjectStats.budgetRemaining || 0, privacyMode)
                : '--'}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 truncate">
              {activeProject.budget
                ? `预算 ¥${activeProject.budget.toFixed(2)}`
                : '点击编辑可设置预算'}
            </div>
          </div>
        </div>

        {/* Budget Progress Bar if set */}
        {activeProject.budget && activeProject.budget > 0 && (
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-600 dark:text-slate-300 font-medium">
                专项预算执行情况: 已支出 <strong>{formatCurrency(activeProjectStats.netExpense, privacyMode)}</strong> / 预算总额 <strong>¥{activeProject.budget.toFixed(2)}</strong>
              </span>
              <span
                className={`font-bold ${
                  isExceeded ? 'text-rose-600' : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                {isExceeded
                  ? `已超支 ¥${(activeProjectStats.netExpense - activeProject.budget).toFixed(2)}`
                  : `剩余额度 ¥${(activeProject.budget - activeProjectStats.netExpense).toFixed(2)}`}
              </span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isExceeded
                    ? 'bg-rose-600'
                    : activeProjectStats.budgetUsagePercent > 80
                    ? 'bg-amber-500'
                    : 'bg-teal-600'
                }`}
                style={{ width: `${Math.min(100, activeProjectStats.budgetUsagePercent)}%` }}
              />
            </div>
          </div>
        )}

        {/* Project Expense Category Breakdown */}
        {categoryBreakdown.length > 0 && (
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600">
                  <PieChartIcon className="w-4 h-4" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  项目支出分类占比与构成
                </h3>
              </div>
              <span className="text-xs text-slate-400">
                涵盖 {categoryBreakdown.length} 个支出类别
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
              {categoryBreakdown.map((item) => (
                <div
                  key={item.category}
                  className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0">
                        <CategoryIcon nameOrIcon={item.category} className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {item.category}
                      </span>
                    </div>
                    <span className="text-xs font-bold font-mono text-slate-700 dark:text-slate-300">
                      {item.percent}%
                    </span>
                  </div>

                  <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-600 rounded-full"
                      style={{ width: `${Math.min(100, item.percent)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>净支: ¥{item.net.toFixed(2)}</span>
                    {item.refund > 0 && (
                      <span className="text-rose-600 dark:text-rose-400">
                        (含冲红 ¥{item.refund.toFixed(2)})
                      </span>
                    )}
                    <span>{item.count} 笔</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dedicated Transaction Flow for this Single Project */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          {/* Header & Filter Bar */}
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600">
                <ReceiptText className="w-4 h-4" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                该项目收支流水清单
              </h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                共 {filteredActiveProjectTxs.length} 笔
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={singleProjectTxSearch}
                  onChange={(e) => setSingleProjectTxSearch(e.target.value)}
                  placeholder="搜索此项目账单..."
                  className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              {/* Type Switcher */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                <button
                  onClick={() => setSingleProjectTxType('ALL')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    singleProjectTxType === 'ALL'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold'
                      : 'text-slate-500'
                  }`}
                >
                  全部
                </button>
                <button
                  onClick={() => setSingleProjectTxType('EXPENSE')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    singleProjectTxType === 'EXPENSE'
                      ? 'bg-white dark:bg-slate-700 text-rose-600 font-bold shadow-2xs'
                      : 'text-slate-500'
                  }`}
                >
                  支出
                </button>
                <button
                  onClick={() => setSingleProjectTxType('INCOME')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    singleProjectTxType === 'INCOME'
                      ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 font-bold shadow-2xs'
                      : 'text-slate-500'
                  }`}
                >
                  收入
                </button>
                <button
                  onClick={() => setSingleProjectTxType('REFUND')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    singleProjectTxType === 'REFUND'
                      ? 'bg-white dark:bg-slate-700 text-rose-700 font-bold shadow-2xs'
                      : 'text-slate-500'
                  }`}
                >
                  冲红退费
                </button>
              </div>
            </div>
          </div>

          {/* Transaction Items */}
          {filteredActiveProjectTxs.length === 0 ? (
            <div className="p-10 text-center text-slate-400 space-y-3">
              <ReceiptText className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
              <div className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                暂无符合条件的流水记录
              </div>
              <p className="text-xs text-slate-400">
                点击上方“记支出”或“记收入”即可为当前项目添加入账流水
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredActiveProjectTxs.map((tx) => {
                const acc = accountMap.get(tx.accountId);
                const isExpense = tx.type === 'EXPENSE';
                const isIncome = tx.type === 'INCOME';
                const isRefund = tx.type === 'REFUND' || tx.isRefund;
                const hasRefund = (tx.refundedAmount || 0) > 0;
                const netAmount = Math.max(0, tx.amount - (tx.refundedAmount || 0));

                return (
                  <div
                    key={tx.id}
                    className="p-4 sm:px-5 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isExpense
                            ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400'
                            : isIncome
                            ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400'
                            : 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300'
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
                              : RotateCcw
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
                          {isRefund && (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-800">
                              平账冲红凭证
                            </span>
                          )}
                          {hasRefund && (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-bold border border-amber-200 dark:border-amber-800">
                              已冲红退款 ¥{tx.refundedAmount?.toFixed(2)}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1 flex-wrap font-mono">
                          <span>{tx.date}</span>
                          {tx.time && <span>{tx.time}</span>}
                          <span>·</span>
                          <span>{acc?.name || '账户'}</span>
                          {tx.merchant && <span>· 商户: {tx.merchant}</span>}
                          {isRefund && tx.refundedTxDescription && (
                            <span className="text-rose-600 dark:text-rose-400">
                              · 冲销原单: {tx.refundedTxDescription}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex items-center gap-3 shrink-0">
                      <div>
                        <div
                          className={`text-sm sm:text-base font-bold font-mono ${
                            isExpense
                              ? 'text-rose-600 dark:text-rose-400'
                              : isIncome
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-rose-700 dark:text-rose-300'
                          }`}
                        >
                          {isExpense
                            ? `-${formatCurrency(tx.amount, privacyMode)}`
                            : isIncome
                            ? `+${formatCurrency(tx.amount, privacyMode)}`
                            : `+${formatCurrency(tx.amount, privacyMode)} (冲红)`}
                        </div>

                        {/* If expense has refund, show net expenditure */}
                        {isExpense && hasRefund && (
                          <div className="text-[10px] font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                            净支出: {formatCurrency(netAmount, privacyMode)}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                        {/* Direct Red-ink Reversal Button for Expense */}
                        {isExpense && (
                          <button
                            onClick={() => onRefundTransaction(tx)}
                            className="px-2 py-1 rounded-lg text-xs font-semibold bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 transition-all flex items-center gap-1"
                            title="对该笔支出进行平账冲红 (退费入账)"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>冲红</span>
                          </button>
                        )}
                        <button
                          onClick={() => onEditTransaction(tx)}
                          className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="编辑流水"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`确定删除记录 “${tx.description || tx.category}” 吗？`)) {
                              onDeleteTransaction(tx.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="删除流水"
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
      </div>
    );
  }

  // =========================================================================
  // VIEW 1: ALL PROJECTS OVERVIEW & MANAGEMENT (全部账本项目看板)
  // =========================================================================
  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner & Summary */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-sm">
              <FolderKanban className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  账本项目管理
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
                  共 {projects.length} 个专项项目
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                用于装修、旅行、副业、婚礼等特定事项的独立核算，方便统计单项目支出、收入、冲红与净结余
              </p>
            </div>
          </div>

          <button
            onClick={() => handleOpenEditor(null)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white text-xs sm:text-sm font-bold shadow-sm active:scale-95 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 text-emerald-400 stroke-[3]" />
            <span>新增账本项目</span>
          </button>
        </div>

        {/* Aggregate Stats Across All Projects */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 pt-5">
          <div className="p-3.5 rounded-2xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
            <div className="text-xs text-slate-400 font-medium mb-1">专项项目总数</div>
            <div className="text-lg font-black text-slate-900 dark:text-white font-mono">
              {projects.length}{' '}
              <span className="text-xs font-normal text-slate-400">
                (进行中 {overallStats.activeProjectsCount})
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
            <div className="text-xs text-slate-400 font-medium mb-1">专项总收入</div>
            <div className="text-lg font-black text-emerald-700 dark:text-emerald-400 font-mono">
              +{formatCurrency(overallStats.totalIncome, privacyMode)}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
            <div className="text-xs text-slate-400 font-medium mb-1">平账冲红退款</div>
            <div className="text-lg font-black text-rose-600 dark:text-rose-400 font-mono">
              +{formatCurrency(overallStats.refundAmount, privacyMode)}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
            <div className="text-xs text-slate-400 font-medium mb-1">项目实际净支出</div>
            <div className="text-lg font-black text-rose-700 dark:text-rose-400 font-mono">
              -{formatCurrency(overallStats.netExpense, privacyMode)}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 col-span-2 lg:col-span-1">
            <div className="text-xs text-slate-400 font-medium mb-1">项目综合净结余</div>
            <div
              className={`text-lg font-black font-mono ${
                overallStats.netBalance >= 0
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {overallStats.netBalance >= 0 ? '+' : ''}
              {formatCurrency(overallStats.netBalance, privacyMode)}
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-2 flex-wrap flex-1">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索项目名称、分类或说明..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none"
          >
            <option value="ALL">全部状态 (进行中/已结项)</option>
            <option value="ACTIVE">🟢 仅看进行中</option>
            <option value="COMPLETED">✅ 仅看已结项</option>
            <option value="ARCHIVED">📦 已归档</option>
          </select>

          {availableCategories.length > 0 && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none"
            >
              <option value="ALL">全部分类</option>
              {availableCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}
        </div>

        {(searchQuery || statusFilter !== 'ALL' || categoryFilter !== 'ALL') && (
          <button
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('ALL');
              setCategoryFilter('ALL');
            }}
            className="text-xs text-rose-500 font-semibold hover:underline self-end sm:self-auto"
          >
            重置筛选
          </button>
        )}
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200/80 dark:border-slate-800 space-y-4">
          <FolderKanban className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              {searchQuery || statusFilter !== 'ALL' || categoryFilter !== 'ALL'
                ? '暂无符合筛选条件的账本项目'
                : '暂无账本项目'}
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              创建您的第一个账本项目（如“新房装修”、“日本旅行”、“独立副业”），即可将相关的支出、收入与冲红集中统一独立核算！
            </p>
          </div>
          <button
            onClick={() => handleOpenEditor(null)}
            className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow-sm inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>创建第一个账本项目</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((proj) => {
            const stats = projectStatsMap.get(proj.id) || {
              totalIncome: 0,
              grossExpense: 0,
              refundAmount: 0,
              netExpense: 0,
              netBalance: 0,
              transactionCount: 0,
              incomeCount: 0,
              expenseCount: 0,
              refundCount: 0,
              budgetUsagePercent: 0,
            };

            const isExceeded = proj.budget && stats.netExpense > proj.budget;

            return (
              <div
                key={proj.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                <div>
                  {/* Card Header Color Bar */}
                  <div
                    className="h-2 w-full"
                    style={{ backgroundColor: proj.color || '#0d9488' }}
                  />

                  <div className="p-5 space-y-4">
                    {/* Title & Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {proj.category}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              proj.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            {proj.status === 'ACTIVE' ? '进行中' : '已结项'}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1.5 truncate">
                          {proj.name}
                        </h3>
                        {proj.description && (
                          <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">
                            {proj.description}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => handleOpenEditor(proj)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
                        title="编辑项目"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Financial Matrix (收入 / 支出 / 冲红 / 净支出 / 结余) */}
                    <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50/80 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium">项目收入</div>
                        <div className="text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                          +{formatCurrency(stats.totalIncome, privacyMode)}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] text-slate-400 font-medium">原始支出</div>
                        <div className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 font-mono">
                          -{formatCurrency(stats.grossExpense, privacyMode)}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] text-rose-500 font-medium">平账冲红</div>
                        <div className="text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 font-mono">
                          +{formatCurrency(stats.refundAmount, privacyMode)}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] text-rose-700 dark:text-rose-300 font-bold">
                          实际净支出
                        </div>
                        <div className="text-xs sm:text-sm font-black text-rose-700 dark:text-rose-400 font-mono">
                          -{formatCurrency(stats.netExpense, privacyMode)}
                        </div>
                      </div>

                      <div className="col-span-2 pt-1 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          项目净结余 (收入-净支)
                        </span>
                        <span
                          className={`text-xs font-bold font-mono ${
                            stats.netBalance >= 0
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {stats.netBalance >= 0 ? '+' : ''}
                          {formatCurrency(stats.netBalance, privacyMode)}
                        </span>
                      </div>
                    </div>

                    {/* Budget Progress Bar */}
                    {proj.budget && proj.budget > 0 ? (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-slate-500 dark:text-slate-400">
                            预算: ¥{proj.budget.toFixed(0)}
                          </span>
                          <span
                            className={`font-bold ${
                              isExceeded ? 'text-rose-600' : 'text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            已用 {stats.budgetUsagePercent.toFixed(1)}%
                          </span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isExceeded
                                ? 'bg-rose-600'
                                : stats.budgetUsagePercent > 80
                                ? 'bg-amber-500'
                                : 'bg-teal-600'
                            }`}
                            style={{
                              width: `${Math.min(100, stats.budgetUsagePercent)}%`,
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>
                          {proj.startDate || '未设日期'} {proj.endDate ? `~ ${proj.endDate}` : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="p-3 bg-slate-50/50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-400 font-mono pl-1">
                    {stats.transactionCount} 笔流水
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onOpenNewTx('EXPENSE', undefined, undefined, proj.id)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1"
                      title="记一笔该项目账单"
                    >
                      <Plus className="w-3.5 h-3.5 text-teal-600" />
                      <span>记一笔</span>
                    </button>

                    <button
                      onClick={() => setSelectedProjectId(proj.id)}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center gap-1 shadow-2xs"
                    >
                      <span>明细统计</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
